import { createAnonClient, createServiceClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

const VALID_LISTING_TYPES = new Set(['wts', 'wtb']);
const VALID_MATERIAL_TYPES = new Set([
  'unknown', 'potted', 'bareroot', 'scion', 'cutting', 'seed', 'rootstock', 'other',
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  return EMAIL_RE.test(email) ? email : null;
}

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

  const normalizedEmail = normalizeEmail(contact_email);
  if (contact_email && !normalizedEmail) {
    return apiError('INVALID_FIELD', 'contact_email must be a valid email address', 422);
  }

  const supabase = createServiceClient();

  // Rate limit: max 5 pending listings per email
  if (normalizedEmail) {
    const { count, error: countError } = await supabase
      .from('community_listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('contact_email', normalizedEmail);

    if (countError) {
      console.error('Listing rate-limit check failed:', countError);
      return apiError('DB_ERROR', 'Failed to validate listing limits', 500);
    }

    if ((count ?? 0) >= 5) {
      return apiError(
        'RATE_LIMITED',
        'You already have 5 pending listings for this email. Please wait for moderation.',
        429
      );
    }
  }

  // Attempt resolver: exact case-insensitive cultivar name match
  let cultivarId: string | null = null;
  let plantEntityId: string | null = null;
  let resolveConfidence = 0.0;

  const { data: exactMatch } = await supabase
    .from('cultivars')
    .select('id, plant_entity_id')
    .ilike('canonical_name', raw_cultivar_text.trim())
    .eq('curation_status', 'published')
    .limit(1)
    .maybeSingle();

  if (exactMatch) {
    cultivarId = exactMatch.id as string;
    plantEntityId = exactMatch.plant_entity_id as string;
    resolveConfidence = 0.90;
  } else if (typeof raw_species_text === 'string' && raw_species_text.trim()) {
    const { data: speciesMatch } = await supabase
      .from('plant_entities')
      .select('id')
      .or(
        `canonical_name.ilike.${raw_species_text.trim()},botanical_name.ilike.${raw_species_text.trim()}`
      )
      .eq('curation_status', 'published')
      .limit(1)
      .maybeSingle();

    if (speciesMatch) {
      plantEntityId = speciesMatch.id as string;
      resolveConfidence = 0.60;
    }
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
      contact_email: normalizedEmail,
      notes:
        typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      cultivar_id: cultivarId,
      plant_entity_id: plantEntityId,
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
