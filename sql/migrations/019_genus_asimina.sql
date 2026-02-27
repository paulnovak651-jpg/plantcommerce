-- Migration: 019_genus_asimina.sql
-- Genus: Asimina (Pawpaws)
-- Date: 2026-02-26
-- Species count: 2 species + 1 hybrid
-- Sources: KSU Pawpaw Research Program, Peterson Pawpaws, USDA PLANTS, USDA FEIS,
--          NC State Extension, Alabama Cooperative Extension, One Green World,
--          Raintree Nursery, PFAF, California Rare Fruit Growers, Missouri Botanical Garden,
--          Lady Bird Johnson Wildflower Center, Gardenia.net
-- Pipeline step: 2 (Write SQL Migration)
--
-- Verification queries (run after deploy):
--   1. SELECT slug, canonical_name, entity_type FROM plant_entities WHERE genus = 'Asimina';
--   2. SELECT pe.slug, sgp.usda_zone_min, sgp.usda_zone_max, sgp.sun_requirement
--      FROM species_growing_profiles sgp JOIN plant_entities pe ON pe.id = sgp.plant_entity_id
--      WHERE pe.genus = 'Asimina';
--   3. SELECT pe.slug, spp.pollination_type, spp.pollination_mechanism
--      FROM species_pollination_profiles spp JOIN plant_entities pe ON pe.id = spp.plant_entity_id
--      WHERE pe.genus = 'Asimina';

BEGIN;

-- ============================================================================
-- PART 1: plant_entities
-- ============================================================================

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'asimina-triloba',
  'Pawpaw',
  'Asimina triloba',
  'Annonaceae', 'Asimina', 'triloba',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000015',
  'Asimina triloba is the largest edible fruit native to North America and the only temperate member of the otherwise tropical custard apple family (Annonaceae). The species ranges from southern Ontario west to southeastern Nebraska, south to eastern Texas, and east to the Florida panhandle, reaching greatest abundance in the Ohio and Mississippi River valleys where it forms dense clonal thickets in bottomland hardwood forests. Indigenous peoples cultivated pawpaw for millennia and are credited with extending its range well beyond its post-glacial refugia. The fruit — a cluster of oblong berries weighing 5 to 16 ounces each — has soft, custardy flesh with a flavor commonly described as a blend of banana, mango, and vanilla custard. Named cultivars from the KSU and Peterson breeding programs have pushed fruit quality dramatically, with selections like Potomac, Shenandoah, and the KSU-Atwood series offering larger fruit, fewer seeds, and improved shelf life.

Pawpaw is a deciduous understory tree typically reaching 15–25 feet in cultivation, occasionally to 35 feet in ideal bottomland conditions. It spreads aggressively by root suckers to form colonies — a trait that is both its principal survival strategy and a management challenge. Young seedlings require shade for the first one to two years and are extremely sensitive to full sun, but mature trees fruit best in open exposure. Transplanting is notoriously difficult due to the fleshy, magnolia-like root system with a deep taproot and minimal fibrous roots; container-grown stock establishes far more reliably than field-dug trees. The species requires approximately 400 chill hours and a minimum of 150 frost-free days with at least 2,200 GDD to ripen fruit. Pawpaw is essentially pest-free — the pawpaw peduncle borer (Talponia plummeriana) is the only significant insect pest, and no major disease limits production. The foliage contains acetogenins (annonacin), which render the leaves and bark unpalatable to deer and most herbivores, making pawpaw one of the very few fruit trees that thrive without deer fencing.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'asimina-parviflora',
  'Small-flower Pawpaw',
  'Asimina parviflora',
  'Annonaceae', 'Asimina', 'parviflora',
  'species', 'verified',
  'd0000000-0000-0000-0000-000000000015',
  'Asimina parviflora is a compact deciduous shrub native to the southeastern United States, ranging from southeastern Virginia through the Carolinas, Georgia, Alabama, Mississippi, and into the Florida panhandle, typically in dry pine-oak forests, sandy uplands, and open woodland understories. Unlike its larger cousin A. triloba, small-flower pawpaw rarely exceeds 6–8 feet in height and produces fruit only 1–3 inches long with fewer seeds per berry. The brownish-purple flowers are smaller and appear singly in leaf axils before leaf emergence. Despite its diminutive size, the fruit is edible with a flavor similar to common pawpaw — sweet, custardy, and eagerly consumed by wildlife including songbirds, wild turkeys, squirrels, raccoons, and black bears. Like all Asimina species, it serves as the larval host plant for the zebra swallowtail butterfly (Eurytides marcellus).

