-- ============================================================================
-- MIGRATION 021: Malus Genus (Apples & Crabapples)
-- Sprint 5 Phase 3 — Knowledge graph genus seeding
--
-- What this migration does:
--   1. INSERT plant_entities for 9 Malus species/hybrids
--   2. INSERT species_growing_profiles for all 9 entities
--   3. INSERT species_pollination_profiles for all 9 entities
--   4. INSERT parentage records for M. domestica (hybrid species)
--   5. REFRESH MATERIALIZED VIEW material_search_index
--
-- Taxonomy node ID:
--   Rosaceae → Malus = d0000000-0000-0000-0000-000000000007
--
-- Species included:
--   malus-domestica          — Common Apple (hybrid species)
--   malus-sieversii          — Wild Apple (primary ancestor of M. domestica)
--   malus-sylvestris         — European Crabapple (secondary ancestor)
--   malus-baccata            — Siberian Crabapple (extreme cold-hardiness)
--   malus-prunifolia         — Chinese Crabapple (rootstock, cold-hardy)
--   malus-floribunda         — Japanese Flowering Crabapple (disease resistance donor)
--   malus-coronaria          — Sweet Crabapple (native eastern NA, cider)
--   malus-ioensis            — Prairie Crabapple (native Midwest)
--   malus-fusca              — Pacific Crabapple (native PNW, cider interest)
--
-- Data verified against:
--   USDA PLANTS Database, GRIN-Global, USDA FEIS, NC State Extension,
--   Missouri Botanical Garden, Geneva USDA-ARS Apple Germplasm Repository,
--   Orange Pippin, WSU Extension, Cornell Fruit Resources, Cummins Nursery,
--   One Green World, Fedco Trees, Lady Bird Johnson Wildflower Center,
--   Velasco et al. (2010) The Genome of the Domesticated Apple,
--   Cornille et al. (2012) New Insight into the History of Domesticated Apple
--
-- Verification queries (run after deploy):
--   1. SELECT slug, canonical_name, entity_type FROM plant_entities WHERE genus = 'Malus';
--   2. SELECT pe.slug, sgp.usda_zone_min, sgp.usda_zone_max, sgp.sun_requirement
--      FROM species_growing_profiles sgp JOIN plant_entities pe ON pe.id = sgp.plant_entity_id
--      WHERE pe.genus = 'Malus';
--   3. SELECT pe.slug, spp.pollination_type, spp.pollination_mechanism
--      FROM species_pollination_profiles spp JOIN plant_entities pe ON pe.id = spp.plant_entity_id
--      WHERE pe.genus = 'Malus';
--   4. SELECT h.slug AS hybrid, p.slug AS parent, pep.contribution_percent
--      FROM plant_entity_parents pep
--      JOIN plant_entities h ON h.id = pep.hybrid_id
--      JOIN plant_entities p ON p.id = pep.parent_id
--      WHERE h.genus = 'Malus';
--
-- Run AFTER: 020_genus_corylus
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: PLANT ENTITIES
-- ============================================================================

-- M. domestica — Common Apple (hybrid species)
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-domestica',
  'Common Apple',
  'Malus domestica',
  'Rosaceae', 'Malus', 'domestica',
  'hybrid_species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus domestica is the world''s most commercially important temperate tree fruit, grown on every continent except Antarctica. Genomic studies (Velasco et al. 2010, Cornille et al. 2012) have established that M. domestica is a complex hybrid species whose primary ancestor is the Central Asian wild apple M. sieversii, with significant secondary introgression from the European crabapple M. sylvestris and smaller contributions from M. orientalis (Caucasus) and other wild Malus species acquired along Silk Road trade routes over roughly 4,000 years of cultivation and selection. Modern apple cultivars encompass an extraordinary range: dessert, cooking, cider, and dual-purpose types spanning early-season (July) to very late (November) harvest, with flesh textures from soft and mealy to explosively crisp, and flavors from pure sugar to bracingly tart to deeply tannic.

Apple trees are deciduous, typically reaching 15–30 feet on seedling rootstock (or 6–12 feet on modern dwarfing rootstocks such as the Geneva and M.9 series). They require 400–1800 chill hours depending on cultivar (most commercial varieties need 800–1200), a minimum of 120–180 frost-free days, and cross-pollination by a compatible cultivar that blooms in the same window. Bloom group (early, mid, late) and diploid vs. triploid ploidy determine pollination compatibility. Triploid cultivars (Gravenstein, Jonagold, Mutsu) produce sterile pollen and require two other diploid pollinizers nearby.

