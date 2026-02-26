import type { SupabaseClient } from '@supabase/supabase-js';

export async function getPlantEntityBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function listPlantEntities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('*')
    .eq('curation_status', 'published')
    .order('canonical_name');

  if (error) {
    console.error('listPlantEntities error:', error);
    return [];
  }
  return data;
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
  for (const c of cultivars ?? []) {
    cultivarToPlant.set(c.id, c.plant_entity_id);
  }

  const plantNurseries = new Map<string, Set<string>>();
  for (const offer of activeOffers ?? []) {
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
  return data;
}
