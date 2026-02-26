-- ============================================================================
-- MIGRATION 016: Juglans Genus Seeding (Walnuts) + Hybrid Parentage (Buartnut)
-- Sprint 5 Phase 1: Systematic genus expansion framework
--
-- Seeds:
--   - Juglans regia (English/Persian walnut)
--   - Juglans nigra (Black walnut)
--   - Juglans cinerea (Butternut / White walnut)
--   - Juglans ailantifolia (Japanese walnut; heartnut is var. cordiformis)
--   - Juglans × bixbyi (Buartnut = J. cinerea × J. ailantifolia)
--
-- Notes:
--   - Juglone allelopathy is a critical grower trait across Juglans; strongest
--     practical impact is from black walnut (J. nigra).
--   - Pollination biology: monoecious, wind-pollinated, often dichogamous;
--     many cultivars will set some nuts alone but yields are better with overlap.
--
-- Taxonomy node ID:
--   Juglandaceae → Juglans = d0000000-0000-0000-0000-000000000005
-- ============================================================================

-- ============================================================================
-- PART 1: JUGLANS PLANT ENTITIES
-- ============================================================================

-- English / Persian Walnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'juglans-regia',
  'English Walnut',
  'Juglans regia',
  'Juglandaceae', 'Juglans', 'regia',
  'species', 'verified',
  'The classic commercial walnut of Europe and Central Asia, and the dominant orchard species worldwide. English walnut forms a large, broad-canopied tree (often 40–80+ ft in cultivation) with smooth gray bark when young and deeply furrowed bark with age. It is grown primarily for thin-shelled nuts with high kernel quality, and secondarily for valuable figured timber. In the U.S., nearly all large-scale production is concentrated in California, where late spring frost risk and disease pressure are manageable with cultivar selection and management.

For growers, the biggest practical constraints are climate fit and bloom timing. Many cultivars are vulnerable to late frost because pistillate flowers can be damaged after dormancy release; "late-leafing" cultivars reduce this risk. Walnut is also famous for juglone allelopathy (growth inhibition of sensitive plants), which matters for orchard understory design and agroforestry stacking.

Pollination is wind-driven and frequently complicated by dichogamy (male and female bloom not perfectly synchronized on the same tree). A single tree may set some nuts, but reliable yields generally require a genetically distinct pollinizer with overlapping bloom. Chill requirement varies widely by cultivar and breeding region.',
  'published',
  'd0000000-0000-0000-0000-000000000005'
) ON CONFLICT (slug) DO NOTHING;

-- Black Walnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'juglans-nigra',
  'Black Walnut',
  'Juglans nigra',
  'Juglandaceae', 'Juglans', 'nigra',
  'species', 'verified',
  'A large North American hardwood grown for both nuts and premium timber. Black walnut typically becomes a tall, straight-trunked tree on good sites, with a broad crown at maturity and a deep taproot that makes older trees difficult to transplant. Its nuts have an intensely aromatic flavor and hard shells; selected cultivars are used for nut orchards, while wild-type plantings are often managed for timber.

For growers, black walnut is the reference point for juglone allelopathy: it can suppress many understory crops and ornamental species, and it also inhibits some common orchard companions. Site selection and spacing matter, especially near gardens and mixed plantings.

Hardiness is broad (commonly reported down into zone 4 and into warm zones), but nut quality and yield are strongly influenced by heat accumulation and pollination overlap. Like other walnuts it is wind-pollinated, monoecious, and frequently dichogamous; yields improve with cross-pollination and matched bloom windows.',
  'published',
  'd0000000-0000-0000-0000-000000000005'
) ON CONFLICT (slug) DO NOTHING;

-- Butternut / White Walnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'juglans-cinerea',
  'Butternut',
  'Juglans cinerea',
  'Juglandaceae', 'Juglans', 'cinerea',
  'species', 'verified',
  'A cold-hardy North American walnut relative valued for sweet, oily nuts and light-colored wood. Butternut is typically a medium to large tree (often 40–60 ft, occasionally larger) adapted to cooler climates than black walnut, occurring naturally from southeastern Canada through the northeastern and midwestern U.S. It favors well-drained sites along stream terraces and rich woods but can also persist on rocky slopes.

