-- ============================================================================
-- MIGRATION 020: Corylus Genus Completion (Hazelnuts & Filberts)
-- Sprint 5 Phase 2 — Backfill of the original Wave 1 pilot genus
--
-- Context: 6 Corylus plant_entities were seeded in deploy_wave1_complete.sql
-- (the original hazelnut pilot) but received no growing or pollination profiles.
-- This migration completes the genus by adding all missing data.
--
-- What this migration does:
--   1. INSERT growing profiles for corylus-heterophylla + corylus-avellana-x-americana
--      (other 4 already have growing profiles — ON CONFLICT DO NOTHING covers all 6)
--   2. INSERT pollination profiles for all 6 existing entities
--   3. INSERT parentage records for corylus-avellana-x-americana
--   4. INSERT new plant_entity for C. maxima (Giant Hazelnut/Filbert) — missing from Wave 1,
--      needed as parent species for many large-nut cultivars and hybrids
--   5. INSERT growing + pollination profiles for C. maxima
--   6. INSERT new plant_entity corylus-americana-x-cornuta-x-avellana (Neohybrid) —
--      Badgersett triple-species hybrid; the neohybrid-hazelnut cultivar currently
--      has NULL plant_entity_id, leaving it detached from the knowledge graph
--   7. INSERT growing + pollination profiles for the Neohybrid entity
--   8. UPDATE neohybrid-hazelnut cultivar to point to the new entity
--   9. REFRESH MATERIALIZED VIEW material_search_index
--      (no CONCURRENTLY — fails via MCP apply_migration endpoint in practice)
--
-- Taxonomy node ID:
--   Betulaceae → Corylus = d0000000-0000-0000-0000-000000000001
--
-- Data verified against:
--   USDA PLANTS Database, GRIN-Global, OSU Hazelnut Research Program,
--   Grimo Nut Nursery catalog, Rutgers Hazelnut Program, Badgersett Research Corp,
--   NRCS Plant Guide (Corylus americana), NC State Extension,
--   Roger Leakey "Multifunctional Agriculture", Agroforestry Research Trust
--
-- Run AFTER: 015a_species_pollination_profiles
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD MISSING PLANT ENTITIES
-- ============================================================================

-- C. maxima: Giant Hazelnut / Giant Filbert
-- Source of large-nut commercial cultivars; some taxonomists treat as C. avellana
-- subsp. maxima, others as a distinct species. Used here as 'provisional' because
-- of ongoing taxonomic debate, but commercially distinct enough to warrant its
-- own entity — several Grimo and European cultivars explicitly reference C. maxima.
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'corylus-maxima',
  'Giant Hazelnut',
  'Corylus maxima',
  'Betulaceae', 'Corylus', 'maxima',
  'species', 'provisional',
  'd0000000-0000-0000-0000-000000000001',
  'The Giant Hazelnut or Giant Filbert of southeastern Europe and southwestern Asia — the species behind Turkey''s dominance in global hazelnut production. C. maxima produces larger nuts than C. avellana and has a more prominent involucre (husk) that extends well beyond the nut, forming a tubular "beak." It typically grows as a large shrub or small tree to 20 feet. Its taxonomic status is debated: some authorities treat it as Corylus avellana subsp. maxima, while others maintain it as a distinct species. For our purposes, commercial relevance justifies a separate entity, as many cultivars explicitly reference C. maxima parentage and several breeding programs (particularly in Turkey and SE Europe) work with it as distinct genetic material.

