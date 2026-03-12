import type { SupabaseClient } from '@supabase/supabase-js';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';
import type { GenusPlantItem, GenusPlantListResponse } from '@/lib/types/genus-plants';

interface PlantRow {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  display_category: string | null;
}

interface CultivarRow {
  id: string;
  slug: string;
  canonical_name: string;
  plant_entity_id: string | null;
}

interface OfferRow {
  cultivar_id: string | null;
  nursery_id: string;
  price_cents: number | null;
}

interface ProfileRow {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
}

interface GenusNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

async function findGenusNode(
  supabase: SupabaseClient,
  genusSlug: string
): Promise<GenusNode | null> {
  let { data: genusNode } = await supabase
    .from('taxonomy_nodes')
    .select('id, slug, name, description, taxonomy_ranks!inner(rank_name)')
    .eq('taxonomy_ranks.rank_name', 'genus')
    .eq('slug', genusSlug)
    .single();

  if (!genusNode && !genusSlug.startsWith('genus-')) {
    const retry = await supabase
      .from('taxonomy_nodes')
      .select('id, slug, name, description, taxonomy_ranks!inner(rank_name)')
      .eq('taxonomy_ranks.rank_name', 'genus')
      .eq('slug', `genus-${genusSlug}`)
      .single();
    genusNode = retry.data;
  }

  if (!genusNode) return null;
  return genusNode as GenusNode;
}

export async function getGenusPlantList(
  supabase: SupabaseClient,
  genusSlug: string
): Promise<GenusPlantListResponse | null> {
  const node = await findGenusNode(supabase, genusSlug);
  if (!node) return null;

  const [
    { data: plantRows },
    { data: cultivarRows },
    { data: offerRows },
    { data: profileRows },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, botanical_name, display_category')
      .eq('taxonomy_node_id', node.id)
      .eq('curation_status', 'published')
      .order('canonical_name'),
    supabase
      .from('cultivars')
      .select('id, slug, canonical_name, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id, price_cents')
      .eq('offer_status', 'active'),
    supabase
      .from('species_growing_profiles')
      .select('plant_entity_id, usda_zone_min, usda_zone_max'),
  ]);

  const plants = (plantRows ?? []) as PlantRow[];
  if (plants.length === 0) return null;

  const cultivars = (cultivarRows ?? []) as CultivarRow[];
  const offers = (offerRows ?? []) as OfferRow[];
  const profiles = (profileRows ?? []) as ProfileRow[];

  const plantIds = new Set(plants.map((p) => p.id));
  const plantById = new Map(plants.map((p) => [p.id, p]));

  // Build cultivar → plant mapping
  const cultivarToPlant = new Map<string, string>();
  const plantCultivars = new Map<string, CultivarRow[]>();
  for (const cv of cultivars) {
    if (!cv.plant_entity_id || !plantIds.has(cv.plant_entity_id)) continue;
    cultivarToPlant.set(cv.id, cv.plant_entity_id);
    if (!plantCultivars.has(cv.plant_entity_id)) {
      plantCultivars.set(cv.plant_entity_id, []);
    }
    plantCultivars.get(cv.plant_entity_id)!.push(cv);
  }

  // Per-cultivar: lowest price and nursery set
  const cultivarLowestPrice = new Map<string, number>();
  const cultivarNurseries = new Map<string, Set<string>>();

  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (!plantId) continue;

    if (!cultivarNurseries.has(offer.cultivar_id)) {
      cultivarNurseries.set(offer.cultivar_id, new Set());
    }
    cultivarNurseries.get(offer.cultivar_id)!.add(offer.nursery_id);

    if (offer.price_cents != null) {
      const current = cultivarLowestPrice.get(offer.cultivar_id);
      if (current === undefined || offer.price_cents < current) {
        cultivarLowestPrice.set(offer.cultivar_id, offer.price_cents);
      }
    }
  }

  // Profile map
  const profileMap = new Map<string, ProfileRow>();
  for (const p of profiles) {
    if (plantIds.has(p.plant_entity_id)) {
      profileMap.set(p.plant_entity_id, p);
    }
  }

  // Build flat items
  const items: GenusPlantItem[] = [];
  const speciesCounts = new Map<string, number>();

  for (const plant of plants) {
    const profile = profileMap.get(plant.id);
    const cvs = plantCultivars.get(plant.id);

    if (cvs && cvs.length > 0) {
      // Emit one item per cultivar
      for (const cv of cvs) {
        const item: GenusPlantItem = {
          id: cv.id,
          type: 'cultivar',
          name: cv.canonical_name,
          slug: cv.slug,
          species_slug: plant.slug,
          species_name: plant.canonical_name,
          botanical_name: plant.botanical_name,
          nursery_count: cultivarNurseries.get(cv.id)?.size ?? 0,
          lowest_price_cents: cultivarLowestPrice.get(cv.id) ?? null,
          zone_min: profile?.usda_zone_min ?? null,
          zone_max: profile?.usda_zone_max ?? null,
          display_category: plant.display_category,
        };
        items.push(item);
        speciesCounts.set(plant.slug, (speciesCounts.get(plant.slug) ?? 0) + 1);
      }
    } else {
      // Species with no cultivars — emit as its own item
      // Compute nursery count from all offers for cultivars under this plant
      // (but since there are none, nursery_count is 0)
      const item: GenusPlantItem = {
        id: plant.id,
        type: 'species',
        name: plant.canonical_name,
        slug: plant.slug,
        species_slug: plant.slug,
        species_name: plant.canonical_name,
        botanical_name: plant.botanical_name,
        nursery_count: 0,
        lowest_price_cents: null,
        zone_min: profile?.usda_zone_min ?? null,
        zone_max: profile?.usda_zone_max ?? null,
        display_category: plant.display_category,
      };
      items.push(item);
      speciesCounts.set(plant.slug, (speciesCounts.get(plant.slug) ?? 0) + 1);
    }
  }

  // Sort by name by default
  items.sort((a, b) => a.name.localeCompare(b.name));

  // Build species filter options
  const species_filter_options = plants
    .map((p) => ({
      slug: p.slug,
      name: p.canonical_name,
      count: speciesCounts.get(p.slug) ?? 0,
    }))
    .filter((o) => o.count > 0)
    .sort((a, b) => b.count - a.count);

  const bareSlug = node.slug.replace(/^genus-/, '');

  return {
    genus_slug: node.slug,
    genus_name: node.name,
    common_name: GENUS_COMMON_NAMES[bareSlug] ?? node.name,
    description: node.description,
    total_count: items.length,
    species_filter_options,
    items,
  };
}
