-- ============================================================================
-- MIGRATION 049: Carya Cultivars + Cultivar Traits
-- Systematic data buildout — Carya (Pecans, Hickories, Hicans)
--
-- What this migration does:
--   1. INSERT 24 cultivars across 4 Carya species + hican hybrid
--   2. INSERT cultivar_traits for all 24 cultivars
--   3. INSERT aliases for common name variants
--   4. REFRESH MATERIALIZED VIEW material_search_index
--
-- Species covered:
--   carya-illinoinensis (Pecan)       — 12 cultivars (northern-adapted focus)
--   carya-ovata (Shagbark Hickory)    — 5 cultivars
--   carya-laciniosa (Shellbark Hickory) — 2 cultivars
--   carya-x-hican (Hican hybrids)     — 4 cultivars
--   carya-cordiformis (Bitternut)     — parent species only, no cultivars
--
-- Data verified against:
--   USDA-ARS CGRU Pecan Cultivar Pages, Northern Pecans (Bill Reid,
--   Pecan Experiment Field, Chetopa KS), Grimo Nut Nursery catalog,
--   Nolin River Nut Tree Nursery, Stark Bros, Rock Bridge Trees,
--   University of Missouri Extension, Penn State Extension,
--   Northern Nut Growers Association proceedings
--
-- Run AFTER: 017_genus_carya.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CULTIVAR INSERTS
-- ============================================================================

-- ── Pecans (carya-illinoinensis) ──

INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, year_released, patent_status, curation_status, description, notes)
SELECT v.slug, v.canonical_name, pe.id, 'cultivar_clone'::material_type, v.breeder, v.origin_location, v.year_released, 'none'::patent_status, 'published'::curation_status, v.description, v.notes
FROM (VALUES
  ('kanza-pecan', 'Kanza', 'carya-illinoinensis', 'USDA-ARS / L.D. Romberg', 'Brownwood, TX', 1996,
   'Northern-adapted USDA pecan with outstanding scab resistance and consistent production. Cross of Major x Shoshoni, widely regarded as the best all-around cultivar for zones 6-8.',
   'Protogynous (Type II). 74 nuts/lb. One of the most recommended cultivars for permaculture plantings in the transition zone between northern and southern pecan regions.'),
  ('pawnee-pecan', 'Pawnee', 'carya-illinoinensis', 'USDA-ARS', 'Brownwood, TX', 1984,
   'Very early ripening pecan with large nuts and high kernel percentage. Widely available and popular for home orchards in zones 6-9.',
   'Protandrous (Type I). 44 nuts/lb. Susceptible to scab — best in drier climates. Very early maturity (mid-September) makes it viable further north than its zone rating suggests.'),
  ('hark-pecan', 'Hark', 'carya-illinoinensis', 'Selection from wild stand', 'Alexis, IL', 2015,
   'Promising northern pecan with excellent scab resistance and good nut quality. Named and released from a seedling tree in western Illinois.',
   'Protandrous (Type I). ~62 nuts/lb. Good partner for Kanza (Type II). Possible Major parentage.'),
  ('major-pecan', 'Major', 'carya-illinoinensis', 'Native selection by Mrs. L.B. Major', 'Henderson County, KY', 1908,
   'Historic northern pecan standard. Native selection from the northernmost pecan range with outstanding cold hardiness and reliable production.',
   'Protandrous (Type I). 78 nuts/lb. Female parent of Kanza and Osage. One of the oldest named northern pecan cultivars.'),
  ('greenriver-pecan', 'Greenriver', 'carya-illinoinensis', 'Selection from Pecan Experiment Field', 'Chetopa, KS', 2011,
   'Northern pecan with good nut size for the region and reliable production. Open-pollinated seedling selected at the Kansas Pecan Experiment Field.',
   'Protogynous (Type II). ~70 nuts/lb. Good pollinizer for Type I cultivars like Major and Hark.'),
  ('posey-pecan', 'Posey', 'carya-illinoinensis', 'Selection from wild stand', 'Chrisney, IN', NULL,
   'Hardy northern pecan from Indiana with distinctive flat nut shape. Reliable producer in zones 5-8 with good cold tolerance.',
   'Protogynous (Type II). ~68 nuts/lb. Strongly flattened nut shape with prominent wing ridges on sutures.'),
  ('shepherd-pecan', 'Shepherd', 'carya-illinoinensis', 'Native selection by Jerrell Shepherd', 'Chariton County, MO', 1978,
   'Consistent-yielding northern pecan from Missouri with good scab resistance.',
   'Protandrous (Type I). 65 nuts/lb. Good complement to Kanza and Posey (Type II).'),
  ('colby-pecan', 'Colby', 'carya-illinoinensis', 'A.S. Colby / J.C. McDaniel, University of Illinois', 'Illinois', 1957,
   'Classic far-northern pecan and widely used seedstock for the northern pecan industry. Native seedling selection with proven cold hardiness to zone 5.',
   'Protogynous (Type II). ~60 nuts/lb. Often used as seedling rootstock. 160 days to ripen.'),
  ('mullahy-pecan', 'Mullahy', 'carya-illinoinensis', 'Native selection', 'Burlington, IA', NULL,
   'Ultra-northern pecan from Iowa adapted to the shortest growing seasons. Found along the Mississippi River.',
   'Protogynous (Type II). ~79 nuts/lb. One of the most northern-adapted named pecan cultivars.'),
  ('warren-pecan', 'Warren', 'carya-illinoinensis', 'Native selection by Dale Warren', 'Wheeling, MO', NULL,
   'Northern pecan selected for earliness of ripening, hardiness, productivity, and nut cracking quality.',
   'Suited for zones 5b-8. Selected for overall performance in short-season northern environments.'),
  ('witte-pecan', 'Witte', 'carya-illinoinensis', 'Native selection from wild stand', NULL, NULL,
   'Ultra-northern pecan adapted to zone 6 and farther north. Wild stand selection with proven cold hardiness.',
   'One of the hardiest northern pecan selections alongside Mullahy.'),
  ('lucas-pecan', 'Lucas', 'carya-illinoinensis', 'Native selection', NULL, NULL,
   'Northern pecan recommended for short-season areas in zones 5-8. Known for early ripening and reliable kernel filling.',
   'One of the earliest-ripening northern pecans. Available from Grimo Nut Nursery.')
) AS v(slug, canonical_name, species_slug, breeder, origin_location, year_released, description, notes)
JOIN plant_entities pe ON pe.slug = v.species_slug
WHERE NOT EXISTS (SELECT 1 FROM cultivars c WHERE c.slug = v.slug)
ON CONFLICT (slug) DO NOTHING;

-- ── Shagbark Hickory (carya-ovata) ──

INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, year_released, patent_status, curation_status, description, notes)
SELECT v.slug, v.canonical_name, pe.id, 'cultivar_clone'::material_type, v.breeder, v.origin_location, v.year_released, 'none'::patent_status, 'published'::curation_status, v.description, v.notes
FROM (VALUES
  ('yoder-no1-shagbark', 'Yoder #1', 'carya-ovata', 'Selection from Ohio', 'Ohio', NULL,
   'One of the most popular named shagbark hickory selections. Medium-sized nut with good cracking quality.',
   'Late ripening; alternate bearing with good crops 2 out of 3 years. Among the most widely grafted shagbark cultivars.'),
  ('grainger-shagbark', 'Grainger', 'carya-ovata', 'Selection by John Hershey', 'Grainger County, TN', 1936,
   'One of the finest shagbark hickory selections. Exceptionally large nut approaching shellbark size, thin shell that cracks into whole halves. Weevil-resistant.',
   'Often cracks out in halves and large pieces. Available from Grimo Nut Nursery and Rock Bridge Trees.'),
  ('porter-shagbark', 'Porter', 'carya-ovata', 'Selection from Pennsylvania', 'Pennsylvania', NULL,
   'Excellent cracking shagbark hickory selected by the Pennsylvania Nut Growers Association. Winner of cracking contests.',
   'Among the most popular current shagbark cultivars alongside Yoder and Wilcox.'),
  ('wilcox-shagbark', 'Wilcox', 'carya-ovata', 'Selection from wild stand', 'Eastern United States', NULL,
   'Popular shagbark hickory selection known for reliable production and good nut quality.',
   'Among the most popular current shagbark cultivars alongside Yoder and Porter.'),
  ('blyth-shagbark', 'Blyth', 'carya-ovata', 'Grimo Nut Nursery (seedling of Neilson)', 'Niagara-on-the-Lake, ON, Canada', NULL,
   'Canadian shagbark hickory selection from Grimo Nut Nursery. Proven in cold Ontario winters.',
   'Seedling of Neilson selection. Large nut for a shagbark with good cracking quality.')
) AS v(slug, canonical_name, species_slug, breeder, origin_location, year_released, description, notes)
JOIN plant_entities pe ON pe.slug = v.species_slug
WHERE NOT EXISTS (SELECT 1 FROM cultivars c WHERE c.slug = v.slug)
ON CONFLICT (slug) DO NOTHING;

-- ── Shellbark Hickory (carya-laciniosa) ──

INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, year_released, patent_status, curation_status, description, notes)
SELECT v.slug, v.canonical_name, pe.id, 'cultivar_clone'::material_type, v.breeder, v.origin_location, v.year_released, 'none'::patent_status, 'published'::curation_status, v.description, v.notes
FROM (VALUES
  ('keystone-shellbark', 'Keystone', 'carya-laciniosa', 'Selection by Fayette Etter', 'Franklin County, PA', 1955,
   'Historic shellbark hickory selection discovered by Fayette Etter along a creek in Pennsylvania. Named for the Keystone State.',
   'Fayette Etter rescued scion wood before the original tree was destroyed in a flood. Very large, sweet nuts.'),
  ('henry-shellbark', 'Henry', 'carya-laciniosa', 'Selection by Fayette Etter', 'Franklin County, PA', NULL,
   'Highly productive shellbark hickory with lateral bearing habit and high weevil resistance. Very large nut.',
   'Lateral bearing habit makes it one of the most productive shellbark selections. Mid to late October ripening.')
) AS v(slug, canonical_name, species_slug, breeder, origin_location, year_released, description, notes)
JOIN plant_entities pe ON pe.slug = v.species_slug
WHERE NOT EXISTS (SELECT 1 FROM cultivars c WHERE c.slug = v.slug)
ON CONFLICT (slug) DO NOTHING;

-- ── Hicans (carya-x-hican) ──

INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, year_released, patent_status, curation_status, description, notes)
SELECT v.slug, v.canonical_name, pe.id, 'cultivar_clone'::material_type, v.breeder, v.origin_location, v.year_released, 'none'::patent_status, 'published'::curation_status, v.description, v.notes
FROM (VALUES
  ('james-hican', 'James', 'carya-x-hican', 'Unknown (natural hybrid selection)', 'Eastern United States', NULL,
   'Precocious hican with very large nuts. More productive than most shellbark hickories and reportedly self-fertile.',
   'Self-fertile — unusual among hicans. Available from Stark Bros and Nolin River Nut Tree Nursery.'),
  ('burton-hican', 'Burton', 'carya-x-hican', 'Natural hybrid selection', 'Kentucky', NULL,
   'Hardy, prolific hican (pecan x shagbark hickory) with good cracking quality. One of the best hican selections for northern food forests.',
   'Pecan x shagbark hickory cross. Available from Rock Bridge Trees and Nolin River.'),
  ('dooley-hican', 'Dooley', 'carya-x-hican', 'Natural hybrid selection', 'Oklahoma', NULL,
   'Productive hican with qualities similar to Burton — hardy, prolific, and good cracking.',
   'Often listed alongside Burton as one of the two best hicans.'),
  ('abbott-hican', 'Abbott', 'carya-x-hican', 'Selection by A.N. Abbott', 'Morrison, IL', NULL,
   'Bitternut hickory x pecan hybrid with extra cold hardiness and early ripening. Combines pecan form with bitternut extreme northern range.',
   'Bitternut x pecan parentage gives extreme cold hardiness. Bitternut parent (C. cordiformis) is the most cold-hardy Carya species.')
) AS v(slug, canonical_name, species_slug, breeder, origin_location, year_released, description, notes)
JOIN plant_entities pe ON pe.slug = v.species_slug
WHERE NOT EXISTS (SELECT 1 FROM cultivars c WHERE c.slug = v.slug)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 2: CULTIVAR TRAITS
-- ============================================================================

INSERT INTO cultivar_traits (
  cultivar_id, yield_potential, precocity, nut_weight_g, kernel_percentage,
  flavor_profile, flavor_rating, storage_quality, disease_resistance,
  bloom_period, harvest_season, vigor, tree_form, curation_status, data_sources
)
SELECT c.id, v.yield_potential, v.precocity, v.nut_weight_g, v.kernel_percentage,
       v.flavor_profile, v.flavor_rating, v.storage_quality, v.disease_resistance::jsonb,
       v.bloom_period, v.harvest_season, v.vigor, v.tree_form, 'published'::curation_status,
       ARRAY['USDA-ARS CGRU', 'Northern Pecans (Bill Reid)', 'Grimo Nut Nursery', 'Nolin River Nut Tree Nursery', 'Northern Nut Growers Association']