In North American permaculture and agroforestry, C. maxima is primarily encountered through cultivars — notably in Grimo Nut Nursery catalog entries referencing "large-nut Turkish filbert" parentage and in some Rutgers/HHRC crosses. Pure C. maxima selections are rarely sold as species-level plants in North America; the species is most commercially significant in Turkey and SE Europe.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- Corylus americana × cornuta × avellana (Badgersett Neohybrid)
-- Multi-generation triple-species hybrid developed by Badgersett Research Corp
-- since 1978. The neohybrid-hazelnut cultivar currently has NULL plant_entity_id;
-- creating this entity reattaches it to the knowledge graph.
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'corylus-neohybrid',
  'NeoHybrid Hazelnut',
  'Corylus americana × cornuta × avellana',
  'Betulaceae', 'Corylus', NULL,
  'hybrid_species', 'provisional',
  'd0000000-0000-0000-0000-000000000001',
  'The Badgersett NeoHybrid is a multi-generation triple-species hybrid of C. americana, C. cornuta, and C. avellana, developed by Badgersett Research Corporation in Canton, Minnesota since 1978. It represents one of the longest-running hazelnut domestication programs in North America. Unlike single-cross hybrids, NeoHybrid material is a breeding population — plants sold as "NeoHybrid" are genetically variable seedlings, not clones — selected across multiple cycles for cold hardiness, eastern filbert blight (EFB) resistance, and nut quality in continental climates.

The program produces four rough material tiers: machine-picked (open-pollinated, unselected), Standard, Select, and Experimental Mediums and Larges (the highest breeding tier, sold at premium). Badgersett''s core thesis is that a multi-species hybrid population, selected over generations, will eventually yield cultivar-quality genetics better adapted to the upper Midwest than any single-species C. avellana program. As of the mid-2020s, some Experimental selections are approaching commercial quality. EFB resistance in NeoHybrid material comes primarily from C. americana and C. cornuta parentage.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: GROWING PROFILES (all 8 entities — ON CONFLICT DO NOTHING)
-- ============================================================================

-- corylus-americana
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  4, 9, 5.5, 7.0, 'well_drained', ARRAY['loam', 'sandy_loam', 'clay_loam'],
  'full_sun', 'moderate', 3,
  8.0, 16.0, 8.0, 16.0,
  'moderate', 'suckering',
  'Eastern and central North America: Maine to Saskatchewan south to Georgia, Kansas, and Oklahoma. Found in forest edges, thickets, and disturbed ground.',
  false, false,
  ARRAY['ruffed_grouse', 'pheasant', 'wild_turkey', 'deer', 'squirrel', 'chipmunk'],
  'Important wildlife mast crop. Forms thickets via suckering; useful for erosion control and hedgerows. EFB-resistant (eastern strains) compared to C. avellana.',
  3, 5, 40,
  'mid_late', 'published',
  ARRAY['USDA PLANTS Database', 'NRCS Plant Guide', 'OSU Extension', 'Dirr Manual of Woody Landscape Plants']
FROM plant_entities pe WHERE pe.slug = 'corylus-americana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-avellana
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  4, 8, 5.5, 7.5, 'well_drained', ARRAY['loam', 'sandy_loam', 'silt_loam', 'clay_loam'],
  'full_sun', 'moderate', 3,
  10.0, 20.0, 10.0, 18.0,
  'moderate', 'suckering',
  'Europe and western Asia. Naturalized widely in the Pacific Northwest (Oregon/Washington) where commercial production is centered.',
  false, false,
  3, 5, 50,
  'mid_late', 'published',
  ARRAY['USDA PLANTS Database', 'OSU Hazelnut Research Program', 'GRIN-Global', 'Grimo Nut Nursery catalog']
FROM plant_entities pe WHERE pe.slug = 'corylus-avellana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-colurna
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  4, 7, 5.5, 7.5, 'well_drained', ARRAY['loam', 'sandy_loam', 'clay'],
  'full_sun', 'low', 4,
  40.0, 70.0, 20.0, 35.0,
  'moderate', 'taproot',
  'SE Europe and SW Asia: Balkans through Turkey to the Himalayas. The only tree-form hazel.',
  false, false,
  'The sole Corylus species with a true taproot and single-trunk tree form. Widely used as a non-suckering rootstock for commercial C. avellana production. Contributes cold hardiness and drought tolerance to hybrids. Grand Traverse hazelnut has 25% C. colurna genetics.',
  5, 8, 100,
  'mid_late', 'published',
  ARRAY['USDA PLANTS Database', 'Dirr Manual', 'Grimo Nut Nursery catalog', 'OSU Extension']
