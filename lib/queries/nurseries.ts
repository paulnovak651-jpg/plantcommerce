import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaginationParams } from '@/lib/pagination';

interface NurseryOfferCountRow {
  nursery_id: string;
}

interface NurseryWithOfferCount extends Record<string, unknown> {
  id: string;
  offer_count: number;
}

interface PagedResult<T> {
  data: T[];
  total: number;
}

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
  const { data } = await listNurseriesPaged(supabase, { limit: 5000, offset: 0 });
  return data;
}

export async function listNurseriesPaged(
  supabase: SupabaseClient,
  pagination: PaginationParams
): Promise<PagedResult<NurseryWithOfferCount>> {
  const { data: nurseries, error, count } = await supabase
    .from('nurseries')
    .select('*', { count: 'exact' })
    .eq('curation_status', 'published')
    .eq('is_active', true)
    .order('name')
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (error) return { data: [], total: 0 };
  if (!nurseries || nurseries.length === 0) {
    return { data: [], total: count ?? 0 };
  }

  const nurseryIds = nurseries.map((nursery) => nursery.id as string);
  const { data: offerRows } = await supabase
    .from('inventory_offers')
    .select('nursery_id')
    .eq('offer_status', 'active')
    .in('nursery_id', nurseryIds);

  const offerCounts = new Map<string, number>();
  for (const row of (offerRows ?? []) as NurseryOfferCountRow[]) {
    offerCounts.set(row.nursery_id, (offerCounts.get(row.nursery_id) ?? 0) + 1);
  }

  return {
    data: (nurseries ?? []).map((nursery) => ({
      ...nursery,
      offer_count: offerCounts.get(nursery.id as string) ?? 0,
    })) as NurseryWithOfferCount[],
    total: count ?? 0,
  };
}

export async function getInventoryForNurseryPaged(
  supabase: SupabaseClient,
  nurseryId: string,
  pagination: PaginationParams
): Promise<PagedResult<Record<string, unknown>>> {
  const { data, error, count } = await supabase
    .from('inventory_offers')
    .select(
      `
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
    `,
      { count: 'exact' }
    )
    .eq('nursery_id', nurseryId)
    .eq('offer_status', 'active')
    .order('raw_product_name')
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (error) return { data: [], total: 0 };
  return { data: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
}

export async function getInventoryForNursery(supabase: SupabaseClient, nurseryId: string) {
  const { data } = await getInventoryForNurseryPaged(supabase, nurseryId, {
    limit: 5000,
    offset: 0,
  });
  return data;
}
