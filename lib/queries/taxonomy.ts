import type { SupabaseClient } from '@supabase/supabase-js';

export interface TaxonomyNode {
  id: string;
  rank: string;
  name: string;
  botanical_name: string | null;
  slug: string;
  parent_id: string | null;
  description: string | null;
}

interface TaxonomyPathRpcRow {
  node_id: string;
  rank_name: string;
  rank_level: number;
  node_name: string;
  common_name: string | null;
  slug: string;
}

/**
 * Get the full lineage from a plant entity up to kingdom.
 * Returns array ordered from kingdom (top) to genus (bottom).
 *
 * Uses the database RPC `get_taxonomy_path` (recursive CTE) to fetch the
 * entire lineage in a single round-trip instead of N+1 queries.
 */
export async function getTaxonomyPath(
  supabase: SupabaseClient,
  plantEntityId: string
): Promise<TaxonomyNode[]> {
  const { data: entity } = await supabase
    .from('plant_entities')
    .select('taxonomy_node_id')
    .eq('id', plantEntityId)
    .single();

  if (!entity?.taxonomy_node_id) return [];

  const { data: rows, error } = await supabase.rpc('get_taxonomy_path', {
    leaf_node_id: entity.taxonomy_node_id,
  });

  if (error || !rows) {
    // Fall back gracefully — return empty path rather than crashing.
    console.error('get_taxonomy_path RPC error:', error);
    return [];
  }

  // The RPC returns rows ordered by rank_level ASC (kingdom → genus).
  return (rows as TaxonomyPathRpcRow[]).map((row) => ({
    id: row.node_id,
    rank: row.rank_name,
    name: row.node_name,
    botanical_name: null,
    slug: row.slug,
    parent_id: null,
    description: null,
  }));
}