FROM plant_entities pe WHERE pe.slug = 'corylus-colurna'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-cornuta (Beaked Hazelnut)
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  3, 7, 4.5, 7.0, 'well_drained', ARRAY['loam', 'sandy_loam', 'sandy'],
  'part_shade', 'moderate', 3,
  6.0, 12.0, 6.0, 10.0,
  'moderate', 'suckering',
  'Transcontinental North America: Newfoundland to British Columbia, south to Georgia and California in two disjunct varieties (var. cornuta east, var. californica west).',
  false, false,
  ARRAY['ruffed_grouse', 'wild_turkey', 'squirrel', 'chipmunk', 'deer'],
  'Most cold-hardy Corylus species in North America. Important component in Badgersett NeoHybrid program for cold tolerance and EFB resistance. Involucre forms a distinctive elongated beak enclosing the nut.',
  3, 5, 40,
  'mid_late', 'published',
  ARRAY['USDA PLANTS Database', 'NRCS Plant Guide', 'Badgersett Research Corporation', 'OSU Extension']
FROM plant_entities pe WHERE pe.slug = 'corylus-cornuta'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-heterophylla (Asian Hazelnut)
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  3, 8, 5.0, 7.5, 'well_drained', ARRAY['loam', 'sandy_loam', 'silt_loam'],
  'full_sun', 'moderate', 3,
  10.0, 18.0, 8.0, 15.0,
  'moderate', 'suckering',
  'NE China, Korea, Japan, and Siberia. Widely grown in Manchuria and northern China for nut production.',
  false, false,
  'Used extensively by Grimo Nut Nursery as a source of cold hardiness for Canadian hazelnut breeding. The "Northern Hazel" populations sold by Grimo (Asian/Quebec, Saskatchewan, Wisconsin sources) are C. heterophylla-derived. Contributes significant zone 3 tolerance to hybrids — important for Canadian and upper-Midwest growers.',
  3, 5, 40,
  'mid_late', 'published',
  ARRAY['USDA PLANTS Database', 'GRIN-Global', 'Grimo Nut Nursery catalog', 'OSU Extension']
FROM plant_entities pe WHERE pe.slug = 'corylus-heterophylla'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-avellana-x-americana
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  4, 8, 5.5, 7.0, 'well_drained', ARRAY['loam', 'sandy_loam', 'clay_loam'],
  'full_sun', 'moderate', 3,
  8.0, 16.0, 8.0, 14.0,
  'moderate', 'suckering',
  'Cultivated hybrid; no natural range. Developed primarily by Rutgers University (NJ), OSU (OR), and Hybrid Hazelnut Research Consortium programs.',
  false, false,
  'Combines C. avellana nut quality with C. americana EFB resistance and cold hardiness. The Rutgers HHRC program (The Beast, Somerset) represents the frontier of this cross. Intermediate in most traits between parents. Broad-spectrum EFB resistance is the primary trait being selected for in eastern growing regions.',
  3, 4, 50,
  'mid_late', 'published',
  ARRAY['Rutgers Hazelnut Program', 'OSU Hazelnut Research Program', 'Hybrid Hazelnut Research Consortium', 'USDA PLANTS Database']
FROM plant_entities pe WHERE pe.slug = 'corylus-avellana-x-americana'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-maxima
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  5, 8, 5.5, 7.5, 'well_drained', ARRAY['loam', 'silt_loam', 'sandy_loam'],
  'full_sun', 'moderate', 3,
  12.0, 20.0, 10.0, 16.0,
  'moderate', 'suckering',
  'SE Europe and SW Asia: Balkans, Turkey, Caucasus, northern Iran. Center of commercial production is Black Sea coast of Turkey.',
  false, false,
  3, 5, 60,
  'mid_late', 'draft',
  ARRAY['USDA PLANTS Database', 'GRIN-Global', 'FAO Hazelnut Production Statistics', 'Grimo Nut Nursery catalog']
