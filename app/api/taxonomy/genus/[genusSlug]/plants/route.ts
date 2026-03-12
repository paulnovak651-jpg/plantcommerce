import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiNotFound } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';
import { getGenusPlantList } from '@/lib/queries/genus-plants';
import type { GenusPlantItem } from '@/lib/types/genus-plants';

export const GET = withRateLimit(
  async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ genusSlug: string }> }
  ) {
    const { genusSlug } = await params;
    const { searchParams } = request.nextUrl;

    const sort = searchParams.get('sort') ?? 'name';
    const speciesFilter = searchParams.get('species');
    const inStockOnly = searchParams.get('in_stock') === 'true';

    const supabase = await createClient();
    const result = await getGenusPlantList(supabase, genusSlug);

    if (!result) {
      return apiNotFound('Genus');
    }

    let items = result.items;

    // Apply species filter
    if (speciesFilter) {
      items = items.filter((item) => item.species_slug === speciesFilter);
    }

    // Apply in-stock filter
    if (inStockOnly) {
      items = items.filter((item) => item.nursery_count > 0);
    }

    // Apply sort
    items = sortItems(items, sort);

    const response = apiSuccess({
      ...result,
      items,
      total_count: items.length,
    });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  },
  { max: 60 }
);

function sortItems(items: GenusPlantItem[], sort: string): GenusPlantItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'price_low':
      sorted.sort((a, b) => {
        if (a.lowest_price_cents == null && b.lowest_price_cents == null) return 0;
        if (a.lowest_price_cents == null) return 1;
        if (b.lowest_price_cents == null) return -1;
        return a.lowest_price_cents - b.lowest_price_cents;
      });
      break;
    case 'price_high':
      sorted.sort((a, b) => {
        if (a.lowest_price_cents == null && b.lowest_price_cents == null) return 0;
        if (a.lowest_price_cents == null) return 1;
        if (b.lowest_price_cents == null) return -1;
        return b.lowest_price_cents - a.lowest_price_cents;
      });
      break;
    case 'nursery_count':
      sorted.sort((a, b) => b.nursery_count - a.nursery_count);
      break;
    case 'name':
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  return sorted;
}
