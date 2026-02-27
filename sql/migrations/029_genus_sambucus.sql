-- ============================================================================
-- MIGRATION 029: Sambucus Genus (Elderberries)
-- PlantCommerce genus seeding for core Sambucus species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000014 (genus-sambucus)
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
  'sambucus-canadensis',
  'American Elderberry',
  'Sambucus canadensis',
  'Adoxaceae',
  'Sambucus',
  'canadensis',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000014',
  'American elderberry is the primary elderberry species cultivated for fruit production in North American permaculture systems. It is widely used for syrup, wine, and medicinal preparations and functions well in hedgerows and riparian plantings.',
  'draft'
),
(
  'sambucus-nigra',
  'European Elderberry',
  'Sambucus nigra',
  'Adoxaceae',
  'Sambucus',
  'nigra',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000014',
  'European elderberry is cultivated in parts of North America for high-quality fruit production and is the foundation of many commercial elderberry cultivars used in syrup and nutraceutical markets.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- sambucus-canadensis
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
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
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  3,
  9,
  8,
  5.5,
  7.5,
  'tolerates_wet',
  ARRAY['loam','sandy_loam','clay_loam','silt_loam'],
  'full_sun',
  'fast',
  'suckering',
  'Native to most of eastern and central North America, commonly found in moist meadows, streambanks, and disturbed sites.',
  5,
  12,
  6,
  12,
  2,
  3,
  'mid_late',
  'Performs best in moist, fertile soils but tolerates periodic flooding.',
  'Moderate to high; benefits from consistent moisture.',
  2,
  4,
  'Multi-stemmed deciduous shrub forming dense colonies.',
  false,
  ARRAY['bird food','pollinator support'],
  'Excellent riparian stabilizer and wildlife hedge component.',
  20,
  ARRAY['comfrey','clover'],
  'Space 6-10 ft apart for hedgerow production.',
  'Fruits best on 1- to 3-year-old wood; remove oldest canes annually.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Sambucus canadensis',
    'NCSU Plant Toolbox: Sambucus canadensis',
    'University of Missouri Extension: Growing Elderberry'
  ]
FROM plant_entities pe
WHERE pe.slug = 'sambucus-canadensis'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- sambucus-nigra
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
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
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4,
  8,
  8,
  5.5,
  7.5,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'fast',
  'suckering',
  'Native to Europe and western Asia; widely naturalized and cultivated in temperate regions including parts of North America.',
  10,
  20,
  8,
  15,
  2,
  4,
  'late',
  'Prefers fertile, well-drained soils but tolerates seasonal moisture.',
  'Moderate; avoid prolonged drought.',
  2,
  3,
  'Large multi-stemmed shrub or small tree.',
  false,
  ARRAY['bird food','pollinator support'],
  'Valuable nectar source; fruit attracts wildlife.',
  25,
  ARRAY['comfrey','yarrow'],
  'Space 8-12 ft apart for orchard-style plantings.',
  'Annual renewal pruning recommended for maximum fruiting.',
  'draft',
  ARRAY[
    'USDA PLANTS Database: Sambucus nigra',
    'NCSU Plant Toolbox: Sambucus nigra',
    'Cornell Cooperative Extension: Elderberry Production Guide'
  ]
FROM plant_entities pe
WHERE pe.slug = 'sambucus-nigra'
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
  (SELECT id FROM plant_entities WHERE slug = 'sambucus-canadensis'),
  'partially_self',
  'insect',
  1,
  60,
  'early_summer',
  'Cross-pollination between distinct cultivars improves fruit set and yield.'
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
  (SELECT id FROM plant_entities WHERE slug = 'sambucus-nigra'),
  'partially_self',
  'insect',
  1,
  60,
  'late_spring',
  'While partially self-fertile, planting multiple cultivars increases yield.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
