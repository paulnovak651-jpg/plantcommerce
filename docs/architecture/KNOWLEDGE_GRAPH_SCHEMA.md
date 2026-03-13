# Plant Commerce — Knowledge Graph Schema Specification

*Migration plan for Wave 4. Created 2026-02-24.*
*Status: ✅ All migrations in this document have been applied. This file is retained as a reference for the schema design decisions.*
*Actual migrations are in `sql/migrations/`.*

---

## Migration 002: Taxonomy

Adds the taxonomic hierarchy that powers the "where does this sit in the plant kingdom" visualization.

```sql
-- 002_taxonomy.sql

BEGIN;

-- Enum for taxonomic ranks
CREATE TYPE taxonomic_rank AS ENUM (
  'kingdom', 'division', 'class', 'order', 'family', 'genus'
);

-- The tree of life (for permaculture-relevant lineages)
CREATE TABLE taxonomy_nodes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank            taxonomic_rank NOT NULL,
  name            TEXT NOT NULL,              -- e.g. "Betulaceae", "Corylus"
  botanical_name  TEXT,                       -- full Latin form if differs from name
  slug            TEXT UNIQUE NOT NULL,
  parent_id       UUID REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  description     TEXT,
  permaculture_relevant BOOLEAN DEFAULT FALSE, -- highlight food-producing lineages
  display_order   INTEGER DEFAULT 0,          -- sibling sort order
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_taxonomy_parent ON taxonomy_nodes(parent_id);
CREATE INDEX idx_taxonomy_rank ON taxonomy_nodes(rank);
CREATE INDEX idx_taxonomy_slug ON taxonomy_nodes(slug);

-- Link plant_entities to their position in the taxonomy
ALTER TABLE plant_entities
  ADD COLUMN taxonomy_node_id UUID REFERENCES taxonomy_nodes(id);

CREATE INDEX idx_plant_entities_taxonomy ON plant_entities(taxonomy_node_id);

-- Trigger for updated_at
CREATE TRIGGER trg_taxonomy_updated
  BEFORE UPDATE ON taxonomy_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read
ALTER TABLE taxonomy_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read taxonomy_nodes" ON taxonomy_nodes FOR SELECT USING (true);

-- ─── Seed data: Permaculture-relevant lineages ───

-- Kingdom
INSERT INTO taxonomy_nodes (slug, rank, name, parent_id, permaculture_relevant) VALUES
('plantae', 'kingdom', 'Plantae', NULL, TRUE);

-- Division
INSERT INTO taxonomy_nodes (slug, rank, name, parent_id, permaculture_relevant) VALUES
('magnoliophyta', 'division', 'Magnoliophyta',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'plantae'), TRUE);

-- Class
INSERT INTO taxonomy_nodes (slug, rank, name, botanical_name, parent_id, permaculture_relevant) VALUES
('magnoliopsida', 'class', 'Magnoliopsida', 'Magnoliopsida (Dicotyledons)',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliophyta'), TRUE);

-- Orders (the key food-producing orders for permaculture)
INSERT INTO taxonomy_nodes (slug, rank, name, parent_id, permaculture_relevant, description) VALUES
('fagales', 'order', 'Fagales',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliopsida'), TRUE,
  'Nut-bearing trees: hazels, chestnuts, walnuts, oaks, birches'),
('rosales', 'order', 'Rosales',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliopsida'), TRUE,
  'Stone fruits, pome fruits, berries: apples, pears, plums, cherries'),
('ericales', 'order', 'Ericales',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliopsida'), TRUE,
  'Blueberries, persimmons, kiwifruit'),
('dipsacales', 'order', 'Dipsacales',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliopsida'), TRUE,
  'Elderberries and viburnums'),
('proteales', 'order', 'Proteales',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'magnoliopsida'), TRUE,
  'Proteas, macadamias, Chilean hazelnut');

-- Families
INSERT INTO taxonomy_nodes (slug, rank, name, parent_id, permaculture_relevant, description) VALUES
-- Fagales families
('betulaceae', 'family', 'Betulaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'fagales'), TRUE,
  'Birch family — includes hazels (Corylus)'),
('fagaceae', 'family', 'Fagaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'fagales'), TRUE,
  'Beech family — includes chestnuts (Castanea) and oaks (Quercus)'),
('juglandaceae', 'family', 'Juglandaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'fagales'), TRUE,
  'Walnut family — includes walnuts (Juglans), hickories and pecans (Carya)'),
-- Rosales families
('rosaceae', 'family', 'Rosaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'rosales'), TRUE,
  'Rose family — apples, pears, cherries, plums, peaches, raspberries, strawberries'),
-- Ericales families
('ebenaceae', 'family', 'Ebenaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'ericales'), TRUE,
  'Ebony family — persimmons (Diospyros)'),
('ericaceae', 'family', 'Ericaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'ericales'), TRUE,
  'Heath family — blueberries, cranberries, huckleberries (Vaccinium)'),
-- Dipsacales families
('adoxaceae', 'family', 'Adoxaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'dipsacales'), TRUE,
  'Moschatel family — elderberries (Sambucus)'),
-- Proteales families
('proteaceae', 'family', 'Proteaceae',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'proteales'), TRUE,
  'Protea family — macadamias (Macadamia), Chilean hazelnut (Gevuina)');

-- Genera (the ones we will populate first)
INSERT INTO taxonomy_nodes (slug, rank, name, botanical_name, parent_id, permaculture_relevant, description) VALUES
('corylus', 'genus', 'Corylus', 'Corylus L.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'betulaceae'), TRUE,
  'Hazels — 15-20 species. Key food-producing genus for temperate permaculture.'),
('castanea', 'genus', 'Castanea', 'Castanea Mill.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'fagaceae'), TRUE,
  'Chestnuts — historically dominant food tree in eastern North America and Europe.'),
('juglans', 'genus', 'Juglans', 'Juglans L.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'juglandaceae'), TRUE,
  'Walnuts — black walnut, English walnut, butternut, heartnut.'),
('carya', 'genus', 'Carya', 'Carya Nutt.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'juglandaceae'), TRUE,
  'Hickories and pecans. Deep-rooted, long-lived nut trees.'),
('diospyros', 'genus', 'Diospyros', 'Diospyros L.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'ebenaceae'), TRUE,
  'Persimmons — American (D. virginiana) and Asian (D. kaki).'),
('sambucus', 'genus', 'Sambucus', 'Sambucus L.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'adoxaceae'), TRUE,
  'Elderberries — fast-growing, prolific fruit and flower producers.'),
('malus', 'genus', 'Malus', 'Malus Mill.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'rosaceae'), TRUE,
  'Apples and crabapples. Most widely grown temperate tree fruit.'),
('prunus', 'genus', 'Prunus', 'Prunus L.',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'rosaceae'), TRUE,
  'Stone fruits — cherries, plums, peaches, apricots, almonds.'),
('gevuina', 'genus', 'Gevuina', 'Gevuina Molina',
  (SELECT id FROM taxonomy_nodes WHERE slug = 'proteaceae'), TRUE,
  'Chilean hazelnut — monotypic genus. Not a true hazel (Corylus).');

-- Link existing plant_entities to taxonomy
UPDATE plant_entities
SET taxonomy_node_id = (SELECT id FROM taxonomy_nodes WHERE slug = 'corylus')
WHERE genus = 'Corylus';

-- Gevuina gets its own correct taxonomy node
UPDATE plant_entities
SET taxonomy_node_id = (SELECT id FROM taxonomy_nodes WHERE slug = 'gevuina')
WHERE slug = 'gevuina-avellana';

COMMIT;
```

