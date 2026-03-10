-- ============================================================================
-- MIGRATION 049: Juglans (Walnut) Cultivars + Traits
-- Seeds curated cultivars across all five Juglans species/hybrid entities:
--   - Juglans nigra (Black Walnut): 7 cultivars
--   - Juglans regia (English/Persian Walnut): 4 cultivars
--   - Juglans ailantifolia (Heartnut): 5 cultivars
--   - Juglans cinerea (Butternut): 3 cultivars
--   - Juglans cinerea × ailantifolia (Buartnut): 2 cultivars
--
-- Data sourced from: Grimo Nut Nursery catalog, Nolin River Nut Tree Nursery,
--   Burnt Ridge Nursery, Nutcracker Nursery, MU Extension (XM1001),
--   JASHS 147(5) 2022 (Reid et al.), Purdue New Crops proceedings,
--   USDA NCGR-Corvallis Juglans Catalog, Perennia heartnut factsheet.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CULTIVARS
-- ============================================================================

INSERT INTO cultivars (
  slug,
  canonical_name,
  plant_entity_id,
  material_type,
  breeder,
  origin_location,
  year_released,
  patent_status,
  description,
  notes,
  curation_status
)
VALUES

-- ---------------------------------------------------------------------------
-- BLACK WALNUT (Juglans nigra)
-- ---------------------------------------------------------------------------

(
  'emma-k',
  'Emma K',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'Illinois, USA',
  NULL,
  'none',
  'Top-ranked black walnut cultivar for nut production, combining the highest kernel percentage with thin shells and consistent annual bearing. Excellent choice for permaculture nut orchards.',
  'Highest total percentile score in JASHS 2022 study combining kernel weight and kernel percentage. Oval, medium-sized nut that often cracks out half kernels. Widely available from Nolin River, Grimo, and other specialty nurseries.',
  'published'
),
(
  'thomas',
  'Thomas',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'Pennsylvania, USA',
  NULL,
  'none',
  'Classic black walnut cultivar selected for very large nut size and high kernel weight. A standard pollinizer and nut producer for eastern orchards.',
  'Also sold as Thomas Myers. Had the highest kernel weight (7.52 g) in the JASHS 2022 study of 54 cultivars. Large, light-colored kernel. Cracks reasonably well. One of the oldest named black walnut selections.',
  'published'
),
(
  'sparks-127',
  'Sparks 127',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'USA',
  NULL,
  'none',
  'High-kernel-percentage black walnut that bears on lateral branches, making it a primary candidate for commercial nut orchards and permaculture alley-cropping systems.',
  'Over 30% kernel. Bears on lateral branches (lateral bearing habit improves early yields). Top performer alongside Hay in overall kernel percentage. Parent of the newer Hickman cultivar.',
  'published'
),
(
  'kwik-krop',
  'Kwik Krop',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'USA',
  NULL,
  'none',
  'Precocious, consistently productive black walnut with good kernel quality. Dense canopy structure may reduce understory light in agroforestry layouts.',
  'Above 85th percentile for combined kernel metrics. More than 30% kernel. Dense canopy allows less solar energy to reach crops below compared to cultivars like Hay, which is worth considering for alley-cropping designs.',
  'published'
),
(
  'hay',
  'Hay',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'USA',
  NULL,
  'none',
  'Top-performing black walnut for kernel percentage with a relatively narrow canopy that allows nearly twice as much light to reach understory crops compared to denser cultivars.',
  'Excellent agroforestry candidate due to canopy architecture. High kernel percentage. Narrow canopy documented to allow almost 2x the solar energy to understory compared to Kwik Krop. Available from specialty nut tree nurseries.',
  'published'
),
(
  'sparrow',
  'Sparrow',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'Illinois, USA',
  NULL,
  'none',
  'Black walnut cultivar selected for exceptional cracking quality and high total kernel percentage. Well suited to northern nut orchards.',
  'Cracks exceptionally well. Kernel percentage increases notably through the harvest window. Good choice for northern plantings. Available from Grimo and other nurseries.',
  'published'
),
(
  'football',
  'Football',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-nigra'),
  'cultivar_clone',
  NULL,
  'USA',
  NULL,
  'none',
  'Large-nutted black walnut cultivar with lateral bearing habit and over 30% kernel, suited for commercial nut production and timber-nut dual purpose plantings.',
  'Also listed as Football 11. Above 85th percentile in JASHS 2022 study. Bears on lateral branches. Parent of the newer Hickman cultivar alongside Sparks 127.',
  'published'
),