Small-flower pawpaw occupies a different ecological niche than common pawpaw, preferring drier, sandier, more acidic sites and tolerating conditions that would stress A. triloba. Its deep taproot makes transplanting difficult, but it establishes well from container stock. For permaculture and food forest designers, small-flower pawpaw fills a valuable role as a compact, shade-tolerant, native fruiting understory shrub for southeastern properties. Alabama Cooperative Extension has identified it as a potential dwarfing rootstock for A. triloba — grafting common pawpaw cultivars onto A. parviflora rootstock could produce smaller, more manageable trees suitable for intensive orchard systems and home gardens. This rootstock research is still experimental but represents a genuine frontier in pawpaw commercialization.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES (
  'asimina-x-piedmontana',
  'Piedmont Pawpaw',
  'Asimina × piedmontana',
  'Annonaceae', 'Asimina', NULL,
  'hybrid_species', 'provisional',
  'd0000000-0000-0000-0000-000000000015',
  'Asimina × piedmontana is a naturally occurring hybrid between common pawpaw (A. triloba) and small-flower pawpaw (A. parviflora), documented in the southern Piedmont and Coastal Plain regions where the two species'' ranges overlap, particularly in Alabama, Georgia, and the Carolinas. The hybrid has been genomically verified and shows intermediate characteristics between its parents — larger than A. parviflora but more compact than A. triloba, with fruit size and quality falling between the two species. Piedmont pawpaw typically grows as a large shrub or small tree reaching 8–15 feet in height.

For breeders and permaculture designers, A. × piedmontana is of interest as a potential bridge taxon for developing semi-dwarf pawpaw cultivars. The hybrid demonstrates that interspecific crossing within Asimina is viable and that intermediate growth habits can be achieved. Alabama Cooperative Extension has noted the potential of piedmont pawpaw (along with A. parviflora) as experimental dwarfing rootstock material. No named cultivars of this hybrid are currently in commercial propagation, but wild populations in the overlap zone provide genetic material for future breeding work aimed at reducing tree size while retaining the fruit quality of A. triloba.',
  'draft'
) ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PART 2: plant_entity_parents
-- ============================================================================

INSERT INTO plant_entity_parents (
  hybrid_id, parent_id, contribution_percent, data_source, confidence_note
)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana'),
  (SELECT id FROM plant_entities WHERE slug = 'asimina-triloba'),
  NULL,
  'Alabama Cooperative Extension pawpaw production guide; Wikipedia Asimina triloba; genomic verification studies',
  'A. × piedmontana is a natural hybrid of A. triloba × A. parviflora found where ranges overlap in the Deep South. Contribution percent is NULL because ratios vary by individual. Genomically verified hybrid classification.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'asimina-triloba')
);

