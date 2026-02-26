-- Migration: 017_genus_carya.sql
-- Genus: Carya (Hickories & Pecans)
-- Date: 2026-02-26
-- Species count: 4 species + 1 hybrid group
-- Sources: USDA PLANTS, USDA Forest Service Silvics, PFAF, GRIN-Global/NCGR-Carya,
--          Clemson Extension, Noble Research Institute, UGA Pecan Breeding, NC State Extension,
--          Morton Arboretum, Flora of the Southeastern US
-- Pipeline step: 2 (Write SQL Migration)

-- ============================================================================
-- PART 1: plant_entities
-- ============================================================================

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'carya-illinoinensis',
  'Pecan',
  'Carya illinoinensis',
  'Juglandaceae', 'Carya', 'illinoinensis',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000006',
  'Carya illinoinensis is the largest member of the hickory genus and the most commercially significant nut tree native to North America. Indigenous to the Mississippi River floodplain from Iowa south through Texas and into the river valleys of northern Mexico, pecan has been cultivated since at least 1846 and now anchors a multi-billion-dollar industry centered in Georgia, Texas, and New Mexico. The tree is monoecious and wind-pollinated with dichogamous flowering — cultivars are classified as Type I (protandrous, pollen sheds before female flowers are receptive) or Type II (protogynous, female flowers receptive first) — making it essential to interplant complementary types within 200 feet for reliable nut set. A single catkin can produce over 2.6 million pollen grains, but cross-pollination yields larger, higher-quality kernels than selfing.

Pecan is a fast-growing bottomland species that thrives on deep, well-drained alluvial soils but struggles on heavy clay flats. Mature specimens routinely exceed 100 feet in height with spreads of 40-70 feet and productive lifespans of 150-300 years. The trees are alternate bearing, producing heavy crops one year followed by lighter yields the next. Like all Juglandaceae, pecan produces juglone, though in much smaller quantities than black walnut. Northern-adapted cultivars like Kanza and Pawnee have pushed reliable production into USDA zone 5, though nut fill remains inconsistent where summers are short and cool. Pecan scab (Cladosporium effusum) is the most serious disease limiting production in humid southeastern climates.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'carya-ovata',
  'Shagbark Hickory',
  'Carya ovata',
  'Juglandaceae', 'Carya', 'ovata',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000006',
  'Carya ovata is the most recognizable of the true hickories, distinguished by its loose, shaggy bark plates that peel away from the trunk in long, tough curls. Distributed from southeastern Minnesota and southern Maine south to Georgia, Alabama, and eastern Texas — with disjunct populations reaching Michoacán and Veracruz in Mexico — shagbark hickory is a diploid (n=16) upland species that reaches greatest abundance on deep, rich, moist soils but tolerates drier sites better than any other edible hickory. Two recognized varieties exist: var. ovata across most of the range, and var. australis (Carolina hickory) in the southeastern mountains. The species hybridizes naturally with shellbark hickory (C. × dunbarii), bitternut (C. × laneyi), and pecan, producing named cultivars in all three cross combinations.

Shagbark hickory nuts are the primary hickory nut of commerce, prized for their sweet, rich flavor. Grafted cultivars begin bearing in 5-6 years, compared to 10-15+ years for seedling trees, though most named selections are grafted onto pecan rootstock. The species is extremely long-lived (200-300 years), slow-growing, and notoriously difficult to transplant due to its aggressive taproot. For permaculture systems, shagbark''s late leaf emergence and early leaf drop make it an excellent overstory companion. The wood is legendary for its strength, shock resistance, and smoke flavor.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'carya-laciniosa',
  'Shellbark Hickory',
  'Carya laciniosa',
  'Juglandaceae', 'Carya', 'laciniosa',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000006',
  'Carya laciniosa produces the largest nut of any hickory — sweet, thick-shelled, and eagerly harvested by both wildlife and people. Also called kingnut, big shellbark, and bottom shellbark, this diploid (n=16) species ranges from western New York through southern Michigan to southeastern Iowa, south through eastern Kansas into northern Oklahoma, and eastward through Tennessee into Pennsylvania. Unlike the upland-adapted shagbark, shellbark hickory is fundamentally a bottomland tree, reaching its best development on river terraces and second bottoms where soils are deep, fertile Alfisols subject to brief spring flooding. It requires moister conditions than shagbark, pignut, or mockernut hickories.

Shellbark hickory is slow-growing, long-lived, and shares the transplant difficulty common to all hickories due to its deep taproot. The species hybridizes with pecan (C. × nussbaumeri), shagbark (C. × dunbarii), and bitternut, and several named hican cultivars — most notably James and McAllister — derive from shellbark-pecan crosses. For permaculture designers, shellbark fills a niche shagbark cannot: productive nut trees for wet bottomland sites, riparian buffers, and flood-tolerant food forests.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'carya-cordiformis',
  'Bitternut Hickory',
  'Carya cordiformis',
  'Juglandaceae', 'Carya', 'cordiformis',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000006',
  'Carya cordiformis is the most abundant and uniformly distributed hickory in eastern North America, ranging from southwestern New Hampshire and southern Quebec west to central Michigan and northern Minnesota, south to eastern Texas and northwestern Florida. It is a pecan-group hickory (Section Apocarya) and a diploid (n=16), making it interfertile with pecan, shagbark, shellbark, and other diploid Carya species. Bitternut is the fastest-growing and shortest-lived hickory (approximately 200 years), identifiable year-round by its distinctive sulfur-yellow buds — a trait unique among all North American trees.