### Recursive CTE for Taxonomy Path Query

This is the query that powers the TaxonomyPath component:

```sql
-- Get full lineage from a taxonomy node up to the kingdom
WITH RECURSIVE lineage AS (
  -- Start from the node
  SELECT id, rank, name, slug, parent_id, 0 AS depth
  FROM taxonomy_nodes
  WHERE id = $1  -- the plant_entity's taxonomy_node_id

  UNION ALL

  -- Walk up the tree
  SELECT tn.id, tn.rank, tn.name, tn.slug, tn.parent_id, l.depth + 1
  FROM taxonomy_nodes tn
  JOIN lineage l ON tn.id = l.parent_id
)
SELECT * FROM lineage ORDER BY depth DESC;
```

And for siblings at any level (to show "Corylus sits alongside Betula and Alnus"):

```sql
-- Get siblings of a taxonomy node
SELECT * FROM taxonomy_nodes
WHERE parent_id = (
  SELECT parent_id FROM taxonomy_nodes WHERE id = $1
)
AND id != $1
ORDER BY display_order, name;
```

---

## Migration 003: Growing Profiles

```sql
-- 003_growing_profiles.sql

BEGIN;

-- Enums for structured growing data
CREATE TYPE sun_requirement AS ENUM ('full_sun', 'full_to_part_sun', 'part_shade', 'shade_tolerant');
CREATE TYPE water_needs AS ENUM ('low', 'moderate', 'high');
CREATE TYPE soil_drainage AS ENUM ('well_drained', 'moderate', 'tolerates_wet', 'any');
CREATE TYPE growth_rate AS ENUM ('slow', 'moderate', 'fast');
CREATE TYPE root_type AS ENUM ('taproot', 'fibrous', 'spreading', 'mixed');
CREATE TYPE harvest_season AS ENUM ('early', 'mid', 'late', 'extended');

-- Species-level growing requirements
CREATE TABLE species_growing_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id     UUID NOT NULL UNIQUE REFERENCES plant_entities(id) ON DELETE CASCADE,

  -- Hardiness
  usda_zone_min       SMALLINT,       -- e.g. 4
  usda_zone_max       SMALLINT,       -- e.g. 9
  usda_zone_notes     TEXT,           -- "Zone 4 with wind protection"
  chill_hours_min     SMALLINT,       -- critical for fruit/nut crops
  chill_hours_max     SMALLINT,

  -- Soil
  soil_ph_min         NUMERIC(3,1),   -- e.g. 5.5
  soil_ph_max         NUMERIC(3,1),   -- e.g. 7.0
  soil_drainage       soil_drainage,
  soil_textures       TEXT[],         -- ['clay', 'loam', 'sand']
  soil_notes          TEXT,

  -- Light & water
  sun_requirement     sun_requirement,
  water_needs         water_needs,
  drought_tolerance   SMALLINT CHECK (drought_tolerance BETWEEN 1 AND 5),

  -- Size & form
  mature_height_min_ft NUMERIC(5,1),
  mature_height_max_ft NUMERIC(5,1),
  mature_spread_min_ft NUMERIC(5,1),
  mature_spread_max_ft NUMERIC(5,1),
  growth_rate         growth_rate,
  root_type           root_type,

  -- Ecology
  native_range        TEXT,           -- prose description
  nitrogen_fixer      BOOLEAN DEFAULT FALSE,
  allelopathic_notes  TEXT,           -- e.g. "Juglone toxicity affects..."
  wildlife_value      TEXT[],         -- ['squirrels', 'blue jays', 'deer browse']

  -- Production
  years_to_bearing_min SMALLINT,
  years_to_bearing_max SMALLINT,
  harvest_season      harvest_season,
  productive_lifespan_years SMALLINT, -- how long the tree produces

  -- Meta
  data_source         TEXT,           -- where this info came from
  curation_status     curation_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_growing_profiles_updated
  BEFORE UPDATE ON species_growing_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read
ALTER TABLE species_growing_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read species_growing_profiles" ON species_growing_profiles
  FOR SELECT USING (true);

-- ─── Seed data for existing Corylus species ───

-- European Hazelnut
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max, usda_zone_notes,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_textures,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_type,
  native_range, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_source, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana'),
  4, 9, 'Zone 4 selections available (NITKA, Photon). Most commercial cultivars zone 5+.',
  800, 1500,
  5.5, 7.5, 'well_drained', ARRAY['loam', 'sand', 'clay'],
  'full_to_part_sun', 'moderate', 3,
  12, 20, 12, 18,
  'moderate', 'fibrous',
  'Europe, western Asia, North Africa', FALSE,
  3, 5, 'mid', 80,
  'OSU Extension, Grimo Nut Nursery catalogs, USDA Plants Database',
  'published'
);

-- American Hazelnut
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  chill_hours_min, chill_hours_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_textures,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  growth_rate, root_type,
  native_range, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season, productive_lifespan_years,
  data_source, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-americana'),
  3, 9,
  800, 1800,
  4.5, 7.5, 'moderate', ARRAY['loam', 'sand', 'clay'],
  'full_to_part_sun', 'moderate', 4,
  6, 12, 6, 12,
  'moderate', 'spreading',
  'Eastern North America, Quebec to Florida, west to Oklahoma', FALSE,
  3, 5, 'mid', 60,
  'USDA Plants Database, Badgersett Research',
  'published'
);

-- Beaked Hazelnut
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_textures,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  growth_rate, root_type,
  native_range, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season,
  data_source, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-cornuta'),
  2, 8,
  5.0, 7.0, 'well_drained', ARRAY['loam', 'sand'],
  'full_to_part_sun', 'moderate', 4,
  4, 10, 'moderate', 'spreading',
  'Northern North America, Alaska to Newfoundland, south to Appalachians', FALSE,
  3, 6, 'mid',
  'USDA Plants Database',
  'published'
);

-- Turkish Tree Hazel
INSERT INTO species_growing_profiles (
  plant_entity_id, usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max, soil_drainage, soil_textures,
  sun_requirement, water_needs, drought_tolerance,
  mature_height_min_ft, mature_height_max_ft,
  growth_rate, root_type,
  native_range, nitrogen_fixer,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season,
  data_source, curation_status
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-colurna'),
  4, 7,
  6.0, 7.5, 'well_drained', ARRAY['loam', 'clay'],
  'full_sun', 'low', 4,
  40, 80, 'moderate', 'taproot',
  'Southeastern Europe, Turkey, Iran', FALSE,
  6, 10, 'mid',
  'Morton Arboretum, Grimo Nut Nursery',
  'published'
);

COMMIT;
```

