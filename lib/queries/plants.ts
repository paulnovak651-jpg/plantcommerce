import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cultivar, PlantEntity } from '@/lib/types';

interface PlantCategoryRow {
  id: string;
  slug: string;
  canonical_name: string;
  display_category: string | null;
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
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, display_category')
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
  ]);

  if (speciesError || cultivarError || offerError) {
    console.error('getHomepageCategories error:', speciesError ?? cultivarError ?? offerError);
    return [];
  }

  const species = (speciesRows ?? []) as PlantCategoryRow[];
  const cultivars = (cultivarRows ?? []) as CultivarCategoryRow[];
  const offers = (offerRows ?? []) as ActiveOfferRow[];

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
    });
  }

  return Array.from(groups.entries())
    .map(([category, group]) => ({
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
    }))
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
