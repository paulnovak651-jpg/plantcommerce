-- ============================================================================
-- MIGRATION 039: Audit Vitis Cultivars for Permaculture Relevance
-- 1) Remove high-management commercial table grapes if present
-- 2) Ensure curated Vitis cultivars are present and published
-- 3) Publish remaining Vitis-linked draft cultivars
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: REMOVE HIGH-MANAGEMENT COMMERCIAL TABLE GRAPES (IF PRESENT)
-- Delete aliases first, then cultivar rows.
-- ============================================================================

WITH commercial(slug, canonical_name) AS (
  VALUES
    ('thompson-seedless', 'Thompson Seedless'),
    ('sultana', 'Sultana'),
    ('flame-seedless', 'Flame Seedless'),
    ('crimson-seedless', 'Crimson Seedless'),
    ('ruby-seedless', 'Ruby Seedless'),
    ('red-globe', 'Red Globe'),
    ('autumn-royal', 'Autumn Royal'),
    ('perlette', 'Perlette')
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
    ('thompson-seedless', 'Thompson Seedless'),
    ('sultana', 'Sultana'),
    ('flame-seedless', 'Flame Seedless'),
    ('crimson-seedless', 'Crimson Seedless'),
    ('ruby-seedless', 'Ruby Seedless'),
    ('red-globe', 'Red Globe'),
    ('autumn-royal', 'Autumn Royal'),
    ('perlette', 'Perlette')
)
DELETE FROM cultivars c
USING commercial m
WHERE c.slug = m.slug
   OR lower(c.canonical_name) = lower(m.canonical_name);

-- ============================================================================
-- PART 2: ENSURE CURATED VITIS CULTIVARS EXIST
-- Use vitis-labruscana as the existing project hybrid bucket for cultivated
-- bunch grapes and interspecific hybrids; muscadines stay on rotundifolia.
-- ============================================================================

WITH target(slug, canonical_name, species_slug, breeder, year_released, notes) AS (
  VALUES
    -- Cold-hardy wine (University of Minnesota)
    ('marquette', 'Marquette', 'vitis-labruscana', 'University of Minnesota', 2006, 'Cold-hardy red wine grape selected for northern low-input vineyards.'),
    ('frontenac', 'Frontenac', 'vitis-labruscana', 'University of Minnesota', 1996, 'Very cold-hardy red wine grape with strong disease resistance.'),
    ('frontenac-gris', 'Frontenac Gris', 'vitis-labruscana', 'University of Minnesota', 2003, 'Cold-hardy white/rose wine sport of Frontenac for northern sites.'),
    ('la-crescent', 'La Crescent', 'vitis-labruscana', 'University of Minnesota', 2002, 'Cold-hardy aromatic white wine grape suited to continental climates.'),
    ('itasca', 'Itasca', 'vitis-labruscana', 'University of Minnesota', 2017, 'Cold-hardy low-acid white wine grape bred for upper Midwest production.'),

    -- Seedless table (disease-resistant)
    ('mars', 'Mars', 'vitis-labruscana', 'University of Arkansas', 1985, 'Blue seedless table grape with good disease resistance for home growers.'),
    ('reliance', 'Reliance', 'vitis-labruscana', 'University of Arkansas', 1982, 'Cold-hardy pink seedless table grape for backyard and homestead use.'),
    ('jupiter', 'Jupiter', 'vitis-labruscana', 'University of Arkansas', 1998, 'Large-fruited seedless table grape with improved disease resistance.'),
    ('neptune', 'Neptune', 'vitis-labruscana', 'University of Arkansas', 1998, 'White seedless table grape selected for home and regional market plantings.'),
    ('vanessa', 'Vanessa', 'vitis-labruscana', NULL, NULL, 'Red seedless table grape valued for flavor and comparatively home-scale suitability.'),

    -- Juice / preserves
    ('concord', 'Concord', 'vitis-labruscana', 'Ephraim Wales Bull', 1849, 'Classic American juice and jelly grape with broad homestead relevance.'),
    ('niagara', 'Niagara', 'vitis-labruscana', NULL, NULL, 'White American grape widely used for juice, fresh eating, and preserves.'),
    ('catawba', 'Catawba', 'vitis-labruscana', NULL, NULL, 'Historic pink-red American grape used for juice, preserves, and regional wine.'),
    ('steuben', 'Steuben', 'vitis-labruscana', 'New York State Agricultural Experiment Station', 1947, 'Blue-black American grape suited to fresh use, juice, and preserves.'),

    -- Muscadine (SE US)
    ('carlos', 'Carlos', 'vitis-rotundifolia', NULL, NULL, 'Self-fertile bronze muscadine widely used for wine, juice, and fresh use in the Southeast.'),
    ('noble', 'Noble', 'vitis-rotundifolia', NULL, NULL, 'Self-fertile black muscadine with strong juice and wine value in humid climates.'),
    ('scuppernong', 'Scuppernong', 'vitis-rotundifolia', NULL, NULL, 'Historic bronze muscadine with enduring regional value for fresh use and preserves.'),
    ('triumph', 'Triumph', 'vitis-rotundifolia', NULL, NULL, 'Bronze muscadine selected for fresh eating in southeastern low-spray systems.'),

    -- Multi-use
    ('chambourcin', 'Chambourcin', 'vitis-labruscana', NULL, NULL, 'French-American hybrid used for wine and resilient eastern U.S. plantings.'),
    ('chardonel', 'Chardonel', 'vitis-labruscana', NULL, NULL, 'Productive interspecific white wine grape with broad adaptation beyond vinifera-only sites.'),
    ('vidal-blanc', 'Vidal Blanc', 'vitis-labruscana', NULL, NULL, 'Dependable hybrid white grape used for wine, juice, and cold-climate production.')
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
    ('marquette', 'Marquette', 'vitis-labruscana'),
    ('frontenac', 'Frontenac', 'vitis-labruscana'),
    ('frontenac-gris', 'Frontenac Gris', 'vitis-labruscana'),
    ('la-crescent', 'La Crescent', 'vitis-labruscana'),
    ('itasca', 'Itasca', 'vitis-labruscana'),
    ('mars', 'Mars', 'vitis-labruscana'),
    ('reliance', 'Reliance', 'vitis-labruscana'),
    ('jupiter', 'Jupiter', 'vitis-labruscana'),
    ('neptune', 'Neptune', 'vitis-labruscana'),
    ('vanessa', 'Vanessa', 'vitis-labruscana'),
    ('concord', 'Concord', 'vitis-labruscana'),
    ('niagara', 'Niagara', 'vitis-labruscana'),
    ('catawba', 'Catawba', 'vitis-labruscana'),
    ('steuben', 'Steuben', 'vitis-labruscana'),
    ('carlos', 'Carlos', 'vitis-rotundifolia'),
    ('noble', 'Noble', 'vitis-rotundifolia'),
    ('scuppernong', 'Scuppernong', 'vitis-rotundifolia'),
    ('triumph', 'Triumph', 'vitis-rotundifolia'),
    ('chambourcin', 'Chambourcin', 'vitis-labruscana'),
    ('chardonel', 'Chardonel', 'vitis-labruscana'),
    ('vidal-blanc', 'Vidal Blanc', 'vitis-labruscana')
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

-- Publish any remaining Vitis-linked draft cultivars not removed above.
UPDATE cultivars
SET curation_status = 'published'
WHERE plant_entity_id IN (
  SELECT id FROM plant_entities WHERE genus = 'Vitis'
)
  AND curation_status = 'draft';

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
