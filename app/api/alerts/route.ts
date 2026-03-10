import { createServiceClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  return EMAIL_RE.test(email) ? email : null;
}

export const POST = withRateLimit(async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  if (typeof body.email === 'string' && body.email.length > 254) {
    return apiError('INVALID_FIELD', 'email must be 254 characters or less', 400);
  }
  const email = normalizeEmail(body.email);
  if (!email) {
    return apiError('INVALID_FIELD', 'email must be a valid email address', 422);
  }

  const cultivarId =
    typeof body.cultivarId === 'string' && body.cultivarId.trim()
      ? body.cultivarId.trim()
      : null;
  const plantEntityId =
    typeof body.plantEntityId === 'string' && body.plantEntityId.trim()
      ? body.plantEntityId.trim()
      : null;
  const usdaZone =
    typeof body.usdaZone === 'number' &&
    Number.isInteger(body.usdaZone) &&
    body.usdaZone >= 1 &&
    body.usdaZone <= 13
      ? body.usdaZone
      : null;

  if (!cultivarId && !plantEntityId) {
    return apiError('INVALID_FIELD', 'cultivarId or plantEntityId is required', 422);
  }

  const supabase = createServiceClient();

  // Prevent duplicate active alerts for the same target/email pair.
  let duplicateQuery = supabase
    .from('stock_alerts')
    .select('id')
    .eq('email', email)
    .eq('status', 'active')
    .limit(1);

  duplicateQuery = cultivarId
    ? duplicateQuery.eq('cultivar_id', cultivarId)
    : duplicateQuery.eq('plant_entity_id', plantEntityId);

  const { data: existing } = await duplicateQuery.maybeSingle();
  if (existing?.id) {
    return apiSuccess({ id: existing.id, status: 'active', duplicate: true });
  }

  const { data, error } = await supabase
    .from('stock_alerts')
    .insert({
      email,
      cultivar_id: cultivarId,
      plant_entity_id: plantEntityId,
      usda_zone: usdaZone,
      status: 'active',
    })
    .select('id, status')
    .single();

  if (error || !data) {
    console.error('alerts POST error:', error);
    return apiError('DB_ERROR', 'Failed to create stock alert', 500);
  }

  return apiSuccess({
    id: data.id as string,
    status: data.status as string,
    duplicate: false,
  });
}, { max: 10 });
