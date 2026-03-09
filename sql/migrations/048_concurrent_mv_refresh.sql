-- ============================================================================
-- Migration 048: Use CONCURRENTLY for materialized view refresh
--
-- The refresh_search_index() function previously used plain REFRESH, which
-- takes an ACCESS EXCLUSIVE lock and blocks all reads during refresh.
-- CONCURRENTLY allows reads to continue during the refresh.
--
-- Prerequisite: a UNIQUE INDEX on the materialized view (already exists as
-- idx_material_search_entity on (index_source, entity_id)).
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY material_search_index;
END;
$$;
