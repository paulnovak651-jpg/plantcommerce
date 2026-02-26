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
  const [{ data: nurseries, error }, { data: offerRows }] = await Promise.all([
    supabase
      .from('nurseries')
      .select('*')
      .eq('curation_status', 'published')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('inventory_offers')
      .select('nursery_id')
      .eq('offer_status', 'active'),
  ]);

  if (error) return [];

  const offerCounts = new Map<string, number>();
  for (const row of offerRows ?? []) {
    offerCounts.set(row.nursery_id, (offerCounts.get(row.nursery_id) ?? 0) + 1);
  }

  return (nurseries ?? []).map((n) => ({
    ...n,
    offer_count: offerCounts.get(n.id) ?? 0,
  }));
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