---

## Migration 004: Pollination System

```sql
-- 004_pollination.sql

BEGIN;

CREATE TYPE pollination_type AS ENUM (
  'self_fertile',
  'cross_required',      -- most hazelnuts, apples
  'partially_self',      -- some fruit will set, more with cross
  'dioecious',           -- separate male/female plants (persimmons, some kiwi)
  'parthenocarpic',      -- fruit without pollination
  'monoecious_cross'     -- male+female on same tree but needs cross (chestnuts)
);

CREATE TYPE pollination_mechanism AS ENUM ('wind', 'insect', 'both');

CREATE TYPE compatibility_rating AS ENUM (
  'compatible', 'partially_compatible', 'incompatible', 'unknown'
);

-- Species-level pollination biology
CREATE TABLE species_pollination_profiles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id         UUID NOT NULL UNIQUE REFERENCES plant_entities(id) ON DELETE CASCADE,
  pollination_type        pollination_type NOT NULL,
  pollination_mechanism   pollination_mechanism NOT NULL,
  min_pollinizer_count    SMALLINT DEFAULT 1,   -- how many different pollinizers needed
  max_pollinizer_distance_ft SMALLINT,          -- effective pollen range
  bloom_period_general    TEXT,                  -- "Late winter (Jan-Mar in PNW)"
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pollination_profiles_updated
  BEFORE UPDATE ON species_pollination_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE species_pollination_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read species_pollination_profiles" ON species_pollination_profiles
  FOR SELECT USING (true);

-- Pollination groups (S-allele system for hazelnuts, bloom groups for apples, etc.)
CREATE TABLE pollination_groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id UUID NOT NULL REFERENCES plant_entities(id) ON DELETE CASCADE,
  group_code      TEXT NOT NULL,          -- "S3", "Bloom Group B", etc.
  group_name      TEXT NOT NULL,          -- "S-allele 3"
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plant_entity_id, group_code)
);

ALTER TABLE pollination_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pollination_groups" ON pollination_groups FOR SELECT USING (true);

-- Which cultivars belong to which pollination groups (many-to-many)
CREATE TABLE cultivar_pollination_groups (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_id           UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  pollination_group_id  UUID NOT NULL REFERENCES pollination_groups(id) ON DELETE CASCADE,
  allele_designation    TEXT,       -- "S3, S22" for cultivars with multiple alleles
  notes                 TEXT,
  UNIQUE(cultivar_id, pollination_group_id)
);

CREATE INDEX idx_cpg_cultivar ON cultivar_pollination_groups(cultivar_id);
CREATE INDEX idx_cpg_group ON cultivar_pollination_groups(pollination_group_id);

ALTER TABLE cultivar_pollination_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cultivar_pollination_groups" ON cultivar_pollination_groups
  FOR SELECT USING (true);

-- Explicit pollination compatibility pairs (overrides/supplements group-based inference)
CREATE TABLE pollination_compatibility (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_a_id   UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  cultivar_b_id   UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  compatibility   compatibility_rating NOT NULL DEFAULT 'unknown',
  notes           TEXT,
  data_source     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_cultivars CHECK (cultivar_a_id != cultivar_b_id),
  -- Ensure only one record per pair (regardless of direction)
  CONSTRAINT unique_pair UNIQUE (
    LEAST(cultivar_a_id, cultivar_b_id),
    GREATEST(cultivar_a_id, cultivar_b_id)
  )
);

CREATE INDEX idx_poll_compat_a ON pollination_compatibility(cultivar_a_id);
CREATE INDEX idx_poll_compat_b ON pollination_compatibility(cultivar_b_id);

ALTER TABLE pollination_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pollination_compatibility" ON pollination_compatibility
  FOR SELECT USING (true);

-- ─── Seed data: European Hazelnut pollination biology ───

INSERT INTO species_pollination_profiles (
  plant_entity_id, pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
) VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'corylus-avellana'),
  'cross_required', 'wind', 2, 65,
  'Late winter — January to March in PNW, February to April in eastern US',
  'Hazelnuts are monoecious (male catkins + female flowers on same tree) but self-incompatible via S-allele system. Two different S-allele groups required for cross-pollination. Plant at least 2 cultivars from different groups within 65 feet.'
);

COMMIT;
```

