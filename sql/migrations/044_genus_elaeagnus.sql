-- ============================================================================
-- MIGRATION 044: Elaeagnus Genus (Autumn Olive & Goumi)
-- Adds taxonomy, species, profiles, pollination, cultivars, and aliases.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000019 (genus-elaeagnus)
-- ============================================================================

BEGIN;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'c0000000-0000-0000-0000-000000000013',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'family'),
  'Elaeagnaceae', 'Oleaster Family', 'elaeagnaceae',
  'b0000000-0000-0000-0000-000000000002', TRUE, 3,
  'Nitrogen-fixing shrubs and small trees including goumi, autumn olive, and sea buckthorn.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'd0000000-0000-0000-0000-000000000019',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Elaeagnus', 'Autumn Olive & Goumi', 'genus-elaeagnus',
  'c0000000-0000-0000-0000-000000000013', TRUE, 1,
  'Nitrogen-fixing shrubs used for fruit, shelter, and support species functions, though some species are invasive in parts of North America.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  ('elaeagnus-umbellata', 'Autumn Olive', 'Elaeagnus umbellata', 'Elaeagnaceae', 'Elaeagnus', 'umbellata', 'species', 'verified', 'd0000000-0000-0000-0000-000000000019', 'Nitrogen-fixing shrub with edible fruit, but invasive across much of the eastern and central United States. Included with an explicit caution rather than as a general recommendation.', 'published'),
  ('elaeagnus-multiflora', 'Goumi', 'Elaeagnus multiflora', 'Elaeagnaceae', 'Elaeagnus', 'multiflora', 'species', 'verified', 'd0000000-0000-0000-0000-000000000019', 'Nitrogen-fixing fruit shrub well suited to edible hedges and mixed support plantings in temperate food forests.', 'published'),
  ('elaeagnus-angustifolia', 'Russian Olive', 'Elaeagnus angustifolia', 'Elaeagnaceae', 'Elaeagnus', 'angustifolia', 'species', 'verified', 'd0000000-0000-0000-0000-000000000019', 'Drought-tolerant nitrogen-fixing tree/shrub that is invasive in many western and riparian ecosystems in the United States; included for identification and caution.', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, nitrogen_fixer, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 4, 8, 5.5, 7.8,
  'well_drained', ARRAY['loam','sandy_loam','clay_loam','sand'], 'full_sun', 'fast', 'fibrous',
  'Asia, widely introduced in North America.',
  8, 16, 8, 16, TRUE, ARRAY['bird_food','pollinator_support'],
  'Fixes nitrogen and fruits heavily, but spreads aggressively by seed and should not be promoted in invasive-prone regions.',
  2, 4, 'mid_late', 'published',
  ARRAY['USDA Forest Service invasive species profiles', 'General agroforestry references']
FROM plant_entities pe
WHERE pe.slug = 'elaeagnus-umbellata'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, nitrogen_fixer, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 4, 8, 5.5, 7.5,
  'well_drained', ARRAY['loam','sandy_loam','clay_loam'], 'full_sun', 'moderate', 'fibrous',
  'East Asia; cultivated widely as an edible support shrub.',
  6, 10, 6, 10, TRUE, ARRAY['pollinator_support','bird_food'],
  'High-value nitrogen-fixing fruit shrub for hedgerows, poultry forage zones, and mixed support guilds.',
  2, 3, 'early_mid', 'published',
  ARRAY['Agroforestry references', 'General nursery and extension consensus on goumi']
FROM plant_entities pe
WHERE pe.slug = 'elaeagnus-multiflora'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, nitrogen_fixer, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 8, 6.0, 8.0,
  'well_drained', ARRAY['loam','sandy_loam','clay_loam','sand'], 'full_sun', 'fast', 'fibrous',
  'Europe and western Asia; introduced and widely naturalized in North America.',
  12, 25, 10, 20, TRUE, ARRAY['bird_food'],
  'Useful as a cautionary identification species; highly drought tolerant but invasive in many western riparian systems.',
  3, 5, 'late', 'published',
  ARRAY['USDA invasive species resources', 'General agroforestry references']
FROM plant_entities pe
WHERE pe.slug = 'elaeagnus-angustifolia'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, bloom_period_general, notes
)
VALUES
  ((SELECT id FROM plant_entities WHERE slug = 'elaeagnus-umbellata'), 'self_fertile', 'insect', 0, 'spring', 'Typically self-fertile and highly attractive to pollinators.'),
  ((SELECT id FROM plant_entities WHERE slug = 'elaeagnus-multiflora'), 'partially_self', 'insect', 1, 'spring', 'Often fruits alone, but cross-pollination improves set and berry size.'),
  ((SELECT id FROM plant_entities WHERE slug = 'elaeagnus-angustifolia'), 'self_fertile', 'insect', 0, 'spring', 'Usually self-fertile, with flowers strongly attractive to bees.')
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('sweet-scarlet', 'Sweet Scarlet', (SELECT id FROM plant_entities WHERE slug = 'elaeagnus-multiflora'), 'cultivar_clone', NULL, NULL, 'published', 'Goumi cultivar selected for improved fruit size and fresh-eating quality.'),
  ('red-gem', 'Red Gem', (SELECT id FROM plant_entities WHERE slug = 'elaeagnus-multiflora'), 'cultivar_clone', NULL, NULL, 'published', 'Reliable goumi cultivar for edible hedges and mixed support plantings.'),
  ('ruby', 'Ruby', (SELECT id FROM plant_entities WHERE slug = 'elaeagnus-umbellata'), 'cultivar_clone', NULL, NULL, 'published', 'Autumn olive selection included with an invasive-species caveat; not recommended in regions where spread is a concern.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('Sweet Scarlet Goumi', 'sweet scarlet goumi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'sweet-scarlet'), 'nursery_variant', 'published'),
  ('Red Gem Goumi', 'red gem goumi', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'red-gem'), 'nursery_variant', 'published'),
  ('Ruby Autumn Olive', 'ruby autumn olive', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'ruby'), 'nursery_variant', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
