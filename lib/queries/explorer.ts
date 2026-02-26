import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExplorerSpecies {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  family: string;
  genus: string;
  nursery_count: number;
  cultivar_count: number;
  zone_min: number | null;
  zone_max: number | null;
}

export interface ExplorerFilters {
  zoneMin?: number | null;
  zoneMax?: number | null;
  availableOnly?: boolean;
}

export async function getExplorerSpecies(
  supabase: SupabaseClient,
  filters: ExplorerFilters = {}
): Promise<ExplorerSpecies[]> {
  const { zoneMin, zoneMax, availableOnly } = filters;

  const { data, error } = await supabase.rpc('get_explorer_species', {
    p_zone_min: zoneMin ?? null,
    p_zone_max: zoneMax ?? null,
    p_available_only: availableOnly ?? false,
  });

  if (error) {
    console.error('getExplorerSpecies error:', error);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    canonical_name: row.canonical_name as string,
    botanical_name: (row.botanical_name as string | null) ?? null,
    family: row.family as string,
    genus: row.genus as string,
    nursery_count: Number(row.nursery_count),
    cultivar_count: Number(row.cultivar_count),
    zone_min: row.zone_min != null ? Number(row.zone_min) : null,
    zone_max: row.zone_max != null ? Number(row.zone_max) : null,
  }));
}
