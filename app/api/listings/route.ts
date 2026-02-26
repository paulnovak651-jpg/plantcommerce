import { createAnonClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

const VALID_LISTING_TYPES = new Set(['wts', 'wtb']);
const VALID_MATERIAL_TYPES = new Set([
  'unknown', 'potted', 'bareroot', 'scion', 'cutting', 'seed', 'rootstock', 'other',
]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const {
    listing_type,
    raw_cultivar_text,
    raw_species_text,
    material_type,
    quantity,
    price_cents,
    location_state,
    contact_email,
    notes,
  } = body;

  if (!listing_type || !VALID_LISTING_TYPES.has(String(listing_type))) {
    return apiError('INVALID_FIELD', 'listing_type must be "wts" or "wtb"', 422);
  }
  if (
    !raw_cultivar_text ||
    typeof raw_cultivar_text !== 'string' ||
    raw_cultivar_text.trim().length < 2
  ) {
    return apiError('INVALID_FIELD', 'raw_cultivar_text is required (min 2 chars)', 422);
  }
  if (
    !location_state ||
    typeof location_state !== 'string' ||
    location_state.trim().length === 0
  ) {
    return apiError('INVALID_FIELD', 'location_state is required', 422);
  }

  const resolvedMaterialType =
    typeof material_type === 'string' && VALID_MATERIAL_TYPES.has(material_type)
      ? material_type
      : 'unknown';

  // Attempt resolver: exact case-insensitive cultivar name match
  const supabase = createAnonClient();
  let cultivarId: string | null = null;
  let resolveConfidence = 0.0;

  const { data: exactMatch } = await supabase
    .from('cultivars')
    .select('id')
    .ilike('canonical_name', raw_cultivar_text.trim())
    .eq('curation_status', 'published')
    .limit(1)
    .maybeSingle();

  if (exactMatch) {
    cultivarId = exactMatch.id as string;
    resolveConfidence = 0.90;
  }

  const { data: inserted, error } = await supabase
    .from('community_listings')
    .insert({
      listing_type: String(listing_type),
      raw_cultivar_text: raw_cultivar_text.trim(),
      raw_species_text:
        typeof raw_species_text === 'string' && raw_species_text.trim()
          ? raw_species_text.trim()
          : null,
      material_type: resolvedMaterialType,
      quantity:
        typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : null,
      price_cents:
        typeof price_cents === 'number' && price_cents >= 0
          ? Math.floor(price_cents)
          : null,
      location_state: String(location_state).trim(),
      contact_email:
        typeof contact_email === 'string' && contact_email.trim()
          ? contact_email.trim()
          : null,
      notes:
        typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      cultivar_id: cultivarId,
      resolve_confidence: resolveConfidence,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Listing insert error:', error);
    return apiError('DB_ERROR', 'Failed to submit listing', 500);
  }

  return apiSuccess(
    { id: (inserted as { id: string }).id, status: 'pending' },
    undefined,
    undefined
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cultivarId = searchParams.get('cultivarId');
  const plantEntityId = searchParams.get('plantEntityId');

  if (!cultivarId && !plantEntityId) {
    return apiError('INVALID_PARAMS', 'cultivarId or plantEntityId is required', 400);
  }

  const supabase = createAnonClient();
  let query = supabase
    .from('community_listings')
    .select(
      'id, listing_type, raw_cultivar_text, material_type, quantity, price_cents, location_state, notes, trust_tier, created_at'
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (cultivarId) {
    query = query.eq('cultivar_id', cultivarId);
  } else if (plantEntityId) {
    query = query.eq('plant_entity_id', plantEntityId);
  }

  const { data } = await query;
  return apiSuccess(data ?? []);
}
