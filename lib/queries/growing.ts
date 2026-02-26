import type { SupabaseClient } from '@supabase/supabase-js';

export async function getGrowingProfile(
  supabase: SupabaseClient,
  plantEntityId: string
) {
  const { data, error } = await supabase
    .from('species_growing_profiles')
    .select('*')
    .eq('plant_entity_id', plantEntityId)
    .maybeSingle();

  if (error) {
    console.error('getGrowingProfile error:', error);
    return null;
  }
  return data;
}