FROM (VALUES
  -- Pecans
  ('kanza-pecan', 'excellent'::quality_rating, 'good'::quality_rating, 6.2, 51.0,
   'Rich, buttery flavor with golden-colored kernels', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"resistant","black_aphid":"moderate"}',
   'mid'::bloom_period, 'mid'::harvest_season, 'Moderate', 'Upright-spreading, medium-sized tree'),
  ('pawnee-pecan', 'good'::quality_rating, 'excellent'::quality_rating, 10.4, 58.0,
   'Light-colored kernel with excellent eating quality. Mild, sweet flavor', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"susceptible","downy_spot":"moderate","black_aphid":"resistant"}',
   'early'::bloom_period, 'very_early'::harvest_season, 'Vigorous, strong central leader', 'Upright, strong central leader'),
  ('hark-pecan', 'good'::quality_rating, 'fair'::quality_rating, 7.35, 56.0,
   'Light-colored, well-filled kernels with sweet, rich flavor', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"resistant"}',
   'mid'::bloom_period, 'mid'::harvest_season, 'Moderate to vigorous', 'Spreading, open canopy'),
  ('major-pecan', 'good'::quality_rating, 'fair'::quality_rating, 6.0, 49.0,
   'Cream to golden kernels with broad, shallow dorsal grooves', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Moderate, slow to come into bearing', 'Large, spreading crown'),
  ('greenriver-pecan', 'good'::quality_rating, 'fair'::quality_rating, 6.4, 51.0,
   'Golden-colored kernels with wide dorsal grooves. Pleasant, sweet flavor', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid'::bloom_period, 'mid'::harvest_season, 'Moderate to vigorous', 'Upright-spreading'),
  ('posey-pecan', 'good'::quality_rating, 'fair'::quality_rating, 6.2, 54.0,
   'Well-filled kernels. Sweet, slightly richer flavor than typical southern pecans', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, large tree', 'Large, spreading native form'),
  ('shepherd-pecan', 'good'::quality_rating, 'fair'::quality_rating, 7.0, 53.0,
   'Well-filled kernels with good cracking quality and pleasant flavor', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid'::bloom_period, 'mid'::harvest_season, 'Vigorous, consistent yielder', 'Upright-spreading, large tree'),
  ('colby-pecan', 'good'::quality_rating, 'fair'::quality_rating, 7.6, 45.0,
   'Golden kernels, sweet and meaty', 'good'::quality_rating, 'fair'::quality_rating,
   '{"pecan_scab":"moderate","downy_spot":"moderate"}',
   'mid_late'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, large tree', 'Spreading, large crown'),
  ('mullahy-pecan', 'fair'::quality_rating, 'fair'::quality_rating, 5.8, 48.0,
   'Small but well-filled kernels with sweet flavor typical of northern pecans', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid_late'::bloom_period, 'mid_late'::harvest_season, 'Moderate', 'Medium-sized, spreading'),
  ('warren-pecan', 'good'::quality_rating, 'fair'::quality_rating, 6.5, 50.0,
   'Good cracking quality with sweet, well-filled kernels', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"moderate","downy_spot":"moderate"}',
   'mid'::bloom_period, 'early_mid'::harvest_season, 'Moderate to vigorous', 'Spreading, native pecan form'),
  ('witte-pecan', 'fair'::quality_rating, 'fair'::quality_rating, 5.5, 48.0,
   'Small but sweet, well-filled kernels', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"resistant","downy_spot":"moderate"}',
   'mid_late'::bloom_period, 'mid_late'::harvest_season, 'Moderate', 'Medium-sized, spreading'),
  ('lucas-pecan', 'fair'::quality_rating, 'fair'::quality_rating, 6.2, 54.0,
   'Well-filled kernels with mild, sweet pecan flavor', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"moderate","downy_spot":"moderate"}',
   'mid'::bloom_period, 'early'::harvest_season, 'Moderate', 'Medium-sized, upright-spreading'),

  -- Shagbark Hickory
  ('yoder-no1-shagbark', 'good'::quality_rating, 'poor'::quality_rating, 7.0, 28.0,
   'Rich, sweet hickory flavor. Classic shagbark taste prized for baking and eating fresh', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate"}',
   'mid'::bloom_period, 'late'::harvest_season, 'Vigorous, slow to establish but long-lived', 'Large upright tree with shaggy bark'),
  ('grainger-shagbark', 'excellent'::quality_rating, 'poor'::quality_rating, 10.0, 30.0,
   'Excellent rich hickory flavor. Thin shell cracks easily into halves', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate","hickory_weevil":"resistant"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, productive', 'Large, spreading shagbark form'),
  ('porter-shagbark', 'good'::quality_rating, 'poor'::quality_rating, 7.5, 29.0,
   'Rich hickory flavor. Well-filled kernels that crack cleanly', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, slow to bear', 'Large upright-spreading shagbark'),
  ('wilcox-shagbark', 'good'::quality_rating, 'poor'::quality_rating, 7.0, 28.0,
   'Classic shagbark hickory flavor. Sweet, rich, and distinctive', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous', 'Large shagbark form'),
  ('blyth-shagbark', 'good'::quality_rating, 'poor'::quality_rating, 9.0, 28.0,
   'Sweet, rich hickory flavor. Large kernel for a shagbark', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous', 'Large shagbark form'),

  -- Shellbark Hickory
  ('keystone-shellbark', 'good'::quality_rating, 'poor'::quality_rating, 18.0, 25.0,
   'Very large, sweet shellbark nut. Rich flavor superior to most hickories', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","anthracnose":"moderate"}',
   'mid_late'::bloom_period, 'late'::harvest_season, 'Moderate to vigorous, slow to establish', 'Large upright tree'),
  ('henry-shellbark', 'excellent'::quality_rating, 'poor'::quality_rating, 17.0, 26.0,
   'Large, well-filled nut with sweet shellbark flavor. Cracks fairly easily', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"hickory_bark_beetle":"moderate","hickory_weevil":"resistant","anthracnose":"moderate"}',
   'mid_late'::bloom_period, 'late'::harvest_season, 'Vigorous, lateral bearing increases productivity', 'Large upright shellbark form'),

  -- Hicans
  ('james-hican', 'good'::quality_rating, 'good'::quality_rating, 16.0, 30.0,
   'Intermediate between pecan and hickory. Rich, complex flavor with pecan sweetness and hickory depth', 'excellent'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"moderate","hickory_bark_beetle":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, faster growth than pure hickory', 'Large, upright tree with pecan-like form'),
  ('burton-hican', 'good'::quality_rating, 'fair'::quality_rating, 10.0, 32.0,
   'Pecan-like sweetness with hickory richness. Good cracking quality', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"moderate","hickory_bark_beetle":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous, grows faster than pure hickory', 'Large spreading tree, intermediate pecan-hickory form'),
  ('dooley-hican', 'good'::quality_rating, 'fair'::quality_rating, 9.0, 33.0,
   'Pecan-like flavor with hickory undertones. Well-filled kernels', 'good'::quality_rating, 'good'::quality_rating,
   '{"pecan_scab":"moderate","hickory_bark_beetle":"moderate"}',
   'mid'::bloom_period, 'mid_late'::harvest_season, 'Vigorous', 'Large tree, intermediate hickory-pecan form'),
  ('abbott-hican', 'fair'::quality_rating, 'good'::quality_rating, 6.0, 35.0,
   'Pecan-like flavor, milder than shagbark hicans. Some bitternut influence may be detectable', 'fair'::quality_rating, 'fair'::quality_rating,
   '{"pecan_scab":"moderate","hickory_bark_beetle":"resistant"}',
   'early_mid'::bloom_period, 'early_mid'::harvest_season, 'Vigorous, fast-growing like bitternut parent', 'Upright, pecan-like form')
) AS v(slug, yield_potential, precocity, nut_weight_g, kernel_percentage,
       flavor_profile, flavor_rating, storage_quality, disease_resistance,
       bloom_period, harvest_season, vigor, tree_form)
JOIN cultivars c ON c.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM cultivar_traits ct WHERE ct.cultivar_id = c.id)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 3: ALIASES
-- ============================================================================

INSERT INTO aliases (alias_text, normalized_text, target_type, target_id)
SELECT v.alias_text, lower(v.alias_text), 'cultivar', c.id
FROM (VALUES
  ('kanza-pecan', 'Kanza Pecan'),
  ('pawnee-pecan', 'Pawnee Pecan'),
  ('major-pecan', 'Major Pecan'),
  ('colby-pecan', 'Colby Pecan'),
  ('james-hican', 'James Hican'),
  ('james-hican', 'James Hickan'),
  ('burton-hican', 'Burton Hican'),
  ('dooley-hican', 'Dooley Hican'),
  ('abbott-hican', 'Abbott Hican'),
  ('abbott-hican', 'Abbott Bitcan'),
  ('yoder-no1-shagbark', 'Yoder No. 1'),
  ('yoder-no1-shagbark', 'Yoder Number 1'),
  ('yoder-no1-shagbark', 'Yoder #1 Shagbark'),
  ('grainger-shagbark', 'Grainger Shagbark'),
  ('keystone-shellbark', 'Keystone Shellbark'),
  ('henry-shellbark', 'Henry Shellbark')
) AS v(slug, alias_text)
JOIN cultivars c ON c.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM aliases a WHERE a.normalized_text = lower(v.alias_text) AND a.target_type = 'cultivar' AND a.target_id = c.id
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: REFRESH SEARCH INDEX
-- ============================================================================

REFRESH MATERIALIZED VIEW CONCURRENTLY material_search_index;

COMMIT;
