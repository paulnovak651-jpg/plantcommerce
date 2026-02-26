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

/**
 * Get the full lineage from a plant entity up to kingdom.
 * Returns array ordered from kingdom (top) to genus (bottom).
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

  const path: TaxonomyNode[] = [];
  let currentId: string | null = entity.taxonomy_node_id;

  while (currentId) {
    const { data: node } = await supabase
      .from('taxonomy_nodes')
      .select('id, name, botanical_name, slug, parent_id, description, taxonomy_ranks(rank_name)')
      .eq('id', currentId)
      .single();

    if (!node) break;

    const rankRow = node.taxonomy_ranks as unknown as { rank_name: string } | null;
    path.unshift({
      id: node.id,
      rank: rankRow?.rank_name ?? 'unknown',
      name: node.name,
      botanical_name: node.botanical_name ?? null,
      slug: node.slug,
      parent_id: node.parent_id ?? null,
      description: node.description ?? null,
    });
    currentId = node.parent_id ?? null;
  }

  return path;
}
