-- ============================================================================
-- MIGRATION 028: Vaccinium Genus (Blueberries, Cranberries, and Huckleberries)
-- PlantCommerce genus seeding for core Vaccinium species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000012 (genus-vaccinium)
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
  'vaccinium-corymbosum',
  'Highbush Blueberry',
  'Vaccinium corymbosum',
  'Ericaceae',
  'Vaccinium',
  'corymbosum',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Primary commercial blueberry species in North America and a cornerstone fruit crop for temperate permaculture systems. Widely used in food forests and U-pick operations.',
  'draft'
),
(
  'vaccinium-angustifolium',
  'Lowbush Blueberry',
  'Vaccinium angustifolium',
  'Ericaceae',
  'Vaccinium',
  'angustifolium',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Native low-growing blueberry of northeastern North America used in managed wild blueberry production and permaculture groundcover systems.',
  'draft'
),
(
  'vaccinium-virgatum',
  'Rabbiteye Blueberry',
  'Vaccinium virgatum',
  'Ericaceae',
  'Vaccinium',
  'virgatum',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Heat-tolerant southern blueberry species widely grown in the southeastern United States and valuable for low-input permaculture systems in warmer climates.',
  'draft'
),
(
  'vaccinium-macrocarpon',
  'American Cranberry',
  'Vaccinium macrocarpon',
  'Ericaceae',
  'Vaccinium',
  'macrocarpon',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Native North American cranberry used in commercial bog production and adaptable to acidic wetland permaculture systems.',
  'draft'
),
(
  'vaccinium-ovatum',
  'Evergreen Huckleberry',
  'Vaccinium ovatum',
  'Ericaceae',
  'Vaccinium',
  'ovatum',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Pacific Northwest native berry shrub valued in regional permaculture systems for shade tolerance and wildlife support.',
  'draft'
),
(
  'vaccinium-membranaceum',
  'Black Huckleberry',
  'Vaccinium membranaceum',
  'Ericaceae',
  'Vaccinium',
  'membranaceum',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000012',
  'Mountain West native berry species important in forest-edge permaculture systems and valued for high-quality wild fruit production.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- vaccinium-corymbosum
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  3,
  8,
  4.0,
  5.5,
  'well_drained',
  ARRAY['sandy_loam','loam','silt_loam'],
  'full_sun',
  'moderate',
  'fibrous',
  'Native to eastern North America from Canada south to Florida; widely cultivated.',
  6,
  12,
  4,
  8,
  2,
  4,
  'mid',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium corymbosum',
    'NCSU Plant Toolbox: Vaccinium corymbosum',
    'Cornell Cooperative Extension: Blueberry Production Guide'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-corymbosum'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vaccinium-angustifolium
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  2,
  7,
  4.0,
  5.5,
  'well_drained',
  ARRAY['sandy_loam','sand'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to northeastern United States and eastern Canada.',
  0.5,
  2,
  2,
  5,
  2,
  3,
  'early_mid',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium angustifolium',
    'University of Maine Extension: Wild Blueberry Facts'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-angustifolium'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vaccinium-virgatum
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  7,
  9,
  4.2,
  5.8,
  'well_drained',
  ARRAY['sandy_loam','loam'],
  'full_sun',
  'fast',
  'fibrous',
  'Native to the southeastern United States.',
  8,
  15,
  6,
  10,
  2,
  4,
  'late',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium virgatum',
    'University of Georgia Extension: Rabbiteye Blueberry Guide'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-virgatum'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vaccinium-macrocarpon
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  3,
  7,
  4.0,
  5.5,
  'requires_wet',
  ARRAY['sand','sandy_loam'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to northeastern and north-central North America.',
  0.5,
  1,
  2,
  4,
  2,
  3,
  'late',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium macrocarpon',
    'University of Massachusetts Extension: Cranberry Production'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-macrocarpon'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vaccinium-ovatum
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  7,
  9,
  4.5,
  6.0,
  'well_drained',
  ARRAY['loam','sandy_loam'],
  'part_shade',
  'slow',
  'fibrous',
  'Native to the Pacific coastal regions from British Columbia to California.',
  3,
  8,
  3,
  6,
  3,
  5,
  'late',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium ovatum',
    'Oregon State Extension: Native Huckleberries'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-ovatum'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vaccinium-membranaceum
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
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4,
  8,
  4.5,
  6.0,
  'well_drained',
  ARRAY['loam','sandy_loam'],
  'part_shade',
  'slow',
  'fibrous',
  'Native to western North America from Alaska south to California and the Rocky Mountains.',
  3,
  6,
  3,
  6,
  3,
  5,
  'mid_late',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vaccinium membranaceum',
    'University of Idaho Extension: Huckleberries'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vaccinium-membranaceum'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-corymbosum'),
  'partially_self',
  'insect',
  1,
  50,
  'spring',
  'Cross-pollination improves fruit size and yield; bees are primary pollinators.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-angustifolium'),
  'cross_required',
  'insect',
  1,
  50,
  'spring',
  'Requires insect pollination; managed fields often use honeybees or native bees.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-virgatum'),
  'cross_required',
  'insect',
  1,
  50,
  'early spring',
  'Requires cross-pollination between compatible cultivars for reliable fruit set.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-macrocarpon'),
  'partially_self',
  'insect',
  1,
  50,
  'late spring',
  'Benefits from bee activity; commercial production often supplements pollinators.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-ovatum'),
  'partially_self',
  'insect',
  1,
  50,
  'spring',
  'Cross-pollination improves fruit set; pollinated primarily by native bees.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vaccinium-membranaceum'),
  'cross_required',
  'insect',
  1,
  50,
  'late spring',
  'Requires insect pollination; fruit set improved with multiple genetically distinct plants.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
