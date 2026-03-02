/**
 * Composite ranking engine ported from PlantFinder.
 * Scores and re-ranks search results using multiple weighted factors.
 *
 * Weights:
 *   Text match:    35%  — how well query terms match the result
 *   Availability:  25%  — in-stock > limited > out-of-stock
 *   Confidence:    20%  — resolution confidence of best offer
 *   Distance:      10%  — proximity to user (via Haversine)
 *   Shipping:      10%  — ships nationwide or to user's state
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedQuery } from './parseQuery';
import type { SearchResult } from '@/lib/queries/search';
import { haversine } from './haversine';

export interface ScoredResult extends SearchResult {
  compositeScore: number;
  textMatchScore: number;
  availabilityScore: number;
  confidenceScore: number;
  distanceScore: number;
  shippingScore: number;
  distanceMiles?: number;
  bestPriceCents?: number;
  nurseryName?: string;
  nurseryState?: string;
}

interface OfferInfo {
  entity_id: string;
  offer_status: string;
  resolution_confidence: number | null;
  price_cents: number | null;
  nursery_id: string;
}

interface NurseryInfo {
  id: string;
  name: string;
  location_state: string | null;
  latitude: number | null;
  longitude: number | null;
  shipping_notes: string | null;
}

// ---------- Text match ----------

function textMatchScore(parsed: ParsedQuery, result: SearchResult): number {
  if (parsed.plantTerms.length === 0) return 0.5;

  const haystack = [
    result.canonical_name,
    result.botanical_name,
    result.species_common_name,
    result.genus,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let matched = 0;
  for (const term of parsed.plantTerms) {
    if (haystack.includes(term)) matched++;
  }
  return matched / parsed.plantTerms.length;
}

// ---------- Availability ----------

function availabilityScore(offerCount: number): number {
  if (offerCount >= 3) return 1;
  if (offerCount >= 1) return 0.7;
  return 0.1;
}

// ---------- Composite scoring ----------

export async function scoreResults(
  supabase: SupabaseClient,
  parsed: ParsedQuery,
  results: SearchResult[],
  userLat?: number,
  userLng?: number,
  userState?: string,
): Promise<ScoredResult[]> {
  if (results.length === 0) return [];

  // Collect entity IDs to batch-fetch offer and nursery data
  const entityIds = results.map(r => r.entity_id);

  // Fetch best offers per entity (active only)
  const { data: offers } = await supabase
    .from('inventory_offers')
    .select('cultivar_id, plant_entity_id, offer_status, resolution_confidence, price_cents, nursery_id')
    .eq('offer_status', 'active')
    .or(
      entityIds.map(id => `cultivar_id.eq.${id}`).join(',')
      + ',' +
      entityIds.map(id => `plant_entity_id.eq.${id}`).join(',')
    )
    .limit(500);

  // Group offers by entity
  const offersByEntity = new Map<string, OfferInfo[]>();
  for (const o of (offers ?? []) as any[]) {
    const eid = o.cultivar_id ?? o.plant_entity_id;
    if (!eid) continue;
    if (!offersByEntity.has(eid)) offersByEntity.set(eid, []);
    offersByEntity.get(eid)!.push({
      entity_id: eid,
      offer_status: o.offer_status,
      resolution_confidence: o.resolution_confidence,
      price_cents: o.price_cents,
      nursery_id: o.nursery_id,
    });
  }

  // Fetch nurseries for those offers
  const nurseryIds = new Set<string>();
  for (const arr of offersByEntity.values()) {
    for (const o of arr) nurseryIds.add(o.nursery_id);
  }

  const nurseryMap = new Map<string, NurseryInfo>();
  if (nurseryIds.size > 0) {
    const { data: nurseries } = await supabase
      .from('nurseries')
      .select('id, name, location_state, latitude, longitude, shipping_notes')
      .in('id', [...nurseryIds]);

    for (const n of (nurseries ?? []) as NurseryInfo[]) {
      nurseryMap.set(n.id, n);
    }
  }

  // Score each result
  const scored: ScoredResult[] = results.map(result => {
    const tmScore = textMatchScore(parsed, result);
    const availScore = availabilityScore(result.active_offer_count);

    // Best confidence from offers
    const entityOffers = offersByEntity.get(result.entity_id) ?? [];
    const bestConf = entityOffers.reduce(
      (max, o) => Math.max(max, o.resolution_confidence ?? 0), 0
    );
    const confScore = Math.min(bestConf, 1);

    // Best price
    const prices = entityOffers
      .map(o => o.price_cents)
      .filter((p): p is number => p != null && p > 0);
    const bestPriceCents = prices.length > 0 ? Math.min(...prices) : undefined;

    // Distance — use closest nursery
    let distScore = 0.5;
    let distanceMiles: number | undefined;
    let closestNursery: NurseryInfo | undefined;

    if (userLat != null && userLng != null && entityOffers.length > 0) {
      let minDist = Infinity;
      for (const o of entityOffers) {
        const n = nurseryMap.get(o.nursery_id);
        if (n?.latitude != null && n?.longitude != null) {
          const d = haversine(userLat, userLng, n.latitude, n.longitude);
          if (d < minDist) {
            minDist = d;
            closestNursery = n;
          }
        }
      }
      if (minDist < Infinity) {
        distanceMiles = Math.round(minDist);
        distScore = Math.max(0, 1 - minDist / 500);
      }
    }

    // Shipping — does any nursery ship to user's state or nationwide?
    let shipScore = 0.3;
    if (entityOffers.length > 0) {
      for (const o of entityOffers) {
        const n = nurseryMap.get(o.nursery_id);
        if (!n) continue;
        const notes = (n.shipping_notes ?? '').toLowerCase();
        if (notes.includes('nationwide') || notes.includes('all states')) {
          shipScore = 1;
          break;
        }
        if (userState && n.location_state === userState) {
          shipScore = Math.max(shipScore, 0.7);
        }
      }
    }

    // First nursery name for display
    const primaryNursery = closestNursery ?? (
      entityOffers.length > 0 ? nurseryMap.get(entityOffers[0].nursery_id) : undefined
    );

    const composite =
      tmScore * 0.35 +
      availScore * 0.25 +
      confScore * 0.20 +
      distScore * 0.10 +
      shipScore * 0.10;

    return {
      ...result,
      compositeScore: Math.round(composite * 1000) / 1000,
      textMatchScore: tmScore,
      availabilityScore: availScore,
      confidenceScore: confScore,
      distanceScore: distScore,
      shippingScore: shipScore,
      distanceMiles,
      bestPriceCents,
      nurseryName: primaryNursery?.name,
      nurseryState: primaryNursery?.location_state ?? undefined,
    };
  });

  return scored.sort((a, b) => b.compositeScore - a.compositeScore);
}
