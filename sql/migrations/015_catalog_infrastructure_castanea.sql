-- ============================================================================
-- MIGRATION 015: Catalog Infrastructure + Castanea Genus Seeding
-- Sprint 5 Phase 1: Systematic genus expansion framework
--
-- This migration does three things:
--   1. Adds taxonomy_confidence to plant_entities (verified/provisional/needs_review)
--   2. Adds data_source + confidence_note to plant_entity_parents
--   3. Seeds the Castanea genus: 6 species + 1 hybrid, growing profiles,
--      pollination profiles, and parentage records
--
-- Every record carries:
--   - taxonomy_confidence: how certain is the taxonomic placement
--   - data_sources (on growing profiles): where the numbers came from
--   - curation_status: editorial readiness
--
-- Data verified against:
--   USDA PLANTS Database, GRIN-Global, PFAF, Oregon State Extension,
--   NC State Extension, Raintree Nursery, The American Chestnut Foundation,
--   Sheffield Seeds, Route 9 Cooperative, Britannica, Nature/Heredity
--   molecular phylogenetics (Lang et al. 2007)
--
-- Genus taxonomy per Craddock & Perkins (2019):
--   Section Castanea (3 nuts/bur): C. dentata, C. mollissima, C. crenata,
--     C. sativa, C. seguinii, C. henryi
--   Section Balanocastanon (1 nut/bur): C. pumila (incl. var. ozarkensis)
--
-- Run AFTER: 002_taxonomy, 003_growing_profiles, 006_taxonomy_seed_data
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: SCHEMA ADDITIONS
-- ============================================================================

-- 1a. Taxonomy confidence enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taxonomy_confidence') THEN
    CREATE TYPE taxonomy_confidence AS ENUM ('verified', 'provisional', 'needs_review');
  END IF;
END $$;

-- 1b. Add taxonomy_confidence column to plant_entities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plant_entities' AND column_name = 'taxonomy_confidence'
  ) THEN
    ALTER TABLE plant_entities
      ADD COLUMN taxonomy_confidence taxonomy_confidence NOT NULL DEFAULT 'needs_review';
  END IF;
END $$;

COMMENT ON COLUMN plant_entities.taxonomy_confidence IS
  'verified = confirmed against USDA PLANTS/GRIN/Kew; provisional = best-guess placement; needs_review = uncertain or incomplete';

-- 1c. Add data_source to plant_entity_parents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plant_entity_parents' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE plant_entity_parents ADD COLUMN data_source TEXT;
  END IF;
END $$;

-- 1d. Add confidence_note to plant_entity_parents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plant_entity_parents' AND column_name = 'confidence_note'
  ) THEN
    ALTER TABLE plant_entity_parents ADD COLUMN confidence_note TEXT;
  END IF;
END $$;

COMMENT ON COLUMN plant_entity_parents.confidence_note IS
  'Freetext note on confidence of parentage claim. E.g. "confirmed by TACF breeding records" or "inferred from morphology, not genotyped"';

-- 1e. Backfill existing Corylus species to verified
UPDATE plant_entities
SET taxonomy_confidence = 'verified'
WHERE genus = 'Corylus';


-- ============================================================================
-- PART 2: CASTANEA PLANT ENTITIES
-- ============================================================================
-- Ordered by section, then commercial/ecological importance.
--
-- Section Castanea (3 nuts/bur): mollissima, dentata, sativa, crenata, seguinii
-- Section Balanocastanon (1 nut/bur): pumila
-- Hybrid: dentata × mollissima
--
-- Molecular phylogenetics reference (Lang et al. 2007, Heredity):
--   mollissima ↔ seguinii = 0.870 (sister species)
--   pumila var. pumila ↔ pumila var. ozarkensis = 0.931
--   dentata ↔ pumila = 0.720–0.729
--   dentata ↔ mollissima = 0.505 (intercontinental)
-- ============================================================================

