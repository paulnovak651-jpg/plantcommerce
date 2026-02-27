-- ============================================================================
-- MIGRATION 031: Ficus Genus (Fig)
-- PlantCommerce genus seeding for core Ficus species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000017 (genus-ficus)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 0: ENSURE TAXONOMY GENUS NODE EXISTS
-- ============================================================================

INSERT INTO taxonomy_nodes (
  id,
  rank_id,
  name,
  common_name,
  slug,
  parent_id,
  notable_for_permaculture,
  display_order,
  description
)
VALUES (
  'd0000000-0000-0000-0000-000000000017',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Ficus',
  'Figs',
  'genus-ficus',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'moraceae'),
  TRUE,
  2,
  'Includes edible figs, with Ficus carica as the primary cultivated fruit species in North American warm-temperate systems.'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 1: PLANT ENTITIES
-- ============================================================================

INSERT INTO plant_entities (
  slug,
  canonical_name,
  botanical_name,
  family,
  genus,
  species,
  entity_type,
  taxonomy_confidence,
  taxonomy_node_id,
  description,
  curation_status
) VALUES
(
  'ficus-carica',
  'Common Fig',
  'Ficus carica',
  'Moraceae',
  'Ficus',
  'carica',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000017',
  'Common fig is the primary fig species cultivated for fruit production in North America. It is widely grown in temperate and Mediterranean-climate regions and is a staple in food forestry and backyard permaculture systems.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  7,
  10,
  9,
  100,
  400,
  'Most cultivars have low to moderate chill requirements; wide variability exists.',
  6.0,
  7.8,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam','sand'],
  'Performs best in well-drained soils; avoid waterlogged sites.',
  'full_sun',
  'Moderate; drought tolerant once established.',
  4,
  2,
  10,
  30,
  10,
  30,
  'fast',
  'spreading',
  'Multi-stemmed shrub or small spreading tree with broad canopy.',
  'Native to the Mediterranean region and Western Asia; widely naturalized and cultivated in warm temperate regions of North America.',
  false,
  ARRAY['bird food','pollinator support'],
  'Fruit supports wildlife; latex sap present in vegetative tissues.',
  2,
  4,
  30,
  'mid_late',
  ARRAY['comfrey','clover'],
  'Space 10-20 ft apart depending on pruning system.',
  'Light annual pruning to manage size and encourage new fruiting wood.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Ficus carica',
    'NCSU Plant Toolbox: Ficus carica',
    'University of California ANR Extension Publications on Fig Production'
  ]
FROM plant_entities pe
WHERE pe.slug = 'ficus-carica'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: SPECIES POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'ficus-carica'),
  'self_fertile',
  'insect',
  0,
  'spring',
  'Most common fig cultivars grown in North America are parthenocarpic and do not require the fig wasp for fruit production.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