---

## Migration 005: Cultivar Traits & Rootstock Compatibility

```sql
-- 005_cultivar_traits_and_rootstock.sql

BEGIN;

-- Cultivar-level traits (production, disease resistance, bloom timing)
CREATE TABLE cultivar_traits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_id     UUID NOT NULL UNIQUE REFERENCES cultivars(id) ON DELETE CASCADE,

  -- Production traits
  nut_weight_g    NUMERIC(5,1),     -- average nut weight in grams
  kernel_pct      NUMERIC(4,1),     -- kernel to shell ratio percentage
  flavor_notes    TEXT,              -- free text flavor description
  storage_quality TEXT,              -- 'poor', 'fair', 'good', 'excellent'

  -- Disease resistance (JSONB — varies by genus)
  -- Hazelnuts: {"efb": "immune", "bud_mite": "resistant", "bacterial_blight": "susceptible"}
  -- Chestnuts: {"chestnut_blight": "resistant", "phytophthora": "susceptible"}
  -- Apples: {"fire_blight": "resistant", "scab": "moderate", "cedar_apple_rust": "susceptible"}
  disease_resistance JSONB DEFAULT '{}',

  -- Bloom timing (critical for pollination planning)
  bloom_period    TEXT,              -- 'very_early', 'early', 'mid', 'late', 'very_late'
  bloom_overlap   TEXT,              -- notes on which cultivars overlap

  -- Harvest
  harvest_window  TEXT,              -- "Early September" or "Late August to mid September"

  -- Meta
  data_source     TEXT,
  curation_status curation_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cultivar_traits_updated
  BEFORE UPDATE ON cultivar_traits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cultivar_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cultivar_traits" ON cultivar_traits FOR SELECT USING (true);

-- GIN index on disease_resistance for JSONB queries
CREATE INDEX idx_cultivar_traits_disease ON cultivar_traits USING gin(disease_resistance);

-- ── Rootstock compatibility ──

CREATE TYPE vigor_effect AS ENUM ('dwarfing', 'semi_dwarfing', 'standard', 'vigorous');
CREATE TYPE precocity_effect AS ENUM ('earlier', 'neutral', 'later');

CREATE TABLE rootstock_compatibility (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scion_cultivar_id     UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  rootstock_cultivar_id UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  compatibility         compatibility_rating NOT NULL DEFAULT 'unknown',
  interstem_required    BOOLEAN DEFAULT FALSE,
  interstem_cultivar_id UUID REFERENCES cultivars(id),
  vigor_effect          vigor_effect,
  precocity_effect      precocity_effect,
  notes                 TEXT,
  data_source           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_scion_rootstock CHECK (scion_cultivar_id != rootstock_cultivar_id),
  UNIQUE(scion_cultivar_id, rootstock_cultivar_id)
);

CREATE INDEX idx_rootstock_scion ON rootstock_compatibility(scion_cultivar_id);
CREATE INDEX idx_rootstock_rootstock ON rootstock_compatibility(rootstock_cultivar_id);

ALTER TABLE rootstock_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rootstock_compatibility" ON rootstock_compatibility
  FOR SELECT USING (true);

-- ── Extend SaleForm enum for scion/rootstock/seed ──

ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'scion_wood';
ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'budwood';
ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'rootstock';
ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'seeds';

-- Extend PropagationMethod
ALTER TYPE propagation_method ADD VALUE IF NOT EXISTS 'air_layered';
ALTER TYPE propagation_method ADD VALUE IF NOT EXISTS 'division';

COMMIT;
```

