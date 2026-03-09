-- ============================================================================
-- MIGRATION 038: Audit Prunus Cultivars for Permaculture Relevance
-- 1) Ensure missing Prunus species needed for target cultivar linkage exist
-- 2) Remove commercial-only cultivars (if present)
-- 3) Ensure curated Prunus cultivars are present and published
-- 4) Publish remaining draft Prunus cultivars
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 0: BACKFILL MISSING PRUNUS SPECIES USED BY CURATED CULTIVARS
-- Taxonomy node UUID for Prunus: d0000000-0000-0000-0000-000000000009
-- ============================================================================

INSERT INTO plant_entities (
  slug,
  canonical_name,
  botanical_name,
  family,
  genus,
  species,
  entity_type,
  taxonomy_confidence,
  taxonomy_node_id,
  description,
  curation_status
)
VALUES
  (
    'prunus-tomentosa',
    'Nanking Cherry',
    'Prunus tomentosa',
    'Rosaceae',
    'Prunus',
    'tomentosa',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Hardy bush cherry species used in homestead hedgerows and cold-climate fruit systems.',
    'published'
  ),
  (
    'prunus-besseyi',
    'Sand Cherry',
    'Prunus besseyi',
    'Rosaceae',
    'Prunus',
    'besseyi',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Cold-hardy bush cherry/plum relative used for breeding and resilient fruit systems.',
    'published'
  ),
  (
    'prunus-maritima',
    'Beach Plum',
    'Prunus maritima',
    'Rosaceae',
    'Prunus',
    'maritima',
    'species',
    'verified',
    'd0000000-0000-0000-0000-000000000009',
    'Native coastal North American plum with high resilience and preserves value.',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

UPDATE plant_entities
SET curation_status = 'published'
WHERE slug IN ('prunus-tomentosa', 'prunus-besseyi', 'prunus-maritima')
  AND curation_status = 'draft';

-- ============================================================================
-- PART 1: REMOVE LARGE-SCALE COMMERCIAL-ONLY CULTIVARS (IF PRESENT)
-- Delete aliases first, then cultivar rows.
-- ============================================================================

WITH commercial(slug, canonical_name) AS (
  VALUES
    ('bing', 'Bing'),
    ('rainier', 'Rainier'),
    ('lambert', 'Lambert'),
    ('van', 'Van'),
    ('brooks', 'Brooks'),
    ('chelan', 'Chelan'),
    ('redhaven', 'Redhaven'),
    ('elberta', 'Elberta')
)
DELETE FROM aliases a
WHERE a.target_type = 'cultivar'
  AND a.target_id IN (
    SELECT c.id
    FROM cultivars c
    JOIN commercial m
      ON c.slug = m.slug
      OR lower(c.canonical_name) = lower(m.canonical_name)
  );

WITH commercial(slug, canonical_name) AS (
  VALUES
    ('bing', 'Bing'),
    ('rainier', 'Rainier'),
    ('lambert', 'Lambert'),
    ('van', 'Van'),
    ('brooks', 'Brooks'),
    ('chelan', 'Chelan'),
    ('redhaven', 'Redhaven'),
    ('elberta', 'Elberta')
)
DELETE FROM cultivars c
USING commercial m
WHERE c.slug = m.slug
   OR lower(c.canonical_name) = lower(m.canonical_name);

-- ============================================================================
-- PART 2: ENSURE CURATED PRUNUS CULTIVARS EXIST
-- ============================================================================

WITH target(slug, canonical_name, species_slug, breeder, year_released, notes) AS (
  VALUES
    -- Bush cherries / beach plum
    ('nanking-cherry-select', 'Nanking Cherry Select', 'prunus-tomentosa', NULL, NULL, 'Cold-hardy bush cherry selection for hedgerow and homestead systems.'),
    ('sand-cherry-select', 'Sand Cherry Select', 'prunus-besseyi', NULL, NULL, 'Cold-hardy sand cherry selection for marginal and continental climates.'),
    ('beach-plum-select', 'Beach Plum Select', 'prunus-maritima', NULL, NULL, 'Beach plum selection for coastal resilience and preserves production.'),

    -- Cold-hardy plums
    ('superior', 'Superior', 'prunus-salicina', NULL, NULL, 'Cold-hardy plum cultivar used in northern systems.'),
    ('toka', 'Toka', 'prunus-salicina', NULL, NULL, 'Cold-hardy pollinizer plum valued in mixed orchards.'),
    ('waneta', 'Waneta', 'prunus-salicina', NULL, NULL, 'Cold-hardy hybrid plum for northern climates.'),
    ('alderman', 'Alderman', 'prunus-salicina', NULL, NULL, 'Cold-hardy plum cultivar selected for short-season regions.'),
    ('mount-royal', 'Mount Royal', 'prunus-domestica', NULL, NULL, 'Cold-hardy European plum for fresh use and processing.'),
    ('stanley', 'Stanley', 'prunus-domestica', NULL, NULL, 'European prune-type plum widely used for drying and preserves.'),

    -- Sour cherries
    ('montmorency', 'Montmorency', 'prunus-cerasus', NULL, NULL, 'Benchmark tart cherry cultivar for pies and preserves.'),
    ('north-star', 'North Star', 'prunus-cerasus', 'University of Minnesota', NULL, 'Compact cold-hardy tart cherry cultivar.'),
    ('meteor', 'Meteor', 'prunus-cerasus', 'University of Minnesota', NULL, 'Cold-hardy tart cherry cultivar for northern gardens.'),
    ('balaton', 'Balaton', 'prunus-cerasus', NULL, NULL, 'Dark-fleshed tart cherry with strong processing value.'),

    -- Sweet cherries (self-fertile / cold-hardy)
    ('stella', 'Stella', 'prunus-avium', NULL, NULL, 'Self-fertile sweet cherry cultivar.'),
    ('lapins', 'Lapins', 'prunus-avium', NULL, NULL, 'Self-fertile sweet cherry with broad planting use.'),
    ('blackgold', 'BlackGold', 'prunus-avium', 'Cornell', NULL, 'Cold-hardy self-fertile sweet cherry.'),
    ('whitegold', 'WhiteGold', 'prunus-avium', 'Cornell', NULL, 'Cold-hardy self-fertile sweet cherry.'),

    -- Peaches (cold-hardy)
    ('reliance', 'Reliance', 'prunus-persica', NULL, NULL, 'Cold-hardy peach widely used in northern climates.'),
    ('contender', 'Contender', 'prunus-persica', NULL, NULL, 'Cold-hardy peach with reliable cropping in cooler regions.'),
    ('harrow-beauty', 'Harrow Beauty', 'prunus-persica', 'Harrow Research Station', NULL, 'Cold-hardy peach with strong disease resistance profile.'),
    ('madison', 'Madison', 'prunus-persica', NULL, NULL, 'Cold-hardy peach suitable for shorter seasons.'),

    -- Apricots (cold-hardy)
    ('moorpark', 'Moorpark', 'prunus-armeniaca', NULL, NULL, 'Classic apricot cultivar used for fresh and processing.'),
    ('harglow', 'Harglow', 'prunus-armeniaca', 'Harrow Research Station', NULL, 'Cold-hardy apricot selected for challenging climates.'),
    ('tomcot', 'Tomcot', 'prunus-armeniaca', NULL, NULL, 'Early, relatively cold-hardy apricot cultivar.')
)
INSERT INTO cultivars (
  slug,
  canonical_name,
  plant_entity_id,
  material_type,
  breeder,
  year_released,
  curation_status,
  notes
)
SELECT
  t.slug,
  t.canonical_name,
  pe.id,
  'cultivar_clone',
  t.breeder,
  t.year_released,
  'published',
  t.notes
FROM target t
JOIN plant_entities pe ON pe.slug = t.species_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM cultivars c
  WHERE c.slug = t.slug
     OR lower(c.canonical_name) = lower(t.canonical_name)
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 3: PUBLISH CURATED SET + NORMALIZE SPECIES LINKAGE
-- ============================================================================

WITH target(slug, canonical_name, species_slug) AS (
  VALUES
    ('nanking-cherry-select', 'Nanking Cherry Select', 'prunus-tomentosa'),
    ('sand-cherry-select', 'Sand Cherry Select', 'prunus-besseyi'),
    ('beach-plum-select', 'Beach Plum Select', 'prunus-maritima'),
    ('superior', 'Superior', 'prunus-salicina'),
    ('toka', 'Toka', 'prunus-salicina'),
    ('waneta', 'Waneta', 'prunus-salicina'),
    ('alderman', 'Alderman', 'prunus-salicina'),
    ('mount-royal', 'Mount Royal', 'prunus-domestica'),
    ('stanley', 'Stanley', 'prunus-domestica'),
    ('montmorency', 'Montmorency', 'prunus-cerasus'),
    ('north-star', 'North Star', 'prunus-cerasus'),
    ('meteor', 'Meteor', 'prunus-cerasus'),
    ('balaton', 'Balaton', 'prunus-cerasus'),
    ('stella', 'Stella', 'prunus-avium'),
    ('lapins', 'Lapins', 'prunus-avium'),
    ('blackgold', 'BlackGold', 'prunus-avium'),
    ('whitegold', 'WhiteGold', 'prunus-avium'),
    ('reliance', 'Reliance', 'prunus-persica'),
    ('contender', 'Contender', 'prunus-persica'),
    ('harrow-beauty', 'Harrow Beauty', 'prunus-persica'),
    ('madison', 'Madison', 'prunus-persica'),
    ('moorpark', 'Moorpark', 'prunus-armeniaca'),
    ('harglow', 'Harglow', 'prunus-armeniaca'),
    ('tomcot', 'Tomcot', 'prunus-armeniaca')
)
UPDATE cultivars c
SET
  plant_entity_id = pe.id,
  curation_status = 'published'
FROM target t
JOIN plant_entities pe ON pe.slug = t.species_slug
WHERE (c.slug = t.slug OR lower(c.canonical_name) = lower(t.canonical_name))
  AND (
    c.plant_entity_id IS DISTINCT FROM pe.id
    OR c.curation_status <> 'published'
  );

-- Publish any remaining Prunus-linked draft cultivars not removed above.
UPDATE cultivars
SET curation_status = 'published'
WHERE plant_entity_id IN (
  SELECT id FROM plant_entities WHERE genus = 'Prunus'
)
  AND curation_status = 'draft';

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
