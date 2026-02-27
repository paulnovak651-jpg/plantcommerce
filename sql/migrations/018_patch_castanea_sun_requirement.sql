-- ============================================================================
-- MIGRATION 018: Patch Castanea sun_requirement data
--
-- Bug: Migration 015 attempted to insert castanea-pumila and castanea-seguinii
-- with sun_requirement = 'full_to_part_sun', which is not a valid enum value.
-- Postgres silently accepted the earlier INSERT that used 'full_sun' for these
-- two species, leaving them with the wrong value.
--
-- Fix: Update to 'part_shade', the correct enum value for shade-tolerant
-- understory species.
--
-- Affected rows:
--   castanea-pumila    (Allegheny Chinkapin) — native forest understory shrub/tree
--   castanea-seguinii  (Seguin Chestnut)     — small understory tree, native China
--
-- Valid sun_requirement enum: full_sun | part_shade | full_shade | shade_tolerant
-- ============================================================================

BEGIN;

UPDATE species_growing_profiles
SET
  sun_requirement = 'part_shade',
  updated_at      = now()
WHERE plant_entity_id = (
  SELECT id FROM plant_entities WHERE slug = 'castanea-pumila'
)
AND sun_requirement = 'full_sun';

UPDATE species_growing_profiles
SET
  sun_requirement = 'part_shade',
  updated_at      = now()
WHERE plant_entity_id = (
  SELECT id FROM plant_entities WHERE slug = 'castanea-seguinii'
)
AND sun_requirement = 'full_sun';

-- Verify
DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM species_growing_profiles sgp
  JOIN plant_entities pe ON pe.id = sgp.plant_entity_id
  WHERE pe.slug IN ('castanea-pumila', 'castanea-seguinii')
    AND sgp.sun_requirement != 'part_shade';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Migration 018: % rows still have wrong sun_requirement', bad_count;
  END IF;
END $$;

COMMIT;
