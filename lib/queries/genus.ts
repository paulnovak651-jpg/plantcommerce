import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenusOverview {
  id: string;
  slug: string;
  name: string;
  botanical_name: string | null;
  description: string | null;
  species: GenusSpeciesSummary[];
  total_cultivar_count: number;
  total_nursery_count: number;
  family_name: string | null;
  family_slug: string | null;
  order_name: string | null;
}

export interface GenusSpeciesSummary {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  description: string | null;
  display_category: string | null;
  cultivar_count: number;
  nursery_count: number;
  zone_min: number | null;
  zone_max: number | null;
  sun_requirement: string | null;
  growth_rate: string | null;
  mature_height_min_ft: number | null;
  mature_height_max_ft: number | null;
}

interface TaxNodeRow {
  id: string;
  slug: string;
  name: string;
  botanical_name: string | null;
  description: string | null;
  parent_id: string | null;
  taxonomy_ranks: unknown;
}

interface PlantRow {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  description: string | null;
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

interface ProfileRow {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  sun_requirement: string | null;
  growth_rate: string | null;
  mature_height_min_ft: number | null;
  mature_height_max_ft: number | null;
}

function extractRankName(rankRaw: unknown): string {
  if (Array.isArray(rankRaw)) {
    return (rankRaw[0] as { rank_name?: string } | undefined)?.rank_name ?? 'unknown';
  }
  return (rankRaw as { rank_name?: string } | null)?.rank_name ?? 'unknown';
}

/** Fetch a genus by slug with all species, cultivar counts, and growing profiles. */
export async function getGenusBySlug(
  supabase: SupabaseClient,
  genusSlug: string
): Promise<GenusOverview | null> {
  // 1. Get the genus taxonomy node
  const { data: genusNode, error: genusError } = await supabase
    .from('taxonomy_nodes')
    .select('id, slug, name, botanical_name, description, parent_id, taxonomy_ranks(rank_name)')
    .eq('slug', genusSlug)
    .single();

  if (genusError || !genusNode) {
    if (genusError) console.error('getGenusBySlug genus lookup error:', genusError);
    return null;
  }

  const node = genusNode as TaxNodeRow;
  const rank = extractRankName(node.taxonomy_ranks);
  if (rank !== 'genus') return null;

  // 2. Get parent (family) and grandparent (order) for breadcrumbs
  let familyName: string | null = null;
  let familySlug: string | null = null;
  let orderName: string | null = null;

  if (node.parent_id) {
    const { data: familyNode } = await supabase
      .from('taxonomy_nodes')
      .select('id, name, slug, parent_id, taxonomy_ranks(rank_name)')
      .eq('id', node.parent_id)
      .single();

    if (familyNode) {
      const fNode = familyNode as TaxNodeRow;
      const fRank = extractRankName(fNode.taxonomy_ranks);
      if (fRank === 'family') {
        familyName = fNode.name;
        familySlug = fNode.slug;
      }
      if (fNode.parent_id) {
        const { data: orderNode } = await supabase
          .from('taxonomy_nodes')
          .select('name, taxonomy_ranks(rank_name)')
          .eq('id', fNode.parent_id)
          .single();
        if (orderNode) {
          const oRank = extractRankName((orderNode as TaxNodeRow).taxonomy_ranks);
          if (oRank === 'order') orderName = (orderNode as TaxNodeRow).name;
        }
      }
    }
  }

  // 3. Get all published species in this genus + related data in parallel
  const [
    { data: plantRows, error: plantError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, botanical_name, description, display_category, taxonomy_node_id')
      .eq('taxonomy_node_id', node.id)
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
      .from('species_growing_profiles')
      .select('plant_entity_id, usda_zone_min, usda_zone_max, sun_requirement, growth_rate, mature_height_min_ft, mature_height_max_ft'),
  ]);

  if (plantError || cultivarError || offerError || profileError) {
    console.error('getGenusBySlug data error:', plantError ?? cultivarError ?? offerError ?? profileError);
    return null;
  }

  const plants = (plantRows ?? []) as PlantRow[];
  const cultivars = (cultivarRows ?? []) as CultivarRow[];
  const offers = (offerRows ?? []) as OfferRow[];
  const profiles = (profileRows ?? []) as ProfileRow[];

  if (plants.length === 0) return null;

  const plantIds = new Set(plants.map((p) => p.id));

  // Build lookup maps (same pattern as browse.ts)
  const cultivarToPlant = new Map<string, string>();
  const plantCultivarCount = new Map<string, number>();
  const plantNurseries = new Map<string, Set<string>>();
  const profileMap = new Map<string, ProfileRow>();

  for (const cv of cultivars) {
    if (!cv.plant_entity_id || !plantIds.has(cv.plant_entity_id)) continue;
    cultivarToPlant.set(cv.id, cv.plant_entity_id);
    plantCultivarCount.set(cv.plant_entity_id, (plantCultivarCount.get(cv.plant_entity_id) ?? 0) + 1);
  }

  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (!plantId) continue;
    if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
    plantNurseries.get(plantId)!.add(offer.nursery_id);
  }

