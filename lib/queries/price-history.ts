import type { SupabaseClient } from '@supabase/supabase-js';

export interface PriceChange {
  priceCentsOld: number;
  priceCentsNew: number;
  detectedAt: string;
}

/**
 * Get the most recent price change for each offer in a list.
 * Returns a map of offerId → most recent PriceChange (or absent if no history).
 */
export async function getLatestPriceChanges(
  supabase: SupabaseClient,
  offerIds: string[]
): Promise<Map<string, PriceChange>> {
  if (offerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('price_history')
    .select('offer_id, price_cents_old, price_cents_new, detected_at')
    .in('offer_id', offerIds)
    .order('detected_at', { ascending: false });

  if (error || !data) return new Map();

  // Keep only the most recent entry per offer
  const result = new Map<string, PriceChange>();
  for (const row of data) {
    if (result.has(row.offer_id)) continue;
    result.set(row.offer_id, {
      priceCentsOld: row.price_cents_old,
      priceCentsNew: row.price_cents_new,
      detectedAt: row.detected_at,
    });
  }

  return result;
}

export interface PriceHistoryPoint {
  offerId: string;
  priceCents: number;
  detectedAt: string;
}

/**
 * Get all price history points for a set of offer IDs.
 * Returns points sorted by date ascending, grouped by offer ID.
 */
export async function getPriceHistoryForOffers(
  supabase: SupabaseClient,
  offerIds: string[]
): Promise<Map<string, PriceHistoryPoint[]>> {
  if (offerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('price_history')
    .select('offer_id, price_cents_new, detected_at')
    .in('offer_id', offerIds)
    .order('detected_at', { ascending: true });

  if (error || !data) return new Map();

  const result = new Map<string, PriceHistoryPoint[]>();
  for (const row of data) {
    const points = result.get(row.offer_id) ?? [];
    points.push({
      offerId: row.offer_id,
      priceCents: row.price_cents_new,
      detectedAt: row.detected_at,
    });
    result.set(row.offer_id, points);
  }

  return result;
}
