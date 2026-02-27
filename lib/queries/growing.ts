import type { SupabaseClient } from '@supabase/supabase-js';
import type { GrowingProfile } from '@/lib/types';

export async function getGrowingProfile(
  supabase: SupabaseClient,
  plantEntityId: string
): Promise<GrowingProfile | null> {
  const { data, error } = await supabase
    .from('species_growing_profiles')
    .select('*')
    .eq('plant_entity_id', plantEntityId)
    .maybeSingle();

  if (error) {
    console.error('getGrowingProfile error:', error);
    return null;
  }
  return data as GrowingProfile;
}
