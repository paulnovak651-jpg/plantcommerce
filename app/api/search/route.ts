import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlantsPaged } from '@/lib/queries/search';
import { parseSearchApiParams } from '@/lib/contracts/ux';
import { apiSuccess } from '@/lib/api-helpers';
import { buildPaginationLinks } from '@/lib/pagination';
import { parseQuery } from '@/lib/search/parseQuery';
import { scoreResults } from '@/lib/search/scoring';
import { withRateLimit } from '@/lib/api-rate-limit';

export const GET = withRateLimit(async function GET(request: NextRequest) {
  const { query: q, limit, offset, zone, category, inStock } = parseSearchApiParams(
    request.nextUrl.searchParams
  );

  const zip = request.nextUrl.searchParams.get('zip') ?? undefined;
  const lat = parseFloat(request.nextUrl.searchParams.get('lat') ?? '');
  const lng = parseFloat(request.nextUrl.searchParams.get('lng') ?? '');
  const userLat = Number.isFinite(lat) ? lat : undefined;
  const userLng = Number.isFinite(lng) ? lng : undefined;

  const baseParams = new URLSearchParams();
  baseParams.set('q', q);
  if (zone != null) baseParams.set('zone', String(zone));
  if (category) baseParams.set('category', category);
  if (inStock) baseParams.set('inStock', 'true');
  if (zip) baseParams.set('zip', zip);

  if (!q.trim()) {
    return apiSuccess([], { total: 0, limit, offset }, {
      self: '/api/search',
    });
  }

  // Parse the raw query to extract intent
  const parsed = parseQuery(q);

  // Use parsed zone if not explicitly provided as a filter param
  const effectiveZone = zone ?? parsed.zoneFilter;

  // Build the DB query using cleaned plant terms (fall back to raw query
  // if parser consumed all terms into filters)
  const dbQuery = parsed.plantTerms.length > 0
    ? parsed.plantTerms.join(' ')
    : q;

  const supabase = await createClient();

  // Fetch enough results so scoring can re-rank and still fill the requested page.
  // We always fetch from offset 0 since reranking changes the order.
  const fetchLimit = Math.min(Math.max((offset + limit) * 2, limit * 3), 200);

  const { results, total } = await searchPlantsPaged(supabase, {
    q: dbQuery,
    limit: fetchLimit,
    offset: 0,
    zone: effectiveZone,
    category,
    inStock: inStock ?? undefined,
  });

  // Apply composite scoring and re-rank
  const scored = await scoreResults(
    supabase,
    parsed,
    results,
    userLat,
    userLng,
    parsed.stateFilter,
  );

  // Apply pagination to scored results
  const paged = scored.slice(offset, offset + limit);
  // Use DB total as the authoritative count (scored set is a subset)
  const scoredTotal = total;

  const links = buildPaginationLinks(
    '/api/search',
    baseParams,
    { limit, offset },
    scoredTotal
  );

  return apiSuccess(paged, { total: scoredTotal, limit, offset }, links);
}, { max: 60 });
