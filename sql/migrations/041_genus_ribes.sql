-- ============================================================================
-- MIGRATION 041: Ribes Genus (Currants & Gooseberries)
-- Adds taxonomy, species, profiles, pollination, cultivars, and aliases.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000017 (genus-ribes)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 0: TAXONOMY
-- ============================================================================

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'b0000000-0000-0000-0000-000000000007',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'order'),
  'Saxifragales', 'Saxifrage Order', 'saxifragales',
  'a0000000-0000-0000-0000-000000000003', TRUE, 7,
  'Includes currants, gooseberries, and several other shrub groups important in temperate food systems.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'c0000000-0000-0000-0000-000000000012',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Grossulariaceae', 'Currant Family', 'grossulariaceae',
  'b0000000-0000-0000-0000-000000000007', TRUE, 1,
  'Currants and gooseberries. Shade-tolerant, cold-hardy berry shrubs with high wildlife and preserves value.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'd0000000-0000-0000-0000-000000000017',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Ribes', 'Currants & Gooseberries', 'genus-ribes',
  'c0000000-0000-0000-0000-000000000012', TRUE, 1,
  'Cold-hardy berry shrubs including black currants, red currants, gooseberries, and clove currants.'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 1: PLANT ENTITIES
-- ============================================================================

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  (
    'ribes-nigrum',
    'Black Currant',
    'Ribes nigrum',
    'Grossulariaceae',
    'Ribes',
    'nigrum',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000017',
    'Cold-hardy currant shrub valued for high-antioxidant fruit, preserves, cordials, and low-input berry production in cool climates.',
    'published'
  ),
  (
    'ribes-rubrum',
    'Red Currant',
    'Ribes rubrum',
    'Grossulariaceae',
    'Ribes',
    'rubrum',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000017',
    'Productive and long-lived currant shrub used for fresh eating, jelly, and ornamental-edible hedgerows.',
    'published'
  ),
  (
    'ribes-uva-crispa',
    'Gooseberry',
    'Ribes uva-crispa',
    'Grossulariaceae',
    'Ribes',
    'uva-crispa',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000017',
    'Cold-hardy shrub berry with tart-sweet fruit, valued for pies, preserves, and productive partial-shade plantings.',
    'published'
  ),
  (
    'ribes-aureum',
    'Clove Currant',
    'Ribes aureum',
    'Grossulariaceae',
    'Ribes',
    'aureum',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000017',
    'North American currant with fragrant clove-scented flowers, broad wildlife value, and resilience in dryland or continental systems.',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 7, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam','clay_loam'], 'full_sun', 'moderate', 'fibrous',
  'Northern Europe and temperate Asia; widely cultivated in cool North American regions.',
  3, 6, 3, 6, ARRAY['pollinator_support','bird_food'],
  'Performs best in cooler summer climates; useful in edible hedgerows and mixed berry guilds.',
  2, 3, 'mid', 'published',
  ARRAY['USDA PLANTS Database', 'Cornell Fruit Resources: Currants and Gooseberries']
FROM plant_entities pe
WHERE pe.slug = 'ribes-nigrum'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 8, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam','clay_loam'], 'full_sun', 'moderate', 'fibrous',
  'Europe and western Asia; long cultivated in North American gardens and small fruit plantings.',
  3, 5, 3, 5, ARRAY['pollinator_support','bird_food'],
  'Tolerates light shade but fruits best in sun; useful for compact productive berry rows.',
  2, 3, 'mid', 'published',
  ARRAY['USDA PLANTS Database', 'Cornell Fruit Resources: Currants and Gooseberries']
FROM plant_entities pe
WHERE pe.slug = 'ribes-rubrum'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 8, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam','clay_loam'], 'part_shade', 'moderate', 'fibrous',
  'Europe, western Asia, and the Caucasus; widely adapted in North American cool-climate gardens.',
  3, 5, 3, 5, ARRAY['bird_food','pollinator_support'],
  'Appreciates air circulation to reduce mildew; productive in temperate food forests with some afternoon shade.',
  2, 3, 'mid', 'published',
  ARRAY['USDA PLANTS Database', 'Cornell Fruit Resources: Currants and Gooseberries']
FROM plant_entities pe
WHERE pe.slug = 'ribes-uva-crispa'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 4, 8, 6.0, 7.5,
  'well_drained', ARRAY['loam','sandy_loam','clay_loam','sand'], 'full_sun', 'moderate', 'fibrous',
  'Western and central North America; native to dry plains, foothills, and open woodland margins.',
  4, 8, 4, 8, ARRAY['bird_food','pollinator_support'],
  'Especially useful in dryland plantings, wildlife hedges, and native-fruit guilds; spring flowers are strongly fragrant.',
  2, 3, 'mid', 'published',
  ARRAY['USDA PLANTS Database', 'Lady Bird Johnson Wildflower Center']
FROM plant_entities pe
WHERE pe.slug = 'ribes-aureum'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: SPECIES POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, bloom_period_general, notes
)
VALUES
  ((SELECT id FROM plant_entities WHERE slug = 'ribes-nigrum'), 'partially_self', 'insect', 1, 'spring', 'Many black currants are somewhat self-fertile but crop more heavily with cross-pollination.'),
  ((SELECT id FROM plant_entities WHERE slug = 'ribes-rubrum'), 'self_fertile', 'insect', 0, 'spring', 'Red currants are generally self-fertile, though mixed plantings can improve set and yield.'),
  ((SELECT id FROM plant_entities WHERE slug = 'ribes-uva-crispa'), 'self_fertile', 'insect', 0, 'spring', 'Gooseberries are commonly self-fertile and productive as single shrubs.'),
  ((SELECT id FROM plant_entities WHERE slug = 'ribes-aureum'), 'self_fertile', 'insect', 0, 'spring', 'Clove currants typically set fruit without a second cultivar, but pollinators improve reliability.')
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: CULTIVARS
-- ============================================================================

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('crandall', 'Crandall', (SELECT id FROM plant_entities WHERE slug = 'ribes-aureum'), 'cultivar_clone', NULL, NULL, 'published', 'Classic clove currant valued for fragrance, fresh eating, and dryland adaptability.'),
  ('consort', 'Consort', (SELECT id FROM plant_entities WHERE slug = 'ribes-nigrum'), 'cultivar_clone', 'Agriculture Canada', NULL, 'published', 'Black currant selected for disease resistance and northern productivity.'),
  ('titania', 'Titania', (SELECT id FROM plant_entities WHERE slug = 'ribes-nigrum'), 'cultivar_clone', 'Swedish University of Agricultural Sciences', 1985, 'published', 'Vigorous black currant with strong disease resistance and large fruit.'),
  ('ben-sarek', 'Ben Sarek', (SELECT id FROM plant_entities WHERE slug = 'ribes-nigrum'), 'cultivar_clone', 'Scottish Crop Research Institute', NULL, 'published', 'Compact black currant suited to small-space plantings and cool climates.'),
  ('red-lake', 'Red Lake', (SELECT id FROM plant_entities WHERE slug = 'ribes-rubrum'), 'cultivar_clone', 'University of Minnesota', 1933, 'published', 'Widely grown red currant for jelly, fresh use, and northern gardens.'),
  ('rovada', 'Rovada', (SELECT id FROM plant_entities WHERE slug = 'ribes-rubrum'), 'cultivar_clone', NULL, NULL, 'published', 'Late red currant with long strigs and high productivity.'),
  ('jonkheer-van-tets', 'Jonkheer van Tets', (SELECT id FROM plant_entities WHERE slug = 'ribes-rubrum'), 'cultivar_clone', NULL, NULL, 'published', 'Early red currant valued for heavy crops and bright tart fruit.'),
  ('invicta', 'Invicta', (SELECT id FROM plant_entities WHERE slug = 'ribes-uva-crispa'), 'cultivar_clone', NULL, NULL, 'published', 'Green gooseberry known for vigor, productivity, and mildew tolerance.'),
  ('hinnonmaki-red', 'Hinnonmaki Red', (SELECT id FROM plant_entities WHERE slug = 'ribes-uva-crispa'), 'cultivar_clone', 'Finnish breeding program', NULL, 'published', 'Reliable red gooseberry with good flavor and cold hardiness.'),
  ('pixwell', 'Pixwell', (SELECT id FROM plant_entities WHERE slug = 'ribes-uva-crispa'), 'cultivar_clone', NULL, NULL, 'published', 'Classic hardy gooseberry often grown for pies, preserves, and low-input plantings.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 5: ALIASES
-- ============================================================================

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('Crandall Clove Currant', 'crandall clove currant', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'crandall'), 'nursery_variant', 'published'),
  ('Ben Sarek Black Currant', 'ben sarek black currant', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'ben-sarek'), 'nursery_variant', 'published'),
  ('Red Lake Currant', 'red lake currant', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'red-lake'), 'nursery_variant', 'published'),
  ('Jonkheer', 'jonkheer', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'jonkheer-van-tets'), 'abbreviation', 'published'),
  ('Hinnomaki Red', 'hinnomaki red', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'hinnonmaki-red'), 'misspelling', 'published'),
  ('Pixwell Gooseberry', 'pixwell gooseberry', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'pixwell'), 'nursery_variant', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
