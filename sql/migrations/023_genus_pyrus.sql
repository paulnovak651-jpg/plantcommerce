-- ============================================================================
-- MIGRATION 023: Pyrus Genus (Pears)
-- PlantCommerce genus seeding for core Pyrus species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000008 (genus-pyrus)
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
  'pyrus-communis',
  'European Pear',
  'Pyrus communis',
  'Rosaceae',
  'Pyrus',
  'communis',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000008',
  'European pear is the primary pear species for temperate orchard production in North America. Most cultivars set best with compatible cross-pollinizers and insect pollination.',
  'draft'
),
(
  'pyrus-pyrifolia',
  'Asian Pear',
  'Pyrus pyrifolia',
  'Rosaceae',
  'Pyrus',
  'pyrifolia',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000008',
  'Asian pear (nashi) is an East Asian pear species grown for crisp fruit texture. Pollination needs vary by cultivar and fruit set often improves with compatible pollinizers.',
  'draft'
),
(
  'pyrus-ussuriensis',
  'Ussurian Pear',
  'Pyrus ussuriensis',
  'Rosaceae',
  'Pyrus',
  'ussuriensis',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000008',
  'Ussurian pear is a cold-hardy East Asian pear species used in shelterbelt and wildlife plantings and as a hardy genetic source in breeding/rootstock contexts.',
  'draft'
),
(
  'pyrus-calleryana',
  'Callery Pear',
  'Pyrus calleryana',
  'Rosaceae',
  'Pyrus',
  'calleryana',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000008',
  'Callery pear is widely naturalized and invasive in many US regions. Included for data completeness and identification, not as a recommended food-forest planting.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- pyrus-communis
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
  9,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to a broad region from Europe into Western Asia; widely cultivated in North America.',
  40,
  50,
  25,
  35,
  3,
  7,
  'mid',
  'draft',
  ARRAY[
    'NCSU Plant Toolbox: Pyrus communis',
    'General horticultural consensus (NA cultivation)'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-communis'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- pyrus-pyrifolia
INSERT INTO species_growing_profiles (
  plant_entity_id,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to parts of East Asia; widely cultivated and planted in North America for crisp fruit.',
  'draft',
  ARRAY[
    'Wikipedia: Pyrus pyrifolia',
    'UC ANR Small Farms: Asian pears (pollination notes)'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-pyrifolia'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- pyrus-ussuriensis
INSERT INTO species_growing_profiles (
  plant_entity_id,
  soil_drainage,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  'moderate',
  'full_sun',
  'fast',
  'spreading',
  'Northeast Asia origin; used in North American conservation plantings for windbreaks, shelterbelts, and wildlife habitat.',
  'draft',
  ARRAY[
    'USDA NRCS: McDermand Ussurian pear (windbreak/wildlife use)',
    'NRCS conservation plant releases listing'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-ussuriensis'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- pyrus-calleryana
INSERT INTO species_growing_profiles (
  plant_entity_id,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  'full_sun',
  'fast',
  'spreading',
  'Native to Asia; invasive across large areas of the eastern United States; avoid planting in permaculture systems.',
  'draft',
  ARRAY[
    'invasivespeciesinfo.gov: Callery pear',
    'Invasive Species of Virginia: Callery pear',
    'Morton Arboretum: Callery pear spread'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-calleryana'
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
  (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'),
  'cross_required',
  'insect',
  1,
  100,
  'spring',
  'Typically requires a compatible second pear variety with overlapping bloom for reliable fruit set.'
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
  (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'),
  'partially_self',
  'insect',
  1,
  100,
  'spring',
  'Often sets better crops with a second Asian pear (or compatible pear) with overlapping bloom; cool bloom weather increases need for cross-pollination.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'pyrus-ussuriensis'),
  'cross_required',
  'insect',
  'spring',
  'Primarily included as a multi-function tree (windbreak/wildlife) and as hardy genetics; fruit quality varies by selection.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'pyrus-calleryana'),
  'cross_required',
  'insect',
  'spring',
  'Do not recommend. Escapes cultivation and forms dense stands; some states restrict sale/planting.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
