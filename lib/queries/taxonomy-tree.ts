import type { SupabaseClient } from '@supabase/supabase-js';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface TaxonomyTreePlant {
  zone_min: number | null;
  zone_max: number | null;
  cultivar_count: number;
  has_stock: boolean;
}

export interface TaxonomyTreeGenus {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  species_count: number;
  cultivar_count: number;
  has_stock: boolean;
  plants: TaxonomyTreePlant[];
}

export interface TaxonomyTreeCategory {
  category: string;
  genera: TaxonomyTreeGenus[];
  total_species: number;
  total_cultivars: number;
}

export interface TaxonomyTree {
  categories: TaxonomyTreeCategory[];
  total_species: number;
  total_cultivars: number;
}

// ---------------------------------------------------------------------------
// Internal row types
// ---------------------------------------------------------------------------

interface PlantRow {
  id: string;
  display_category: string | null;
  taxonomy_node_id: string | null;
}

interface CultivarRow {
  id: string;
  plant_entity_id: string | null;
}

interface OfferRow {
  cultivar_id: string | null;
  nursery_id: string;
}

interface GenusRow {
  id: string;
  slug: string;
  name: string;
}

interface ProfileRow {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/**
 * Build the full Category → Genus → Species hierarchy with counts.
 *
 * Runs server-side at page load for the browse page. Uses the same
 * parallel-fetch pattern as getAllBrowsePlants() and getHomepageCategories().
 */
export async function getTaxonomyTree(
  supabase: SupabaseClient
): Promise<TaxonomyTree> {
  const [
    { data: plantRows, error: plantError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: genusRows, error: genusError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, display_category, taxonomy_node_id')
      .eq('curation_status', 'published'),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('taxonomy_nodes')
      .select('id, slug, name, taxonomy_ranks!inner(rank_name)')
      .eq('taxonomy_ranks.rank_name', 'genus'),
    supabase
      .from('species_growing_profiles')
      .select('plant_entity_id, usda_zone_min, usda_zone_max'),
  ]);

  if (plantError || cultivarError || offerError || genusError || profileError) {
    console.error(
      'getTaxonomyTree error:',
      plantError ?? cultivarError ?? offerError ?? genusError ?? profileError
    );
    return { categories: [], total_species: 0, total_cultivars: 0 };
  }

  const plants = (plantRows ?? []) as PlantRow[];
  const cultivars = (cultivarRows ?? []) as CultivarRow[];
  const offers = (offerRows ?? []) as OfferRow[];
  const genera = (genusRows ?? []) as GenusRow[];
  const profiles = (profileRows ?? []) as ProfileRow[];

  // Build profile lookup: plant_entity_id → zone range
  const profileMap = new Map<string, ProfileRow>();
  for (const p of profiles) {
    profileMap.set(p.plant_entity_id, p);
  }

  // Build genus lookup: taxonomy_node_id → genus info
  const genusMap = new Map<string, GenusRow>();
  for (const g of genera) {
    genusMap.set(g.id, g);
  }

  // Build cultivar → plant mapping and per-plant cultivar counts
  const cultivarToPlant = new Map<string, string>();
  const plantCultivarCount = new Map<string, number>();
  for (const cv of cultivars) {
    if (!cv.plant_entity_id) continue;
    cultivarToPlant.set(cv.id, cv.plant_entity_id);
    plantCultivarCount.set(
      cv.plant_entity_id,
      (plantCultivarCount.get(cv.plant_entity_id) ?? 0) + 1
    );
  }

  // Build set of plant IDs that have active stock
  const plantsWithStock = new Set<string>();
  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (plantId) plantsWithStock.add(plantId);
  }

  // Category consolidation
  const CATEGORY_REMAP: Record<string, string> = {
    'Nut Trees': 'Nut Trees',
    'Berries': 'Berries',
    'Grapes': 'Berries',
    'Mulberries': 'Berries',
    'Persimmons': 'Tree Fruit',
    'Pears': 'Tree Fruit',
    'Apples & Crabapples': 'Tree Fruit',
    'Pawpaw': 'Tree Fruit',
    'Stone Fruit': 'Tree Fruit',
    'Kiwi': 'Tree Fruit',
    'Nitrogen Fixers': 'Support Species',
    'Other': 'Support Species',
  };

  function remapCategory(raw: string): string {
    return CATEGORY_REMAP[raw] ?? 'Support Species';
  }

  // Accumulator: category → genus_slug → stats
  type GenusAcc = {
    genus_slug: string;
    genus_name: string;
    species_ids: Set<string>;
    cultivar_count: number;
    has_stock: boolean;
    plants: TaxonomyTreePlant[];
  };

  const categoryMap = new Map<string, Map<string, GenusAcc>>();

  for (const plant of plants) {
    const rawCategory = plant.display_category?.trim() || 'Other';
    const category = remapCategory(rawCategory);
    const genus = plant.taxonomy_node_id
      ? genusMap.get(plant.taxonomy_node_id)
      : null;
    if (!genus) continue;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Map());
    }
    const genusAccMap = categoryMap.get(category)!;

    if (!genusAccMap.has(genus.slug)) {
      genusAccMap.set(genus.slug, {
        genus_slug: genus.slug,
        genus_name: genus.name,
        species_ids: new Set(),
        cultivar_count: 0,
        has_stock: false,
        plants: [],
      });
    }

    const acc = genusAccMap.get(genus.slug)!;
    acc.species_ids.add(plant.id);
    const cvCount = plantCultivarCount.get(plant.id) ?? 0;
    acc.cultivar_count += cvCount;
    const hasStock = plantsWithStock.has(plant.id);
    if (hasStock) acc.has_stock = true;

    const profile = profileMap.get(plant.id);
    acc.plants.push({
      zone_min: profile?.usda_zone_min ?? null,
      zone_max: profile?.usda_zone_max ?? null,
      cultivar_count: cvCount,
      has_stock: hasStock,
    });
  }

  // Assemble final structure
  let totalSpecies = 0;
  let totalCultivars = 0;

  const categories: TaxonomyTreeCategory[] = Array.from(
    categoryMap.entries()
  ).map(([category, genusAccMap]) => {
    const generaList: TaxonomyTreeGenus[] = Array.from(
      genusAccMap.values()
    ).map((acc) => {
      const bareSlug = acc.genus_slug.replace(/^genus-/, '');
      return {
        genus_slug: acc.genus_slug,
        genus_name: acc.genus_name,
        common_name: GENUS_COMMON_NAMES[bareSlug] ?? acc.genus_name,
        species_count: acc.species_ids.size,
        cultivar_count: acc.cultivar_count,
        has_stock: acc.has_stock,
        plants: acc.plants,
      };
    });

    // Sort genera: cultivar_count desc, then name asc
    generaList.sort((a, b) => {
      if (b.cultivar_count !== a.cultivar_count)
        return b.cultivar_count - a.cultivar_count;
      return a.common_name.localeCompare(b.common_name);
    });

    const catSpecies = generaList.reduce((s, g) => s + g.species_count, 0);
    const catCultivars = generaList.reduce((s, g) => s + g.cultivar_count, 0);
    totalSpecies += catSpecies;
    totalCultivars += catCultivars;

    return {
      category,
      genera: generaList,
      total_species: catSpecies,
      total_cultivars: catCultivars,
    };
  });

  // Fixed category sort order
  const CATEGORY_ORDER = ['Nut Trees', 'Berries', 'Tree Fruit', 'Support Species'];
  categories.sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.category);
    const bIdx = CATEGORY_ORDER.indexOf(b.category);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  return { categories, total_species: totalSpecies, total_cultivars: totalCultivars };
}
