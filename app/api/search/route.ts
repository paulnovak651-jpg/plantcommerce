import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlants } from '@/lib/queries/search';
import { parseSearchApiParams } from '@/lib/contracts/ux';
import { apiSuccess } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { query: q, limit } = parseSearchApiParams(request.nextUrl.searchParams);

  if (!q.trim()) {
    return apiSuccess([], { total: 0 }, { self: '/api/search' });
  }

  const supabase = await createClient();
  const results = await searchPlants(supabase, q, limit);

  return apiSuccess(results, { total: results.length }, {
    self: `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  });
}
