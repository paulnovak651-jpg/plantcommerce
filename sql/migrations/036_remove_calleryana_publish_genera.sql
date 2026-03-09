-- ============================================================================
-- MIGRATION 036: Remove Callery Pear + Publish Remaining Draft Genera
-- 1) Remove invasive Pyrus calleryana and related profile/alias records
-- 2) Publish genera seeded after migration 024 that are still in draft
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: REMOVE PYRUS CALLERYANA (INVASIVE)
-- ============================================================================

DELETE FROM aliases
WHERE target_type = 'plant_entity'
  AND target_id = (SELECT id FROM plant_entities WHERE slug = 'pyrus-calleryana');

DELETE FROM species_pollination_profiles
WHERE plant_entity_id = (SELECT id FROM plant_entities WHERE slug = 'pyrus-calleryana');

DELETE FROM species_growing_profiles
WHERE plant_entity_id = (SELECT id FROM plant_entities WHERE slug = 'pyrus-calleryana');

DELETE FROM plant_entities
WHERE slug = 'pyrus-calleryana';

-- ============================================================================
-- PART 2: PUBLISH REMAINING DRAFT GENERA
-- ============================================================================

UPDATE plant_entities
SET curation_status = 'published'
WHERE genus IN ('Diospyros', 'Morus', 'Quercus', 'Vaccinium', 'Sambucus', 'Vitis', 'Ficus')
  AND curation_status = 'draft';

UPDATE cultivars
SET curation_status = 'published'
WHERE plant_entity_id IN (
  SELECT id
  FROM plant_entities
  WHERE genus IN ('Diospyros', 'Morus', 'Quercus', 'Vaccinium', 'Sambucus', 'Vitis', 'Ficus')
)
  AND curation_status = 'draft';

UPDATE species_growing_profiles
SET curation_status = 'published'
WHERE plant_entity_id IN (
  SELECT id
  FROM plant_entities
  WHERE genus IN ('Diospyros', 'Morus', 'Quercus', 'Vaccinium', 'Sambucus', 'Vitis', 'Ficus')
)
  AND curation_status = 'draft';

UPDATE aliases
SET curation_status = 'published'
WHERE target_id IN (
  SELECT id
  FROM plant_entities
  WHERE genus IN ('Diospyros', 'Morus', 'Quercus', 'Vaccinium', 'Sambucus', 'Vitis', 'Ficus')
)
  AND curation_status = 'draft';

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