  for (const profile of profiles) {
    if (plantIds.has(profile.plant_entity_id)) {
      profileMap.set(profile.plant_entity_id, profile);
    }
  }

  // 4. Assemble species summaries
  const allNurseries = new Set<string>();
  let totalCultivars = 0;

  const species: GenusSpeciesSummary[] = plants.map((plant) => {
    const profile = profileMap.get(plant.id);
    const cultivarCount = plantCultivarCount.get(plant.id) ?? 0;
    const nurseries = plantNurseries.get(plant.id);
    const nurseryCount = nurseries?.size ?? 0;

    totalCultivars += cultivarCount;
    if (nurseries) nurseries.forEach((n) => allNurseries.add(n));

    return {
      id: plant.id,
      slug: plant.slug,
      canonical_name: plant.canonical_name,
      botanical_name: plant.botanical_name,
      description: plant.description,
      display_category: plant.display_category,
      cultivar_count: cultivarCount,
      nursery_count: nurseryCount,
      zone_min: profile?.usda_zone_min ?? null,
      zone_max: profile?.usda_zone_max ?? null,
      sun_requirement: profile?.sun_requirement ?? null,
      growth_rate: profile?.growth_rate ?? null,
      mature_height_min_ft: profile?.mature_height_min_ft ?? null,
      mature_height_max_ft: profile?.mature_height_max_ft ?? null,
    };
  });

  // Sort: nursery_count desc, then canonical_name asc
  species.sort((a, b) => {
    if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
    return a.canonical_name.localeCompare(b.canonical_name);
  });

  return {
    id: node.id,
    slug: node.slug,
    name: node.name,
    botanical_name: node.botanical_name,
    description: node.description,
    species,
    total_cultivar_count: totalCultivars,
    total_nursery_count: allNurseries.size,
    family_name: familyName,
    family_slug: familySlug,
    order_name: orderName,
  };
}

/** Fetch all permaculture-relevant genera with species/cultivar/nursery counts. */
export async function getAllGenera(
  supabase: SupabaseClient
): Promise<Array<{
  slug: string;
  name: string;
  botanical_name: string | null;
  species_count: number;
  cultivar_count: number;
  nursery_count: number;
}>> {
  const [
    { data: genusRows, error: genusError },
    { data: plantRows, error: plantError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
  ] = await Promise.all([
    supabase
      .from('taxonomy_nodes')
      .select('id, slug, name, botanical_name, taxonomy_ranks!inner(rank_name)')
      .eq('taxonomy_ranks.rank_name', 'genus')
      .eq('notable_for_permaculture', true)
      .order('name'),
    supabase
      .from('plant_entities')
      .select('id, taxonomy_node_id')
      .eq('curation_status', 'published'),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
  ]);

  if (genusError || plantError || cultivarError || offerError) {
    console.error('getAllGenera error:', genusError ?? plantError ?? cultivarError ?? offerError);
    return [];
  }

  const genera = (genusRows ?? []) as Array<{ id: string; slug: string; name: string; botanical_name: string | null }>;
  const plants = (plantRows ?? []) as Array<{ id: string; taxonomy_node_id: string | null }>;
  const cultivars = (cultivarRows ?? []) as CultivarRow[];
  const offers = (offerRows ?? []) as OfferRow[];

  // Build genus → plant IDs map
  const genusPlants = new Map<string, Set<string>>();
  for (const plant of plants) {
    if (!plant.taxonomy_node_id) continue;
    if (!genusPlants.has(plant.taxonomy_node_id)) genusPlants.set(plant.taxonomy_node_id, new Set());
    genusPlants.get(plant.taxonomy_node_id)!.add(plant.id);
  }

  // Build cultivar → plant map
  const cultivarToPlant = new Map<string, string>();
  const plantCultivarCount = new Map<string, number>();
  for (const cv of cultivars) {
    if (!cv.plant_entity_id) continue;
    cultivarToPlant.set(cv.id, cv.plant_entity_id);
    plantCultivarCount.set(cv.plant_entity_id, (plantCultivarCount.get(cv.plant_entity_id) ?? 0) + 1);
  }

  // Build plant → nursery set
  const plantNurseries = new Map<string, Set<string>>();
  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (!plantId) continue;
    if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
    plantNurseries.get(plantId)!.add(offer.nursery_id);
  }

  return genera.map((genus) => {
    const speciesIds = genusPlants.get(genus.id);
    const speciesCount = speciesIds?.size ?? 0;
    let cultivarCount = 0;
    const nurseries = new Set<string>();

    if (speciesIds) {
      for (const plantId of speciesIds) {
        cultivarCount += plantCultivarCount.get(plantId) ?? 0;
        const pn = plantNurseries.get(plantId);
        if (pn) pn.forEach((n) => nurseries.add(n));
      }
    }

    return {
      slug: genus.slug,
      name: genus.name,
      botanical_name: genus.botanical_name,
      species_count: speciesCount,
      cultivar_count: cultivarCount,
      nursery_count: nurseries.size,
    };
  }).filter((g) => g.species_count > 0);
}
