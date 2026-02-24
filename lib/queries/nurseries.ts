import type { SupabaseClient } from '@supabase/supabase-js';

export async function getNurseryBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('nurseries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function listNurseries(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('nurseries')
    .select('*')
    .eq('curation_status', 'published')
    .eq('is_active', true)
    .order('name');

  if (error) return [];
  return data;
}

export async function getInventoryForNursery(supabase: SupabaseClient, nurseryId: string) {
  const { data, error } = await supabase
    .from('inventory_offers')
    .select(`
      *,
      cultivars (
        id, slug, canonical_name, material_type,
        plant_entities (
          id, slug, canonical_name, botanical_name
        )
      ),
      plant_entities (
        id, slug, canonical_name, botanical_name
      )
    `)
    .eq('nursery_id', nurseryId)
    .eq('offer_status', 'active')
    .order('raw_product_name');

  if (error) return [];
  return data;
}