The Geneva rootstock series (G.11, G.41, G.890, G.935, etc.) developed by Cornell and the USDA represents a paradigm shift — combining dwarfing habit with fire blight resistance, replant disease tolerance, and woolly apple aphid resistance. For permaculture and home orchard designers, apple cultivar and rootstock selection is arguably the single highest-leverage decision in the entire food forest, given the 30–80 year productive lifespan and the crop''s unmatched versatility in storage, fermentation, and fresh eating.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. sieversii — Wild Apple (primary ancestor)
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-sieversii',
  'Wild Apple',
  'Malus sieversii',
  'Rosaceae', 'Malus', 'sieversii',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus sieversii is the primary wild progenitor of the domesticated apple, native to the Tian Shan mountains of Central Asia — Kazakhstan, Kyrgyzstan, Tajikistan, Uzbekistan, and western China (Xinjiang). It forms extensive wild fruit forests in the mountain valleys at 900–1,500 meters elevation, particularly in the Ile-Alatau range near Almaty, Kazakhstan (whose former name "Alma-Ata" means "father of apples"). Individual trees in wild populations display extraordinary fruit diversity — some produce fruit virtually indistinguishable from modern cultivated apples in size, color, and sweetness, while neighboring trees bear small, sour fruit. This within-population variability was the raw material upon which 4,000+ years of human selection operated.

M. sieversii grows as a medium to large tree reaching 25–50 feet in its native range, with a rounded to spreading crown. It is endangered in situ: habitat loss from development, livestock grazing, and genetic erosion from cross-pollination with feral M. domestica trees threaten wild populations. The USDA-ARS Plant Genetic Resources Unit at Geneva, New York maintains the largest ex situ collection of M. sieversii accessions outside Central Asia, collected during expeditions in 1989, 1995, and 1996. These accessions are actively used in apple breeding research for disease resistance genes (particularly apple scab, fire blight, and cedar-apple rust resistance) that have been lost from the narrow genetic base of modern commercial cultivars. For permaculture breeders and conservation orchardists, M. sieversii represents the deep gene pool — the wellspring of apple genetic diversity.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. sylvestris — European Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-sylvestris',
  'European Crabapple',
  'Malus sylvestris',
  'Rosaceae', 'Malus', 'sylvestris',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus sylvestris is the European wild apple, native from Scandinavia and the British Isles south to the Iberian Peninsula, east to the Caucasus, and into western Siberia. Genomic studies (Cornille et al. 2012) have shown that M. sylvestris contributed approximately 10–20% of the genome of modern domesticated apples through secondary introgression — as Silk Road apple cultivars moved westward through Europe, they hybridized with local wild crabapple populations, acquiring genes for local adaptation, disease resistance, and flavor complexity. This "European polish" on the Central Asian foundation is responsible for many of the aromatic and acidity traits valued in European cider and dessert apple traditions.

M. sylvestris is a small, thorny tree typically reaching 15–30 feet, with hard, tart fruit 0.75–1.5 inches in diameter. It is extremely tough — surviving poor soils, heavy clay, exposure, and cold to zone 3. Pure M. sylvestris populations are increasingly rare due to introgression from feral M. domestica; distinguishing true wild trees from first-generation hybrids requires genetic testing. For cider makers and permaculture designers, M. sylvestris is valuable as a rootstock (seedling rootstocks from wild crabapple are long-lived and deeply anchored), as a source of late-season pollinizer bloom, and as a provider of high-tannin, high-acid fruit for blending in traditional farmhouse cider production. Several European conservation programs are actively working to protect remaining pure M. sylvestris populations.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. baccata — Siberian Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-baccata',
  'Siberian Crabapple',
  'Malus baccata',
  'Rosaceae', 'Malus', 'baccata',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus baccata is the most cold-hardy apple species on earth, native from Siberia through Mongolia and northern China to the Himalayan foothills. It withstands temperatures to −50°F (zone 1b) and is the genetic foundation for ultra-cold-hardy apple breeding in Canada, Minnesota, and the northern Great Plains. The University of Minnesota (Haralson, Honeycrisp, SweeTango, First Kiss), Agriculture Canada (Norland, Goodland, Battleford), and the Morden Research Station have all relied heavily on M. baccata genetics to develop apples that survive prairie winters. Ranetka-type apples — small-fruited M. baccata × M. domestica crosses — are a traditional Russian and Central Asian class of winter-hardy apples still widely grown in Siberia and the Altai region.