-- Chinese Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-mollissima',
  'Chinese Chestnut',
  'Castanea mollissima',
  'Fagaceae', 'Castanea', 'mollissima',
  'species', 'verified',
  'The most widely planted chestnut in North America today. Chinese chestnut earned its dominance through strong resistance to chestnut blight — the fungal disease (Cryphonectria parasitica) that devastated American chestnuts in the early 1900s. Trees develop a broad, spreading crown reminiscent of a large apple tree, reaching 40–60 feet at maturity. The nuts are sweet and starchy, smaller than European varieties but produced reliably and annually — unlike most nut trees which bear heavily only every 2–3 years. Chinese chestnut tolerates a wider range of soils than most Castanea species, succeeding even on acidic, infertile sands. It requires hot summers to fruit well, performing best in zones 5–8. Cross-pollination by a genetically distinct tree within 100 feet is essential for nut set. Molecular studies show Chinese chestnut has the highest genetic variability of any Castanea species, making it the most adaptable and the most valuable parent in hybrid breeding programs.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- American Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-dentata',
  'American Chestnut',
  'Castanea dentata',
  'Fagaceae', 'Castanea', 'dentata',
  'species', 'verified',
  'Once the defining tree of eastern North American forests — a towering canopy species reaching 100 feet tall and 10 feet in diameter, producing reliable annual mast crops that fed people, livestock, and wildlife. An estimated 4 billion trees were functionally eliminated by chestnut blight (Cryphonectria parasitica), introduced near New York City around 1904 and spreading through the native range within four decades. The root systems persist: stumps continue to send up sprouts that grow 10–20 feet before the blight kills them back, a cycle that has continued for over a century. The American Chestnut Foundation''s backcross breeding program aims to restore the species by crossing blight resistance from Chinese chestnut into predominantly American genetic backgrounds. Transgenic approaches (the Darling 58 line with an oxalate oxidase gene from wheat) and CRISPR-based methods are also under development. Pure American chestnut can still be grown in the Pacific Northwest where blight pressure is low. The nuts are notably sweet and small — around 50–100 per pound.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- European Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-sativa',
  'European Chestnut',
  'Castanea sativa',
  'Fagaceae', 'Castanea', 'sativa',
  'species', 'verified',
  'The chestnut of European commerce for over two millennia — cultivated since Roman times for its large, sweet nuts and durable timber. European chestnut produces the largest nuts in the genus, with selected cultivars yielding 20–30 per pound. Trees grow to 65–100 feet with massive trunks; specimens over 500 years old are documented in Italy and Corsica. In North America, it shares American chestnut''s vulnerability to chestnut blight and is difficult to establish east of the Rockies. It performs well in the Pacific Northwest and parts of California where the climate resembles its native Mediterranean habitat. The species is susceptible to both blight and Phytophthora ink disease, though European populations have begun recovering naturally through hypovirulence — a virus that weakens the blight fungus, first observed enabling recovery in the 1950s. Many named cultivars exist in European orcharding traditions, particularly from Italy, France, and Portugal, selected for nut size, peelability, and flavor. Choice nuts called marrons come from varieties that produce a single large nut per bur.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- Japanese Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-crenata',
  'Japanese Chestnut',
  'Castanea crenata',
  'Fagaceae', 'Castanea', 'crenata',
  'species', 'verified',
  'A smaller, earlier-bearing chestnut native to Japan and Korea, valued for large nuts and strong resistance to both chestnut blight and ink disease (Phytophthora cinnamomi). Trees reach only 30–50 feet — compact enough for residential landscapes and intensive orchard plantings. Japanese chestnut produces some of the largest individual nuts in the genus, and cultivars have been selected in Japan for centuries for nut size, peelability, and sweetness. The species is central to Japanese confectionery traditions including kuri-gohan (chestnut rice) and wagashi sweets. In North America, Japanese chestnut is important primarily as a parent in hybrid breeding programs: its blight and Phytophthora resistance genes are crossed into American and Chinese backgrounds. Seedlings begin bearing in as few as 2–4 years. Some cultivars (e.g. Tsukuba) produce very little viable pollen and require careful pollinizer placement. Molecular evidence places C. crenata closer to C. mollissima than to the North American species.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- Seguin Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-seguinii',
  'Seguin Chestnut',
  'Castanea seguinii',
  'Fagaceae', 'Castanea', 'seguinii',
  'species', 'verified',
  'A small tree or large shrub native to central and southwestern China, occurring sympatrically with Chinese chestnut across much of its range. Seguin chestnut reaches about 30–40 feet and produces small nuts in spiny burs. It is not commercially cultivated for nut production but is of interest to breeders as a genetic resource — molecular studies show it is the closest wild relative of Chinese chestnut (genetic identity 0.870). The species is blight-resistant and adapted to a wide elevation range (400–2000m). In cultivation outside Asia it remains rare, with a notable specimen at Kew Gardens reaching 60 feet. Included in the PlantCommerce catalog for taxonomic completeness and to document its role in the genetic background of some hybrid breeding lines.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- Allegheny Chinkapin (Section Balanocastanon — 1 nut/bur)
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-pumila',
  'Allegheny Chinkapin',
  'Castanea pumila',
  'Fagaceae', 'Castanea', 'pumila',
  'species', 'verified',
  'The small native chestnut of the eastern United States — a large shrub or small tree reaching 15–30 feet, producing tiny but intensely sweet single nuts inside small burs. Allegheny chinkapin is more tolerant of chestnut blight than American chestnut, though not immune. It occupies drier, poorer sites than its larger cousin, often found on sandy ridges and rocky slopes from New Jersey south to Florida and west to Texas. The nuts are about the size of a hazelnut and have long been gathered as a wild food. Chinkapin is fast-growing, begins bearing young (3–5 years from seed), and suckers freely to form thickets — a trait useful in erosion control and permaculture hedgerows. Some taxonomists recognize var. ozarkensis (Ozark chinkapin) as a distinct taxon: a larger tree to 65 feet found on the Ozark plateau. Molecular analysis shows the Allegheny and Ozark forms are very closely related (genetic identity 0.931) but surprisingly distant from American chestnut (0.720–0.729).',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;

