-- ============================================================================
-- MIGRATION 024: Publish Seeded Draft Genera
-- Promotes already-seeded genera from draft to published so they are visible
-- in explorer queries and resolver alias indexing.
--
-- Genera:
--   Carya, Asimina, Malus, Prunus, Pyrus
-- ============================================================================

BEGIN;

UPDATE plant_entities
SET curation_status = 'published'
WHERE genus IN ('Carya', 'Asimina', 'Malus', 'Prunus', 'Pyrus')
  AND curation_status = 'draft';

UPDATE species_growing_profiles sgp
SET curation_status = 'published'
FROM plant_entities pe
WHERE sgp.plant_entity_id = pe.id
  AND pe.genus IN ('Carya', 'Asimina', 'Malus', 'Prunus', 'Pyrus')
  AND sgp.curation_status = 'draft';

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
