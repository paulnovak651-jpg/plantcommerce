-- ============================================================================
-- MIGRATION 026: Morus Genus (Mulberries)
-- PlantCommerce genus seeding for core Morus species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000010 (genus-morus)
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
  'morus-alba',
  'White Mulberry',
  'Morus alba',
  'Moraceae',
  'Morus',
  'alba',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000010',
  'Widely planted and naturalized across North America as a fast-growing fruit and fodder tree; commonly used in permaculture systems for abundant berries and poultry/wildlife feed. Can be invasive in parts of the U.S. and hybridizes with native red mulberry.',
  'draft'
),
(
  'morus-rubra',
  'Red Mulberry',
  'Morus rubra',
  'Moraceae',
  'Morus',
  'rubra',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000010',
  'Primary native mulberry of eastern North America; widely planted in food forests and wildlife systems.',
  'draft'
),
(
  'morus-microphylla',
  'Texas Mulberry',
  'Morus microphylla',
  'Moraceae',
  'Morus',
  'microphylla',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000010',
  'Drought- and heat-adapted native mulberry suitable for dryland permaculture systems in the U.S. Southwest.',
  'draft'
),
(
  'morus-nigra',
  'Black Mulberry',
  'Morus nigra',
  'Moraceae',
  'Morus',
  'nigra',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000010',
  'High-flavor mulberry valued in warmer climates; less cold-hardy and less widely planted than white or red mulberry.',
  'draft'
),
(
  'morus-macroura',
  'Pakistan Mulberry',
  'Morus macroura',
  'Moraceae',
  'Morus',
  'macroura',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000010',
  'Popular in rare-fruit and permaculture circles for very long, sweet berries; best suited to warmer zones.',
  'draft'
),
(
  'morus-alba-x-rubra',
  'Morus alba x Morus rubra Hybrid Group',
  'Morus alba x Morus rubra',
  'Moraceae',
  'Morus',
  NULL,
  'hybrid_species',
  'provisional',
  'd0000000-0000-0000-0000-000000000010',
  'Common everbearing mulberries in North American food forests (for example Illinois Everbearing and Silk Hope), selected for long harvest windows and heavy production.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- morus-alba
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
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  harvest_season,
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
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'fast',
  'Asia (introduced and naturalized in North America).',
  30,
  60,
  30,
  50,
  'early_mid',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-alba'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- morus-rubra
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
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
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
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'fast',
  'Eastern North America.',
  25,
  60,
  35,
  40,
  'early_mid',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-rubra'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- morus-microphylla
INSERT INTO species_growing_profiles (
  plant_entity_id,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  harvest_season,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'moderate',
  'Southwestern U.S. and northern Mexico.',
  20,
  30,
  20,
  30,
  'early',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-microphylla'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- morus-nigra
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  native_range_description,
  harvest_season,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'slow',
  'Asia.',
  'mid',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-nigra'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- morus-macroura
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
  native_range_description,
  mature_height_min_ft,
  mature_height_max_ft,
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  7,
  10,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'fast',
  'Asia (Himalayan region).',
  15,
  30,
  2,
  3,
  'mid_late',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-macroura'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- morus-alba-x-rubra
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
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'fast',
  'early_mid',
  'draft',
  ARRAY['docs/genus-research-morus.md']
FROM plant_entities pe
WHERE pe.slug = 'morus-alba-x-rubra'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: SPECIES POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-alba'),
  'cross_required',
  'wind',
  1,
  'Typically dioecious (male and female trees); wind pollinated.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-rubra'),
  'cross_required',
  'wind',
  1,
  'Typically dioecious; wind pollinated.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-microphylla'),
  'cross_required',
  'wind',
  1,
  'Assume cross-pollination unless confirmed self-fertile by specific selection.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-nigra'),
  'partially_self',
  'wind',
  1,
  'Pollination biology varies; ensure a compatible pollinator unless a self-fertile selection is confirmed.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-macroura'),
  'self_fertile',
  'wind',
  'Commonly sold as self-fertile; wind pollinated.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'morus-alba-x-rubra'),
  'partially_self',
  'wind',
  'Fertility characteristics vary by named selection; confirm pollination behavior at cultivar level.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: HYBRID PARENTAGE
-- ============================================================================

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'morus-alba-x-rubra'),
  (SELECT id FROM plant_entities WHERE slug = 'morus-alba'),
  50,
  'docs/genus-research-morus.md'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'morus-alba-x-rubra')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'morus-alba')
)
ON CONFLICT DO NOTHING;

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'morus-alba-x-rubra'),
  (SELECT id FROM plant_entities WHERE slug = 'morus-rubra'),
  50,
  'docs/genus-research-morus.md'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'morus-alba-x-rubra')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'morus-rubra')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