The species produces small fruit (0.25–0.5 inches, occasionally to 1 inch) that are astringent when fresh but make excellent jelly, preserves, and cider blends. Trees reach 20–40 feet with a rounded crown and are extremely tough, tolerating poor drainage, alkaline soils, and urban pollution. The flowers are white, profuse, and highly attractive to bees — M. baccata is one of the most reliable pollinizers for early-blooming apple cultivars. Several ornamental crabapple cultivars (Dolgo, Chestnut, Rescue) are M. baccata derivatives selected for both fruit quality and extreme hardiness. For zone 2–3 permaculture designers, M. baccata and its hybrids are often the only viable Malus options.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. prunifolia — Chinese Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-prunifolia',
  'Chinese Crabapple',
  'Malus prunifolia',
  'Rosaceae', 'Malus', 'prunifolia',
  'species', 'provisional',
  'd0000000-0000-0000-0000-000000000007',
  'Malus prunifolia is a cold-hardy crabapple species native to northern China, Manchuria, and eastern Siberia, though some taxonomists consider it an ancient hybrid or feral derivative of M. baccata × M. domestica rather than a true species — hence the ''provisional'' taxonomy confidence. Regardless of its exact origin, it is commercially and genetically significant as a rootstock species and a source of cold hardiness in apple breeding programs across East Asia and North America.

M. prunifolia typically grows to 20–35 feet with a rounded crown and produces fruit 0.75–1.5 inches in diameter — larger than M. baccata and occasionally used for preserves, candied fruit (tanghulu in China), and fermented beverages. It is hardy to zone 3, tolerates heavy clay soils, and has good fire blight tolerance compared to M. domestica. In Chinese pomology, M. prunifolia seedlings are widely used as rootstock for M. domestica — they provide excellent anchorage, cold hardiness, and compatibility. In North American nurseries, M. prunifolia is encountered primarily as a rootstock seed source (e.g., Antonovka rootstock is sometimes classified as M. prunifolia or M. domestica depending on the source) and as a parent in the development of cold-hardy ornamental and edible crabapple cultivars.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. floribunda — Japanese Flowering Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-floribunda',
  'Japanese Flowering Crabapple',
  'Malus floribunda',
  'Rosaceae', 'Malus', 'floribunda',
  'species', 'provisional',
  'd0000000-0000-0000-0000-000000000007',
  'Malus floribunda is a small, spreading ornamental crabapple of Japanese origin (likely a garden hybrid of M. baccata × M. sieboldii, though its exact parentage is debated — hence ''provisional'' confidence). Its importance to modern apple production vastly exceeds its modest appearance: M. floribunda 821, a single accession at the Geneva research station, is the original source of the Vf gene (now reclassified as Rvi6), the most widely deployed apple scab resistance gene in the world. Virtually every scab-resistant apple cultivar developed in the second half of the 20th century — Liberty, Enterprise, GoldRush, Pristine, Redfree, the PRI series — traces its scab resistance to this one M. floribunda tree.

The species grows to 15–25 feet with a graceful, arching, wide-spreading habit. Buds are deep carmine-pink opening to white, creating a spectacular bicolor display. Fruit is tiny (0.25–0.5 inches), yellow with a red blush, persistent into winter, and of minimal direct food value. For permaculture orchardists, M. floribunda''s role is purely functional: it is the single most important disease resistance donor in the genus Malus. Its genes for apple scab resistance, combined with Geneva rootstock fire blight resistance, form the two pillars of modern low-spray apple production. Understanding that your ''disease-resistant'' cultivars trace back to this one Japanese crabapple is essential context for any serious orchardist.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. coronaria — Sweet Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-coronaria',
  'Sweet Crabapple',
  'Malus coronaria',
  'Rosaceae', 'Malus', 'coronaria',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus coronaria is a native North American crabapple found from southern Ontario through the eastern United States — New York to Georgia, west to Missouri and Kansas — in forest edges, old fields, fencerows, and stream banks. It is the most widely distributed native apple east of the Mississippi. The species is noted for its late bloom (2–3 weeks after M. domestica), intensely fragrant flowers (violet-scented, among the most aromatic in the genus), and hard, extremely tart fruit 1–1.5 inches in diameter that requires frost to become palatable. Early American settlers made cider and preserves from M. coronaria fruit; the cultivar ''Charlotte'' (a double-flowered selection) has been grown ornamentally since the 1830s.

