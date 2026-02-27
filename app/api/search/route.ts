import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlantsPaged } from '@/lib/queries/search';
import { parseSearchApiParams } from '@/lib/contracts/ux';
import { apiSuccess } from '@/lib/api-helpers';
import { buildPaginationLinks } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const { query: q, limit, offset, zone, category, inStock } = parseSearchApiParams(
    request.nextUrl.searchParams
  );

  const baseParams = new URLSearchParams();
  baseParams.set('q', q);
  if (zone != null) baseParams.set('zone', String(zone));
  if (category) baseParams.set('category', category);
  if (inStock) baseParams.set('inStock', 'true');

  if (!q.trim()) {
    return apiSuccess([], { total: 0, limit, offset }, {
      self: '/api/search',
    });
  }

  const supabase = await createClient();
  const { results, total } = await searchPlantsPaged(supabase, {
    q,
    limit,
    offset,
    zone,
    category,
    inStock,
  });
  const links = buildPaginationLinks(
    '/api/search',
    baseParams,
    { limit, offset },
    total
  );

  return apiSuccess(results, { total, limit, offset }, links);
}
