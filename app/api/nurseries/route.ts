import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listNurseriesPaged } from '@/lib/queries/nurseries';
import { apiSuccess } from '@/lib/api-helpers';
import { buildPaginationLinks, parsePagination } from '@/lib/pagination';
import { withRateLimit } from '@/lib/api-rate-limit';

/**
 * GET /api/nurseries
 * List all active, published nurseries.
 */
export const GET = withRateLimit(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const pagination = parsePagination(request.nextUrl.searchParams);
  const { data: nurseries, total } = await listNurseriesPaged(supabase, pagination);
  const links = buildPaginationLinks(
    '/api/nurseries',
    request.nextUrl.searchParams,
    pagination,
    total
  );

  return apiSuccess(nurseries, { total, ...pagination }, links);
}, { max: 60 });
