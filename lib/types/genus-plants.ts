export interface GenusPlantItem {
  id: string;
  type: 'cultivar' | 'species';
  name: string;
  slug: string;
  species_slug: string;
  species_name: string;
  botanical_name: string | null;
  nursery_count: number;
  lowest_price_cents: number | null;
  zone_min: number | null;
  zone_max: number | null;
  display_category: string | null;
}

export interface GenusPlantListResponse {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  description: string | null;
  total_count: number;
  species_filter_options: Array<{ slug: string; name: string; count: number }>;
  items: GenusPlantItem[];
}