The nuts are thin-shelled but intensely bitter and astringent. While not a food crop, bitternut hickory holds significant value in permaculture systems as a timber tree, biomass producer, native ecosystem anchor, and smoking wood. Bitternut tolerates a wider range of sites than most hickories, occurring on rich loamy bottomlands, gravelly stream borders, and dry uplands alike. It hybridizes naturally with pecan (C. × brownii), pignut (C. × demareei), and shagbark (C. × laneyi). As a host plant for luna moth and other Lepidoptera it provides significant habitat value.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'carya-x-hican',
  'Hican',
  'Carya × (hybrid group)',
  'Juglandaceae', 'Carya', NULL,
  'hybrid_species', 'verified',
  'd0000000-0000-0000-0000-000000000006',
  'Hicans are interspecific hybrids between pecan (Carya illinoinensis) and various true hickory species — the portmanteau of HIckory and peCANs. The commercially propagated hicans are clonal selections combining the thin shell and large kernel of pecan with the cold-hardiness and rich flavor of hickory. The parentage of named hicans varies — James is a pecan × shellbark cross (C. × nussbaumeri), Burton is one of the best-tasting selections, and various unnamed seedlings derive from pecan × shagbark or pecan × bitternut crosses. Each seedling is genetically unique.

Hicans typically grow 60-100 feet tall with intermediate characteristics. They are notably cold-hardy — Nutcracker Nursery in southern Quebec reports tolerance to -30°C (zone 4b), extending pecan-quality nut production far north of pecan''s reliable commercial range. Pollination is complex and production erratic. Hicans are anecdotally hyper-attractive to pecan weevils. Despite these challenges, hicans occupy a genuine niche in small farm orchards and food forests, producing a rare nut product with a flavor profile described as 80% hickory richness with 20% pecan butteriness.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PART 2: plant_entity_parents
-- ============================================================================

-- Hican: pecan is always one parent; non-pecan parent varies by cultivar
INSERT INTO plant_entity_parents (
  hybrid_id, parent_id, contribution_percent, data_source, confidence_note
)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'carya-x-hican'),
  (SELECT id FROM plant_entities WHERE slug = 'carya-illinoinensis'),
  NULL,
  'USDA NCGR-Carya species list; Wikipedia Hican article; Rock Bridges Trees hican documentation',
  'Pecan is always one parent in hican crosses. The other parent varies by cultivar — shellbark (C. × nussbaumeri for James, McAllister), shagbark (unnamed cross for many seedling hicans), or bitternut (C. × brownii). Contribution percent is NULL because it varies by specific cross and individual. When specific hican cultivars are added, they will get their own parentage records pointing to the specific hickory parent species.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'carya-x-hican')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'carya-illinoinensis')
);


