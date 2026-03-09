-- ============================================================================
-- MIGRATION 042: Rubus Genus (Raspberries & Blackberries)
-- Adds taxonomy, species, profiles, pollination, cultivars, and aliases.
-- Taxonomy node UUID: d0000000-0000-0000-0000-000000000018 (genus-rubus)
-- ============================================================================

BEGIN;

INSERT INTO taxonomy_nodes (
  id, rank_id, name, common_name, slug, parent_id, notable_for_permaculture, display_order, description
)
VALUES (
  'd0000000-0000-0000-0000-000000000018',
  (SELECT id FROM taxonomy_ranks WHERE rank_name = 'genus'),
  'Rubus', 'Raspberries & Blackberries', 'genus-rubus',
  'c0000000-0000-0000-0000-000000000004', TRUE, 4,
  'Brambles including raspberries, blackberries, and hybrid berries. Highly productive cane fruits central to homestead berry systems.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
)
VALUES
  ('rubus-idaeus', 'Red Raspberry', 'Rubus idaeus', 'Rosaceae', 'Rubus', 'idaeus', 'species', 'verified', 'd0000000-0000-0000-0000-000000000018', 'The principal raspberry species in temperate cultivation, valued for fresh eating, preserves, and reliable cane-fruit production.', 'published'),
  ('rubus-occidentalis', 'Black Raspberry', 'Rubus occidentalis', 'Rosaceae', 'Rubus', 'occidentalis', 'species', 'verified', 'd0000000-0000-0000-0000-000000000018', 'North American raspberry species producing richly flavored dark fruit, with strong relevance to regional fresh market and homestead plantings.', 'published'),
  ('rubus-fruticosus', 'Blackberry', 'Rubus fruticosus agg.', 'Rosaceae', 'Rubus', 'fruticosus', 'species_group', 'provisional', 'd0000000-0000-0000-0000-000000000018', 'Cultivated blackberry complex used for trailing and erect thornless berry production across much of North America.', 'published'),
  ('rubus-hybrid-berry', 'Hybrid Berry Bramble Group', 'Rubus hybrids', 'Rosaceae', 'Rubus', NULL, 'hybrid_species', 'provisional', 'd0000000-0000-0000-0000-000000000018', 'Interspecific cane-fruit hybrids such as tayberries and boysenberries, valued for specialty berry flavor and long harvest windows.', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 3, 8, 5.5, 6.8,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'full_sun', 'fast', 'suckering',
  'Europe and northern Asia, long naturalized and cultivated across North America.',
  4, 6, 3, 5, ARRAY['pollinator_support','bird_food'],
  'Typically managed as biennial fruiting canes; productive in hedgerow systems with annual renewal pruning.',
  1, 2, 'mid', 'published',
  ARRAY['Cornell Berry Production Guide', 'NCSU Extension small fruit resources']
FROM plant_entities pe
WHERE pe.slug = 'rubus-idaeus'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 4, 8, 5.5, 6.8,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'full_sun', 'moderate', 'suckering',
  'Native to eastern North America, especially woodland edges and old-field margins.',
  4, 6, 3, 5, ARRAY['pollinator_support','bird_food'],
  'More drought tolerant than red raspberry in some settings; benefits from cane renewal and good airflow.',
  1, 2, 'mid', 'published',
  ARRAY['USDA PLANTS Database', 'Cornell Berry Production Guide']
FROM plant_entities pe
WHERE pe.slug = 'rubus-occidentalis'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 5, 9, 5.5, 7.0,
  'well_drained', ARRAY['loam','sandy_loam','clay_loam'], 'full_sun', 'fast', 'suckering',
  'Cultivated blackberry aggregate of Eurasian and American Rubus lineages grown widely in North America.',
  4, 8, 4, 8, ARRAY['pollinator_support','bird_food'],
  'Often grown on trellis systems; thornless modern cultivars are central to low-input backyard berry production.',
  1, 2, 'mid_late', 'published',
  ARRAY['University of Arkansas blackberry breeding program', 'Extension small fruit production guides']
FROM plant_entities pe
WHERE pe.slug = 'rubus-fruticosus'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances, sun_requirement, growth_rate, root_architecture,
  native_range_description, mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, harvest_season, curation_status, data_sources
)
SELECT
  pe.id, 5, 8, 5.5, 6.8,
  'well_drained', ARRAY['loam','sandy_loam','silt_loam'], 'full_sun', 'fast', 'suckering',
  'Cultivated bramble hybrids with no natural native range.',
  5, 8, 4, 8, ARRAY['pollinator_support','bird_food'],
  'Hybrid berries are typically trellised and benefit from annual cane training, but offer excellent flavor diversity in mixed berry systems.',
  1, 2, 'mid_late', 'published',
  ARRAY['Extension small fruit production guides', 'Royal Horticultural Society cultivar references']