FROM plant_entities pe WHERE pe.slug = 'corylus-maxima'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- corylus-neohybrid
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft, mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
)
SELECT pe.id,
  3, 7, 5.0, 7.5, 'moderate', ARRAY['loam', 'clay_loam', 'sandy_loam'],
  'full_sun', 'moderate', 4,
  8.0, 15.0, 8.0, 15.0,
  'moderate', 'suckering',
  'Cultivated hybrid. Developed at Badgersett Research Corporation, Canton, Minnesota since 1978. Adapted to upper Midwest continental climate conditions.',
  false, false,
  'Unlike clone-based cultivars, NeoHybrid is sold as a breeding population — genetically variable seedlings selected over multiple generations. Material tiers (Standard → Select → Experimental) reflect breeding advancement. The target traits are EFB resistance, cold hardiness to zone 3, mechanized harvest compatibility, and nut quality. As a suckering population planting, NeoHybrid hedges fulfill multiple agroforestry roles: windbreak, biomass, wildlife corridor, and nut production.',
  3, 6, 40,
  'mid_late', 'draft',
  ARRAY['Badgersett Research Corporation', 'Agroforestry Research Trust', 'USDA NRCS Agroforestry Notes']
FROM plant_entities pe WHERE pe.slug = 'corylus-neohybrid'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: POLLINATION PROFILES (all 8 entities)
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-americana'),
  'partially_self', 'wind', 1, 100,
  'Very early spring — January to March in zone 5-6, before any other woody plant flowers.',
  'Self-fertile to a degree but cross-pollination with a distinct genotype significantly improves yield and nut fill. Catkins (male) release pollen in cold weather before leaves emerge; tiny red pistillate flowers on the same branches receive pollen. Standard recommendation is to plant at least 2 genetically distinct individuals within 100 ft. EFB-resistant in eastern North American strains — an important trait for the continental eastern US market.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana'),
  'partially_self', 'wind', 1, 100,
  'Very early spring — January to March in zone 6-7, often during frost periods.',
  'Most commercial cultivars are partially to nearly fully self-sterile due to S-allele incompatibility. S-allele matching is critical: two cultivars with the same S-alleles cannot cross-pollinate each other. OSU publishes S-allele tables for all named releases. Standard practice is to plant 2+ cultivars with non-overlapping S-alleles. Catkins release pollen before leaves; pistillate flowers are inconspicuous red tufts. Wind is the sole vector — no insect pollinators required or effective. The EFB pathogen (Anisogramma anomala) infects via catkins in exactly this bloom window, making bloom timing a key factor in disease management.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-colurna'),
  'partially_self', 'wind', 1, 150,
  'Very early spring — January to February in zones 5-6; earlier than C. avellana.',
  'More self-fertile than shrub hazel species. Often used as a rootstock for commercial C. avellana production because it is non-suckering (taproot form) and highly compatible. As a pollinizer for C. avellana, bloom timing overlap must be verified by cultivar — Turkish tree hazel blooms very early. Long catkins make it an effective pollen donor when timing aligns. Grand Traverse hazelnut (25% C. colurna) inherits some of its cold hardiness and taproot tendency.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-cornuta'),
  'cross_required', 'wind', 1, 100,
  'Very early spring — February to April depending on latitude; slightly later than C. avellana.',
  'Self-incompatible. Requires a genetically distinct plant for fruit set. Plants from different geographic origins (var. cornuta vs var. californica) may have limited pollen compatibility. Most commonly encountered in agroforestry as a component of the Badgersett NeoHybrid program, where its primary contributions are cold tolerance and EFB resistance, not direct nut production. The elongated tubular husk (beak) that gives this species its common name is absent from most commercial hybrids it contributes to.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-heterophylla'),
  'partially_self', 'wind', 1, 100,
  'Very early spring — February to March; adapted to continental cold-climate bloom windows.',
  'Partially self-fertile; cross-pollination improves yield and nut quality. Catkin structure and bloom biology similar to C. avellana. Compatible as a pollinizer with C. avellana hybrids in cold-climate breeding programs — Grimo uses C. heterophylla-derived material (Northern Hazel) alongside C. avellana cultivars. Bloom timing in zone 3-5 is generally well-synchronized with other Corylus species, making it a reliable contributor in multi-species plantings.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana-x-americana'),
  'cross_required', 'wind', 1, 100,
  'Very early spring — January to March in zones 4-7.',
  'Self-incompatible. Must be cross-pollinated with a genetically distinct individual — same-cultivar grafted trees are clones and cannot pollinate each other. Rutgers HHRC recommends planting at least 2 different named selections (e.g., The Beast + Somerset) within 100 ft. S-allele data for HHRC cultivars is being developed by Rutgers. C. avellana cultivars with compatible bloom timing can serve as pollinizers. OSU releases with appropriate S-alleles also cross-pollinate effectively with avellana x americana hybrids. EFB resistance in these hybrids is the defining commercial advantage for eastern growers.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-maxima'),
  'partially_self', 'wind', 1, 100,
  'Very early spring — January to March in zones 5-8.',
  'Pollination biology closely parallels C. avellana. Partially self-sterile; commercial production requires pollinizers. In Turkey, mixed orchards with multiple varieties are standard. S-allele incompatibility data exists for some Turkish commercial varieties but is less comprehensively documented than OSU releases. In North America, C. maxima primarily appears as a parentage note in cultivar descriptions (e.g., Grimo''s "large-nut" selections) rather than as a directly cultivated species.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid'),
  'cross_required', 'wind', 1, 100,
  'Very early spring — January to March; variable within population due to genetic diversity.',
  'Self-incompatible as a population. Because NeoHybrid plants are genetically variable seedlings (not clones), two plants from different packets are typically genetically distinct and will cross-pollinate each other — this is by design. Badgersett recommends planting groups of 5-10+ plants to ensure adequate genetic diversity for cross-pollination. Bloom timing is variable within the population, which extends the effective pollen window. C. americana and C. cornuta parentage contributes cold hardiness to bloom timing, ensuring catkins are not destroyed by late frosts in continental climates.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: HYBRID PARENTAGE
