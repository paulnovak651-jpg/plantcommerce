import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cultivar, PlantEntity } from '@/lib/types';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';

interface PlantCategoryRow {
  id: string;
  slug: string;
  canonical_name: string;
  display_category: string | null;
  taxonomy_node_id: string | null;
}

interface CultivarCategoryRow {
  id: string;
  plant_entity_id: string;
}

interface ActiveOfferRow {
  cultivar_id: string | null;
  nursery_id: string;
}

export interface CategoryGroup {
  category: string;
  species_count: number;
  cultivar_count: number;
  nursery_count: number;
  top_species: Array<{ slug: string; canonical_name: string }>;
  top_genera: Array<{ slug: string; common_name: string; species_count: number }>;
}

export interface RelatedSpecies {
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
}

export async function getPlantEntityBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<PlantEntity | null> {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('*')
    .eq('slug', slug)
    .eq('curation_status', 'published')
    .single();

  if (error) return null;
  return data as PlantEntity;
}

export async function listPlantEntities(
  supabase: SupabaseClient
): Promise<PlantEntity[]> {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('*')
    .eq('curation_status', 'published')
    .order('canonical_name');

  if (error) {
    console.error('listPlantEntities error:', error);
    return [];
  }
  return (data ?? []) as PlantEntity[];
}

export async function listPlantEntitiesForBrowse(supabase: SupabaseClient) {
  const [
    { data: plants, error },
    { data: cultivars },
    { data: activeOffers },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, botanical_name, genus, family')
      .eq('curation_status', 'published')
      .order('family')
      .order('genus')
      .order('canonical_name'),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
    ]);

  if (error) return [];

  const cultivarToPlant = new Map<string, string>();
  for (const c of (cultivars ?? []) as Array<{ id: string; plant_entity_id: string }>) {
    cultivarToPlant.set(c.id, c.plant_entity_id);
  }

  const plantNurseries = new Map<string, Set<string>>();
  for (const offer of (activeOffers ?? []) as Array<{ cultivar_id: string; nursery_id: string }>) {
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (!plantId) continue;
    if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
    plantNurseries.get(plantId)!.add(offer.nursery_id);
  }

  return (plants ?? []).map((p) => ({
    ...p,
    nursery_count: plantNurseries.get(p.id)?.size ?? 0,
  }));
}

/**
 * Returns per-cultivar nursery counts and species-level nursery count for a species.
 * Single query: fetches all active offers for the given cultivar IDs.
 */
export async function getOfferStatsForSpecies(
  supabase: SupabaseClient,
  cultivarIds: string[]
): Promise<{ nurseryCount: number; perCultivar: Record<string, number> }> {
  if (cultivarIds.length === 0) return { nurseryCount: 0, perCultivar: {} };

  const { data } = await supabase
    .from('inventory_offers')
    .select('cultivar_id, nursery_id')
    .in('cultivar_id', cultivarIds)
    .eq('offer_status', 'active');

  const perCultivar: Record<string, Set<string>> = {};
  const allNurseries = new Set<string>();

  for (const offer of data ?? []) {
    if (!perCultivar[offer.cultivar_id]) perCultivar[offer.cultivar_id] = new Set();
    perCultivar[offer.cultivar_id].add(offer.nursery_id);
    allNurseries.add(offer.nursery_id);
  }

  return {
    nurseryCount: allNurseries.size,
    perCultivar: Object.fromEntries(
      Object.entries(perCultivar).map(([id, nurseries]) => [id, nurseries.size])
    ),
  };
}

export async function getCultivarsForSpecies(supabase: SupabaseClient, plantEntityId: string) {
  const { data, error } = await supabase
    .from('cultivars')
    .select('*')
    .eq('plant_entity_id', plantEntityId)
    .eq('curation_status', 'published')
    .order('canonical_name');

  if (error) return [];
  return (data ?? []) as Cultivar[];
}

