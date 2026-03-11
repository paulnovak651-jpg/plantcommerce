import type { SupabaseClient } from '@supabase/supabase-js';
import { CATEGORY_GROUPS } from '@/lib/search/categories';

export interface SearchResult {
  index_source: string;
  entity_id: string;
  slug: string;
  canonical_name: string;
  material_type: string;
  botanical_name: string | null;
  species_common_name: string | null;
  species_slug: string;
  genus: string | null;
  family: string | null;
  active_offer_count: number;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  display_category: string | null;
  /** Full search text including aliases — used for scoring, not display */
  search_text?: string;
  /** Pipe-separated display-friendly alias names */
  alias_names?: string | null;
}

export interface SearchFilters {
  q: string;
  zone?: number;
  category?: string;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchPage {
  results: SearchResult[];
  total: number;
}

export async function searchPlantsPaged(
  supabase: SupabaseClient,
  filters: SearchFilters
): Promise<SearchPage> {
  const q = filters.q.trim();
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const hasFilters =
    filters.zone != null || Boolean(filters.category) || Boolean(filters.inStock);
  if (!q && !hasFilters) return { results: [], total: 0 };

  let query = supabase
    .from('material_search_index')
    .select('*', { count: 'exact' });

  if (q) {
    query = query.textSearch('search_text', q.toLowerCase(), { type: 'plain' });
  }

  if (filters.zone != null) {
    query = query
      .lte('usda_zone_min', filters.zone)
      .gte('usda_zone_max', filters.zone);
  }

  if (filters.category) {
    const groupedCategories = CATEGORY_GROUPS[filters.category];
    query = groupedCategories
      ? query.in('display_category', groupedCategories)
      : query.eq('display_category', filters.category);
  }

  if (filters.inStock) {
    query = query.gt('active_offer_count', 0);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  // Fallback: if full-text search returns nothing, try ilike
  if (q && (error || !data || data.length === 0)) {
    let fallback = supabase
      .from('material_search_index')
      .select('*', { count: 'exact' })
      .ilike('search_text', `%${q.toLowerCase()}%`);

    if (filters.zone != null) {
      fallback = fallback
        .lte('usda_zone_min', filters.zone)
        .gte('usda_zone_max', filters.zone);
    }
    if (filters.category) {
      const groupedCategories = CATEGORY_GROUPS[filters.category];
      fallback = groupedCategories
        ? fallback.in('display_category', groupedCategories)
        : fallback.eq('display_category', filters.category);
    }
    if (filters.inStock) fallback = fallback.gt('active_offer_count', 0);

    const {
      data: fallbackData,
      count: fallbackCount,
    } = await fallback.range(offset, offset + limit - 1);

    return {
      results: (fallbackData ?? []) as SearchResult[],
      total: fallbackCount ?? 0,
    };
  }

  return {
    results: (data ?? []) as SearchResult[],
    total: count ?? data?.length ?? 0,
  };
}

export async function searchPlants(
  supabase: SupabaseClient,
  filters: SearchFilters
): Promise<SearchResult[]> {
  const { results } = await searchPlantsPaged(supabase, { ...filters, offset: 0 });
  return results;
}
