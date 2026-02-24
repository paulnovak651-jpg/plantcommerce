import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlants } from '@/lib/queries/search';
import { apiSuccess } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);

  if (!q.trim()) {
    return apiSuccess([], { total: 0 }, { self: '/api/search' });
  }

  const supabase = await createClient();
  const results = await searchPlants(supabase, q, limit);

  return apiSuccess(results, { total: results.length }, {
    self: `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  });
}
