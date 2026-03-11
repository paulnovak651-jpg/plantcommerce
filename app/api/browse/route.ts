import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';
import { parseFacetState } from '@/lib/facets/state';
import { queryBrowsePlants } from '@/lib/queries/facet-query-builder';

const DEFAULT_PER_PAGE = 24;
const MAX_PER_PAGE = 100;

/**
 * GET /api/browse
 *
 * Server-side facet-driven browse endpoint.
 * Accepts all facet params (category, sun, growthRate, zoneMin, zoneMax, etc.),
 * sort, page, perPage, groupBy, and q (keyword).
 *
 * Returns filtered plants, total count, and facet counts for sidebar rendering.
 */
export const GET = withRateLimit(async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse perPage separately (not part of FacetState)
  const rawPerPage = searchParams.get('perPage');
  const perPage = rawPerPage
    ? Math.min(Math.max(1, Number(rawPerPage) || DEFAULT_PER_PAGE), MAX_PER_PAGE)
    : DEFAULT_PER_PAGE;

  // Parse all facet state from URL params
  const facetState = parseFacetState(searchParams);

  try {
    const supabase = await createClient();
    const { plants, total, facetCounts, recoveryHints } = await queryBrowsePlants(
      supabase,
      facetState,
      perPage
    );

    return apiSuccess(
      {
        plants,
        facetCounts,
        recoveryHints,
        groupBy: facetState.groupBy,
      },
      {
        total,
        limit: perPage,
        offset: (facetState.page - 1) * perPage,
      }
    );
  } catch (err) {
    console.error('browse API error:', err);
    return apiError('BROWSE_FAILED', 'Unable to fetch browse results', 500);
  }
}, { max: 60 });
