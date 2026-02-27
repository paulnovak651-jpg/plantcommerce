-- ============================================================================
-- MIGRATION 025: Diospyros Genus (Persimmons)
-- PlantCommerce genus seeding for core Diospyros species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000011 (genus-diospyros)
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
  'diospyros-virginiana',
  'American Persimmon',
  'Diospyros virginiana',
  'Ebenaceae',
  'Diospyros',
  'virginiana',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000011',
  'Primary temperate persimmon for North American food forestry, wildlife plantings, and regional fresh/processed fruit; also used as a cold-hardy rootstock for Asian persimmon.',
  'draft'
),
(
  'diospyros-kaki',
  'Asian Persimmon',
  'Diospyros kaki',
  'Ebenaceae',
  'Diospyros',
  'kaki',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000011',
  'Main large-fruited supermarket persimmon grown in warm-temperate North America; widely planted in home orchards and food forests where winters are mild enough, commonly grafted onto D. lotus or D. virginiana rootstocks.',
  'draft'
),
(
  'diospyros-lotus',
  'Date Plum',
  'Diospyros lotus',
  'Ebenaceae',
  'Diospyros',
  'lotus',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000011',
  'Commonly used as a nursery rootstock for Asian persimmon in the U.S. (especially West Coast supply), and sometimes grown for its small edible fruit; relevant mainly as rootstock and grafting infrastructure.',
  'draft'
),
(
  'diospyros-texana',
  'Texas Persimmon',
  'Diospyros texana',
  'Ebenaceae',
  'Diospyros',
  'texana',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000011',
  'Regional native fruit tree of Texas and adjacent areas; valued in Southwest food forestry for drought tolerance, small sweet fruit when fully ripe, and wildlife support.',
  'draft'
),
(
  'diospyros-digyna',
  'Black Sapote',
  'Diospyros digyna',
  'Ebenaceae',
  'Diospyros',
  'digyna',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000011',
  'Subtropical/tropical Diospyros grown by Florida and warm-zone permaculture growers for its sweet, pudding-textured fruit; relevant in North America primarily in frost-free or near-frost-free sites.',
  'draft'
),
(
  'diospyros-virginiana-x-kaki',
  'Hardy Hybrid Persimmon (American x Asian)',
  'Diospyros virginiana x Diospyros kaki',
  'Ebenaceae',
  'Diospyros',
  NULL,
  'hybrid_species',
  'needs_review',
  'd0000000-0000-0000-0000-000000000011',
  'Interspecific hybrids increasingly sold into the North American permaculture and wildlife-planting markets to combine American persimmon cold-hardiness with larger fruit size typical of Asian persimmon. Cultivar-level parentage and traits vary.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- diospyros-virginiana
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
  harvest_season,
  nitrogen_fixer,
  wildlife_value,
  ecological_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4,
  9,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to the east-central and southeastern United States, extending northeast into southern New York/Connecticut and west into the Midwest and parts of Texas/Kansas.',
  30,
  50,
  20,
  35,
  'mid_late',
  false,
  ARRAY['bird food','mammal food','nectar for bees'],
  'Often forms thickets via root suckers in open areas; fruit is heavily utilized by wildlife.',
  'draft',
  ARRAY[
    'USDA NRCS Plant Guide: Diospyros virginiana (Common persimmon)',
    'NCSU Extension Gardener Plant Toolbox: Diospyros virginiana',
    'UT Extension (2025): Persimmons for Tennessee Gardens and Landscapes',
    'USDA Forest Service (SRS): Diospyros virginiana species account'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-virginiana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- diospyros-kaki
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
  harvest_season,
  soil_notes,
  nitrogen_fixer,
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
  'moderate',
  'taproot',
  'Native to East Asia; cultivated widely and established in parts of the United States as an orchard and backyard fruit tree.',
  20,
  30,
  15,
  25,
  'mid_late',
  'Poor drainage/standing water can cause fruit drop and reduced vigor in some climates.',
  false,
  'draft',
  ARRAY[
    'NCSU Extension Gardener Plant Toolbox: Diospyros kaki',
    'UT Extension (2025): Persimmons for Tennessee Gardens and Landscapes',
    'University of Arizona Cooperative Extension (2024): Persimmons',
    'UGA Extension (PDF): Home Garden Persimmons',
    'UC ANR (PDF): Growing Persimmons in California'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-kaki'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- diospyros-lotus
INSERT INTO species_growing_profiles (
  plant_entity_id,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  sun_requirement,
  growth_rate,
  root_architecture,
  native_range_description,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to parts of Eurasia; introduced and cultivated in North America primarily as persimmon rootstock.',
  false,
  'draft',
  ARRAY[
    'USDA PLANTS Profile: Diospyros lotus',
    'UC ANR (PDF): Growing Persimmons in California (rootstocks)',
    'Texas A&M AgriLife (PDF): Persimmons (rootstock note)',
    'Alabama Cooperative Extension (2024): Fruit Culture in Alabama - Recommended Rootstocks'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-lotus'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- diospyros-texana
INSERT INTO species_growing_profiles (
  plant_entity_id,
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
  nitrogen_fixer,
  wildlife_value,
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
  'slow',
  'taproot',
  'Endemic to southern and central Texas and northern Mexico; occurs in multiple Texas ecoregions including Edwards Plateau and Rio Grande Plains.',
  10,
  40,
  false,
  ARRAY['bird food','mammal food'],
  'draft',
  ARRAY[
    'USDA PLANTS Profile: Diospyros texana',
    'Lady Bird Johnson Wildflower Center: Diospyros texana',
    'USDA Forest Service FEIS: Diospyros texana species review'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-texana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- diospyros-digyna
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
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  10,
  12,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to Mexico and parts of Central America; cultivated in Florida and other warm regions.',
  25,
  80,
  false,
  'draft',
  ARRAY[
    'UF/IFAS EDIS: Black Sapote Growing in the Florida Home Landscape',
    'USDA PLANTS Profile: Diospyros digyna',
    'UF/IFAS blog (2025): Pudding Sapote (Black Sapote) zones in Florida'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-digyna'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- diospyros-virginiana-x-kaki
INSERT INTO species_growing_profiles (
  plant_entity_id,
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
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'moderate',
  'Artificial interspecific crosses (not naturally native); marketed primarily as orchard and food-forest cultivars for colder sites than typical Asian persimmon.',
  'mid_late',
  'draft',
  ARRAY[
    'UT Extension (2025): Persimmons for Tennessee Gardens and Landscapes (hybrids noted)',
    'Nursery trade descriptions (multiple vendors) - cultivar-level details vary'
  ]
FROM plant_entities pe
WHERE pe.slug = 'diospyros-virginiana-x-kaki'
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
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana'),
  'cross_required',
  'insect',
  1,
  'late_spring',
  'Usually dioecious (separate male and female trees). Seedling trees typically require a male pollinizer for full crops; some named cultivars can set without a male.'
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
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-kaki'),
  'partially_self',
  'insect',
  'spring',
  'Flower sex expression and pollination needs vary by cultivar; many cultivars can set seedless parthenocarpic fruit, but pollination can improve set and reduce drop in some selections.'
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
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-lotus'),
  'cross_required',
  'insect',
  'spring',
  'Seedling populations are typically functionally dioecious; pollination details are rarely relevant in North American use because the species is primarily deployed as rootstock.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-texana'),
  'cross_required',
  'insect',
  1,
  'spring',
  'Dioecious (separate male and female trees); fruit is borne on female trees after pollination.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  bloom_period_general,
  notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-digyna'),
  'cross_required',
  'insect',
  1,
  'spring',
  'Often functionally dioecious (separate male and female trees); some trees may bear both flower types. Planting guidance varies by cultivar/seedling origin.'
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
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana-x-kaki'),
  'partially_self',
  'insect',
  'spring',
  'Pollination traits are cultivar-specific for this hybrid group; treat definitive compatibility at the cultivar level when data is available.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: HYBRID PARENTAGE
-- ============================================================================

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana-x-kaki'),
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana'),
  50,
  'UT Extension (2025) notes hybrids exist; cultivar trade sources describe parentage'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana-x-kaki')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana')
)
ON CONFLICT DO NOTHING;

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana-x-kaki'),
  (SELECT id FROM plant_entities WHERE slug = 'diospyros-kaki'),
  50,
  'UT Extension (2025) notes hybrids exist; cultivar trade sources describe parentage'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'diospyros-virginiana-x-kaki')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'diospyros-kaki')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