M. coronaria typically grows as a thicket-forming small tree or large shrub reaching 15–25 feet, spreading aggressively by root suckers. It is tough, hardy to zone 4, and tolerates a wide range of soils including heavy clay. The species is susceptible to cedar-apple rust where Juniperus virginiana is present. For permaculture and cider designers, M. coronaria is of interest as a late-season pollinizer (extending the bloom window for orchards), as a cider blending fruit (high acid, moderate tannin), as a wildlife hedgerow component, and as native rootstock material. Its late bloom can escape spring frost damage that destroys earlier-blooming M. domestica flowers — a valuable trait in continental climates.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. ioensis — Prairie Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-ioensis',
  'Prairie Crabapple',
  'Malus ioensis',
  'Rosaceae', 'Malus', 'ioensis',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus ioensis is a native crabapple of the central United States, ranging from Minnesota and Wisconsin south through Iowa, Illinois, Indiana, Missouri, and into Oklahoma and eastern Texas. It occupies the prairie-forest ecotone — the transitional zone between tallgrass prairie and eastern deciduous forest — and is adapted to the harsh extremes of continental climate: bitter winters, hot summers, drought, wind, and heavy clay soils. The species is closely related to M. coronaria and was sometimes treated as a variety of it (M. coronaria var. ioensis) before being elevated to species rank.

M. ioensis grows as a small tree or large shrub to 15–25 feet, forming thickets via root suckers. It blooms very late — the last native Malus to flower in its range — with fragrant pink-flushed flowers that appear after M. domestica orchards have finished blooming. Fruit is 0.75–1.5 inches, green to yellow-green, extremely hard and tart, requiring heavy frost before it softens enough for wildlife consumption. The double-flowered ornamental ''Bechtel'' crabapple, once widely planted across the Midwest, is an M. ioensis selection. For permaculture designers working in zones 4–6 with heavy clay prairie soils, M. ioensis is one of the toughest native fruit trees available — drought-resistant, wind-resistant, and adapted to the exact conditions that kill most M. domestica cultivars on dwarfing rootstock. Its extreme late bloom is also an insurance policy against late frost.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- M. fusca — Pacific Crabapple
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'malus-fusca',
  'Pacific Crabapple',
  'Malus fusca',
  'Rosaceae', 'Malus', 'fusca',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000007',
  'Malus fusca is the only apple species native to western North America, ranging from coastal Alaska south through British Columbia, Washington, Oregon, and into northwestern California. It is a riparian species found in wet lowlands, stream banks, estuaries, bogs, and moist forest margins — the ecological opposite of the drought-tolerant prairie crabapples of the interior. First Nations peoples of the Pacific Northwest traditionally harvested and stored M. fusca fruit, sometimes in large quantities; it was one of the few fruits regularly cached in bentwood boxes or buried in bog pits for winter use. The tart, olive-shaped fruit (0.5–0.75 inches) mellows significantly after frost or extended storage and was eaten with fish oil.

M. fusca grows as a large shrub or small tree to 15–35 feet, often multi-stemmed, frequently with thorny branches. It tolerates saturated soils and periodic flooding — it is one of the very few Malus species that thrives in wet feet. Hardy to zone 5 (possibly 4 in maritime conditions). For PNW permaculture designers, M. fusca fills a unique niche: a native, wet-tolerant fruit tree for riparian buffer plantings, rain gardens, and swale edges where M. domestica would drown. It has also attracted interest from craft cider makers for its intense acidity and wild character. One Green World and other PNW specialty nurseries offer M. fusca selections. The species contributes valuable wet-tolerance genes to Malus breeding, though it has been less used than M. baccata or M. floribunda in commercial programs.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: SPECIES GROWING PROFILES
-- ============================================================================