-- ============================================================================
-- PART 3: species_growing_profiles
-- ============================================================================

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-illinoinensis'),
  5, 9, 100, 1000, 6.0, 7.0,
  'well_drained', ARRAY['sandy_loam','loam','silt_loam'],
  'full_sun', 'high', 2,
  70.0, 100.0, 40.0, 70.0,
  'moderate', 'taproot',
  'Mississippi River floodplain from Iowa to eastern Texas and into northern Mexico. Disjunct populations in southwestern Ohio, northern Kentucky, and central Alabama.',
  false, 4, 8, 'mid', 300,
  ARRAY['USDA Forest Service Silvics Vol. 2','PFAF','Clemson Extension HGIC','UGA Pecan Breeding','Noble Research Institute'],
  'draft'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-ovata'),
  4, 8, 5.5, 7.5,
  'well_drained', ARRAY['sandy','sandy_loam','loam','clay_loam','clay'],
  'part_shade', 'moderate', 3,
  70.0, 90.0, 50.0, 70.0,
  'slow', 'taproot',
  'Southeastern Nebraska and southeastern Minnesota through southern Ontario and southern Quebec to southern Maine, south to central Georgia, eastern Texas, eastern Kansas. Disjunct populations in Michoacán and Veracruz, Mexico.',
  false, 10, 40, 'mid', 300,
  ARRAY['USDA Forest Service Silvics Vol. 2 (Graney 1990)','USDA FEIS','NC State Extension','Lady Bird Johnson Wildflower Center','PFAF'],
  'draft'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-laciniosa'),
  4, 8, 5.5, 7.5,
  'tolerates_wet', ARRAY['loam','silt_loam','clay_loam'],
  'part_shade', 'high', 2,
  60.0, 100.0, 30.0, 60.0,
  'slow', 'taproot',
  'Western New York through southern Michigan to southeastern Iowa, south through eastern Kansas into northern Oklahoma, eastward through Tennessee into Pennsylvania. Rare at range edges.',
  false, 10, 20, 'mid', 250,
  ARRAY['USDA Forest Service Silvics Vol. 2 (Schlesinger)','NC State Extension','PFAF','Food Forest Nursery'],
  'draft'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-cordiformis'),
  4, 9, 5.5, 7.5,
  'moderate', ARRAY['sandy','loam','clay_loam','clay'],
  'part_shade', 'moderate', 2,
  50.0, 80.0, 30.0, 50.0,
  'moderate', 'taproot',
  'Southwestern New Hampshire, Vermont, and southern Quebec west to southern Ontario, central Michigan, and northern Minnesota, south to eastern Texas and northwestern Florida.',
  false, 15, 25, 'mid', 200,
  ARRAY['USDA Forest Service Silvics Vol. 2 (Smith 1990)','USDA FEIS','Morton Arboretum','Lady Bird Johnson Wildflower Center','NC State Extension','PFAF'],
  'draft'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture,
  native_range_description, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_sources, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-x-hican'),
  4, 9, 6.0, 7.5,
  'well_drained', ARRAY['sandy_loam','loam','silt_loam'],
  'full_sun', 'moderate', 3,
  60.0, 100.0, 40.0, 60.0,
  'moderate', 'taproot',
  'Hybrid origin. Natural hybrids occur where pecan and hickory ranges overlap across the eastern and central United States. Cultivated selections propagated by grafting.',
  false, 5, 10, 'mid', 200,
  ARRAY['Nutcracker Nursery (Quebec)','Rock Bridges Trees','Humble Abode Nursery','Perennial Crops Nursery','TC Permaculture'],
  'draft'
) ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 4: species_pollination_profiles
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-illinoinensis'),
  'cross_required', 'wind', 1, 200,
  'April to May',
  'Pecan exhibits heterodichogamy — cultivars are classified as Type I (protandrous: pollen sheds before female flowers are receptive) or Type II (protogynous: female flowers receptive before pollen sheds). Plant at least one of each type within 200 feet. Type I cultivars include Pawnee, Oconee, Cape Fear, Desirable, Caddo, Cheyenne, and Western. Type II cultivars include Kanza, Elliot, Stuart, Kiowa, Forkert, Choctaw, and Mohawk. A single gene controls dichogamy type (protogyny is dominant). Some incomplete dichogamy occurs — self-pollination is physically possible but yields smaller, lower-quality kernels. Commercial plantings should include 15% pollinators distributed uniformly. Weather strongly affects overlap timing: warm moist springs favor male flowers, cool dry springs favor female flowers.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-ovata'),
  'cross_required', 'wind', 1, 200,
  'April to May',
  'Monoecious with dichogamous flowering like all Carya. Shagbark hickory has been documented to switch flowering type (protandrous vs protogynous) depending on environmental conditions in a given year. Plant at least two genetically distinct trees for reliable nut set. Cross-pollination with other hickory species is possible — natural hybrids with shellbark (C. × dunbarii), bitternut (C. × laneyi), and pecan are documented. Transplant difficulty is high due to deep taproot; container-grown or freshly dug young trees establish best.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-laciniosa'),
  'cross_required', 'wind', 1, 200,
  'April to May',
  'Monoecious with dichogamous flowering. Like all diploid (n=16) hickories, shellbark can cross-pollinate with pecan, shagbark, and bitternut. Plant at least two genetically distinct trees. The species is a common parent in hican crosses — C. × nussbaumeri (pecan × shellbark) includes cultivars like James and McAllister. Prefers bottomland and wet sites; differentiated from shagbark by its tolerance of periodic flooding and preference for heavier, moister soils. Transplant difficulty is high due to deep taproot.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-cordiformis'),
  'partially_self', 'wind', 0, 200,
  'April to May',
  'Monoecious with dichogamous flowering. PFAF lists bitternut as self-fertile, and it appears to have less complete dichogamy than pecan, but cross-pollination improves nut fill (though the bitter nuts have minimal food value). First nut production typically at 15-25 years from seed. Bitternut hybridizes naturally with pecan (C. × brownii), pignut (C. × demareei), and shagbark (C. × laneyi). Its value as a pollinizer parent in breeding programs exceeds its value as a nut crop — its vigor, cold-hardiness, and rapid growth make it an interesting breeding partner for northern hican development.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'carya-x-hican'),
  'cross_required', 'wind', 1, 200,
  'April to May',
  'Hicans can be pollinated by both pecan and hickory trees, but set rates are variable and often inconsistent. Many hicans do not pollinate well with either parent group — poor production and empty nuts are the most common complaints. Plant alongside both a pecan (preferably a complementary Type I/II cultivar) and a true hickory (shagbark or shellbark) to maximize pollination options. Named grafted cultivars are available from specialty nurseries but are expensive due to propagation difficulty.'
) ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;