-- ---------------------------------------------------------------------------
-- ENGLISH / PERSIAN WALNUT (Juglans regia)
-- ---------------------------------------------------------------------------

(
  'carpathian',
  'Carpathian',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  'named_seed_strain',
  NULL,
  'Carpathian Mountains (Poland/Romania origin)',
  NULL,
  'none',
  'Cold-hardy strain of English walnut originating from the Carpathian Mountains, enabling Persian walnut production in zones 5-6 where standard cultivars fail. Widely planted as a permaculture nut tree in the northeastern and midwestern US.',
  'Not a single clone but a cold-hardy seed strain. Hardy to -20F to -30F depending on source. Thin-shelled, mild-flavored nuts. Available from many nurseries including Arbor Day Foundation, One Green World, Burnt Ridge, and others. Leafs out later than standard English walnut, reducing frost damage risk.',
  'published'
),
(
  'broadview',
  'Broadview',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  'cultivar_clone',
  NULL,
  'British Columbia, Canada',
  NULL,
  'none',
  'Compact, partially self-fertile English walnut that begins bearing within 3-5 years. Cold-hardy to zone 5b with resistance to walnut blight and leaf blotch.',
  'Late leafing reduces frost risk. Very large nuts with thin shells and well-filled kernels lacking bitterness. Self-fertile but yields improve with a pollinizer. Disease resistant to both walnut blight and leaf blotch. Widely sold by Grimo Nut Nursery and others.',
  'published'
),
(
  'coble',
  'Coble',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  'cultivar_clone',
  'Garnet Coble',
  'Pennsylvania, USA',
  NULL,
  'none',
  'Cold-hardy American-selected English walnut with very large thin-shelled nuts. Productive in zone 6b and potentially colder sites.',
  'Introduced by Garnet Coble in Pennsylvania. Susceptible to walnut blight, so best suited to drier sites or where blight pressure is low. Large nuts, thin shells, well-filled kernels without bitterness. Available from Grimo Nut Nursery.',
  'published'
),
(
  'sejnovo',
  'Sejnovo',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-regia'),
  'cultivar_clone',
  NULL,
  'Eastern Europe',
  NULL,
  'none',
  'Cold-hardy, late-leafing English walnut cultivar suited to northern growers who want to avoid spring frost damage. Selected for reliable production in short-season climates.',
  'Late leafing trait is critical for frost avoidance in zones 5-6. Available from Grimo Nut Nursery. Good nut quality with thin shells.',
  'published'
),

-- ---------------------------------------------------------------------------
-- HEARTNUT (Juglans ailantifolia var. cordiformis)
-- ---------------------------------------------------------------------------

(
  'imshu',
  'Imshu',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'cultivar_clone',
  NULL,
  'North America',
  NULL,
  'none',
  'Heavy-producing heartnut cultivar with medium-sized nuts that crack cleanly and release whole kernels with careful handling. One of the most widely planted heartnuts in North America.',
  'Protogynous (females receptive before pollen shed); best paired with protandrous cultivars like Stealth or Ernie for pollination overlap. Nuts ripen late September. Massive harvests reported. Available from Grimo Nut Nursery and others.',
  'published'
),
(
  'heartnut-ernie',
  'Ernie',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'cultivar_clone',
  'Ernie Grimo (Grimo Nut Nursery)',
  'Niagara-on-the-Lake, Ontario, Canada',
  NULL,
  'none',
  'Hand-crossed heartnut selection (Campbell CW3 x Simcoe) with 29% kernel that drops out whole when cracked on edge. Bred for reliable cracking quality and productivity.',
  'Formerly Grimo 89. Medium-sized nut. Protandrous (sheds pollen before females receptive); pair with Bernice, Imshu, or Rose for pollination. Grafted on heartnut rootstock. Available from Grimo Nut Nursery.',
  'published'
),
(
  'heartnut-stealth',
  'Stealth',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'cultivar_clone',
  'John Gordon',
  'New York, USA',
  NULL,
  'none',
  'Large, elongated heartnut whose kernel drops out of the shell whole. Bred for commercial-scale cracking ease; best suited to zone 6 and warmer.',
  'Protandrous; pair with protogynous cultivars like Imshu, Bernice, or Rose. Moderate producer. Grafted on black walnut rootstock for best performance (per Grimo catalog). Zone 6 minimum limits northern range.',
  'published'
),
(
  'heartnut-simcoe',
  'Simcoe',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'cultivar_clone',
  NULL,
  'Simcoe, Ontario, Canada',
  NULL,
  'none',
  'Large Valentine heart-shaped heartnut selected from the Simcoe Experimental Farm planting. Freely drops whole and half nutmeats from the shell.',
  'Alternate bearer on a 2-3 year cycle (heavy crop then lighter crop). Selected at Simcoe Station Experimental Farm. Parent of Ernie (crossed with Campbell CW3). Available from Grimo Nut Nursery.',
  'published'
),
(
  'heartnut-campbell-cw3',
  'Campbell CW3',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-ailantifolia'),
  'cultivar_clone',
  NULL,
  'North America',
  NULL,
  'none',
  'Compact heartnut staying under 20 feet tall while producing large harvests. Excellent choice for small-scale permaculture food forests where space is limited.',
  'The CW3 designation indicates a specific clone from the Campbell heartnut breeding work. 29% kernel when crossed with Simcoe. Compact tree form is unusual for heartnuts and valuable in space-constrained designs. Available from Cricket Hill Garden and others.',
  'published'
),

