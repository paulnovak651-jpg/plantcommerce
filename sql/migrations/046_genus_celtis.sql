-- ============================================================================
-- MIGRATION 046: Celtis Genus (Hackberry)
-- Adds taxonomy, species, profiles, pollination, a small curated cultivar set,
-- and aliases focused on species-level relevance.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000021 (genus-celtis)
-- ============================================================================

BEGIN;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'c0000000-0000-0000-0000-000000000014',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Cannabaceae', 'Hemp Family', 'cannabaceae',
  'b0000000-0000-0000-0000-000000000002', TRUE, 4,
  'Includes hackberries, hops, and hemp. Hackberries are resilient shade trees with edible wildlife-supporting fruit.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'd0000000-0000-0000-0000-000000000021',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Celtis', 'Hackberries', 'genus-celtis',
  'c0000000-0000-0000-0000-000000000014', TRUE, 1,
  'Resilient shade trees with small sweet drupes, major wildlife value, and strong tolerance of urban and continental conditions.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  ('celtis-occidentalis', 'Common Hackberry', 'Celtis occidentalis', 'Cannabaceae', 'Celtis', 'occidentalis', 'species', 'verified', 'd0000000-0000-0000-0000-000000000021', 'North American shade tree with edible small drupes, high wildlife value, and strong resilience to wind, drought, and urban soils.', 'published'),
  ('celtis-laevigata', 'Sugarberry', 'Celtis laevigata', 'Cannabaceae', 'Celtis', 'laevigata', 'species', 'verified', 'd0000000-0000-0000-0000-000000000021', 'Southern hackberry relative adapted to warmer climates and floodplain conditions, with similar wildlife and edible fruit value.', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 9, 6.0, 8.0,
  'moderate', ARRAY['loam','sandy_loam','clay_loam','clay','silt_loam'], 'full_sun', 'moderate', 'spreading',
  'Central and eastern North America, especially floodplains, limestone soils, and open woodlands.',
  40, 70, 35, 60, ARRAY['bird_food','nesting_habitat'],
  'Useful as a resilient overstory tree in large food forests and shelterbelt edges; fruit is important to birds and can be used as a minor human food.',
  5, 10, 'early_mid', 'published',
  ARRAY['USDA PLANTS Database', 'Lady Bird Johnson Wildflower Center']
FROM plant_entities pe
WHERE pe.slug = 'celtis-occidentalis'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 5, 10, 6.0, 8.0,
  'tolerates_wet', ARRAY['loam','sandy_loam','clay_loam','silt_loam'], 'full_sun', 'fast', 'spreading',
  'Southeastern United States and adjacent Mexico, especially river bottoms and alluvial soils.',
  50, 80, 40, 70, ARRAY['bird_food','nesting_habitat'],
  'Excellent warm-climate shade and wildlife tree with higher flood tolerance than common hackberry.',
  5, 10, 'early_mid', 'published',
  ARRAY['USDA PLANTS Database', 'Regional tree guides']
FROM plant_entities pe
WHERE pe.slug = 'celtis-laevigata'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, bloom_period_general, notes
)
VALUES
  ((SELECT id FROM plant_entities WHERE slug = 'celtis-occidentalis'), 'self_fertile', 'wind', 0, 'spring', 'Hackberries are wind pollinated and generally fruit without requiring a second named selection.'),
  ((SELECT id FROM plant_entities WHERE slug = 'celtis-laevigata'), 'self_fertile', 'wind', 0, 'spring', 'Sugarberry is typically self-fertile and wind pollinated.')
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('prairie-pride', 'Prairie Pride', (SELECT id FROM plant_entities WHERE slug = 'celtis-occidentalis'), 'cultivar_clone', NULL, NULL, 'published', 'Common hackberry selection valued for resilient structure and broad site tolerance.'),
  ('prairie-sentinel', 'Prairie Sentinel', (SELECT id FROM plant_entities WHERE slug = 'celtis-occidentalis'), 'cultivar_clone', NULL, NULL, 'published', 'Upright hackberry selection useful where a narrower shade tree is needed.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('Prairie Pride Hackberry', 'prairie pride hackberry', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'prairie-pride'), 'nursery_variant', 'published'),
  ('Prairie Sentinel Hackberry', 'prairie sentinel hackberry', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'prairie-sentinel'), 'nursery_variant', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
