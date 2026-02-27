-- Migration 010: Explorer query function
-- Supports zone-range filtering and availability-only toggle for the Explorer page.

BEGIN;

CREATE OR REPLACE FUNCTION get_explorer_species(
  p_zone_min INT DEFAULT NULL,
  p_zone_max INT DEFAULT NULL,
  p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id           UUID,
  slug         TEXT,
  canonical_name TEXT,
  botanical_name TEXT,
  family       TEXT,
  genus        TEXT,
  nursery_count BIGINT,
  cultivar_count BIGINT,
  zone_min     SMALLINT,
  zone_max     SMALLINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.slug,
    pe.canonical_name,
    pe.botanical_name,
    pe.family,
    pe.genus,
    COALESCE(nc.cnt, 0) AS nursery_count,
    COALESCE(cc.cnt, 0) AS cultivar_count,
    sgp.usda_zone_min   AS zone_min,
    sgp.usda_zone_max   AS zone_max
  FROM plant_entities pe
  LEFT JOIN species_growing_profiles sgp
    ON sgp.plant_entity_id = pe.id
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT io.nursery_id) AS cnt
    FROM cultivars c
    JOIN inventory_offers io
      ON io.cultivar_id = c.id
     AND io.offer_status = 'active'
    WHERE c.plant_entity_id = pe.id
  ) nc ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM cultivars c
    WHERE c.plant_entity_id = pe.id
      AND c.curation_status = 'published'
  ) cc ON TRUE
  WHERE pe.curation_status = 'published'
    AND (p_zone_min IS NULL OR sgp.usda_zone_max >= p_zone_min)
    AND (p_zone_max IS NULL OR sgp.usda_zone_min <= p_zone_max)
    AND (NOT p_available_only OR COALESCE(nc.cnt, 0) > 0)
  ORDER BY pe.family, pe.genus, pe.canonical_name;
END;
$$;

COMMIT;
