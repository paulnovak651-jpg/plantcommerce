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