INSERT INTO plant_entity_parents (
  hybrid_id, parent_id, contribution_percent, data_source, confidence_note
)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana'),
  (SELECT id FROM plant_entities WHERE slug = 'asimina-parviflora'),
  NULL,
  'Alabama Cooperative Extension pawpaw production guide; Wikipedia Asimina triloba; genomic verification studies',
  'A. parviflora is the other parent in the A. × piedmontana cross. Small-flower pawpaw contributes compact growth habit and drought tolerance. Found naturally in overlap zones.'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'asimina-parviflora')
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
  (SELECT id FROM plant_entities WHERE slug = 'asimina-triloba'),
  5, 9, 400, 1000, 5.5, 7.0,
  'well_drained', ARRAY['loam','silt_loam','sandy_loam'],
  'part_shade', 'high', 2,
  15.0, 35.0, 15.0, 30.0,
  'slow', 'taproot',
  'Southern Ontario west to southeastern Nebraska, south to eastern Texas, east to the Florida panhandle. Greatest abundance in the Ohio and Mississippi River valleys. Disjunct populations in southern New York and New England.',
  false, 4, 8, 'late', 80,
  ARRAY['KSU Pawpaw Planting Guide','Peterson Pawpaws','USDA FEIS (Sullivan 1993)','NC State Extension','One Green World','Raintree Nursery','PFAF','Alabama Cooperative Extension','California Rare Fruit Growers'],
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
  (SELECT id FROM plant_entities WHERE slug = 'asimina-parviflora'),
  7, 10, 5.0, 6.5,
  'well_drained', ARRAY['sandy','sandy_loam','loam'],
  'part_shade', 'moderate', 3,
  3.0, 12.0, 2.0, 6.0,
  'slow', 'taproot',
  'Southeastern Virginia through the Carolinas, Georgia, Alabama, Mississippi, and into the Florida panhandle. Typically in dry pine-oak forests, sandy uplands, and open woodland understories.',
  false, 4, 8, 'mid_late', 50,
  ARRAY['NC State Extension','Alabama Cooperative Extension','Lady Bird Johnson Wildflower Center','USDA PLANTS'],
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
  (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana'),
  6, 9, 5.5, 7.0,
  'well_drained', ARRAY['sandy_loam','loam','silt_loam'],
  'part_shade', 'moderate', 3,
  8.0, 15.0, 6.0, 12.0,
  'slow', 'taproot',
  'Hybrid origin. Natural populations occur where A. triloba and A. parviflora ranges overlap in the southern Piedmont and Coastal Plain, particularly in Alabama, Georgia, and the Carolinas.',
  false, 5, 10, 'mid_late', 60,
  ARRAY['Alabama Cooperative Extension','Wikipedia Asimina triloba','genomic verification studies'],
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
  (SELECT id FROM plant_entities WHERE slug = 'asimina-triloba'),
  'cross_required', 'insect', 1, 50,
  'March to May',
  'Pawpaw flowers are protogynous — the stigma matures and is no longer receptive when the pollen is shed, preventing self-pollination within a single flower. The species is also genetically self-incompatible, meaning pollen from the same clone (including root suckers from the same parent tree) will not set fruit. This is a critical consideration because pawpaw''s clonal suckering habit means an entire grove may be a single genotype. Plant at least two genetically distinct cultivars or seedling trees within 30–50 feet. Pollinators are carrion flies (blow flies, flesh flies) and small beetles — NOT bees — attracted by the fetid, yeast-like scent of the maroon flowers. Commercial and home growers often hang decomposing fruit, fish scraps, or roadkill near flowering trees to boost pollinator visitation. Hand pollination with a soft artist''s brush (transfer pollen from a male-stage flower of one genotype to a female-stage flower of another) dramatically increases fruit set and is recommended for small plantings. Warm, still afternoons with good soil moisture are the best time for hand pollination. Named cultivars from KSU (Atwood, Benson, Chappell) and Peterson Pawpaws (Potomac, Shenandoah, Rappahannock, Susquehanna) are available from specialty nurseries.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'asimina-parviflora'),
  'cross_required', 'insect', 1, 30,
  'April to May',
  'Small-flower pawpaw shares the protogynous, self-incompatible pollination biology of common pawpaw. Flowers are smaller (3/4 inch across vs. 2 inches) and appear singly in leaf axils. Pollinated by flies and small beetles attracted to the mildly fetid flower scent. Cross-pollination by a genetically distinct individual is required for fruit set. The species can cross with A. triloba where ranges overlap, producing the hybrid A. × piedmontana. As a potential dwarfing rootstock for A. triloba, graft compatibility is being investigated — rootstock pollination is irrelevant when fruiting scions are grafted, but own-root plantings need cross-pollinizers.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'asimina-x-piedmontana'),
  'cross_required', 'insect', 1, 30,
  'April to May',
  'Piedmont pawpaw inherits the protogynous, self-incompatible pollination system of both parent species. Can theoretically be pollinated by either A. triloba or A. parviflora, as well as other A. × piedmontana individuals, though fertility data on this hybrid are limited. No named cultivars exist — all known individuals are wild seedlings or research accessions. Pollination biology is assumed similar to both parents: flies and beetles as primary vectors, warm-afternoon hand pollination recommended for research plantings.'
) ON CONFLICT (plant_entity_id) DO NOTHING;


-- ============================================================================
-- PART 5: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