-- ---------------------------------------------------------------------------
-- BUTTERNUT (Juglans cinerea)
-- ---------------------------------------------------------------------------

(
  'craxezy',
  'Craxezy',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  'cultivar_clone',
  NULL,
  'Michigan, USA',
  NULL,
  'none',
  'Butternut cultivar named for its exceptionally easy-to-crack shells, making it the most user-friendly butternut for home processing.',
  'Listed in USDA NCGR-Corvallis Juglans Catalog (PI 666984). Michigan origin. The name is a portmanteau of "cracks easy." Pure J. cinerea (DNA-tested stock important due to widespread butternut-heartnut hybridization). Availability limited; check Grimo Nut Nursery.',
  'published'
),
(
  'kenworthy',
  'Kenworthy',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  'cultivar_clone',
  NULL,
  'Minnesota, USA',
  NULL,
  'none',
  'Butternut cultivar producing unusually large nuts with good cracking qualities. An early pollinizer useful for cross-pollination in mixed butternut plantings.',
  'Moderately productive. Very large nut unusual for butternut. Fairly good cracking qualities. Early pollinizer. Zone 5-8. Available from Grimo Nut Nursery. All Grimo butternut stock DNA-tested for species purity.',
  'published'
),
(
  'beckwith',
  'Beckwith',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea'),
  'cultivar_clone',
  NULL,
  'New York, USA',
  NULL,
  'none',
  'Prolific and regular-bearing butternut with medium-sized nuts that crack out easily extractable half kernels. One of the most reliable pure butternut cultivars.',
  'NCGR-Corvallis PI 666994. Originally selected from the wild in Ohio or New York (sources vary). Most regular bearer among named butternuts. Medium-sized nuts that crack well and extract easily. Available from Grimo Nut Nursery.',
  'published'
),

-- ---------------------------------------------------------------------------
-- BUARTNUT (Juglans cinerea × J. ailantifolia)
-- ---------------------------------------------------------------------------