-- Chinese × American Hybrid Chestnut
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, description, curation_status,
  taxonomy_node_id
) VALUES (
  'castanea-dentata-x-mollissima',
  'Chinese × American Hybrid Chestnut',
  'Castanea dentata × C. mollissima',
  'Fagaceae', 'Castanea', NULL,
  'hybrid_species', 'verified',
  'The most commercially important chestnut hybrid in North America, combining Chinese chestnut''s blight resistance with American chestnut''s timber form, nut sweetness, and cold hardiness. These hybrids vary enormously depending on breeding generation and parentage — from compact Chinese-type orchard trees (40–60 feet) to advanced backcross selections approaching American chestnut stature. The American Chestnut Foundation''s backcross breeding program produces trees approximately 94% American chestnut genetics with blight resistance from Chinese parentage. University programs at Missouri, Penn State, and SUNY-ESF, and independent programs like Badgersett Research, have developed many named cultivars optimized for nut production, cold hardiness, or timber form. Intercontinental genetic distance between the parent species is substantial (identity ~0.505 per allozyme studies), making these true wide crosses with significant segregation in F2 and later generations.',
  'published',
  'd0000000-0000-0000-0000-000000000003'
) ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PART 3: HYBRID PARENTAGE RECORDS
-- ============================================================================

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima'),
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata'),
  NULL,
  'The American Chestnut Foundation; Craddock & Perkins 2019',
  'Confirmed. Contribution varies by generation: F1=50%, BC1=75%, BC2=87.5%, BC3≈94% C. dentata.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata')
);

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima'),
  (SELECT id FROM plant_entities WHERE slug = 'castanea-mollissima'),
  NULL,
  'The American Chestnut Foundation; Craddock & Perkins 2019',
  'Confirmed. Source of blight resistance genes. Contribution inversely proportional to C. dentata percentage.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'castanea-mollissima')
);