-- malus-domestica
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-domestica'),
  3, 9, 400, 1800, 6.0, 7.0,
  'well_drained', ARRAY['loam', 'sandy_loam', 'silt_loam', 'clay_loam'],
  'full_sun', 'moderate', 2,
  6.0, 30.0, 8.0, 25.0,
  'moderate', 'fibrous',
  'Hybrid species of cultivated origin. Primary ancestor M. sieversii from Central Asia (Tian Shan); secondary introgression from M. sylvestris (Europe), M. orientalis (Caucasus), and other wild Malus spp. along Silk Road trade routes over ~4,000 years. Now cultivated globally in temperate zones.',
  false, false,
  2, 8, 80,
  'mid_late', 'draft',
  ARRAY['USDA PLANTS Database', 'Cornell Fruit Resources', 'WSU Extension', 'Orange Pippin', 'Geneva USDA-ARS Apple Collection', 'Velasco et al. 2010', 'Cornille et al. 2012']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-sieversii
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-sieversii'),
  4, 8, 5.5, 7.5,
  'well_drained', ARRAY['loam', 'sandy_loam', 'silt_loam'],
  'full_sun', 'moderate', 3,
  25.0, 50.0, 20.0, 35.0,
  'moderate', 'taproot',
  'Central Asia: Tian Shan mountains of Kazakhstan, Kyrgyzstan, Tajikistan, Uzbekistan, and western China (Xinjiang). Wild fruit forests at 900–1,500 meters elevation in the Ile-Alatau range near Almaty.',
  false, false,
  5, 10, 100,
  'mid_late', 'draft',
  ARRAY['USDA-ARS Geneva Germplasm Repository', 'GRIN-Global', 'Velasco et al. 2010', 'Cornille et al. 2012', 'Forsline et al. 2003']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-sylvestris
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-sylvestris'),
  3, 7, 5.0, 7.5,
  'well_drained', ARRAY['loam', 'clay_loam', 'sandy_loam', 'clay'],
  'full_sun', 'moderate', 4,
  15.0, 30.0, 12.0, 25.0,
  'slow', 'taproot',
  'Europe: Scandinavia and the British Isles south to the Iberian Peninsula, east to the Caucasus and western Siberia. Forest edges, hedgerows, open woodland.',
  false, false,
  5, 10, 100,
  'late', 'draft',
  ARRAY['USDA PLANTS Database', 'GRIN-Global', 'Cornille et al. 2012', 'EUFORGEN European Crab Apple Conservation']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-baccata
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-baccata'),
  1, 7, 5.0, 7.5,
  'moderate', ARRAY['loam', 'clay_loam', 'sandy_loam', 'clay'],
  'full_sun', 'moderate', 4,
  20.0, 40.0, 15.0, 30.0,
  'moderate', 'fibrous',
  'Siberia through Mongolia, northern China, Manchuria, Korea, and into the Himalayan foothills. The most widely distributed wild apple species in Asia.',
  false, false,
  3, 6, 80,
  'mid', 'draft',
  ARRAY['USDA PLANTS Database', 'GRIN-Global', 'University of Minnesota Apple Breeding Program', 'Agriculture Canada Morden Research Station', 'Dirr Manual of Woody Landscape Plants']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-prunifolia
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-prunifolia'),
  3, 7, 5.5, 7.5,
  'well_drained', ARRAY['loam', 'clay_loam', 'sandy_loam'],
  'full_sun', 'moderate', 3,
  20.0, 35.0, 15.0, 25.0,
  'moderate', 'fibrous',
  'Northern China, Manchuria, eastern Siberia. Widely cultivated in northern China as a rootstock species and occasionally for fruit (tanghulu). Exact species boundaries with M. baccata are debated.',
  false, false,
  3, 6, 60,
  'mid', 'draft',
  ARRAY['GRIN-Global', 'USDA PLANTS Database', 'Chinese Pomology references', 'Dirr Manual']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-floribunda
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-floribunda'),
  4, 8, 5.5, 7.5,
  'well_drained', ARRAY['loam', 'sandy_loam', 'silt_loam'],
  'full_sun', 'moderate', 3,
  15.0, 25.0, 15.0, 25.0,
  'moderate', 'fibrous',
  'Japan (cultivated origin). Likely a hybrid of M. baccata × M. sieboldii or similar parentage. Known only from cultivation; no confirmed wild populations.',
  false, false,
  'M. floribunda 821 (Geneva accession) is the source of the Vf/Rvi6 apple scab resistance gene deployed in virtually all modern scab-resistant cultivars (Liberty, Enterprise, GoldRush, Pristine, Redfree, PRI series). The most important single disease-resistance donor in global apple breeding.',
  3, 5, 50,
  'mid', 'draft',
  ARRAY['USDA-ARS Geneva Germplasm Repository', 'GRIN-Global', 'Crosby et al. 1992 Fruit Breeding', 'NC State Extension', 'Missouri Botanical Garden']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-coronaria
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-coronaria'),
  4, 8, 5.0, 7.5,
  'well_drained', ARRAY['loam', 'clay_loam', 'sandy_loam', 'clay'],
  'full_sun', 'moderate', 3,
  15.0, 25.0, 15.0, 25.0,
  'moderate', 'suckering',
  'Eastern North America: southern Ontario south through the eastern United States — New York to Georgia, west to Missouri and Kansas. Forest edges, old fields, fencerows, stream banks.',
  false, false,
  ARRAY['white-tailed_deer', 'wild_turkey', 'ruffed_grouse', 'cedar_waxwing', 'fox', 'raccoon'],
  'Most widely distributed native Malus east of the Mississippi. Forms dense thickets via root suckers. Late-blooming (2–3 weeks after M. domestica) with intensely fragrant, violet-scented flowers. Susceptible to cedar-apple rust where Juniperus virginiana is present.',
  4, 7, 60,
  'late', 'draft',
  ARRAY['USDA PLANTS Database', 'USDA FEIS', 'Lady Bird Johnson Wildflower Center', 'NC State Extension', 'Missouri Botanical Garden']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-ioensis
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-ioensis'),
  4, 7, 5.0, 7.5,
  'moderate', ARRAY['clay_loam', 'loam', 'clay', 'silt_loam'],
  'full_sun', 'low', 4,
  15.0, 25.0, 15.0, 25.0,
  'moderate', 'suckering',
  'Central United States: Minnesota and Wisconsin south through Iowa, Illinois, Indiana, Missouri, and into Oklahoma and eastern Texas. Prairie-forest ecotone. Adapted to the tallgrass prairie margin.',
  false, false,
  ARRAY['white-tailed_deer', 'wild_turkey', 'quail', 'songbirds', 'fox'],
  'Prairie-forest ecotone specialist. Last native Malus to bloom in its range — extreme late season. Adapted to heavy clay, drought, wind, and continental temperature extremes. ''Bechtel'' ornamental crabapple is an M. ioensis selection. Closely related to M. coronaria; sometimes treated as M. coronaria var. ioensis.',
  4, 8, 60,
  'very_late', 'draft',
  ARRAY['USDA PLANTS Database', 'USDA FEIS', 'Lady Bird Johnson Wildflower Center', 'Missouri Botanical Garden', 'Iowa State Extension']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- malus-fusca
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_texture_tolerances,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_architecture, native_range_description,
  nitrogen_fixer, allelopathic, wildlife_value, ecological_notes,
  years_to_bearing_min, years_to_bearing_max, productive_lifespan_years,
  harvest_season, curation_status, data_sources
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-fusca'),
  5, 8, 4.5, 7.0,
  'tolerates_wet', ARRAY['loam', 'silt_loam', 'clay', 'peat'],
  'part_shade', 'high', 1,
  15.0, 35.0, 10.0, 25.0,
  'moderate', 'suckering',
  'Western North America: coastal Alaska south through British Columbia, Washington, Oregon, and into northwestern California. Riparian zones, wet lowlands, stream banks, estuaries, bogs, moist forest margins.',
  false, false,
  ARRAY['black_bear', 'deer', 'cedar_waxwing', 'band-tailed_pigeon', 'varied_thrush', 'raccoon'],
  'Only Malus species native to western North America. Unique in the genus for tolerating saturated soils and periodic flooding. First Nations peoples traditionally harvested and stored fruit in large quantities. Attracts craft cider interest for intense acidity and wild character. Thorny branches provide excellent wildlife cover.',
  4, 8, 60,
  'mid_late', 'draft',
  ARRAY['USDA PLANTS Database', 'USDA FEIS', 'One Green World catalog', 'WSU Extension', 'Lady Bird Johnson Wildflower Center', 'First Nations ethnobotanical records']
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 3: SPECIES POLLINATION PROFILES
-- ============================================================================

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-domestica'),
  'cross_required', 'insect', 1, 100,
  'Mid-spring — typically April to May depending on cultivar bloom group (early, mid, late) and latitude.',
  'Most apple cultivars are self-incompatible due to S-allele (gametophytic self-incompatibility) systems — two cultivars sharing both S-alleles cannot pollinate each other. Plant at least 2 cultivars from different bloom groups with compatible S-alleles within 100 feet. Triploid cultivars (Gravenstein, Jonagold, Mutsu, Baldwin, Bramley''s Seedling) produce sterile pollen and cannot pollinate anything — they require TWO other diploid pollinizers nearby, which also serve as pollinizers for each other. Honeybees are the primary commercial pollinator; mason bees (Osmia lignaria) and bumblebees are highly effective and increasingly important in organic and small-scale orchards. Crabapple cultivars are excellent universal pollinizers if bloom timing overlaps. A few cultivars are partially self-fertile (Granny Smith, Golden Delicious, Cox''s Orange Pippin) but still benefit significantly from cross-pollination. Bloom group charts from Orange Pippin or Cornell are essential tools for orchard planning.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-sieversii'),
  'cross_required', 'insect', 1, 150,
  'Mid-spring — April to May in native range; timing varies greatly among individuals within a population.',
  'Self-incompatible like all wild Malus. In wild populations, the extraordinary genetic diversity means any two neighboring trees are likely compatible — the S-allele problem is a consequence of clonal monoculture, not of the species itself. Wild populations are pollinated by a diverse assemblage of native bees, hover flies, and other flower visitors. The bloom timing variation within a single M. sieversii population (up to 3 weeks spread) ensures extended pollen availability — a trait that commercial orchard designers would do well to emulate through cultivar diversity. USDA-ARS Geneva accessions are being evaluated as pollinizer sources for their disease resistance genes and broad genetic base.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-sylvestris'),
  'cross_required', 'insect', 1, 100,
  'Mid to late spring — typically blooms slightly later than M. domestica in the same location.',
  'Self-incompatible. Pollinated by honeybees, bumblebees, hover flies, and solitary bees in native hedgerow and forest-edge habitat. Because M. sylvestris is interfertile with M. domestica, wild populations near orchards frequently hybridize with feral domestic apples — this genetic introgression is actually the mechanism by which M. sylvestris genes entered the domesticated apple gene pool over millennia. For cider orchardists, seedling M. sylvestris rootstocks provide deep taproot anchorage and extreme longevity (100+ years) but no size control. The later bloom timing makes M. sylvestris useful as a pollinizer for late-blooming M. domestica cultivars.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-baccata'),
  'cross_required', 'insect', 1, 150,
  'Early to mid-spring — among the earliest Malus to bloom. April in zones 4–5.',
  'Self-incompatible. Early, profuse bloom makes M. baccata one of the most reliable pollinizers in the genus — it overlaps with early-blooming M. domestica cultivars and provides abundant pollen. Flowers are white, fragrant, and extremely attractive to honeybees, bumblebees, and native solitary bees. The early bloom in zone 2–3 climates means frost risk is significant — but the species'' adaptation includes tolerance of partial flower loss and the ability to set adequate fruit from surviving flowers. In mixed permaculture plantings, M. baccata serves double duty as pollinizer and wildlife food source (persistent fruit feeds birds through winter). Compatible with M. domestica for cross-pollination despite the wide species gap.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-prunifolia'),
  'cross_required', 'insect', 1, 100,
  'Mid-spring — April to May. Bloom timing generally overlaps well with M. domestica.',
  'Self-incompatible. Pollination biology similar to M. baccata and M. domestica. Widely used as a rootstock in Chinese apple production precisely because of its close compatibility with M. domestica — this compatibility extends to cross-pollination. Effective as an orchard pollinizer where bloom timing overlaps. In North American practice, M. prunifolia is more commonly encountered as rootstock seed than as a pollinizer, but trees grown from rootstock suckers will bloom and provide pollen.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-floribunda'),
  'partially_self', 'insect', 0, 100,
  'Early to mid-spring — blooms prolifically, often overlapping with early and mid-season M. domestica cultivars.',
  'Partially self-fertile, but cross-pollination increases fruit set. The primary significance of M. floribunda in orchards is not as a pollinizer but as the source of the Rvi6 (Vf) apple scab resistance gene. That said, its extraordinarily profuse bloom and compatibility with M. domestica make it an effective orchard pollinizer as a secondary benefit. Flowers open from deep carmine buds to white — the bicolor display is visually striking. Honeybees and other pollinators visit M. floribunda enthusiastically. For research orchards containing scab-resistant cultivar trials, having the M. floribunda 821 source tree nearby provides both pollination and a living reference to the resistance gene''s origin.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-coronaria'),
  'cross_required', 'insect', 1, 100,
  'Late spring — blooms 2–3 weeks after M. domestica. May to June in zones 5–6.',
  'Self-incompatible. The latest-blooming eastern Malus species (except M. ioensis). Pollinated by bees, hover flies, and beetles attracted by the intensely fragrant, violet-scented flowers. Because M. coronaria blooms after M. domestica has finished, it cannot serve as a pollinizer for standard apple cultivars — but it can extend the season for very late-blooming cultivars and provides pollen for other native Malus. The suckering habit means a single planting will eventually produce multiple genets if from seed, or clonal ramets if vegetatively propagated. For cider producers interested in wild-fermented or heritage blends, M. coronaria fruit provides the high-acid, moderate-tannin component traditionally valued in American farmstead cider.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-ioensis'),
  'cross_required', 'insect', 1, 100,
  'Late spring to early summer — the latest-blooming Malus in its range. May to June in zones 4–6.',
  'Self-incompatible. Blooms later than any other native apple in the central US — sometimes not until early June in northern parts of its range. This extreme late bloom is both a limitation (cannot pollinate M. domestica orchards) and a feature (escapes late frost that destroys earlier-blooming species). Pollinated by bees, hover flies, and beetles. The fragrant pink-flushed flowers produce nectar that supports pollinators at a time when few other fruit trees are in bloom. For prairie permaculture, plant multiple seedling trees (not clones of Bechtel) to ensure genetic diversity for cross-pollination. M. coronaria is the best cross-pollination partner where ranges overlap.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'malus-fusca'),
  'cross_required', 'insect', 1, 75,
  'Mid to late spring — April to May in the PNW. Bloom timing overlaps with late-season M. domestica.',
  'Self-incompatible. Pollinated by native bees, bumblebees, and hover flies in its riparian habitat. M. fusca is interfertile with M. domestica, which creates both an opportunity (pollinizer for late-blooming orchard apples in the PNW) and a conservation concern (feral M. domestica can introgress into wild M. fusca populations, diluting native genetics). First Nations peoples managed M. fusca groves through selective harvest, burning, and transplanting — a form of pre-Columbian orcharding. For craft cider applications, the intense acidity of M. fusca fruit (pH 2.5–3.0) requires blending but adds complexity and ''wild'' character that is increasingly valued in terroir-driven cider production.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- ============================================================================