(
  'mitchell',
  'Mitchell',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  'cultivar_clone',
  NULL,
  'North America',
  NULL,
  'none',
  'The most widely planted buartnut cultivar, combining heartnut-shaped nuts with butternut hardiness and improved canker tolerance. Very heavy producer even after midsummer crop thinning.',
  'Heartnut-shaped nut that cracks well, cleans well, and releases beautiful kernel pieces. Grafted on black walnut rootstock for best performance. Heavily productive — naturally aborts part of crop in July-August but still carries heavy crop to maturity. Canker-tolerant. Available from Grimo, Nutcracker Nursery, Hardy Fruit Tree Nursery, and others.',
  'published'
),
(
  'fioka',
  'Fioka',
  (SELECT id FROM plant_entities WHERE slug = 'juglans-cinerea-x-ailantifolia'),
  'cultivar_clone',
  NULL,
  'Quebec, Canada',
  NULL,
  'none',
  'Canker-resistant buartnut hybrid with excellent cracking quality. Nut breaks into two clean halves releasing whole kernel pieces. Hardy to zone 4b.',
  'Juglans cinerea x J. ailantifolia var. cordiformis. Resistant to butternut canker. Derived from trees in Mauricie/Centre-du-Québec (zone 4b). The nut cracks into two parts, cleans well, releases beautiful kernel pieces. Available from Nutcracker Nursery & Tree Farm.',
  'published'
)

ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PART 2: CULTIVAR ALIASES
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
  ('Thomas Myers',  'thomas myers',  'cultivar', (SELECT id FROM cultivars WHERE slug = 'thomas'),  'former_name', 'published'),
  ('Thomas Meyer',  'thomas meyer',  'cultivar', (SELECT id FROM cultivars WHERE slug = 'thomas'),  'former_name', 'published'),
  ('Football 11',   'football 11',   'cultivar', (SELECT id FROM cultivars WHERE slug = 'football'), 'nursery_variant', 'published'),
  ('S127',          's127',          'cultivar', (SELECT id FROM cultivars WHERE slug = 'sparks-127'), 'common_name', 'published'),
  ('Kwik-Krop',     'kwik-krop',     'cultivar', (SELECT id FROM cultivars WHERE slug = 'kwik-krop'), 'nursery_variant', 'published'),
  ('Grimo 89',      'grimo 89',      'cultivar', (SELECT id FROM cultivars WHERE slug = 'heartnut-ernie'), 'former_name', 'published'),
  ('Grimo Ernie',   'grimo ernie',   'cultivar', (SELECT id FROM cultivars WHERE slug = 'heartnut-ernie'), 'nursery_variant', 'published'),
  ('Campbell CW-3', 'campbell cw-3', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'heartnut-campbell-cw3'), 'nursery_variant', 'published'),
  ('Mitchell Buartnut', 'mitchell buartnut', 'cultivar', (SELECT id FROM cultivars WHERE slug = 'mitchell'), 'common_name', 'published')
ON CONFLICT (normalized_text, target_type, target_id) DO NOTHING;


-- ============================================================================
-- PART 3: CULTIVAR TRAITS
-- ============================================================================

INSERT INTO cultivar_traits (
  cultivar_id,
  yield_potential,
  precocity,
  nut_weight_g,
  kernel_percentage,
  flavor_profile,
  flavor_rating,
  storage_quality,
  processing_ease,
  disease_resistance,
  bloom_period,
  harvest_season,
  vigor,
  tree_form,
  curation_status,
  data_sources
)
VALUES

-- Emma K (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'emma-k'),
  'excellent',   -- yield_potential: most productive, annual bearing
  'good',        -- precocity
  NULL,          -- nut_weight_g: medium-sized nut, exact weight not published
  34.00,         -- kernel_percentage: 32-35%+ range, using midpoint
  'Intense, aromatic black walnut flavor',
  'good',
  'good',
  'excellent',   -- processing_ease: thinnest shell of named cultivars
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['JASHS 147(5) 2022', 'MU Extension XM1001', 'Grimo Nut Nursery catalog']
),

-- Thomas (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'thomas'),
  'good',        -- yield_potential
  'fair',        -- precocity
  NULL,          -- nut_weight_g: large nut, total nut weight not given in grams
  28.00,         -- kernel_percentage: large kernel by weight (7.52g) but moderate %
  'Rich, classic black walnut flavor; large light-colored kernel',
  'good',
  'good',
  'good',        -- processing_ease: cracks reasonably well
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright',
  'published',
  ARRAY['JASHS 147(5) 2022', 'MU Extension XM1001', 'Walnut Council cultivar sheet']
),

-- Sparks 127 (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'sparks-127'),
  'excellent',   -- yield_potential: lateral bearing, high production
  'good',        -- precocity: lateral bearing aids early production
  NULL,          -- nut_weight_g
  32.00,         -- kernel_percentage: >30%, estimated ~32%
  'Robust black walnut flavor',
  'good',
  'good',
  'good',
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['JASHS 147(5) 2022', 'Purdue New Crops 1990', 'MU Extension XM1001']
),

-- Kwik Krop (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'kwik-krop'),
  'excellent',   -- yield_potential: consistent heavy production
  'excellent',   -- precocity: name reflects rapid bearing onset
  NULL,          -- nut_weight_g
  33.00,         -- kernel_percentage: 32.4-33.4% per research
  'Strong, characteristic black walnut flavor',
  'good',
  'good',
  'good',
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'dense-spreading',
  'published',
  ARRAY['JASHS 147(5) 2022', 'NCSU Plant Toolbox', 'MU Extension XM1001']
),

-- Hay (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'hay'),
  'excellent',   -- yield_potential
  'good',        -- precocity
  NULL,          -- nut_weight_g
  34.00,         -- kernel_percentage: top performer for kernel %
  'Strong black walnut flavor',
  'good',
  'good',
  'good',
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-narrow',
  'published',
  ARRAY['JASHS 147(5) 2022', 'MU Center for Agroforestry']
),

