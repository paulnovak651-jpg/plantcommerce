-- ============================================================================
-- MIGRATION 027: Quercus Genus (Oaks)
-- PlantCommerce genus seeding for core Quercus species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000004 (genus-quercus)
-- ============================================================================

BEGIN;

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
  'quercus-alba',
  'White Oak',
  'Quercus alba',
  'Fagaceae',
  'Quercus',
  'alba',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000004',
  'Foundational eastern North American oak producing moderately low-tannin acorns historically used for human and livestock food. Important canopy species in temperate food forest systems.',
  'draft'
),
(
  'quercus-macrocarpa',
  'Bur Oak',
  'Quercus macrocarpa',
  'Fagaceae',
  'Quercus',
  'macrocarpa',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000004',
  'Cold-hardy oak producing large acorns valued in indigenous food systems and increasingly in temperate permaculture plantings.',
  'draft'
),
(
  'quercus-muehlenbergii',
  'Chinkapin Oak',
  'Quercus muehlenbergii',
  'Fagaceae',
  'Quercus',
  'muehlenbergii',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000004',
  'Produces relatively sweet, low-tannin acorns favored for human food use. Adapted to limestone soils and valued in food forest plantings.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- quercus-alba
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  drought_tolerance,
  flood_tolerance,
  form_description,
  nitrogen_fixer,
  wildlife_value,
  ecological_notes,
  productive_lifespan_years,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  3,
  9,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to eastern and central North America from southern Canada to Florida and Texas.',
  50,
  80,
  50,
  80,
  20,
  30,
  'mid',
  4,
  2,
  'Broad, rounded canopy with strong central trunk',
  false,
  ARRAY['mast for wildlife','habitat tree'],
  'Keystone species in eastern deciduous forests.',
  200,
  'Large canopy tree; allow 50+ ft spacing.',
  'Minimal structural pruning when young.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Quercus alba',
    'NCSU Plant Toolbox: Quercus alba'
  ]
FROM plant_entities pe
WHERE pe.slug = 'quercus-alba'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- quercus-macrocarpa
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  soil_notes,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  form_description,
  nitrogen_fixer,
  wildlife_value,
  ecological_notes,
  productive_lifespan_years,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  2,
  8,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','clay_loam','silt_loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to central and eastern North America, extending into the Great Plains.',
  60,
  80,
  60,
  80,
  15,
  25,
  'mid',
  'Highly tolerant of alkaline and prairie soils.',
  'Moderate; drought tolerant once established.',
  5,
  3,
  'Massive trunk with broad crown.',
  false,
  ARRAY['large mast crop'],
  'Adapted to prairie and savanna systems.',
  200,
  '60 ft spacing recommended.',
  'Minimal pruning needed.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Quercus macrocarpa',
    'NCSU Plant Toolbox: Quercus macrocarpa'
  ]
FROM plant_entities pe
WHERE pe.slug = 'quercus-macrocarpa'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- quercus-muehlenbergii
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  soil_notes,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  form_description,
  nitrogen_fixer,
  wildlife_value,
  ecological_notes,
  productive_lifespan_years,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4,
  8,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','clay_loam','sandy_loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to central and eastern United States, especially limestone regions.',
  40,
  70,
  40,
  70,
  10,
  20,
  'early_mid',
  'Prefers alkaline soils.',
  'Moderate.',
  4,
  2,
  'Rounded crown with serrated leaves.',
  false,
  ARRAY['sweet mast'],
  'Important limestone upland species.',
  150,
  '40-60 ft spacing.',
  'Structural pruning early.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Quercus muehlenbergii',
    'NCSU Plant Toolbox: Quercus muehlenbergii'
  ]
FROM plant_entities pe
WHERE pe.slug = 'quercus-muehlenbergii'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: SPECIES POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'quercus-alba'),
  'wind_cross',
  'wind',
  1,
  200,
  'spring',
  'Wind-pollinated; benefits from nearby oaks with overlapping bloom.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'quercus-macrocarpa'),
  'wind_cross',
  'wind',
  1,
  200,
  'spring',
  'Wind-pollinated; cross-compatible with white oak group.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'quercus-muehlenbergii'),
  'wind_cross',
  'wind',
  1,
  200,
  'spring',
  'Member of white oak group; compatible with related species.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
