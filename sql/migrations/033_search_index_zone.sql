BEGIN;

-- Rebuild material_search_index with zone/category/availability fields for filtering.
DROP MATERIALIZED VIEW IF EXISTS material_search_index;

CREATE MATERIALIZED VIEW material_search_index AS
SELECT
  c.id AS entity_id,
  c.canonical_name,
  pe.botanical_name,
  pe.canonical_name AS species_common_name,
  pe.genus,
  pe.family,
  c.slug,
  pe.slug AS species_slug,
  c.material_type::text AS material_type,
  'cultivar'::text AS index_source,
  lower(
    COALESCE(c.canonical_name, '') || ' ' ||
    COALESCE(pe.canonical_name, '') || ' ' ||
    COALESCE(pe.botanical_name, '') || ' ' ||
    COALESCE(pe.genus, '') || ' ' ||
    COALESCE(a.alias_list, '')
  ) AS search_text,
  gp.usda_zone_min,
  gp.usda_zone_max,
  COALESCE(oc.active_count, 0)::int AS active_offer_count,
  pe.display_category
FROM cultivars c
JOIN plant_entities pe ON pe.id = c.plant_entity_id
LEFT JOIN species_growing_profiles gp ON gp.plant_entity_id = pe.id
LEFT JOIN LATERAL (
  SELECT string_agg(al.normalized_text, ' ') AS alias_list
  FROM aliases al
  WHERE (al.target_type = 'cultivar' AND al.target_id = c.id)
     OR (al.target_type = 'plant_entity' AND al.target_id = pe.id)
) a ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS active_count
  FROM inventory_offers io
  WHERE io.offer_status = 'active'
    AND io.cultivar_id = c.id
) oc ON true
WHERE c.curation_status = 'published'
  AND pe.curation_status = 'published'

UNION ALL

SELECT
  pe.id AS entity_id,
  pe.canonical_name,
  pe.botanical_name,
  pe.canonical_name AS species_common_name,
  pe.genus,
  pe.family,
  pe.slug,
  pe.slug AS species_slug,
  pe.entity_type::text AS material_type,
  'plant_entity'::text AS index_source,
  lower(
    COALESCE(pe.canonical_name, '') || ' ' ||
    COALESCE(pe.botanical_name, '') || ' ' ||
    COALESCE(pe.genus, '') || ' ' ||
    COALESCE(a.alias_list, '')
  ) AS search_text,
  gp.usda_zone_min,
  gp.usda_zone_max,
  COALESCE(oc.active_count, 0)::int AS active_offer_count,
  pe.display_category
FROM plant_entities pe
LEFT JOIN species_growing_profiles gp ON gp.plant_entity_id = pe.id
LEFT JOIN LATERAL (
  SELECT string_agg(al.normalized_text, ' ') AS alias_list
  FROM aliases al
  WHERE al.target_type = 'plant_entity' AND al.target_id = pe.id
) a ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS active_count
  FROM inventory_offers io
  WHERE io.offer_status = 'active'
    AND io.plant_entity_id = pe.id
) oc ON true
WHERE pe.curation_status = 'published';

CREATE UNIQUE INDEX idx_material_search_entity
  ON material_search_index (index_source, entity_id);

CREATE INDEX idx_material_search_trgm
  ON material_search_index USING gin (search_text gin_trgm_ops);

CREATE INDEX idx_material_search_zone
  ON material_search_index (usda_zone_min, usda_zone_max)
  WHERE usda_zone_min IS NOT NULL;

CREATE INDEX idx_material_search_available
  ON material_search_index (active_offer_count)
  WHERE active_offer_count > 0;

CREATE INDEX idx_material_search_category
  ON material_search_index (display_category);

COMMIT;
