-- ============================================================================
-- MIGRATION 003: Growing Profiles & Cultivar Traits
-- Species-level growing requirements + cultivar-level production traits.
-- Powers the "Can I grow this?" zone check and detailed cultivar cards.
-- ============================================================================

BEGIN;

-- ── Enums for structured attributes ──

DO $$ BEGIN
  CREATE TYPE sun_requirement AS ENUM ('full_sun', 'part_shade', 'full_shade', 'shade_tolerant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE soil_drainage AS ENUM ('well_drained', 'moderate', 'tolerates_wet', 'requires_wet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE growth_rate AS ENUM ('slow', 'moderate', 'fast', 'very_fast');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE root_architecture AS ENUM ('taproot', 'fibrous', 'spreading', 'suckering');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE harvest_season AS ENUM ('very_early', 'early', 'early_mid', 'mid', 'mid_late', 'late', 'very_late');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bloom_period AS ENUM ('very_early', 'early', 'early_mid', 'mid', 'mid_late', 'late', 'very_late');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quality_rating AS ENUM ('poor', 'fair', 'good', 'excellent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Species-level growing profiles (one-to-one with plant_entities)
-- Most fields nullable — populated progressively as data is curated.
-- ============================================================================

CREATE TABLE IF NOT EXISTS species_growing_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id   UUID NOT NULL UNIQUE REFERENCES plant_entities(id) ON DELETE CASCADE,
  
  -- Hardiness & climate
  usda_zone_min     SMALLINT,              -- e.g. 4 (meaning zone 4a)
  usda_zone_max     SMALLINT,              -- e.g. 9
  usda_zone_notes   TEXT,                  -- "Zone 4 with wind protection"
  ahs_heat_zone_max SMALLINT,              -- AHS heat zone (often overlooked but matters)
  chill_hours_min   INTEGER,               -- vernalization requirement
  chill_hours_max   INTEGER,
  chill_hours_notes TEXT,

  -- Soil
  soil_ph_min       NUMERIC(3,1),          -- e.g. 5.5
  soil_ph_max       NUMERIC(3,1),          -- e.g. 7.5
  soil_drainage     soil_drainage,
  soil_texture_tolerances TEXT[],           -- ['clay', 'loam', 'sand', 'rocky']
  soil_notes        TEXT,

  -- Light & water
  sun_requirement   sun_requirement,
  water_needs       TEXT,                  -- 'low', 'moderate', 'high' or descriptive
  drought_tolerance SMALLINT,              -- 1-5 scale
  flood_tolerance   SMALLINT,              -- 1-5 scale

  -- Size & form
  mature_height_min_ft  NUMERIC(5,1),
  mature_height_max_ft  NUMERIC(5,1),
  mature_spread_min_ft  NUMERIC(5,1),
  mature_spread_max_ft  NUMERIC(5,1),
  growth_rate       growth_rate,
  root_architecture root_architecture,
  form_description  TEXT,                  -- "Multi-stemmed shrub" or "Single-trunk tree"

  -- Ecology
  native_range_description TEXT,
  native_range_geojson     JSONB,          -- optional GeoJSON polygon for map overlay
  nitrogen_fixer    BOOLEAN DEFAULT FALSE,
  allelopathic      BOOLEAN DEFAULT FALSE,
  allelopathic_notes TEXT,                 -- e.g. "Produces juglone — toxic to many plants within root zone"
  wildlife_value    TEXT[],                -- ['nut_source', 'nesting_habitat', 'pollinator_support']
  ecological_notes  TEXT,

  -- Production timing (species-level defaults, cultivars may override)
  years_to_bearing_min INTEGER,
  years_to_bearing_max INTEGER,
  productive_lifespan_years INTEGER,       -- how long a mature planting produces
  harvest_season    harvest_season,

  -- Miscellaneous
  companion_plants  TEXT[],                -- known good companions
  spacing_notes     TEXT,                  -- "Plant 15-20ft apart in orchard settings"
  pruning_notes     TEXT,

  curation_status   curation_status NOT NULL DEFAULT 'draft',
  data_sources      TEXT[],                -- where this info came from (extension publications, etc.)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_zone_range CHECK (usda_zone_min IS NULL OR usda_zone_max IS NULL OR usda_zone_min <= usda_zone_max),
  CONSTRAINT chk_ph_range CHECK (soil_ph_min IS NULL OR soil_ph_max IS NULL OR soil_ph_min <= soil_ph_max),
  CONSTRAINT chk_height_range CHECK (mature_height_min_ft IS NULL OR mature_height_max_ft IS NULL OR mature_height_min_ft <= mature_height_max_ft),
  CONSTRAINT chk_drought_scale CHECK (drought_tolerance IS NULL OR (drought_tolerance >= 1 AND drought_tolerance <= 5)),
  CONSTRAINT chk_flood_scale CHECK (flood_tolerance IS NULL OR (flood_tolerance >= 1 AND flood_tolerance <= 5))
);

CREATE INDEX IF NOT EXISTS idx_growing_profiles_entity ON species_growing_profiles(plant_entity_id);
CREATE INDEX IF NOT EXISTS idx_growing_profiles_zones ON species_growing_profiles(usda_zone_min, usda_zone_max);

CREATE TRIGGER trg_growing_profiles_updated
  BEFORE UPDATE ON species_growing_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Cultivar-level traits (one-to-one with cultivars)
-- Production characteristics, disease resistance, flavor, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS cultivar_traits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_id     UUID NOT NULL UNIQUE REFERENCES cultivars(id) ON DELETE CASCADE,

  -- Production characteristics
  yield_potential   quality_rating,         -- relative to species norms
  precocity         quality_rating,         -- how quickly it starts bearing
  nut_weight_g      NUMERIC(6,2),           -- average nut/fruit weight in grams
  kernel_percentage NUMERIC(5,2),           -- % of nut that is edible kernel
  fruit_size_notes  TEXT,                   -- free text for non-nut crops

  -- Flavor & quality
  flavor_profile    TEXT,                   -- "Rich, buttery, mild" or more structured
  flavor_rating     quality_rating,
  storage_quality   quality_rating,
  processing_ease   quality_rating,         -- blanching, cracking, etc.
  culinary_uses     TEXT[],                 -- ['fresh_eating', 'roasting', 'oil', 'flour', 'chocolate']

  -- Disease resistance (JSONB — keys vary by genus)
  -- Hazelnuts: {"efb": "immune", "bud_mite": "resistant", "bacterial_blight": "susceptible"}
  -- Apples: {"fire_blight": "resistant", "apple_scab": "immune", "cedar_rust": "susceptible"}
  -- Chestnuts: {"chestnut_blight": "resistant", "phytophthora": "susceptible"}
  disease_resistance JSONB DEFAULT '{}',
  disease_notes      TEXT,

  -- Bloom & pollination timing (cultivar-specific overrides)
  bloom_period      bloom_period,
  bloom_period_notes TEXT,                  -- "Extended bloom, overlaps with many cultivars"

  -- Growing habit (cultivar-specific deviations from species norms)
  vigor             TEXT,                   -- 'compact', 'moderate', 'vigorous'
  tree_form         TEXT,                   -- 'upright', 'spreading', 'weeping', 'columnar'
  cultivar_height_ft NUMERIC(5,1),          -- if notably different from species
  
  -- Zone refinement (cultivar may differ from species)
  zone_min_override SMALLINT,              -- e.g. a particularly hardy cultivar
  zone_max_override SMALLINT,
  zone_notes        TEXT,                  -- "Tested to -30°F in Minnesota trials"

  -- Harvest
  harvest_season    harvest_season,         -- cultivar-specific
  harvest_window_days INTEGER,              -- days of optimal harvest
  ripening_notes    TEXT,

  curation_status   curation_status NOT NULL DEFAULT 'draft',
  data_sources      TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cultivar_traits_cultivar ON cultivar_traits(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_traits_disease ON cultivar_traits USING gin(disease_resistance);

CREATE TRIGGER trg_cultivar_traits_updated
  BEFORE UPDATE ON cultivar_traits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read
ALTER TABLE species_growing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivar_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read species_growing_profiles" ON species_growing_profiles FOR SELECT USING (true);
CREATE POLICY "Public read cultivar_traits" ON cultivar_traits FOR SELECT USING (true);

COMMENT ON TABLE species_growing_profiles IS 'Growing requirements at the species level. Powers zone checks, soil compatibility, and the "Can I grow this?" feature.';
COMMENT ON TABLE cultivar_traits IS 'Production and quality traits per cultivar. Disease resistance stored as JSONB for cross-genus flexibility.';
COMMENT ON COLUMN cultivar_traits.disease_resistance IS 'JSONB map of disease → resistance level. Keys vary by genus (EFB for hazelnuts, fire blight for apples, etc.). Values: immune, resistant, tolerant, susceptible, highly_susceptible.';

COMMIT;