-- PART 4: HYBRID PARENTAGE (M. domestica)
-- ============================================================================

-- Primary parent: M. sieversii
INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'malus-domestica'),
  (SELECT id FROM plant_entities WHERE slug = 'malus-sieversii'),
  NULL,
  'Velasco et al. 2010 (The Genome of the Domesticated Apple); Cornille et al. 2012; USDA-ARS Geneva',
  'Primary wild ancestor. Genomic studies indicate M. sieversii contributed the majority of the M. domestica genome. Contribution percent is NULL because it varies by cultivar lineage — some modern cultivars retain more M. sieversii ancestry than others depending on their breeding history and geographic origin.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'malus-domestica')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'malus-sieversii')
) ON CONFLICT DO NOTHING;

-- Secondary parent: M. sylvestris
INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source, confidence_note)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'malus-domestica'),
  (SELECT id FROM plant_entities WHERE slug = 'malus-sylvestris'),
  NULL,
  'Cornille et al. 2012 (New Insight into the History of Domesticated Apple); USDA-ARS Geneva',
  'Secondary ancestor via introgression as cultivated apples moved westward along the Silk Road into Europe. Approximately 10–20% of the M. domestica genome in European cultivar lineages derives from M. sylvestris hybridization. Contribution percent is NULL because it varies significantly by cultivar — Cornille et al. show European dessert and cider cultivars carry more M. sylvestris than Central Asian landrace varieties.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'malus-domestica')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'malus-sylvestris')
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
