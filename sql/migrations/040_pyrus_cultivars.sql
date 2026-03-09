-- ============================================================================
-- MIGRATION 040: Seed Pyrus Cultivars
-- 1) Ensure core Pyrus growing profiles are present and complete
-- 2) Seed curated European and Asian pear cultivars
-- 3) Add common cultivar aliases
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ENSURE / BACKFILL SPECIES GROWING PROFILES
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
  6.0,
  7.0,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam','silt_loam'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to Europe and western Asia; long cultivated across temperate North America.',
  15,
  30,
  12,
  25,
  3,
  7,
  'mid',
  'published',
  ARRAY[
    'NCSU Plant Toolbox: Pyrus communis',
    'General horticultural consensus (NA orchard culture)'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-communis'
ON CONFLICT (plant_entity_id) DO NOTHING;

UPDATE species_growing_profiles
SET
  usda_zone_min = 4,
  usda_zone_max = 9,
  soil_ph_min = 6.0,
  soil_ph_max = 7.0,
  soil_drainage = 'well_drained',
  soil_texture_tolerances = ARRAY['loam','sandy_loam','clay_loam','silt_loam'],
  sun_requirement = 'full_sun',
  growth_rate = 'moderate',
  root_architecture = 'spreading',
  native_range_description = 'Native to Europe and western Asia; long cultivated across temperate North America.',
  mature_height_min_ft = 15,
  mature_height_max_ft = 30,
  mature_spread_min_ft = 12,
  mature_spread_max_ft = 25,
  years_to_bearing_min = 3,
  years_to_bearing_max = 7,
  harvest_season = 'mid',
  curation_status = 'published',
  data_sources = ARRAY[
    'NCSU Plant Toolbox: Pyrus communis',
    'General horticultural consensus (NA orchard culture)'
  ],
  updated_at = now()
WHERE plant_entity_id = (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis');

-- pyrus-pyrifolia
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
  5,
  9,
  6.0,
  7.0,
  'well_drained',
  ARRAY['loam','sandy_loam','clay_loam','silt_loam'],
  'full_sun',
  'moderate',
  'spreading',
  'Native to East Asia; cultivated in North America for crisp dessert fruit and fresh-market production.',
  12,
  25,
  10,
  20,
  3,
  5,
  'mid',
  'published',
  ARRAY[
    'UC ANR Small Farms Network: Asian Pears',
    'General horticultural consensus (NA cultivation)'
  ]
FROM plant_entities pe
WHERE pe.slug = 'pyrus-pyrifolia'
ON CONFLICT (plant_entity_id) DO NOTHING;

UPDATE species_growing_profiles
SET
  usda_zone_min = 5,
  usda_zone_max = 9,
  soil_ph_min = 6.0,
  soil_ph_max = 7.0,
  soil_drainage = 'well_drained',
  soil_texture_tolerances = ARRAY['loam','sandy_loam','clay_loam','silt_loam'],
  sun_requirement = 'full_sun',
  growth_rate = 'moderate',
  root_architecture = 'spreading',
  native_range_description = 'Native to East Asia; cultivated in North America for crisp dessert fruit and fresh-market production.',
  mature_height_min_ft = 12,
  mature_height_max_ft = 25,
  mature_spread_min_ft = 10,
  mature_spread_max_ft = 20,
  years_to_bearing_min = 3,
  years_to_bearing_max = 5,
  harvest_season = 'mid',
  curation_status = 'published',
  data_sources = ARRAY[
    'UC ANR Small Farms Network: Asian Pears',
    'General horticultural consensus (NA cultivation)'
  ],
  updated_at = now()
WHERE plant_entity_id = (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia');

-- ============================================================================
-- PART 2: CULTIVARS
-- ============================================================================

INSERT INTO cultivars (
  slug,
  canonical_name,
  plant_entity_id,
  material_type,
  breeder,
  year_released,
  curation_status,
  notes
)
VALUES
  -- European pears: fire blight-resistant
  ('harrow-sweet', 'Harrow Sweet', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'Agriculture and Agri-Food Canada (Harrow)', 1991, 'published', 'Fire blight-resistant dessert pear from the Harrow breeding program.'),
  ('harrow-delight', 'Harrow Delight', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'Agriculture Canada (Harrow)', 1981, 'published', 'Early-ripening fire blight-resistant pear for home orchards.'),
  ('harrow-crisp', 'Harrow Crisp', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'Agriculture and Agri-Food Canada (Harrow)', 2004, 'published', 'Crisp-textured, fire blight-resistant pear selected for low-spray production.'),
  ('moonglow', 'Moonglow', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'USDA', 1960, 'published', 'Reliable pear with notable fire blight resistance and broad homestead adaptation.'),
  ('magness', 'Magness', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'USDA', 1960, 'published', 'High-quality dessert pear with strong fire blight resistance.'),
  ('potomac', 'Potomac', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'USDA', 1993, 'published', 'Fire blight-resistant dessert and storage pear with Magness ancestry.'),
  ('blakes-pride', 'Blake''s Pride', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'USDA', 1998, 'published', 'Late-season fire blight-resistant pear for eastern orchards and homesteads.'),

  -- European pears: classic homestead
  ('bartlett', 'Bartlett', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Classic canning and fresh-eating pear; often sold under alternate names.'),
  ('bosc', 'Bosc', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Traditional russeted pear valued for fresh eating, baking, and storage.'),
  ('seckel', 'Seckel', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Small, richly flavored dessert pear suited to homestead orchards.'),
  ('anjou', 'Anjou', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Widely grown dual-purpose pear for fresh eating and storage.'),
  ('comice', 'Comice', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Highly regarded dessert pear with rich flavor and tender texture.'),
  ('conference', 'Conference', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, 1885, 'published', 'Reliable European pear with strong productivity and broad backyard usefulness.'),

  -- European pears: cold-hardy
  ('luscious', 'Luscious', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'South Dakota State University', NULL, 'published', 'Cold-hardy dessert pear for northern orchard systems.'),
  ('patten', 'Patten', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', NULL, NULL, 'published', 'Cold-hardy pear selected for Upper Midwest and prairie orchard use.'),
  ('parker', 'Parker', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'University of Minnesota', NULL, 'published', 'Cold-hardy pear bred for northern climates and short seasons.'),
  ('summercrisp', 'Summercrisp', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'University of Minnesota', 1985, 'published', 'Very hardy early pear recommended for northern growers.'),
  ('ure', 'Ure', (SELECT id FROM plant_entities WHERE slug = 'pyrus-communis'), 'cultivar_clone', 'Morden Research Station', NULL, 'published', 'Extremely hardy small pear used in prairie and zone-3 plantings.'),

  -- Asian pears
  ('hosui', 'Hosui', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', 'Japanese breeding program', 1972, 'published', 'Popular russeted Asian pear with rich flavor and fresh-eating quality.'),
  ('shinseiki', 'Shinseiki', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', 'Japanese breeding program', 1945, 'published', 'Early yellow Asian pear with crisp texture and dependable productivity.'),
  ('chojuro', 'Chojuro', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Classic bronze Asian pear valued for butterscotch-like flavor.'),
  ('korean-giant', 'Korean Giant', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Large late-season Asian pear also widely marketed under alternate trade names.'),
  ('nijisseiki', 'Nijisseiki', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Historic green-yellow Asian pear also known as 20th Century.'),
  ('yoinashi', 'Yoinashi', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Asian pear selected for fresh eating and home orchard diversity.'),
  ('kosui', 'Kosui', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', 'Japanese breeding program', 1959, 'published', 'Early brown Asian pear with sweet flavor and crisp texture.'),
  ('atago', 'Atago', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Very large Asian pear suited to fresh eating and specialty orchard production.'),
  ('shinsui', 'Shinsui', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', 'Japanese breeding program', 1965, 'published', 'Early russeted Asian pear with sweet aromatic fruit.'),
  ('mishirasu', 'Mishirasu', (SELECT id FROM plant_entities WHERE slug = 'pyrus-pyrifolia'), 'cultivar_clone', NULL, NULL, 'published', 'Less-common Asian pear cultivar for diversified fresh-market and homestead plantings.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 3: CULTIVAR ALIASES
-- ============================================================================

INSERT INTO aliases (
  alias_text,
  normalized_text,
  target_type,
  target_id,
  alias_type,
  curation_status
)
VALUES
  ('Williams', 'williams', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'bartlett'), 'former_name', 'published'),
  ('Williams Bon Chretien', 'williams bon chretien', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'bartlett'), 'former_name', 'published'),
  ('Beurre Bosc', 'beurre bosc', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'bosc'), 'foreign_name', 'published'),
  ('D''Anjou', 'd anjou', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'anjou'), 'common_name', 'published'),
  ('Beurre d''Anjou', 'beurre d anjou', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'anjou'), 'foreign_name', 'published'),
  ('Doyenne du Comice', 'doyenne du comice', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'comice'), 'foreign_name', 'published'),
  ('Summer Crisp', 'summer crisp', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'summercrisp'), 'nursery_variant', 'published'),
  ('Blakes Pride', 'blakes pride', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'blakes-pride'), 'nursery_variant', 'published'),
  ('Dan Bae', 'dan bae', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'korean-giant'), 'foreign_name', 'published'),
  ('Olympic', 'olympic', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'korean-giant'), 'trade_name', 'published'),
  ('20th Century', '20th century', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'nijisseiki'), 'common_name', 'published'),
  ('Twentieth Century', 'twentieth century', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'nijisseiki'), 'common_name', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
