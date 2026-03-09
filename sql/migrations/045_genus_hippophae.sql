-- ============================================================================
-- MIGRATION 045: Hippophae Genus (Sea Buckthorn)
-- Adds taxonomy, species, profiles, pollination, cultivars, and aliases.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000020 (genus-hippophae)
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
  'd0000000-0000-0000-0000-000000000020',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Hippophae', 'Sea Buckthorn', 'genus-hippophae',
  'c0000000-0000-0000-0000-000000000013', TRUE, 2,
  'Nitrogen-fixing cold-hardy shrubs prized for nutrient-dense orange berries, wildlife value, and support-species functions.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  ('hippophae-rhamnoides', 'Sea Buckthorn', 'Hippophae rhamnoides', 'Elaeagnaceae', 'Hippophae', 'rhamnoides', 'species', 'verified', 'd0000000-0000-0000-0000-000000000020', 'Nitrogen-fixing, highly cold-hardy fruit shrub with exceptional wildlife value and nutrient-dense berries for juice, preserves, and processing.', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, nitrogen_fixer, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, spacing_notes, pruning_notes,
  curation_status, data_sources
)
SELECT
  pe.id, 3, 7, 5.5, 7.8,
  'well_drained', ARRAY['sand','sandy_loam','loam','gravelly'], 'full_sun', 'fast', 'suckering',
  'Europe and temperate Asia, especially dry coasts, river valleys, and montane regions.',
  6, 15, 6, 15, TRUE, ARRAY['bird_food','pollinator_support'],
  'Excellent support species for poor soils and exposed sites; thorny growth and suckering habit suit living hedges and shelterbelts.',
  3, 5, 'late',
  'Allow space for male pollinizers and harvest access in thorny plantings.',
  'Renew older canes selectively and maintain open structure for harvest.',
  'published',
  ARRAY['General agroforestry references', 'Sea buckthorn extension-style horticultural guidance']
FROM plant_entities pe
WHERE pe.slug = 'hippophae-rhamnoides'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'),
  'cross_required',
  'wind',
  1,
  50,
  'spring',
  'Sea buckthorn is dioecious; female fruiting plants require a nearby male pollinizer, usually at roughly 1 male per 6-8 females.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('askola', 'Askola', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', 'German selection', NULL, 'published', 'Female sea buckthorn cultivar selected for heavy fruiting.'),
  ('leikora', 'Leikora', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', 'German selection', NULL, 'published', 'Widely planted female cultivar valued for vigorous growth and processing fruit.'),
  ('hergo', 'Hergo', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', 'German selection', NULL, 'published', 'Sea buckthorn cultivar with strong cold hardiness and productive fruiting.'),
  ('pollmix', 'Pollmix', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', NULL, NULL, 'published', 'Male pollinizer selection for sea buckthorn orchards and homestead plantings.'),
  ('sirola', 'Sirola', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', 'Finnish selection', NULL, 'published', 'Cold-climate sea buckthorn cultivar for northern fruit production.'),
  ('star-of-altai', 'Star of Altai', (SELECT id FROM plant_entities WHERE slug = 'hippophae-rhamnoides'), 'cultivar_clone', 'Altai breeding program', NULL, 'published', 'Sea buckthorn cultivar associated with high-quality fruit in continental climates.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('Pollmix Male', 'pollmix male', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'pollmix'), 'nursery_variant', 'published'),
  ('Sea Buckthorn Pollmix', 'sea buckthorn pollmix', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'pollmix'), 'nursery_variant', 'published'),
  ('Leikora Sea Buckthorn', 'leikora sea buckthorn', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'leikora'), 'nursery_variant', 'published'),
  ('Altai', 'altai', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'star-of-altai'), 'abbreviation', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