The defining modern constraint is conservation: butternut has declined dramatically due to butternut canker (Ophiognomonia clavigignenti-juglandacearum), which has reduced recruitment and killed mature trees across much of its range. This makes pure butternut plantings risky in many regions unless disease pressure is low or resistant material is available.

Butternut remains important in breeding and restoration work, especially through hybrids with Japanese walnut (buartnuts) where improved canker tolerance is often reported. Like other Juglans, it is wind-pollinated and benefits from a second genotype for better nut set.',
  'published',
  'd0000000-0000-0000-0000-000000000005'
) ON CONFLICT (slug) DO NOTHING;

-- Japanese Walnut (Heartnut context in description)
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'juglans-ailantifolia',
  'Japanese Walnut',
  'Juglans ailantifolia',
  'Juglandaceae', 'Juglans', 'ailantifolia',
  'species', 'verified',
  'A hardy Asian walnut species native to Japan that produces nuts in clusters and tolerates colder climates than many English walnut cultivars. In North American horticulture it is best known for the heartnut — Juglans ailantifolia var. cordiformis — a selected form with heart-shaped nuts that crack cleanly and can yield attractive, easily extracted kernels.

Japanese walnut is relevant to growers for two reasons: (1) cold-climate nut production via heartnut selections, and (2) hybrid breeding with butternut to produce buartnuts, which are widely planted as a practical substitute where butternut canker pressure is high. Trees can be vigorous and large, and like other walnuts they are incompatible with some companion plantings due to juglone.

Pollination is primarily wind-driven. Trees are monoecious and often show timing mismatches between pollen shed and female receptivity; planting at least two distinct genotypes is the simplest path to consistent nut set.',
  'published',
  'd0000000-0000-0000-0000-000000000005'
) ON CONFLICT (slug) DO NOTHING;

-- Hybrid: Buartnut (Butternut × Japanese Walnut)
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'juglans-cinerea-x-ailantifolia',
  'Buartnut',
  'Juglans cinerea × J. ailantifolia',
  'Juglandaceae', 'Juglans', NULL,
  'hybrid_species', 'verified',
  'A hybrid walnut generally understood as Juglans cinerea (butternut) × Juglans ailantifolia (Japanese walnut). Buartnuts are planted heavily in cold climates because they can combine the cold hardiness and nut flavor direction of butternut with the vigor and often improved tolerance to butternut canker relative to pure butternut. Morphology and nut traits vary widely because many buartnuts originate from open-pollinated or complex hybrid histories.

For growers, buartnuts are often treated as the most "practical butternut": vigorous trees, good nut yields, and better survivorship where canker is common. As with other walnuts, juglone affects companion planting decisions.

Modern identification and breeding work uses molecular markers to distinguish true hybrids and introgressed material, because field traits alone are unreliable in later-generation material.',
  'published',
  'd0000000-0000-0000-0000-000000000005'
) ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PART 2: HYBRID PARENTAGE RECORDS
-- ============================================================================

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  NULL,
  'Flora of the Southeastern United States (FSUS) entry for Juglans ×bixbyi; USDA Forest Service research describing buartnut hybrids',
  'Confirmed hybrid concept parent: Juglans cinerea. Contribution % varies widely in planted material due to complex hybrid histories and backcrossing.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea')
);

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  NULL,
  'Flora of the Southeastern United States (FSUS) entry for Juglans ×bixbyi; USDA Forest Service research describing Japanese-walnut introgression markers',
  'Confirmed hybrid concept parent: Juglans ailantifolia. Contribution % varies widely; molecular work notes complex genetic history in many buartnuts.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia')
);


-- ============================================================================
-- PART 3: SPECIES GROWING PROFILES
-- ============================================================================