FROM plant_entities pe
WHERE pe.slug = 'rubus-hybrid-berry'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism, min_pollinizer_count, bloom_period_general, notes
)
VALUES
  ((SELECT id FROM plant_entities WHERE slug = 'rubus-idaeus'), 'self_fertile', 'insect', 0, 'spring', 'Red raspberries are generally self-fertile but benefit from bee activity for full drupelet set.'),
  ((SELECT id FROM plant_entities WHERE slug = 'rubus-occidentalis'), 'self_fertile', 'insect', 0, 'spring', 'Black raspberries are typically self-fertile and productive in single-cultivar plantings.'),
  ((SELECT id FROM plant_entities WHERE slug = 'rubus-fruticosus'), 'self_fertile', 'insect', 0, 'spring', 'Most cultivated blackberries are self-fertile, though pollinator activity improves berry size and uniformity.'),
  ((SELECT id FROM plant_entities WHERE slug = 'rubus-hybrid-berry'), 'self_fertile', 'insect', 0, 'spring', 'Many hybrid berries are self-fertile, with yield improved by strong pollinator presence.')
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO cultivars (
  slug, canonical_name, plant_entity_id, material_type, breeder, year_released, curation_status, notes
)
VALUES
  ('heritage', 'Heritage', (SELECT id FROM plant_entities WHERE slug = 'rubus-idaeus'), 'cultivar_clone', 'Cornell University / NYSAES', 1969, 'published', 'Classic primocane red raspberry widely planted for fresh eating and preserves.'),
  ('joan-j', 'Joan J', (SELECT id FROM plant_entities WHERE slug = 'rubus-idaeus'), 'cultivar_clone', 'Medway Fruits', 2005, 'published', 'Spineless primocane raspberry valued for large fruit and easy harvest.'),
  ('polana', 'Polana', (SELECT id FROM plant_entities WHERE slug = 'rubus-idaeus'), 'cultivar_clone', 'Polish breeding program', NULL, 'published', 'Very early primocane red raspberry suited to cool-season production.'),
  ('nova', 'Nova', (SELECT id FROM plant_entities WHERE slug = 'rubus-idaeus'), 'cultivar_clone', 'Agriculture Canada', 1981, 'published', 'Cold-hardy floricane raspberry with good disease tolerance.'),
  ('bristol', 'Bristol', (SELECT id FROM plant_entities WHERE slug = 'rubus-occidentalis'), 'cultivar_clone', 'Cornell University / NYSAES', 1934, 'published', 'Historic black raspberry noted for productivity and classic flavor.'),
  ('jewel', 'Jewel', (SELECT id FROM plant_entities WHERE slug = 'rubus-occidentalis'), 'cultivar_clone', 'Cornell University / NYSAES', 1973, 'published', 'Widely grown black raspberry with large flavorful fruit.'),
  ('mac-black', 'Mac Black', (SELECT id FROM plant_entities WHERE slug = 'rubus-occidentalis'), 'cultivar_clone', 'Cornell University / NYSAES', 1972, 'published', 'Cold-hardy black raspberry for northern production.'),
  ('triple-crown', 'Triple Crown', (SELECT id FROM plant_entities WHERE slug = 'rubus-fruticosus'), 'cultivar_clone', 'USDA', 1996, 'published', 'Thornless semi-erect blackberry with excellent fresh-eating quality.'),
  ('chester', 'Chester', (SELECT id FROM plant_entities WHERE slug = 'rubus-fruticosus'), 'cultivar_clone', 'USDA', 1985, 'published', 'Late thornless blackberry known for hardiness and heavy crops.'),
  ('natchez', 'Natchez', (SELECT id FROM plant_entities WHERE slug = 'rubus-fruticosus'), 'cultivar_clone', 'University of Arkansas', 2007, 'published', 'Very early thornless blackberry with large berries.'),
  ('ouachita', 'Ouachita', (SELECT id FROM plant_entities WHERE slug = 'rubus-fruticosus'), 'cultivar_clone', 'University of Arkansas', 2003, 'published', 'Reliable thornless blackberry with strong flavor and broad adaptation.'),
  ('tayberry', 'Tayberry', (SELECT id FROM plant_entities WHERE slug = 'rubus-hybrid-berry'), 'cultivar_clone', 'Scottish Horticultural Research Institute', 1979, 'published', 'Raspberry-blackberry hybrid valued for intense aromatic fruit.'),
  ('boysenberry', 'Boysenberry', (SELECT id FROM plant_entities WHERE slug = 'rubus-hybrid-berry'), 'cultivar_clone', 'Rudolph Boysen / Walter Knott selection', 1935, 'published', 'Historic large-fruited hybrid berry used for fresh eating, jams, and specialty production.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO aliases (
  alias_text, normalized_text, target_type, target_id, alias_type, curation_status
)
VALUES
  ('JoanJ', 'joanj', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'joan-j'), 'nursery_variant', 'published'),
  ('Heritage Raspberry', 'heritage raspberry', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'heritage'), 'nursery_variant', 'published'),
  ('Triple Crown Thornless', 'triple crown thornless', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'triple-crown'), 'trade_name', 'published'),
  ('Chester Thornless', 'chester thornless', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'chester'), 'trade_name', 'published'),
  ('Natchez Thornless', 'natchez thornless', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'natchez'), 'trade_name', 'published'),
  ('Ouachita Thornless', 'ouachita thornless', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'ouachita'), 'trade_name', 'published'),
  ('Tay Berry', 'tay berry', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'tayberry'), 'misspelling', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
