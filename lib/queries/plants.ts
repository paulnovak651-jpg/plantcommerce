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