export async function getHomepageCategories(
  supabase: SupabaseClient
): Promise<CategoryGroup[]> {
  const [
    { data: speciesRows, error: speciesError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: genusRows, error: genusError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, display_category, taxonomy_node_id')
      .eq('curation_status', 'published')
      .order('canonical_name'),
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
  ]);

  if (speciesError || cultivarError || offerError || genusError) {
    console.error('getHomepageCategories error:', speciesError ?? cultivarError ?? offerError ?? genusError);
    return [];
  }

  const species = (speciesRows ?? []) as PlantCategoryRow[];
  const cultivars = (cultivarRows ?? []) as CultivarCategoryRow[];
  const offers = (offerRows ?? []) as ActiveOfferRow[];

  // Build genus lookup: taxonomy_node_id → { slug, name }
  const genusMap = new Map<string, { slug: string; name: string }>();
  for (const g of (genusRows ?? []) as Array<{ id: string; slug: string; name: string }>) {
    genusMap.set(g.id, { slug: g.slug, name: g.name });
  }

  const cultivarToSpecies = new Map<string, string>();
  const speciesCultivarCounts = new Map<string, number>();
  const speciesNurseries = new Map<string, Set<string>>();

  for (const cultivar of cultivars) {
    cultivarToSpecies.set(cultivar.id, cultivar.plant_entity_id);
    speciesCultivarCounts.set(
      cultivar.plant_entity_id,
      (speciesCultivarCounts.get(cultivar.plant_entity_id) ?? 0) + 1
    );
  }

  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const speciesId = cultivarToSpecies.get(offer.cultivar_id);
    if (!speciesId) continue;
    if (!speciesNurseries.has(speciesId)) speciesNurseries.set(speciesId, new Set());
    speciesNurseries.get(speciesId)?.add(offer.nursery_id);
  }

  type GroupAccumulator = {
    speciesIds: Set<string>;
    cultivarCount: number;
    nurseryIds: Set<string>;
    speciesStats: Array<{
      slug: string;
      canonical_name: string;
      cultivar_count: number;
      nursery_count: number;
      genus_slug: string | null;
    }>;
  };

  const groups = new Map<string, GroupAccumulator>();

  for (const sp of species) {
    const category = sp.display_category?.trim() || 'Other';
    if (!groups.has(category)) {
      groups.set(category, {
        speciesIds: new Set<string>(),
        cultivarCount: 0,
        nurseryIds: new Set<string>(),
        speciesStats: [],
      });
    }

    const group = groups.get(category);
    if (!group) continue;

    const cultivarCount = speciesCultivarCounts.get(sp.id) ?? 0;
    const nurseries = speciesNurseries.get(sp.id) ?? new Set<string>();
    const genus = sp.taxonomy_node_id ? genusMap.get(sp.taxonomy_node_id) : null;

    group.speciesIds.add(sp.id);
    group.cultivarCount += cultivarCount;
    for (const nurseryId of nurseries) {
      group.nurseryIds.add(nurseryId);
    }

    group.speciesStats.push({
      slug: sp.slug,
      canonical_name: sp.canonical_name,
      cultivar_count: cultivarCount,
      nursery_count: nurseries.size,
      genus_slug: genus?.slug ?? null,
    });
  }

  return Array.from(groups.entries())
    .map(([category, group]) => {
      // Build top_genera by grouping species within this category by genus
      const genusAcc = new Map<string, { slug: string; species_count: number; cultivar_count: number }>();
      for (const sp of group.speciesStats) {
        if (!sp.genus_slug) continue;
        let ga = genusAcc.get(sp.genus_slug);
        if (!ga) {
          ga = { slug: sp.genus_slug, species_count: 0, cultivar_count: 0 };
          genusAcc.set(sp.genus_slug, ga);
        }
        ga.species_count += 1;
        ga.cultivar_count += sp.cultivar_count;
      }

      const topGenera = Array.from(genusAcc.values())
        .sort((a, b) => b.cultivar_count - a.cultivar_count)
        .slice(0, 3)
        .map((g) => ({
          slug: g.slug,
          common_name: GENUS_COMMON_NAMES[g.slug] ?? g.slug,
          species_count: g.species_count,
        }));

      return {
        category,
        species_count: group.speciesIds.size,
        cultivar_count: group.cultivarCount,
        nursery_count: group.nurseryIds.size,
        top_species: group.speciesStats
          .sort((a, b) => {
            if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
            if (b.cultivar_count !== a.cultivar_count) return b.cultivar_count - a.cultivar_count;
            return a.canonical_name.localeCompare(b.canonical_name);
          })
          .slice(0, 3)
          .map(({ slug, canonical_name }) => ({ slug, canonical_name })),
        top_genera: topGenera,
      };
    })
    .sort((a, b) => {
      if (b.cultivar_count !== a.cultivar_count) return b.cultivar_count - a.cultivar_count;
      return a.category.localeCompare(b.category);
    });
}

export async function getRelatedSpecies(
  supabase: SupabaseClient,
  genus: string,
  excludeSlug: string
): Promise<RelatedSpecies[]> {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('slug, canonical_name, botanical_name')
    .eq('genus', genus)
    .eq('curation_status', 'published')
    .neq('slug', excludeSlug)
    .order('canonical_name')
    .limit(10);

  if (error) {
    console.error('getRelatedSpecies error:', error);
    return [];
  }

  return (data ?? []) as RelatedSpecies[];
}
