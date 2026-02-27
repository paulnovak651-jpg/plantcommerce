-- ============================================================================
-- MIGRATION 030: Vitis Genus (Grapes)
-- PlantCommerce genus seeding for core Vitis species used in NA orchards
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000016 (genus-vitis)
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
  'vitis-vinifera',
  'Common Grape (European Wine Grape)',
  'Vitis vinifera',
  'Vitaceae',
  'Vitis',
  'vinifera',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000016',
  'The primary species for table grapes, raisins, and premium wine production in North America, usually grown where winters are moderate and disease pressure is manageable (or under an IPM program).',
  'draft'
),
(
  'vitis-labrusca',
  'Fox Grape (American Grape)',
  'Vitis labrusca',
  'Vitaceae',
  'Vitis',
  'labrusca',
  'species',
  'provisional',
  'd0000000-0000-0000-0000-000000000016',
  'A key North American grape species underpinning many cold-hardy juice/jelly grapes and some hybrids (for example Concord-type heritage), important in the eastern U.S. and for breeding hardiness and disease tolerance.',
  'draft'
),
(
  'vitis-rotundifolia',
  'Muscadine Grape',
  'Vitis rotundifolia',
  'Vitaceae',
  'Vitis',
  'rotundifolia',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000016',
  'A heat- and humidity-adapted southeastern U.S. grape with strong permaculture relevance in the South for fresh eating, juice, and wine, often with lower disease pressure than bunch grapes in Pierce''s-disease regions.',
  'draft'
),
(
  'vitis-riparia',
  'Riverbank Grape',
  'Vitis riparia',
  'Vitaceae',
  'Vitis',
  'riparia',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000016',
  'A very cold-hardy native grape widely used in breeding and rootstock lineage for northern climates and relevant for edible hedgerows, wildlife food, and tough riparian plantings.',
  'draft'
),
(
  'vitis-aestivalis',
  'Summer Grape',
  'Vitis aestivalis',
  'Vitaceae',
  'Vitis',
  'aestivalis',
  'species',
  'verified',
  'd0000000-0000-0000-0000-000000000016',
  'A native eastern U.S. grape species with direct permaculture relevance for wildlife food, feral grape selections, and as a genetic contributor to disease-tolerant American wine grapes (for example Norton lineage).',
  'draft'
),
(
  'vitis-berlandieri',
  'Spanish Grape (Berlandier''s Grape)',
  'Vitis berlandieri',
  'Vitaceae',
  'Vitis',
  'berlandieri',
  'species',
  'provisional',
  'd0000000-0000-0000-0000-000000000016',
  'A Texas/northern Mexico grape species important primarily as a parent of widely used rootstocks, valued for tolerance of high-pH limestone soils and contributing drought tolerance in rootstock breeding.',
  'draft'
),
(
  'vitis-rupestris',
  'Sand Grape (Rupestris Grape)',
  'Vitis rupestris',
  'Vitaceae',
  'Vitis',
  'rupestris',
  'species',
  'provisional',
  'd0000000-0000-0000-0000-000000000016',
  'A North American grape species important in rootstock breeding and as a contributor to drought tolerance and phylloxera resistance, especially through berlandieri x rupestris rootstock lineages.',
  'draft'
),
(
  'vitis-labruscana',
  'American Hybrid Bunch Grapes (Labruscana Group)',
  'Vitis x labruscana',
  'Vitaceae',
  'Vitis',
  'labruscana',
  'hybrid_species',
  'needs_review',
  'd0000000-0000-0000-0000-000000000016',
  'A widely grown hybrid grouping derived primarily from V. vinifera x V. labrusca, including many American table/juice grapes and older cold-hardy cultivars common in homesteads and small farms.',
  'draft'
),
(
  'vitis-champinii',
  'Champin''s Grape (Rootstock Species)',
  'Vitis x champinii',
  'Vitaceae',
  'Vitis',
  'champinii',
  'hybrid_species',
  'verified',
  'd0000000-0000-0000-0000-000000000016',
  'A naturally occurring hybrid species used directly for vigorous, drought-tolerant rootstocks (for example Ramsey/Salt Creek, Dog Ridge), relevant for hot, drought-prone regions where vine vigor and stress tolerance are priorities.',
  'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- vitis-vinifera
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
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  6,
  10,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam','sand','clay'],
  'full_sun',
  'fast',
  'spreading',
  'Native to the Mediterranean Basin, Europe, and parts of western/central Asia; widely cultivated in North America.',
  2,
  4,
  'mid_late',
  false,
  'draft',
  ARRAY[
    'NCSU Extension Gardener Plant Toolbox: Vitis vinifera (zones, light/soil descriptors) https://plants.ces.ncsu.edu/plants/vitis-vinifera/',
    'USDA PLANTS Database: Vitis vinifera profile https://plants.usda.gov/plant-profile/VIVI5'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-vinifera'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-labrusca
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
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5,
  8,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'fast',
  'spreading',
  'Native to eastern North America; commonly naturalized along woodland edges, fencerows, and riparian margins.',
  2,
  4,
  'mid',
  false,
  'draft',
  ARRAY[
    'Chicago Botanic Garden Plant Finder: Vitis labrusca Concord Seedless (zone range representative of common cultivated labrusca types) https://www.chicagobotanic.org/plant-information/plant-finder/vitis-labrusca-concord-seedless-concord-seedless-grape',
    'Missouri Botanical Garden Plant Finder: Vitis labrusca (range/habit description) https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid=301151',
    'USDA PLANTS Database: genus and related profiles https://plants.usda.gov/home'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-labrusca'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-rotundifolia
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
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5,
  9,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam','sand'],
  'full_sun',
  'fast',
  'spreading',
  'Native to the southeastern United States; adapted to warm climates and commonly found in forests, thickets, and sandy sites.',
  2,
  3,
  'late',
  false,
  'draft',
  ARRAY[
    'NCSU Extension Gardener Plant Toolbox: Vitis rotundifolia (zone range, light/soil descriptors) https://plants.ces.ncsu.edu/plants/vitis-rotundifolia/',
    'USDA PLANTS Database: Vitis rotundifolia profile https://plants.usda.gov/plant-profile/viro3',
    'NCSU Extension: Muscadine grapes in the home garden (cold sensitivity notes, cultivar pollination context) https://content.ces.ncsu.edu/muscadine-grapes-in-the-home-garden',
    'UGA Muscadine Breeding Program: flower type / pollination context https://muscadines.caes.uga.edu/cultivars/flower-type.html'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-rotundifolia'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-riparia
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
  mature_height_max_ft,
  harvest_season,
  nitrogen_fixer,
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
  ARRAY['loam','sandy_loam','sand','silt_loam'],
  'full_sun',
  'very_fast',
  'spreading',
  'Native across much of North America, especially along rivers and moist woods; a foundational cold-hardy Vitis species.',
  75,
  'mid',
  false,
  'draft',
  ARRAY[
    'NCSU Extension Gardener Plant Toolbox: Vitis riparia (zones, size/habit descriptors) https://plants.ces.ncsu.edu/plants/vitis-riparia/',
    'University of Minnesota Landscape Arboretum: river bank grape (zone range) https://trees.umn.edu/river-bank-grape-vitis-riparia',
    'USDA PLANTS Database: Vitis riparia profile https://plants.usda.gov/plant-profile/viri'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-riparia'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-aestivalis
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
  mature_height_max_ft,
  harvest_season,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5,
  8,
  NULL,
  NULL,
  'well_drained',
  ARRAY['loam','clay_loam','silt_loam'],
  'full_sun',
  'fast',
  'spreading',
  'Native to much of the eastern and midwestern United States; commonly occurs in woods, thickets, and rocky slopes.',
  35,
  'mid',
  false,
  'draft',
  ARRAY[
    'NCSU Extension Gardener Plant Toolbox: Vitis aestivalis (zones, cultural conditions) https://plants.ces.ncsu.edu/plants/vitis-aestivalis/',
    'USDA Fire Effects Information System (FEIS): Vitis aestivalis overview (native habit/range context) https://www.fs.usda.gov/database/feis/plants/vine/vitaes/all.html',
    'Missouri Botanical Garden Plant Finder: Vitis aestivalis (range/habit description) https://www.missouribotanicalgarden.org/plantfinder/PlantFinderDetails.aspx?taxonid=287538'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-aestivalis'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-berlandieri
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
  soil_notes,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  NULL,
  NULL,
  'well_drained',
  ARRAY['clay_loam','silt_loam','loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to central Texas and into Mexico, associated with calcareous/limestone landscapes.',
  'Notable tolerance of calcareous/high-pH limestone soils; commonly used via rootstock hybrids.',
  false,
  'draft',
  ARRAY[
    'Oklahoma State University Extension: Rootstocks for Grape Production (V. berlandieri lime tolerance, deep-rooted, drought adaptation) https://extension.okstate.edu/fact-sheets/rootstocks-for-grape-production.html',
    'NatureServe Explorer: Vitis berlandieri (range / limestone association) https://explorer.natureserve.org/Taxon/ELEMENT_GLOBAL.2.154590/Vitis_berlandieri',
    'USDA PLANTS Database: Vitis genus profiles https://plants.usda.gov/home'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-berlandieri'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-rupestris
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
  soil_notes,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  NULL,
  NULL,
  'well_drained',
  ARRAY['sand','sandy_loam','loam'],
  'full_sun',
  'moderate',
  'taproot',
  'Native to parts of the central and eastern United States; often associated with rocky creek beds and well-drained sites.',
  'Often associated with rocky, well-drained sites; valued in rootstock breeding for deep rooting and drought tolerance.',
  false,
  'draft',
  ARRAY[
    'Oklahoma State University Extension (PDF): Rootstocks for Grape Production (V. rupestris deep rooted, drought tolerant, phylloxera resistance) https://extension.okstate.edu/fact-sheets/print-publications/hla/rootstocks-for-grape-production-hla-6253.pdf',
    'USDA PLANTS Database: Vitis rupestris profile https://plants.sc.egov.usda.gov/plant-profile/VIRU2',
    'NatureServe Explorer: Vitis rupestris (range context) https://explorer.natureserve.org/Taxon/ELEMENT_GLOBAL.2.154710/Vitis_rupestris'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-rupestris'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-labruscana
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
  years_to_bearing_min,
  years_to_bearing_max,
  harvest_season,
  chill_hours_notes,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5,
  9,
  NULL,
  NULL,
  'moderate',
  ARRAY['loam','sandy_loam','clay_loam'],
  'full_sun',
  'fast',
  'spreading',
  'Not a naturally occurring native range; a horticultural hybrid complex derived from North American and Eurasian Vitis lineages.',
  2,
  4,
  'mid',
  'Wide range; depends on cultivar and parentage.',
  false,
  'draft',
  ARRAY[
    'NC State Extension: North Carolina Winegrape Growers Guide, Chapter 3 (role of V. labrusca and hybrids in U.S. grape culture) https://content.ces.ncsu.edu/north-carolina-winegrape-growers-guide/chapter-3-choice-of-varieties',
    'Double A Vineyards blog (overview of hardiness ranges for vinifera vs American hybrids; non-extension but industry reference) https://doubleavineyards.com/blogs/field-notes/grapevine-hardiness-and-using-the-usda-hardiness-zone-maps'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-labruscana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- vitis-champinii
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
  soil_notes,
  nitrogen_fixer,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  NULL,
  NULL,
  'well_drained',
  ARRAY['sandy_loam','loam','clay_loam'],
  'full_sun',
  'fast',
  'taproot',
  'Native to arid/low-rainfall regions of west-central Texas and northern Mexico, often on calcareous soils.',
  'Often very vigorous; drought-adapted; can be overly vigorous under irrigation and may be less cold hardy.',
  false,
  'draft',
  ARRAY[
    'USDA PLANTS Database: Vitis x champinii profile (hybrid parentage note) https://plants.usda.gov/plant-profile/VICH3',
    'Oklahoma State University Extension: Rootstocks for Grape Production (site adaptation / vigor notes for V. x champinii) https://extension.okstate.edu/fact-sheets/rootstocks-for-grape-production.html',
    'NatureServe Explorer: Vitis x champinii (calcareous soils / range) https://explorer.natureserve.org/Taxon/ELEMENT_GLOBAL.2.1280212/Vitis_x_champinii'
  ]
FROM plant_entities pe
WHERE pe.slug = 'vitis-champinii'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-vinifera'),
  'self_fertile',
  'wind_and_insect',
  0,
  'spring',
  'Cultivated V. vinifera vines have perfect flowers and typically set fruit without a pollinizer vine.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-labrusca'),
  'partially_self',
  'wind_and_insect',
  'late spring',
  'Wild Vitis species commonly have separate male and female vines; cultivated selections are often self-fertile.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-rotundifolia'),
  'partially_self',
  'wind_and_insect',
  1,
  50,
  'spring',
  'Many modern muscadine cultivars are self-fertile; female-flowered cultivars require a nearby self-fertile pollinizer, commonly recommended within about 50 ft in home plantings.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-riparia'),
  'cross_required',
  'wind_and_insect',
  1,
  'spring',
  'Wild V. riparia is commonly functionally dioecious (separate male and female vines), so fruiting requires a female vine and pollen source.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-aestivalis'),
  'cross_required',
  'wind_and_insect',
  1,
  'late spring',
  'Many wild grape species have separate male and female plants; fruiting in wild-type vines may require a nearby pollen source.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-berlandieri'),
  'cross_required',
  'wind_and_insect',
  'spring',
  'Primarily relevant as a rootstock parent species; pollination biology varies in wild Vitis.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-rupestris'),
  'cross_required',
  'wind_and_insect',
  'spring',
  'Primarily relevant as a rootstock parent species; pollination biology varies in wild Vitis.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-labruscana'),
  'self_fertile',
  'wind_and_insect',
  0,
  'spring',
  'Most cultivated hybrids used for fruit are self-fertile; specific pollen requirements vary by cultivar.'
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
  (SELECT id FROM plant_entities WHERE slug = 'vitis-champinii'),
  'cross_required',
  'wind_and_insect',
  'spring',
  'Primarily relevant as a rootstock species; pollination biology varies in wild Vitis.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: HYBRID PARENTAGE
-- ============================================================================

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'vitis-labruscana'),
  (SELECT id FROM plant_entities WHERE slug = 'vitis-vinifera'),
  50,
  'NC State Extension: North Carolina Winegrape Growers Guide, Chapter 3 (hybrid lineage context)'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'vitis-labruscana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'vitis-vinifera')
)
ON CONFLICT DO NOTHING;

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'vitis-labruscana'),
  (SELECT id FROM plant_entities WHERE slug = 'vitis-labrusca'),
  50,
  'NC State Extension: North Carolina Winegrape Growers Guide, Chapter 3 (hybrid lineage context)'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'vitis-labruscana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'vitis-labrusca')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
