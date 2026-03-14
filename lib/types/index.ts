// Re-export query-level types from a single import point.
// Read this file first to understand core domain entities.
export type { SearchResult } from '@/lib/queries/search';

export type MaterialType =
  | 'cultivar_clone'
  | 'named_seed_strain'
  | 'breeding_population'
  | 'geographic_population'
  | 'species_seedling'
  | 'unknown_named_line';

export interface PlantEntity {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string;
  family: string;
  genus: string;
  species: string | null;
  entity_type: 'species' | 'subspecies' | 'hybrid_species' | 'species_group';
  curation_status: 'draft' | 'reviewed' | 'published';
  description: string | null;
  taxonomy_node_id: string | null;
  display_category: string | null;
}

export interface Cultivar {
  id: string;
  slug: string;
  canonical_name: string;
  plant_entity_id: string;
  material_type: MaterialType;
  breeder: string | null;
  origin_location: string | null;
  year_released: number | null;
  patent_status: string | null;
  notes: string | null;
  curation_status: 'draft' | 'reviewed' | 'published';
}

export interface GrowingProfile {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  chill_hours_min: number | null;
  chill_hours_max: number | null;
  soil_ph_min: number | null;
  soil_ph_max: number | null;
  soil_drainage: string | null;
  sun_requirement: string | null;
  growth_rate: string | null;
  mature_height_min_ft: number | null;
  mature_height_max_ft: number | null;
  mature_spread_min_ft: number | null;
  mature_spread_max_ft: number | null;
  years_to_bearing_min: number | null;
  years_to_bearing_max: number | null;
  harvest_season: string | null;
  native_range_description: string | null;
  drought_tolerance: number | null;
  shade_tolerance: string | null;
  growth_habit: string | null;
  deer_browse_pressure: string | null;
  suckering_tendency: string | null;
  pollination_requirement: string | null;
  food_forest_layer: string | null;
  wildlife_value: string[] | null;
  pollinator_value: string | null;
}

export interface InventoryOffer {
  id: string;
  nursery_id: string;
  cultivar_id: string | null;
  plant_entity_id: string | null;
  raw_product_name: string;
  offer_status: 'active' | 'stale' | 'sold_out' | 'discontinued';
  price_raw: string | null;
  price_cents: number | null;
  product_url: string | null;
  availability_raw: string | null;
}

export interface Nursery {
  id: string;
  slug: string;
  name: string;
  website_url: string;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  last_scraped_at?: string | null;
  last_scrape_offer_count?: number | null;
}

export interface CommunityListing {
  id: string;
  listing_type: 'wts' | 'wtb';
  raw_cultivar_text: string;
  raw_species_text: string | null;
  material_type: string | null;
  quantity: number | null;
  price_cents: number | null;
  location_state: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  trust_tier: number;
  resolve_confidence: number | null;
  cultivar_id: string | null;
  plant_entity_id: string | null;
  expires_at: string | null;
  cultivars: {
    canonical_name: string;
    slug: string;
    plant_entities: { slug: string } | null;
  } | null;
  plant_entities: { canonical_name: string; slug: string } | null;
}