-- English Walnut
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  5, 9,
  'Hardiness and frost risk are cultivar-dependent; late-leafing cultivars reduce spring frost injury. Commercial suitability is strongly tied to bloom timing and disease pressure.',
  400, 1500,
  5.5, 7.5, 'well_drained', ARRAY['loam', 'sand', 'clay'],
  'full_sun', 'moderate', 3,
  40, 80, 40, 80,
  'moderate', 'taproot',
  'Southern Europe through Central Asia to the Himalayas and western China; widely cultivated globally',
  FALSE, 5, 8, 'mid', 100,
  ARRAY['Oregon State University Landscape Plants', 'Walnut chill requirement literature'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Black Walnut
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  4, 9,
  'Best nut production correlates with heat accumulation and good pollination overlap.',
  700, 1000,
  5.0, 7.5, 'well_drained', ARRAY['loam', 'sand', 'clay'],
  'full_sun', 'moderate', 4,
  50, 90, 50, 90,
  'fast', 'taproot',
  'Eastern and central North America; commonly on rich bottomlands and well-drained sites',
  FALSE, 7, 10, 'mid', 150,
  ARRAY['NC State Extension Plant Toolbox', 'Burnt Ridge Nursery'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Butternut
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  3, 7,
  'Cool-climate walnut; generally hardier than black walnut. Planting risk dominated by butternut canker pressure.',
  6.0, 7.8, 'well_drained', ARRAY['loam', 'clay', 'sand'],
  'part_shade', 'moderate', 3,
  40, 60, 30, 50,
  'moderate', 'taproot',
  'Eastern North America and southeast Canada; extends farther into cooler regions than black walnut',
  FALSE, 7, 12, 'mid', 75,
  ARRAY['Morton Arboretum', 'USDA Forest Service Silvics (Juglans cinerea)'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Japanese Walnut
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  5, 8,
  'Heartnut selections are widely planted in cold-winter regions where English walnut is marginal.',
  5.5, 7.5, 'well_drained', ARRAY['loam', 'clay', 'sand'],
  'full_sun', 'moderate', 3,
  40, 70, 35, 70,
  'fast', 'taproot',
  'Japan; introduced and planted widely in temperate regions',
  FALSE, 5, 8, 'mid', 100,
  ARRAY['Oregon State University Landscape Plants', 'PFAF'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Buartnut (hybrid)
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  4, 7,
  'Often planted as a cold-climate substitute for butternut where canker pressure is high; performance varies with hybrid history and site.',
  5.8, 7.8, 'well_drained', ARRAY['loam', 'clay', 'sand'],
  'full_sun', 'moderate', 3,
  40, 70, 35, 70,
  'fast', 'taproot',
  'Hybrid origin in cultivation; widely planted in North America',
  FALSE, 5, 10, 'mid', 100,
  ARRAY['FSUS (Juglans ×bixbyi)', 'USDA Forest Service molecular identification research'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 4: POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES
(
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  'partially_self', 'wind', 2, 200,
  'Spring; timing varies strongly by cultivar and climate.',
  'Wind-pollinated, monoecious, often dichogamous. A lone tree may set some nuts, but consistent yields usually require a second genotype with overlapping pollen shed and female receptivity.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'partially_self', 'wind', 2, 200,
  'Spring; male catkins and female flowers often not perfectly synchronized.',
  'Monoecious and wind-pollinated. Dichogamy is common; cross-pollination improves nut set and yield stability, especially in isolated plantings.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  'partially_self', 'wind', 2, 200,
  'Spring (often later than black walnut in colder regions).',
  'Wind-pollinated. Plant at least two distinct genotypes for reliable nut set. Disease pressure (butternut canker) is often the limiting factor rather than pollination.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'partially_self', 'wind', 2, 200,
  'Spring; heartnut selections may vary in bloom timing.',
  'Wind-pollinated, monoecious, commonly dichogamous. For heartnut plantings, include at least two compatible selections or seedlings to ensure overlap.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  'partially_self', 'wind', 2, 200,
  'Spring; variable by hybrid line.',
  'Wind-pollinated. Because buartnuts can have complex hybrid histories, bloom timing can be unpredictable — plant at least two unrelated trees and confirm overlap for orchard-level yields.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;
