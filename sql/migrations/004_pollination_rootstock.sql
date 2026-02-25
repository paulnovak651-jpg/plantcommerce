-- ============================================================================
-- MIGRATION 004: Pollination & Rootstock Compatibility
-- The relationship graph between cultivars — who pollinates whom,
-- what grafts onto what. Powers the compatibility engine.
-- ============================================================================

BEGIN;

-- ── Enums ──

DO $$ BEGIN
  CREATE TYPE pollination_type AS ENUM (
    'self_fertile',           -- produces fruit on its own
    'partially_self_fertile', -- some fruit alone, better with cross
    'cross_required',         -- needs a different cultivar nearby
    'dioecious',              -- separate male/female plants
    'parthenocarpic',         -- fruit without pollination (seedless)
    'variable'                -- depends on cultivar (e.g., persimmons)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pollination_mechanism AS ENUM ('wind', 'insect', 'both', 'self');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE compatibility_level AS ENUM (
    'excellent', 'good', 'fair', 'poor', 'incompatible', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vigor_effect AS ENUM (
    'very_dwarfing', 'dwarfing', 'semi_dwarfing', 'standard', 'semi_vigorous', 'vigorous'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Species-level pollination profile
-- "Hazelnuts require cross-pollination via wind"
-- ============================================================================

CREATE TABLE IF NOT EXISTS pollination_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id     UUID NOT NULL UNIQUE REFERENCES plant_entities(id) ON DELETE CASCADE,
  pollination_type    pollination_type NOT NULL,
  pollination_mechanism pollination_mechanism NOT NULL DEFAULT 'wind',
  min_pollinizers     SMALLINT DEFAULT 1,          -- how many different pollinizers recommended
  max_distance_ft     INTEGER,                      -- effective pollination range
  timing_notes        TEXT,                          -- "Bloom overlap required — check S-allele groups"
  general_notes       TEXT,
  curation_status     curation_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pollination_profiles_entity ON pollination_profiles(plant_entity_id);

-- ============================================================================
-- Pollination groups (S-allele groups for hazelnuts, bloom groups for apples)
-- Genus-specific grouping system for cross-compatibility
-- ============================================================================

CREATE TABLE IF NOT EXISTS pollination_groups (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_entity_id   UUID NOT NULL REFERENCES plant_entities(id) ON DELETE CASCADE,
  group_name        TEXT NOT NULL,                -- "S-allele 3" or "Bloom Group B"
  group_code        TEXT NOT NULL,                -- "S3" or "B" (short identifier)
  group_system      TEXT NOT NULL DEFAULT 'default', -- 'S-allele', 'bloom_timing', etc.
  description       TEXT,
  incompatible_with UUID[],                       -- array of other pollination_group IDs that are incompatible
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plant_entity_id, group_code)
);

CREATE INDEX IF NOT EXISTS idx_pollination_groups_entity ON pollination_groups(plant_entity_id);

-- ============================================================================
-- Cultivar ↔ Pollination Group membership (many-to-many)
-- "Raritan has S-alleles 3 and 22"
-- ============================================================================

CREATE TABLE IF NOT EXISTS cultivar_pollination_memberships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_id           UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  pollination_group_id  UUID NOT NULL REFERENCES pollination_groups(id) ON DELETE CASCADE,
  allele_designation    TEXT,             -- "S3" — the specific allele this cultivar carries
  role                  TEXT DEFAULT 'both', -- 'pollen_donor', 'pollen_receiver', 'both'
  notes                 TEXT,
  UNIQUE(cultivar_id, pollination_group_id)
);

CREATE INDEX IF NOT EXISTS idx_cultivar_poll_cultivar ON cultivar_pollination_memberships(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_poll_group ON cultivar_pollination_memberships(pollination_group_id);

-- ============================================================================
-- Explicit pollination compatibility pairs
-- For cases that don't fit neatly into the group system, or for verified pairs.
-- Bidirectional: if A pollinates B, we store one row (not two).
-- Convention: cultivar_a_id < cultivar_b_id (alphabetical by UUID) to prevent duplicates.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pollination_pairs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_a_id     UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  cultivar_b_id     UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  compatibility     compatibility_level NOT NULL DEFAULT 'unknown',
  bloom_overlap     TEXT,                  -- 'good', 'partial', 'marginal'
  verified          BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  source            TEXT,                  -- "OSU Extension Bulletin EM 9078"
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_not_self CHECK (cultivar_a_id != cultivar_b_id),
  UNIQUE(cultivar_a_id, cultivar_b_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_pairs_a ON pollination_pairs(cultivar_a_id);
CREATE INDEX IF NOT EXISTS idx_poll_pairs_b ON pollination_pairs(cultivar_b_id);

-- ============================================================================
-- Rootstock compatibility
-- Links scion cultivars to rootstock cultivars with grafting outcomes.
-- Rootstocks ARE cultivars — they're just used differently.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rootstock_compatibility (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scion_cultivar_id     UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  rootstock_cultivar_id UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  compatibility         compatibility_level NOT NULL DEFAULT 'unknown',
  interstem_required    BOOLEAN DEFAULT FALSE,
  interstem_cultivar_id UUID REFERENCES cultivars(id),  -- if an interstem is needed
  vigor_effect          vigor_effect,
  precocity_effect      TEXT,                -- 'earlier', 'neutral', 'later'
  anchoring             quality_rating,       -- root anchorage quality
  disease_notes         TEXT,                 -- "Resistant to Phytophthora on this rootstock"
  notes                 TEXT,
  source                TEXT,
  verified              BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_not_self_rootstock CHECK (scion_cultivar_id != rootstock_cultivar_id),
  UNIQUE(scion_cultivar_id, rootstock_cultivar_id)
);

CREATE INDEX IF NOT EXISTS idx_rootstock_scion ON rootstock_compatibility(scion_cultivar_id);
CREATE INDEX IF NOT EXISTS idx_rootstock_rootstock ON rootstock_compatibility(rootstock_cultivar_id);

-- ============================================================================
-- Extend sale_form and propagation_method for scion/rootstock support
-- ============================================================================

-- Add new sale form values (idempotent — Postgres ignores if already exists)
DO $$ BEGIN
  ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'scion_wood';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'budwood';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'rootstock';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE sale_form ADD VALUE IF NOT EXISTS 'seeds';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE propagation_method ADD VALUE IF NOT EXISTS 'air_layered';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE propagation_method ADD VALUE IF NOT EXISTS 'division';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Triggers
CREATE TRIGGER trg_pollination_profiles_updated
  BEFORE UPDATE ON pollination_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read on all knowledge tables
ALTER TABLE pollination_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollination_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivar_pollination_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollination_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rootstock_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pollination_profiles" ON pollination_profiles FOR SELECT USING (true);
CREATE POLICY "Public read pollination_groups" ON pollination_groups FOR SELECT USING (true);
CREATE POLICY "Public read cultivar_pollination_memberships" ON cultivar_pollination_memberships FOR SELECT USING (true);
CREATE POLICY "Public read pollination_pairs" ON pollination_pairs FOR SELECT USING (true);
CREATE POLICY "Public read rootstock_compatibility" ON rootstock_compatibility FOR SELECT USING (true);

-- ============================================================================
-- Helper: Get all compatible pollinizers for a given cultivar
-- Returns cultivars that can pollinate the target, with compatibility info.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pollinizers_for(target_cultivar_id UUID)
RETURNS TABLE (
  cultivar_id UUID,
  cultivar_name TEXT,
  cultivar_slug TEXT,
  compatibility compatibility_level,
  source TEXT,
  match_type TEXT  -- 'explicit_pair' or 'group_compatible'
) AS $$
  -- Explicit pairs where target is cultivar_a
  SELECT pp.cultivar_b_id, c.canonical_name, c.slug, pp.compatibility, pp.source, 'explicit_pair'::text
  FROM pollination_pairs pp
  JOIN cultivars c ON c.id = pp.cultivar_b_id
  WHERE pp.cultivar_a_id = target_cultivar_id
    AND pp.compatibility IN ('excellent', 'good', 'fair')
  
  UNION
  
  -- Explicit pairs where target is cultivar_b
  SELECT pp.cultivar_a_id, c.canonical_name, c.slug, pp.compatibility, pp.source, 'explicit_pair'::text
  FROM pollination_pairs pp
  JOIN cultivars c ON c.id = pp.cultivar_a_id
  WHERE pp.cultivar_b_id = target_cultivar_id
    AND pp.compatibility IN ('excellent', 'good', 'fair')
  
  ORDER BY compatibility, cultivar_name;
$$ LANGUAGE sql STABLE;

COMMENT ON TABLE pollination_profiles IS 'Species-level pollination biology. Whether cross-pollination is needed, mechanism, and general guidance.';
COMMENT ON TABLE pollination_groups IS 'Compatibility grouping system (S-alleles for hazelnuts, bloom groups for apples). Genus-specific.';
COMMENT ON TABLE cultivar_pollination_memberships IS 'Maps cultivars to their pollination groups. A cultivar may belong to multiple groups (e.g., carries two S-alleles).';
COMMENT ON TABLE pollination_pairs IS 'Explicit compatibility between specific cultivar pairs. Supplements the group system for verified or exceptional cases.';
COMMENT ON TABLE rootstock_compatibility IS 'Grafting compatibility between scion and rootstock cultivars. Tracks vigor, precocity, and anchoring effects.';
COMMENT ON FUNCTION get_pollinizers_for IS 'Returns all cultivars compatible as pollinizers for the given cultivar, from both explicit pairs and group membership.';

COMMIT;