---

## Migration 006: Community Marketplace

```sql
-- 006_community_marketplace.sql

BEGIN;

-- User profiles extending Supabase Auth
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  zip_code        TEXT,
  usda_zone       TEXT,            -- auto-derived from zip or manual entry
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  location_state  TEXT,
  location_country TEXT DEFAULT 'US',
  bio             TEXT,
  website_url     TEXT,
  reputation_score INTEGER DEFAULT 0,
  listing_count   INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public can read profiles
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
-- Users can insert their own profile
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Price type for flexible listing pricing
CREATE TYPE price_type AS ENUM ('fixed', 'negotiable', 'trade_only', 'free');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired', 'flagged', 'draft');

-- Community listings (the user-submitted marketplace)
CREATE TABLE community_listings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Resolution (same pattern as inventory_offers)
  cultivar_id         UUID REFERENCES cultivars(id),
  plant_entity_id     UUID REFERENCES plant_entities(id),
  resolution_status   resolution_status NOT NULL DEFAULT 'unresolved',
  resolution_confidence NUMERIC(3,2) DEFAULT 0.0,

  -- User-provided text (goes through resolver)
  raw_listing_text    TEXT NOT NULL,
  parsed_cultivar_name TEXT,

  -- What is being offered
  sale_form           sale_form NOT NULL DEFAULT 'unknown',
  propagation_method  propagation_method DEFAULT 'unknown',
  quantity_available  INTEGER DEFAULT 1,

  -- Pricing
  price_cents         INTEGER,        -- null for trade/free
  price_type          price_type NOT NULL DEFAULT 'fixed',
  currency            TEXT DEFAULT 'USD',
  price_notes         TEXT,           -- "$5 each or 10 for $40"

  -- Location
  location_zip        TEXT,
  location_state      TEXT,
  location_country    TEXT DEFAULT 'US',
  location_lat        NUMERIC(9,6),
  location_lng        NUMERIC(9,6),
  shipping_available  BOOLEAN DEFAULT FALSE,
  shipping_notes      TEXT,
  local_pickup        BOOLEAN DEFAULT TRUE,

  -- Listing details
  description         TEXT,           -- user's own description
  listing_status      listing_status NOT NULL DEFAULT 'active',
  expires_at          TIMESTAMPTZ,    -- auto-expire after 90 days

  -- Meta
  view_count          INTEGER DEFAULT 0,
  inquiry_count       INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Same XOR pattern as inventory_offers
  CONSTRAINT valid_listing_resolution CHECK (
    (resolution_status IN ('unresolved', 'review_needed') AND cultivar_id IS NULL AND plant_entity_id IS NULL)
    OR (resolution_status = 'resolved_plant_entity' AND plant_entity_id IS NOT NULL AND cultivar_id IS NULL)
    OR (resolution_status IN ('resolved_cultivar', 'resolved_named_material', 'resolved_population') AND cultivar_id IS NOT NULL AND plant_entity_id IS NULL)
  ),
  CONSTRAINT chk_listing_confidence CHECK (resolution_confidence >= 0 AND resolution_confidence <= 1)
);

CREATE INDEX idx_listings_seller ON community_listings(seller_id);
CREATE INDEX idx_listings_cultivar ON community_listings(cultivar_id);
CREATE INDEX idx_listings_plant_entity ON community_listings(plant_entity_id);
CREATE INDEX idx_listings_status ON community_listings(listing_status);
CREATE INDEX idx_listings_location ON community_listings(location_state, location_country);
CREATE INDEX idx_listings_sale_form ON community_listings(sale_form);
-- Spatial index for proximity search
CREATE INDEX idx_listings_geo ON community_listings(location_lat, location_lng)
  WHERE location_lat IS NOT NULL;

ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;

-- Public can read active listings
CREATE POLICY "Public read active listings" ON community_listings
  FOR SELECT USING (listing_status = 'active');
-- Users can read all their own listings (including draft/expired)
CREATE POLICY "Users read own listings" ON community_listings
  FOR SELECT USING (auth.uid() = seller_id);
-- Users can insert listings
CREATE POLICY "Users insert listings" ON community_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
-- Users can update their own listings
CREATE POLICY "Users update own listings" ON community_listings
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON community_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
```