-- ============================================================================

-- corylus-avellana-x-americana parents
INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana-x-americana'),
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana'),
  NULL,
  'Rutgers Hazelnut Program; OSU Hazelnut Research Program; HHRC',
  'C. avellana contributes nut quality, shell characteristics, and yield. Contribution percent varies by individual selection.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana-x-americana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana')
);

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana-x-americana'),
  (SELECT id FROM plant_entities WHERE slug = 'corylus-americana'),
  NULL,
  'Rutgers Hazelnut Program; OSU Hazelnut Research Program; HHRC',
  'C. americana contributes EFB resistance and cold hardiness (zones 4-9 native range). Contribution percent varies by selection.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana-x-americana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-americana')
);

-- corylus-neohybrid parents (all 3)
INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid'),
  (SELECT id FROM plant_entities WHERE slug = 'corylus-americana'),
  NULL,
  'Badgersett Research Corporation; Philip Rutter breeding records',
  'One of 3 founding species. Contributes EFB resistance and eastern North American adaptation.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-americana')
);

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid'),
  (SELECT id FROM plant_entities WHERE slug = 'corylus-cornuta'),
  NULL,
  'Badgersett Research Corporation; Philip Rutter breeding records',
  'One of 3 founding species. Contributes cold hardiness to zone 3 and EFB resistance.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-cornuta')
);

INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid'),
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana'),
  NULL,
  'Badgersett Research Corporation; Philip Rutter breeding records',
  'One of 3 founding species. Contributes nut quality, size, and commercial viability traits.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana')
);

-- ============================================================================
-- PART 5: REATTACH NEOHYBRID CULTIVAR TO NEW PLANT ENTITY
-- ============================================================================

UPDATE cultivars
SET plant_entity_id = (SELECT id FROM plant_entities WHERE slug = 'corylus-neohybrid'),
    updated_at = now()
WHERE slug = 'neohybrid-hazelnut'
  AND plant_entity_id IS NULL;

-- ============================================================================
-- PART 6: REFRESH SEARCH INDEX
-- ============================================================================

-- material_search_index has a unique index (idx_material_search_entity on
-- index_source + entity_id), so CONCURRENTLY is safe here.
REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
