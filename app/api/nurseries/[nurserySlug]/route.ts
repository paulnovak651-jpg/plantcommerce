import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNurseryBySlug,
  getInventoryForNurseryPaged,
} from '@/lib/queries/nurseries';
import { apiSuccess, apiNotFound } from '@/lib/api-helpers';
import { buildPaginationLinks, parsePagination } from '@/lib/pagination';

/**
 * GET /api/nurseries/:nurserySlug
 * Nursery detail with current inventory offers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nurserySlug: string }> }
) {
  const { nurserySlug } = await params;
  const pagination = parsePagination(request.nextUrl.searchParams);
  const supabase = await createClient();
  const nursery = await getNurseryBySlug(supabase, nurserySlug);

  if (!nursery) return apiNotFound('Nursery');

  const { data: inventory, total } = await getInventoryForNurseryPaged(
    supabase,
    nursery.id as string,
    pagination
  );
  const links = buildPaginationLinks(
    `/api/nurseries/${nurserySlug}`,
    request.nextUrl.searchParams,
    pagination,
    total
  );
  links.list = '/api/nurseries';

  return apiSuccess(
    { ...nursery, inventory },
    { total, ...pagination },
    links
  );
}
