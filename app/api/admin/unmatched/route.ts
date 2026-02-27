import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { parseLimit, parseListStatus } from '@/lib/unmatched/admin';
import { buildPaginationLinks } from '@/lib/pagination';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/unmatched
 * Protected unmatched queue endpoint for moderation tooling.
 * Query: ?status=pending|resolved|ignored|all&limit=100
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const status = parseListStatus(request.nextUrl.searchParams.get('status'));
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'), 100);
    const offsetRaw = request.nextUrl.searchParams.get('offset');
    const parsedOffset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;
    const offset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    const supabase = createServiceClient();
    let query = supabase
      .from('unmatched_names')
      .select(
        'id, raw_product_name, parsed_core_name, nursery_id, import_run_id, raw_row_id, review_status, resolved_to_type, resolved_to_id, reviewed_at, reviewer_notes, occurrence_count, first_seen_at, last_seen_at, nurseries(name, slug)',
        { count: 'exact' }
      )
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('review_status', status);
    }

    const { data, error, count } = await query;
    if (error) return apiError('DB_ERROR', error.message, 500);

    const params = new URLSearchParams(request.nextUrl.searchParams.toString());
    params.set('status', status);
    const links = buildPaginationLinks(
      '/api/admin/unmatched',
      params,
      { limit, offset },
      count ?? 0
    );

    return apiSuccess(data ?? [], { total: count ?? 0, limit, offset }, links);
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
