/*
  022_genus_prunus.sql
  PlantCommerce - Genus seeding: Prunus (Stone Fruit)
  Taxonomy node UUID: d0000000-0000-0000-0000-000000000009
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) plant_entities - Prunus
-- ---------------------------------------------------------------------------

INSERT INTO plant_entities (
  slug,
  canonical_name,
  botanical_name,
  family,
  genus,
  species,
  entity_type,
  taxonomy_confidence,
  taxonomy_node_id,
  description,
  curation_status
) VALUES
  (
    'prunus-persica',
    'Peach / Nectarine',
    'Prunus persica',
    'Rosaceae',
    'Prunus',
    'persica',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Peach (and nectarines) - warm-temperate stone fruit tree; widely cultivated; typically self-fertile; insect pollinated.',
    'draft'
  ),
  (
    'prunus-armeniaca',
    'Apricot',
    'Prunus armeniaca',
    'Rosaceae',
    'Prunus',
    'armeniaca',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Apricot - early-blooming stone fruit tree; frost-sensitive bloom; insect pollinated; self-fertility varies.',
    'draft'
  ),
  (
    'prunus-avium',
    'Sweet Cherry',
    'Prunus avium',
    'Rosaceae',
    'Prunus',
    'avium',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Sweet cherry - high-value temperate fruit tree; most cultivars require cross-pollination; insect pollinated.',
    'draft'
  ),
  (
    'prunus-cerasus',
    'Sour Cherry',
    'Prunus cerasus',
    'Rosaceae',
    'Prunus',
    'cerasus',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Sour cherry (tart cherry) - cold-hardy temperate fruit tree; generally self-fertile; insect pollinated.',
    'draft'
  ),
  (
    'prunus-dulcis',
    'Almond',
    'Prunus dulcis',
    'Rosaceae',
    'Prunus',
    'dulcis',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Almond - Mediterranean-climate stone fruit relative grown for nuts; typically requires cross-pollination; insect pollinated.',
    'draft'
  ),
  (
    'prunus-salicina',
    'Japanese Plum',
    'Prunus salicina',
    'Rosaceae',
    'Prunus',
    'salicina',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Japanese plum - fruiting plum group; pollination requirements vary; insect pollinated.',
    'draft'
  ),
  (
    'prunus-cerasifera',
    'Cherry Plum',
    'Prunus cerasifera',
    'Rosaceae',
    'Prunus',
    'cerasifera',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Cherry plum (myrobalan) - hardy plum species used for rootstocks and ornamentals; insect pollinated.',
    'draft'
  ),
  (
    'prunus-spinosa',
    'Blackthorn / Sloe',
    'Prunus spinosa',
    'Rosaceae',
    'Prunus',
    'spinosa',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Blackthorn (sloe) - thorny shrub/small tree with astringent fruit; hardy; insect pollinated; sucker-forming.',
    'draft'
  ),
  (
    'prunus-domestica',
    'European Plum',
    'Prunus domestica',
    'Rosaceae',
    'Prunus',
    'domestica',
    'hybrid_species',
    'provisional',
    'd0000000-0000-0000-0000-000000000009',
    'European plum - widely cultivated temperate plum; often treated as an ancient hybrid lineage; insect pollinated; pollination varies by cultivar.',
    'draft'
  )
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) species_growing_profiles - one per Prunus entity
-- ---------------------------------------------------------------------------

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5, 9,
  NULL,
  400, 1200,
  'Chill hour requirements vary widely by cultivar; low-chill to high-chill selections exist.',
  6.0, 7.0,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Avoid heavy, waterlogged soils; drainage is critical to reduce root diseases.',
  'full_sun',
  'Moderate; irrigate during establishment and during drought for consistent fruit set/size.',
  3,
  2,
  10, 25,
  10, 25,
  'moderate',
  'fibrous',
  'Small to medium deciduous fruit tree; often maintained smaller via pruning and training.',
  'Native to NW China; cultivated worldwide in temperate regions.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Nectarines are the same species as peaches; tree size strongly influenced by pruning/training and rootstock.',
  2, 4,
  15,
  'mid',
  ARRAY[]::TEXT[],
  'Typical orchard spacing varies by rootstock/training; dwarf systems closer.',
  'Annual pruning to renew fruiting wood; open-center or trained systems common.',
  'draft',
  ARRAY['general horticultural references; values represent species-level midpoints across cultivar variability']
FROM plant_entities pe
WHERE pe.slug = 'prunus-persica'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5, 8,
  NULL,
  300, 1000,
  'Many apricots bloom very early; site selection to avoid late frosts is often more limiting than chill hours.',
  6.0, 7.5,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Sensitive to poor drainage; avoid heavy clay without drainage improvements.',
  'full_sun',
  'Moderate; drought stress reduces fruit size and increases drop.',
  3,
  2,
  12, 25,
  12, 25,
  'moderate',
  'fibrous',
  'Small to medium deciduous tree; early bloom can be frost-prone.',
  'Native range commonly described from Central/Western Asia; long history of cultivation across Eurasia.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Early flowering increases risk of crop loss from spring freezes; consider protected microclimates.',
  3, 5,
  20,
  'early',
  ARRAY[]::TEXT[],
  'Spacing varies by training system and rootstock vigor.',
  'Prune to balance vegetative growth and spur renewal; remove diseased wood promptly.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-armeniaca'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5, 8,
  NULL,
  700, 1400,
  'Sweet cherries typically require substantial winter chill; cultivar variation exists.',
  6.0, 7.5,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Highly sensitive to waterlogged soils; drainage is critical.',
  'full_sun',
  'Moderate; consistent moisture supports fruit size and reduces stress.',
  3,
  1,
  15, 35,
  15, 30,
  'moderate',
  'spreading',
  'Medium to large deciduous tree; orchard forms often trained and kept smaller.',
  'Native to Europe and Western Asia; widely naturalized and cultivated in temperate regions.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Most cultivars require compatible pollinizers; bloom overlap is essential.',
  4, 7,
  25,
  'early_mid',
  ARRAY[]::TEXT[],
  'Standard orchard spacing wider on vigorous rootstocks; high-density systems possible with dwarfing rootstocks.',
  'Prune to manage vigor and light; spur management important for productivity.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-avium'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4, 8,
  NULL,
  800, 1400,
  'Sour cherries are generally cold-hardy and tolerate substantial winter chill.',
  6.0, 7.5,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Avoid prolonged saturated soils; improves health and reduces canker risk.',
  'full_sun',
  'Moderate; supplemental irrigation improves yields in dry summers.',
  3,
  2,
  10, 25,
  10, 20,
  'moderate',
  'spreading',
  'Small to medium deciduous tree; often more compact than sweet cherry.',
  'Likely of Eurasian origin; cultivated widely in temperate climates.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Generally self-fertile; still benefits from pollinator activity for best set.',
  3, 5,
  20,
  'early_mid',
  ARRAY[]::TEXT[],
  'Spacing depends on rootstock and training system.',
  'Prune to maintain renewal of bearing wood and good air flow.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-cerasus'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  7, 9,
  NULL,
  200, 500,
  'Many commercial almonds are adapted to relatively low chill but require mild winters and dry springs for disease control.',
  6.0, 7.5,
  'well_drained',
  ARRAY['loam','sandy_loam'],
  'Very sensitive to wet feet; prefers lighter, well-drained soils.',
  'full_sun',
  'Low to moderate; drought-tolerant once established but yield benefits from irrigation.',
  4,
  1,
  12, 30,
  12, 25,
  'moderate',
  'fibrous',
  'Small to medium deciduous tree grown primarily for edible seeds (nuts).',
  'Native to the Mediterranean region and Western Asia; widely cultivated in Mediterranean climates.',
  false,
  false,
  NULL,
  ARRAY['pollinators'],
  'Bloom is early; frost risk can be significant outside suitable climates.',
  3, 5,
  25,
  'mid',
  ARRAY[]::TEXT[],
  'Orchard spacing varies with training system and vigor.',
  'Prune for structure and light; manage for disease in wetter climates.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-dulcis'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  5, 9,
  NULL,
  300, 800,
  'Japanese plums often have moderate chill requirements; cultivar variation is substantial.',
  5.5, 7.0,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Avoid poorly drained soils; manage fertility to prevent overly vigorous, disease-prone growth.',
  'full_sun',
  'Moderate; regular moisture supports fruit sizing.',
  3,
  2,
  12, 25,
  12, 25,
  'moderate',
  'fibrous',
  'Small to medium deciduous tree; generally earlier-bearing than some European plums.',
  'Native to China; widely cultivated and hybridized in temperate regions.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Many cultivars require cross-pollination; bloom overlap is important.',
  3, 5,
  20,
  'mid',
  ARRAY[]::TEXT[],
  'Spacing varies by rootstock and training system.',
  'Prune to maintain light and renew fruiting wood; thin fruit to prevent limb breakage.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-salicina'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4, 8,
  NULL,
  400, 900,
  'Widely used as a rootstock; phenology and chill needs vary by selection.',
  5.5, 7.5,
  'well_drained',
  ARRAY['loam','sandy_loam','silt_loam'],
  'Tolerates a range but performs best with good drainage.',
  'full_sun',
  'Moderate; withstands some drought once established.',
  3,
  2,
  10, 25,
  10, 25,
  'fast',
  'spreading',
  'Small to medium deciduous tree; also used ornamentally; common rootstock species.',
  'Native to southeastern Europe and western Asia; widely naturalized and cultivated.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Important in plum breeding and rootstock selection; can be vigorous and adaptable.',
  2, 4,
  20,
  'early_mid',
  ARRAY[]::TEXT[],
  'Spacing depends on intended use (rootstock orchard vs ornamental).',
  'Prune for structure; remove crossing branches and maintain airflow.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-cerasifera'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  3, 8,
  NULL,
  800, 1400,
  'Hardy species adapted to cold winters; chill typically not limiting in its primary growing range.',
  6.0, 8.0,
  'well_drained',
  ARRAY['loam','clay_loam','sandy_loam'],
  'Tolerates heavier soils better than many Prunus when not waterlogged; can handle poorer sites.',
  'full_sun',
  'Low to moderate; drought-tolerant once established.',
  4,
  2,
  6, 15,
  6, 15,
  'moderate',
  'suckering',
  'Thorny, suckering shrub to small tree; forms dense thickets.',
  'Native across Europe and western Asia; common in hedgerows and woodland edges.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds','small_mammals'],
  'Suckering growth and thorniness make it useful for wildlife hedges; fruit feeds birds and mammals.',
  4, 7,
  30,
  'late',
  ARRAY[]::TEXT[],
  'Plant spacing depends on hedge vs specimen use.',
  'Prune after flowering/fruiting for hedge management; remove suckers where unwanted.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-spinosa'
ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min,
  usda_zone_max,
  ahs_heat_zone_max,
  chill_hours_min,
  chill_hours_max,
  chill_hours_notes,
  soil_ph_min,
  soil_ph_max,
  soil_drainage,
  soil_texture_tolerances,
  soil_notes,
  sun_requirement,
  water_needs,
  drought_tolerance,
  flood_tolerance,
  mature_height_min_ft,
  mature_height_max_ft,
  mature_spread_min_ft,
  mature_spread_max_ft,
  growth_rate,
  root_architecture,
  form_description,
  native_range_description,
  nitrogen_fixer,
  allelopathic,
  allelopathic_notes,
  wildlife_value,
  ecological_notes,
  years_to_bearing_min,
  years_to_bearing_max,
  productive_lifespan_years,
  harvest_season,
  companion_plants,
  spacing_notes,
  pruning_notes,
  curation_status,
  data_sources
)
SELECT
  pe.id,
  4, 9,
  NULL,
  700, 1400,
  'European plum chill needs vary by cultivar; many perform well in temperate regions with cold winters.',
  5.8, 7.5,
  'well_drained',
  ARRAY['loam','clay_loam','silt_loam','sandy_loam'],
  'Prefers fertile, well-drained soils; avoid prolonged waterlogging.',
  'full_sun',
  'Moderate; drought stress can reduce fruit quality.',
  3,
  2,
  12, 25,
  12, 25,
  'moderate',
  'fibrous',
  'Small to medium deciduous fruit tree; commonly trained and pruned in orchards.',
  'Long-cultivated across Europe and western Asia; species origin described as complex/ancient hybrid lineage in many references.',
  false,
  false,
  NULL,
  ARRAY['pollinators','birds'],
  'Often treated as an ancient hybrid lineage (commonly cited parents include P. cerasifera and P. spinosa); cultivar pollination needs vary.',
  3, 6,
  25,
  'mid',
  ARRAY[]::TEXT[],
  'Spacing varies by rootstock and training system.',
  'Prune to maintain fruiting wood and airflow; thin fruit where needed.',
  'draft',
  ARRAY['general horticultural references; species-level midpoints']
FROM plant_entities pe
WHERE pe.slug = 'prunus-domestica'
ON CONFLICT (plant_entity_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) species_pollination_profiles - one per Prunus entity
-- ---------------------------------------------------------------------------

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-persica'),
  'self_fertile',
  'insect',
  0,
  200,
  'early',
  'Peaches/nectarines are typically self-fertile, but bee activity improves set and uniformity; bloom overlap for cross-pollination not usually required.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-armeniaca'),
  'partially_self',
  'insect',
  1,
  200,
  'very_early',
  'Apricot self-fertility varies; many set better with a compatible pollinizer. Very early bloom makes weather/pollinator activity a frequent limiting factor.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-avium'),
  'cross_required',
  'insect',
  1,
  200,
  'mid',
  'Most sweet cherries require cross-pollination with compatible cultivars; ensure bloom overlap and compatibility. Bees are primary pollinators.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-cerasus'),
  'self_fertile',
  'insect',
  0,
  200,
  'mid',
  'Sour cherries are generally self-fertile; pollinator presence still improves fruit set and size.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-dulcis'),
  'cross_required',
  'insect',
  1,
  200,
  'very_early',
  'Almonds are typically cross-pollinated and strongly dependent on bees; matching bloom overlap and compatibility is critical.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-salicina'),
  'partially_self',
  'insect',
  1,
  200,
  'early',
  'Japanese plum pollination varies by cultivar; many benefit from or require cross-pollination. Bees are primary pollinators.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-cerasifera'),
  'partially_self',
  'insect',
  1,
  200,
  'early',
  'Cherry plum often flowers early; some selections set alone but cross-pollination improves yield. Useful as a pollinizer and rootstock species.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-spinosa'),
  'cross_required',
  'insect',
  1,
  200,
  'mid',
  'Blackthorn is insect-pollinated and typically benefits from cross-pollination within thickets/hedgerows; supports early-season pollinators.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type,
  pollination_mechanism,
  min_pollinizer_count,
  max_pollinizer_distance_ft,
  bloom_period_general,
  notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'prunus-domestica'),
  'partially_self',
  'insect',
  1,
  200,
  'mid',
  'European plum pollination varies by cultivar; many set better with compatible pollinizers and overlapping bloom. Bees are primary pollinators.'
) ON CONFLICT (plant_entity_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) plant_entity_parents - hybrid parentage (WHERE NOT EXISTS guards)
-- ---------------------------------------------------------------------------

INSERT INTO plant_entity_parents (
  hybrid_id,
  parent_id,
  contribution_percent,
  data_source,
  confidence_note
)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'prunus-domestica'),
  (SELECT id FROM plant_entities WHERE slug = 'prunus-cerasifera'),
  NULL,
  'General botany references; commonly cited parentage for ancient European plum lineage.',
  'Widely cited as part of the ancestral parentage; treated as provisional due to complex domestication history.'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'prunus-domestica')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'prunus-cerasifera')
) ON CONFLICT DO NOTHING;

INSERT INTO plant_entity_parents (
  hybrid_id,
  parent_id,
  contribution_percent,
  data_source,
  confidence_note
)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'prunus-domestica'),
  (SELECT id FROM plant_entities WHERE slug = 'prunus-spinosa'),
  NULL,
  'General botany references; commonly cited parentage for ancient European plum lineage.',
  'Widely cited as part of the ancestral parentage; treated as provisional due to complex domestication history.'
WHERE NOT EXISTS (
  SELECT 1
  FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'prunus-domestica')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'prunus-spinosa')
) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) Refresh search index materialized view
-- ---------------------------------------------------------------------------

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