---

## Migration 007: Grower Reports (Social Proof Map)

```sql
-- 007_grower_reports.sql

BEGIN;

CREATE TYPE grower_report_status AS ENUM ('thriving', 'growing', 'struggling', 'died', 'removed');

CREATE TABLE grower_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cultivar_id     UUID REFERENCES cultivars(id),
  plant_entity_id UUID REFERENCES plant_entities(id),

  -- Location (approximate — privacy)
  location_lat    NUMERIC(9,4),   -- reduced precision for privacy (~11km)
  location_lng    NUMERIC(9,4),
  usda_zone       TEXT,
  location_state  TEXT,

  -- Growing data
  planted_year    SMALLINT,
  tree_count      SMALLINT DEFAULT 1,
  status          grower_report_status NOT NULL DEFAULT 'growing',
  notes           TEXT,

  -- Meta
  is_public       BOOLEAN DEFAULT TRUE,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- At least one of cultivar or plant_entity
  CONSTRAINT grower_report_has_plant CHECK (
    cultivar_id IS NOT NULL OR plant_entity_id IS NOT NULL
  )
);

CREATE INDEX idx_grower_cultivar ON grower_reports(cultivar_id);
CREATE INDEX idx_grower_entity ON grower_reports(plant_entity_id);
CREATE INDEX idx_grower_location ON grower_reports(location_state);
CREATE INDEX idx_grower_geo ON grower_reports(location_lat, location_lng)
  WHERE is_public = TRUE;

ALTER TABLE grower_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read public reports" ON grower_reports
  FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users read own reports" ON grower_reports
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users insert reports" ON grower_reports
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own reports" ON grower_reports
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE TRIGGER trg_grower_reports_updated
  BEFORE UPDATE ON grower_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
```

