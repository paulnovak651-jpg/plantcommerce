import type { SupabaseClient } from '@supabase/supabase-js';

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
}

export async function searchPlants(
  supabase: SupabaseClient,
  query: string,
  limit = 20
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Use the material_search_index materialized view with trigram matching
  const { data, error } = await supabase
    .from('material_search_index')
    .select('*')
    .textSearch('search_text', query.toLowerCase(), { type: 'plain' })
    .limit(limit);

  // Fallback: if full-text search returns nothing, try ilike
  if (error || !data || data.length === 0) {
    const { data: fallback } = await supabase
      .from('material_search_index')
      .select('*')
      .ilike('search_text', `%${query.toLowerCase()}%`)
      .limit(limit);

    return (fallback ?? []) as SearchResult[];
  }

  return data as SearchResult[];
}