-- ============================================================================
-- PART 4: SPECIES GROWING PROFILES
-- ============================================================================

-- Chinese Chestnut
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-mollissima'),
  4, 8,
  'Zone 5 reliable; zone 4 experimental — late spring frost damages blossoms. Requires hot summers.',
  0, 300,
  4.5, 6.5, 'well_drained', ARRAY['sand', 'loam', 'clay'],
  'full_sun', 'moderate', 4,
  40, 60, 40, 60,
  'moderate', 'taproot',
  'China, Korea, Taiwan', FALSE,
  5, 7, 'mid', 100,
  ARRAY['PFAF, Raintree Nursery, Stark Bros, Forest Agriculture Nursery, Oregon State Extension'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- American Chestnut
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata'),
  4, 8,
  'Historically zone 4 (s. Ontario) to zone 8 (Mississippi). Blight makes eastern planting high-risk without resistant hybrids.',
  400, 800,
  4.5, 6.5, 'well_drained', ARRAY['loam', 'sand'],
  'full_sun', 'moderate', 3,
  50, 100, 50, 75,
  'fast', 'taproot',
  'Eastern North America — Maine to Michigan south to Mississippi, concentrated in Appalachians to 4000 ft',
  FALSE, 5, 8, 'mid', 200,
  ARRAY['USDA PLANTS, NC State Extension, Oregon State Extension, TACF, UMN UFOR'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- European Chestnut
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-sativa'),
  5, 7,
  'Less cold-hardy than Chinese or American. Susceptible to blight and Phytophthora. Difficult east of the Rockies.',
  400, 700,
  5.0, 7.0, 'well_drained', ARRAY['loam', 'sand'],
  'full_sun', 'moderate', 3,
  65, 100, 50, 80,
  'fast', 'taproot',
  'Southern Europe, North Africa, southwestern Asia — naturalized in British Isles since Roman times',
  FALSE, 5, 8, 'mid', 150,
  ARRAY['PFAF, Oregon State Extension, Raintree Nursery, Britannica'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Japanese Chestnut
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-crenata'),
  4, 8,
  'Hardy to zone 4. Resistant to blight and ink disease (Phytophthora cinnamomi). Tolerates heat and humidity.',
  300, 600,
  4.5, 6.5, 'well_drained', ARRAY['sand', 'loam', 'clay'],
  'full_sun', 'moderate', 3,
  30, 50, 25, 40,
  'moderate', 'taproot',
  'Japan and Korea — cultivated in eastern China and Taiwan',
  FALSE, 2, 4, 'mid', 80,
  ARRAY['PFAF, Wikipedia, Gardenia.net, Sheffield Seeds, Trees & Shrubs Online'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Seguin Chestnut
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max, usda_zone_notes,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'castanea-seguinii'),
  6, 9,
  'Zone 6 per Trees & Shrubs Online. Prefers warm, wet summers. Rare in cultivation outside Asia.',
  5.0, 6.5, 'well_drained', ARRAY['loam'],
  'part_shade', 'moderate', 3,
  30, 40,
  'moderate', 'taproot',
  'Central/SW China — Anhui to Yunnan, 400–2000m elevation',
  FALSE, 5, 8, 'mid',
  ARRAY['Trees & Shrubs Online, Wikispecies, Flora of China, Lang et al. 2007'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Allegheny Chinkapin
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-pumila'),
  5, 9,
  'More heat-tolerant than American chestnut. Found naturally on dry, poor sites. Some blight tolerance.',
  300, 600,
  4.5, 6.5, 'well_drained', ARRAY['sand', 'loam'],
  'part_shade', 'low', 4,
  15, 30, 10, 20,
  'fast', 'spreading',
  'Eastern US — New Jersey to Florida, west to Texas. var. ozarkensis on Ozark plateau.',
  FALSE, 3, 5, 'mid', 60,
  ARRAY['USDA PLANTS, PFAF, Route 9 Cooperative, Lang et al. 2007'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- Chinese × American Hybrid
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
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima'),
  5, 9,
  'Most reliable zone 5+. Some advanced backcross selections pushing into zone 4. Variable by cross.',
  200, 400,
  5.0, 6.5, 'well_drained', ARRAY['loam', 'sand', 'clay'],
  'full_sun', 'moderate', 3,
  40, 60, 30, 40,
  'fast', 'taproot',
  'Hybrid origin — US breeding programs (TACF, U. Missouri, Penn State, SUNY-ESF, Badgersett)',
  FALSE, 3, 5, 'mid', 80,
  ARRAY['TACF, Tristar Plants, Gardener''s Path, Raintree Nursery, Route 9 Cooperative'],
  'published'
) ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 5: POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-mollissima'),
  'monoecious_cross', 'both', 2, 100,
  'Early–mid summer (June–July). Heavy musky catkin fragrance.',
  'Monoecious but largely self-sterile. Plant 2+ cultivars within 100 ft. Wind + insect pollinated. Match bloom windows.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata'),
  'monoecious_cross', 'both', 2, 100,
  'Late June–early July in Appalachians. Later at higher elevations.',
  'Monoecious, self-sterile. Historically pollinated in dense forest stands. Isolated trees will not set nuts.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-sativa'),
  'monoecious_cross', 'both', 2, 100,
  'June–July. Profuse catkins.',
  'Largely self-sterile. Some cultivars partially self-fertile but yields improve dramatically with cross-pollination.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-crenata'),
  'monoecious_cross', 'both', 2, 100,
  'Early summer. Some cultivars produce little viable pollen.',
  'Self-sterile. Some cultivars (e.g. Tsukuba) produce very little viable pollen — plan pollinizer placement carefully.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-seguinii'),
  'monoecious_cross', 'both', 2, 65,
  'May–July in native range (400–2000m).',
  'Presumably self-sterile like all Castanea. Limited cultivation data. Flowers May–Jul, fruit Sept–Nov.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-pumila'),
  'monoecious_cross', 'both', 2, 65,
  'Late spring–early summer. Slightly earlier than C. dentata where ranges overlap.',
  'Self-sterile. Suckers freely forming clonal thickets (single genotype) — needs genetically distinct individual nearby.'
),
(
  (SELECT id FROM plant_entities WHERE slug = 'castanea-dentata-x-mollissima'),
  'monoecious_cross', 'both', 2, 100,
  'Early–mid summer. Variable by generation and parentage.',
  'Cross-pollination required. Plant 2+ unrelated seedlings/cultivars. Confirm bloom overlap before planting.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 6: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;


-- ============================================================================
-- POST-DEPLOY VERIFICATION
-- ============================================================================
--
-- 1. SELECT slug, canonical_name, taxonomy_confidence FROM plant_entities
--    WHERE genus = 'Castanea' ORDER BY canonical_name;
--    → 7 rows, all 'verified'
--
-- 2. SELECT pe.canonical_name, sgp.usda_zone_min, sgp.usda_zone_max
--    FROM species_growing_profiles sgp
--    JOIN plant_entities pe ON pe.id = sgp.plant_entity_id
--    WHERE pe.genus = 'Castanea' ORDER BY pe.canonical_name;
--    → 7 rows with zone data
--
-- 3. SELECT h.canonical_name, p.canonical_name, pep.confidence_note
--    FROM plant_entity_parents pep
--    JOIN plant_entities h ON h.id = pep.hybrid_id
--    JOIN plant_entities p ON p.id = pep.parent_id;
--    → 2 rows (dentata + mollissima as parents of hybrid)
--
-- 4. SELECT taxonomy_confidence, count(*) FROM plant_entities
--    GROUP BY taxonomy_confidence;
--    → verified: 14 (7 Corylus + 7 Castanea), needs_review: 0
--
-- 5. Explorer /browse should show:
--    BETULACEAE → Corylus → [7 hazelnut species]
--    FAGACEAE   → Castanea → [7 chestnut species]

COMMIT;