---

## Migration 008: Updated Search Index

```sql
-- 008_search_index_v2.sql
-- Drops and rebuilds the materialized view with zone data and listing counts

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS material_search_index;

CREATE MATERIALIZED VIEW material_search_index AS
SELECT
  'cultivar' AS index_source,
  c.id AS entity_id,
  c.slug,
  c.canonical_name,
  c.material_type::text AS material_type,
  c.curation_status,
  pe.botanical_name,
  pe.canonical_name AS species_common_name,
  pe.slug AS species_slug,
  pe.genus,
  pe.family,
  -- Growing data (joined from species_growing_profiles)
  sgp.usda_zone_min,
  sgp.usda_zone_max,
  -- Aggregated counts
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'cultivar' AND a.target_id = c.id), '') AS aliases_text,
  (SELECT COUNT(*) FROM inventory_offers io WHERE io.cultivar_id = c.id AND io.offer_status = 'active') AS active_offer_count,
  (SELECT COUNT(*) FROM community_listings cl WHERE cl.cultivar_id = c.id AND cl.listing_status = 'active') AS active_listing_count,
  -- Search text blob
  lower(c.canonical_name) || ' ' ||
  COALESCE(lower(pe.botanical_name), '') || ' ' ||
  COALESCE(lower(pe.canonical_name), '') || ' ' ||
  COALESCE('zone ' || sgp.usda_zone_min || ' ' || 'zone ' || sgp.usda_zone_max, '') || ' ' ||
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'cultivar' AND a.target_id = c.id), '') AS search_text
FROM cultivars c
LEFT JOIN plant_entities pe ON c.plant_entity_id = pe.id
LEFT JOIN species_growing_profiles sgp ON pe.id = sgp.plant_entity_id
WHERE c.curation_status = 'published'

UNION ALL

SELECT
  'plant_entity' AS index_source,
  pe.id AS entity_id,
  pe.slug,
  pe.canonical_name,
  pe.entity_type::text AS material_type,
  pe.curation_status,
  pe.botanical_name,
  pe.canonical_name AS species_common_name,
  pe.slug AS species_slug,
  pe.genus,
  pe.family,
  sgp.usda_zone_min,
  sgp.usda_zone_max,
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'plant_entity' AND a.target_id = pe.id), '') AS aliases_text,
  (SELECT COUNT(*) FROM inventory_offers io WHERE io.plant_entity_id = pe.id AND io.offer_status = 'active') AS active_offer_count,
  (SELECT COUNT(*) FROM community_listings cl WHERE cl.plant_entity_id = pe.id AND cl.listing_status = 'active') AS active_listing_count,
  lower(pe.canonical_name) || ' ' ||
  COALESCE(lower(pe.botanical_name), '') || ' ' ||
  COALESCE('zone ' || sgp.usda_zone_min || ' ' || 'zone ' || sgp.usda_zone_max, '') || ' ' ||
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'plant_entity' AND a.target_id = pe.id), '') AS search_text
FROM plant_entities pe
LEFT JOIN species_growing_profiles sgp ON pe.id = sgp.plant_entity_id
WHERE pe.curation_status = 'published';

CREATE INDEX idx_material_search_text_trgm ON material_search_index USING gin(search_text gin_trgm_ops);
CREATE UNIQUE INDEX idx_material_search_entity ON material_search_index(index_source, entity_id);
-- New index for zone filtering
CREATE INDEX idx_material_search_zones ON material_search_index(usda_zone_min, usda_zone_max);

COMMIT;
```