-- Sparrow (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'sparrow'),
  'good',
  'good',
  NULL,          -- nut_weight_g
  30.00,         -- kernel_percentage: high, but specific figure not published
  'Classic black walnut flavor',
  'good',
  'good',
  'excellent',   -- processing_ease: cracks exceptionally well
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['JASHS 147(5) 2022', 'Grimo Nut Nursery catalog']
),

-- Football (Black Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'football'),
  'excellent',   -- yield_potential: lateral bearing, high production
  'good',        -- precocity: lateral bearing aids early yields
  NULL,          -- nut_weight_g: large nut
  31.00,         -- kernel_percentage: >30%
  'Strong black walnut flavor',
  'good',
  'good',
  'good',
  '{"anthracnose": "moderate", "thousand_cankers_disease": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['JASHS 147(5) 2022', 'Purdue New Crops 1990']
),

-- Carpathian (English Walnut - seed strain)
(
  (SELECT id FROM cultivars WHERE slug = 'carpathian'),
  'good',
  'fair',        -- precocity: 5-8 years to bearing
  12.00,         -- nut_weight_g: typical English walnut size
  45.00,         -- kernel_percentage: typical thin-shell English walnut range
  'Mild, buttery English walnut flavor',
  'good',
  'good',
  'good',        -- processing_ease: thin-shelled, easy to crack
  '{"walnut_blight": "moderate", "anthracnose": "moderate"}',
  'mid',
  'mid',
  'vigorous',
  'broad-spreading',
  'published',
  ARRAY['Arbor Day Foundation', 'One Green World catalog', 'Burnt Ridge Nursery']
),

-- Broadview (English Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'broadview'),
  'good',
  'excellent',   -- precocity: fruits within 3-5 years
  14.00,         -- nut_weight_g: very large nuts
  48.00,         -- kernel_percentage: well-filled thin shells
  'Mild, sweet, no bitterness',
  'excellent',
  'good',
  'good',
  '{"walnut_blight": "resistant", "leaf_blotch": "resistant"}',
  'mid_late',    -- late leafing
  'mid',
  'vigorous',
  'upright',
  'published',
  ARRAY['Trees and Shrubs Online', 'Grimo Nut Nursery catalog', 'RHS plant database']
),

-- Coble (English Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'coble'),
  'good',
  'good',
  14.00,         -- nut_weight_g: very large nuts
  46.00,         -- kernel_percentage: well-filled
  'Mild English walnut flavor, no bitterness',
  'good',
  'good',
  'good',
  '{"walnut_blight": "susceptible"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['Trees and Shrubs Online', 'Grimo Nut Nursery catalog']
),

-- Sejnovo (English Walnut)
(
  (SELECT id FROM cultivars WHERE slug = 'sejnovo'),
  'good',
  'good',
  12.00,         -- nut_weight_g
  44.00,         -- kernel_percentage
  'Mild, classic English walnut flavor',
  'good',
  'good',
  'good',
  '{"walnut_blight": "moderate"}',
  'late',        -- late leafing, frost avoidance
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog']
),

-- Imshu (Heartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'imshu'),
  'excellent',   -- yield_potential: massive harvests
  'good',
  6.00,          -- nut_weight_g: medium-sized heartnut
  28.00,         -- kernel_percentage: typical heartnut range
  'Mild, sweet, buttery; less astringent than black walnut',
  'good',
  'good',
  'good',        -- processing_ease: whole kernels with careful cracking
  '{"butternut_canker": "moderate"}',
  'mid',
  'mid_late',    -- ripens late September
  'vigorous',
  'broad-spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog', 'Perennia heartnut factsheet']
),

-- Ernie (Heartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'heartnut-ernie'),
  'good',
  'good',
  5.50,          -- nut_weight_g: medium-sized
  29.00,         -- kernel_percentage: documented 29%
  'Mild, sweet walnut flavor',
  'good',
  'good',
  'excellent',   -- processing_ease: kernel drops out whole when cracked on edge
  '{"butternut_canker": "moderate"}',
  'mid',
  'mid',
  'moderate',
  'upright-spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog']
),

