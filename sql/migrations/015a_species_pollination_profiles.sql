-- ============================================================================
-- MIGRATION 015a: Create species_pollination_profiles table
-- Sprint 5 Phase 1 addendum — created to support 015 Castanea seeding.
--
-- NOTE: This table was originally applied via Supabase MCP directly
-- (not from a local file) before 015 ran. This file is the authoritative
-- local record of that DDL. It is fully idempotent (CREATE IF NOT EXISTS).
--
-- Run AFTER: 002_taxonomy, 003_growing_profiles
-- Run BEFORE: 015_catalog_infrastructure_castanea
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS species_pollination_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_entity_id          UUID NOT NULL REFERENCES plant_entities(id) ON DELETE CASCADE,
  pollination_type         TEXT NOT NULL,         -- e.g. 'self_fertile','cross_required','partially_self','wind_cross'
  pollination_mechanism    TEXT,                  -- e.g. 'wind','insect','wind_and_insect'
  min_pollinizer_count     INTEGER,
  max_pollinizer_distance_ft INTEGER,
  bloom_period_general     TEXT,                  -- free text; use bloom_period enum on cultivar records
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_spp_entity UNIQUE (plant_entity_id)
);

COMMENT ON TABLE species_pollination_profiles IS
  'One row per plant_entity. Records species-level pollination requirements.
   Cultivar-specific pollinizer pairings live in a future cultivar_pollinizer_pairs table.';

COMMENT ON COLUMN species_pollination_profiles.pollination_type IS
  'self_fertile | cross_required | partially_self | wind_cross — plain TEXT, not an enum';

COMMIT;