---

## Query Functions Needed

New query functions to add to `lib/queries/`:

```
lib/queries/
  taxonomy.ts       -- getTaxonomyPath(plantEntityId), getSiblings(taxonomyNodeId)
  growing.ts        -- getGrowingProfile(plantEntityId), getByZone(min, max)
  pollination.ts    -- getPollinationProfile(plantEntityId), getPartners(cultivarId), checkCompatibility(a, b)
  rootstock.ts      -- getRootstockOptions(cultivarId), getScionsFor(rootstockCultivarId)
  community.ts      -- getListingsForCultivar(id), getListingsByLocation(lat, lng, radius), createListing(), updateListing()
  grower-reports.ts -- getReportsForCultivar(id), createReport()
```

---

## Notes

- All migrations are designed to be idempotent and non-destructive to existing data
- Existing tables (plant_entities, cultivars, etc.) are NOT modified except for adding the nullable `taxonomy_node_id` FK
- All new tables follow the same RLS pattern: public read, authenticated write (scoped to own data)
- The `compatibility_rating` enum is shared between pollination and rootstock tables
- JSONB for disease resistance is intentional — it allows genus-specific disease vocabularies without schema changes
- Grower report locations use reduced coordinate precision (4 decimal places = ~11km) for privacy
- Gevuina avellana now gets its own correct taxonomy placement under Proteaceae, not Corylus