-- Stealth (Heartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'heartnut-stealth'),
  'fair',        -- yield_potential: moderate producer
  'good',
  7.00,          -- nut_weight_g: large elongated nut
  28.00,         -- kernel_percentage
  'Mild, sweet; kernel drops freely from shell',
  'good',
  'good',
  'excellent',   -- processing_ease: whole kernel drops out freely
  '{"butternut_canker": "moderate"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog', 'Morning Chores heartnut guide']
),

-- Simcoe (Heartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'heartnut-simcoe'),
  'good',        -- yield_potential: good but alternate bearing
  'good',
  7.00,          -- nut_weight_g: large Valentine heart shape
  27.00,         -- kernel_percentage
  'Sweet, mild walnut flavor',
  'good',
  'good',
  'good',        -- processing_ease: freely drops whole and half nutmeats
  '{"butternut_canker": "moderate"}',
  'mid',
  'mid',
  'vigorous',
  'broad-spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog']
),

-- Campbell CW3 (Heartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'heartnut-campbell-cw3'),
  'good',
  'good',
  5.50,          -- nut_weight_g
  29.00,         -- kernel_percentage: 29% documented in crosses
  'Mild, sweet heartnut flavor',
  'good',
  'good',
  'good',
  '{"butternut_canker": "moderate"}',
  'mid',
  'mid',
  'moderate',    -- stays under 20 feet — compact for a walnut
  'compact-spreading',
  'published',
  ARRAY['Cricket Hill Garden', 'Grimo Nut Nursery catalog', 'Dave''s Garden plant database']
),

-- Craxezy (Butternut)
(
  (SELECT id FROM cultivars WHERE slug = 'craxezy'),
  'fair',
  'fair',
  NULL,          -- nut_weight_g
  20.00,         -- kernel_percentage: butternut typically 18-22%
  'Rich, oily, sweet butternut flavor',
  'good',
  'fair',        -- butternuts generally store less well than black walnut
  'excellent',   -- processing_ease: named for easy cracking
  '{"butternut_canker": "susceptible"}',
  'mid',
  'mid',
  'moderate',
  'spreading',
  'published',
  ARRAY['USDA NCGR-Corvallis Juglans Catalog']
),

-- Kenworthy (Butternut)
(
  (SELECT id FROM cultivars WHERE slug = 'kenworthy'),
  'fair',        -- yield_potential: moderately productive
  'fair',
  NULL,          -- nut_weight_g: very large for butternut
  18.00,         -- kernel_percentage
  'Sweet, rich butternut flavor',
  'good',
  'fair',
  'good',
  '{"butternut_canker": "susceptible"}',
  'early',       -- early pollinizer
  'mid',
  'moderate',
  'spreading',
  'published',
  ARRAY['Grimo Nut Nursery catalog']
),

-- Beckwith (Butternut)
(
  (SELECT id FROM cultivars WHERE slug = 'beckwith'),
  'good',        -- yield_potential: prolific, most regular bearer
  'fair',
  NULL,          -- nut_weight_g: medium size
  20.00,         -- kernel_percentage
  'Classic sweet butternut flavor',
  'good',
  'fair',
  'good',        -- processing_ease: cracks out half kernels that extract easily
  '{"butternut_canker": "susceptible"}',
  'mid',
  'mid',
  'moderate',
  'spreading',
  'published',
  ARRAY['USDA NCGR-Corvallis Juglans Catalog', 'Grimo Nut Nursery catalog']
),

-- Mitchell (Buartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'mitchell'),
  'excellent',   -- yield_potential: very heavily productive
  'good',
  8.00,          -- nut_weight_g: heartnut-shaped, larger than typical butternut
  25.00,         -- kernel_percentage
  'Mild, butternut-influenced flavor; less intense than pure butternut',
  'good',
  'good',
  'excellent',   -- processing_ease: cracks well, cleans well, kernels release beautifully
  '{"butternut_canker": "resistant"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['Nutcracker Nursery catalog', 'Grimo Nut Nursery catalog', 'Hardy Fruit Tree Nursery']
),

-- Fioka (Buartnut)
(
  (SELECT id FROM cultivars WHERE slug = 'fioka'),
  'good',
  'good',
  7.00,          -- nut_weight_g
  24.00,         -- kernel_percentage
  'Mild, butternut-like flavor',
  'good',
  'good',
  'excellent',   -- processing_ease: breaks into two clean halves
  '{"butternut_canker": "resistant"}',
  'mid',
  'mid',
  'vigorous',
  'upright-spreading',
  'published',
  ARRAY['Nutcracker Nursery catalog']
)

ON CONFLICT (cultivar_id) DO NOTHING;


-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
