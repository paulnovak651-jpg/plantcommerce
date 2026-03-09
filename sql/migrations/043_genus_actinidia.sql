-- ============================================================================
-- MIGRATION 043: Actinidia Genus (Hardy Kiwi)
-- Adds species, profiles, pollination, cultivars, and aliases.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000013 (genus-actinidia)
-- ============================================================================

BEGIN;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'd0000000-0000-0000-0000-000000000013',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Actinidia', 'Kiwifruit', 'genus-actinidia',
  'c0000000-0000-0000-0000-000000000008', TRUE, 1,
  'Hardy kiwi, arctic kiwi, and fuzzy kiwi. Vigorous fruiting vines, usually dioecious and highly ornamental.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  ('actinidia-arguta', 'Hardy Kiwi', 'Actinidia arguta', 'Actinidiaceae', 'Actinidia', 'arguta', 'species', 'verified', 'd0000000-0000-0000-0000-000000000013', 'Cold-hardy kiwifruit vine producing smooth-skinned bite-sized fruit, highly relevant to temperate permaculture trellis systems.', 'published'),
  ('actinidia-kolomikta', 'Arctic Kiwi', 'Actinidia kolomikta', 'Actinidiaceae', 'Actinidia', 'kolomikta', 'species', 'verified', 'd0000000-0000-0000-0000-000000000013', 'Exceptionally cold-hardy kiwi vine valued for edible fruit, ornamental foliage, and northern-climate resilience.', 'published'),
  ('actinidia-deliciosa', 'Fuzzy Kiwi', 'Actinidia deliciosa', 'Actinidiaceae', 'Actinidia', 'deliciosa', 'species', 'verified', 'd0000000-0000-0000-0000-000000000013', 'The familiar commercial fuzzy kiwi, included for warm-zone plantings and as a contrast to hardy kiwi species.', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, ecological_notes, years_to_bearing_min,
  years_to_bearing_max, harvest_season, spacing_notes, pruning_notes, curation_status, data_sources
)
SELECT
  pe.id, 4, 8, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'full_sun', 'very_fast', 'spreading',
  'East Asia including China, Korea, Japan, and the Russian Far East.',
  15, 30, 8, 15,
  'Needs strong trellis support and regular pruning; heavy fruit set in climates with adequate summer warmth.',
  3, 5, 'late',
  'Plant on durable arbors or wire trellis with ample space for vigorous annual cane growth.',
  'Prune in dormancy and summer to manage vigor and maintain fruiting wood.',
  'published',
  ARRAY['University extension hardy kiwi guides', 'Cornell Fruit Resources']
FROM plant_entities pe
WHERE pe.slug = 'actinidia-arguta'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, ecological_notes, years_to_bearing_min,
  years_to_bearing_max, harvest_season, spacing_notes, pruning_notes, curation_status, data_sources
)
SELECT
  pe.id, 3, 7, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'part_shade', 'fast', 'spreading',
  'Northeast Asia, especially colder continental regions of Russia, China, Korea, and Japan.',
  10, 20, 6, 12,
  'Most cold-hardy Actinidia; ornamental variegated foliage makes it valuable for edible landscapes.',
  3, 5, 'early_mid',
  'Provide support and some shelter from hot afternoon sun in warmer zones.',
  'Regular pruning needed to prevent tangling and maintain fruiting wood.',
  'published',
  ARRAY['University extension hardy kiwi guides', 'Cornell Fruit Resources']
FROM plant_entities pe
WHERE pe.slug = 'actinidia-kolomikta'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, ecological_notes, years_to_bearing_min,
  years_to_bearing_max, harvest_season, spacing_notes, pruning_notes, curation_status, data_sources
)
SELECT
  pe.id, 7, 9, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'full_sun', 'very_fast', 'spreading',
  'China, especially warmer montane and subtropical regions.',
  15, 30, 8, 15,
  'Best for mild-winter sites; highly productive where heat and season length are sufficient.',
  3, 5, 'late',
  'Requires sturdy support and frost-sheltered bloom conditions.',
  'Aggressive annual pruning needed to balance vegetative growth and fruiting.',
  'published',
  ARRAY['University extension kiwi guides', 'General horticultural consensus']
FROM plant_entities pe
WHERE pe.slug = 'actinidia-deliciosa'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
)
VALUES
  ((SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cross_required', 'insect', 1, 30, 'late spring', 'Most hardy kiwi cultivars are dioecious and require a nearby male pollinizer; Issai is a partial exception.'),
  ((SELECT id FROM plant_entities WHERE slug = 'actinidia-kolomikta'), 'cross_required', 'insect', 1, 30, 'spring', 'Typically dioecious; male and female vines with overlapping bloom are needed for reliable fruit set.'),
  ((SELECT id FROM plant_entities WHERE slug = 'actinidia-deliciosa'), 'cross_required', 'insect', 1, 30, 'late spring', 'Standard fuzzy kiwis require male pollinizers and strong bee activity during bloom.')
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('issai', 'Issai', (SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cultivar_clone', 'Japanese selection', NULL, 'published', 'Partially self-fertile hardy kiwi often recommended for smaller plantings.'),
  ('anna', 'Anna', (SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cultivar_clone', NULL, NULL, 'published', 'Hardy kiwi cultivar often sold for sweet aromatic fruit in temperate trellised systems.'),
  ('geneva', 'Geneva', (SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cultivar_clone', 'New York selection', NULL, 'published', 'Hardy kiwi selected for northern productivity and quality.'),
  ('dumbarton-oaks', 'Dumbarton Oaks', (SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cultivar_clone', NULL, NULL, 'published', 'Productive hardy kiwi cultivar used in specialty and homestead plantings.'),
  ('arctic-beauty', 'Arctic Beauty', (SELECT id FROM plant_entities WHERE slug = 'actinidia-kolomikta'), 'cultivar_clone', NULL, NULL, 'published', 'Cold-hardy kiwi with ornamental foliage and edible-fruit potential in northern gardens.'),
  ('meader', 'Meader', (SELECT id FROM plant_entities WHERE slug = 'actinidia-arguta'), 'cultivar_clone', 'Elwyn Meader', NULL, 'published', 'Common male pollinizer for hardy kiwi plantings.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('Issai Hardy Kiwi', 'issai hardy kiwi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'issai'), 'nursery_variant', 'published'),
  ('Ananasnaya', 'ananasnaya', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'anna'), 'foreign_name', 'published'),
  ('Geneva Hardy Kiwi', 'geneva hardy kiwi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'geneva'), 'nursery_variant', 'published'),
  ('Dumbarton Oaks Hardy Kiwi', 'dumbarton oaks hardy kiwi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'dumbarton-oaks'), 'nursery_variant', 'published'),
  ('Arctic Beauty Kiwi', 'arctic beauty kiwi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'arctic-beauty'), 'nursery_variant', 'published'),
  ('Meader Male', 'meader male', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'meader'), 'nursery_variant', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
