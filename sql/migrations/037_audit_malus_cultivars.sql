-- ============================================================================
-- MIGRATION 037: Audit Malus Cultivars for Permaculture Relevance
-- 1) Remove conventional high-spray commercial cultivars if present
-- 2) Ensure curated permaculture-appropriate Malus cultivars are present
-- 3) Publish curated cultivars (and correct species linkage)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: REMOVE CONVENTIONAL COMMERCIAL-ONLY CULTIVARS (IF PRESENT)
-- Delete aliases first, then cultivar rows.
-- ============================================================================

WITH conventional(slug, canonical_name) AS (
  VALUES
    ('red-delicious', 'Red Delicious'),
    ('gala', 'Gala'),
    ('fuji', 'Fuji'),
    ('granny-smith', 'Granny Smith')
)
DELETE FROM aliases a
WHERE a.target_type = 'cultivar'
  AND a.target_id IN (
    SELECT c.id
    FROM cultivars c
    JOIN conventional cv
      ON c.slug = cv.slug
      OR lower(c.canonical_name) = lower(cv.canonical_name)
  );

WITH conventional(slug, canonical_name) AS (
  VALUES
    ('red-delicious', 'Red Delicious'),
    ('gala', 'Gala'),
    ('fuji', 'Fuji'),
    ('granny-smith', 'Granny Smith')
)
DELETE FROM cultivars c
USING conventional cv
WHERE c.slug = cv.slug
   OR lower(c.canonical_name) = lower(cv.canonical_name);

-- ============================================================================
-- PART 2: ENSURE CURATED MALUS CULTIVARS EXIST
-- ============================================================================

WITH target(slug, canonical_name, species_slug, breeder, year_released, notes) AS (
  VALUES
    -- Disease-resistant
    ('liberty', 'Liberty', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1978, 'Scab-resistant dessert apple bred for low-spray systems.'),
    ('freedom', 'Freedom', 'malus-domestica', 'New York State Agricultural Experiment Station', 1983, 'Disease-resistant cultivar with strong backyard/permaculture adoption.'),
    ('enterprise', 'Enterprise', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1994, 'Late-season disease-resistant storage apple.'),
    ('goldrush', 'GoldRush', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1993, 'High-acid, high-storage disease-resistant cultivar.'),
    ('pristine', 'Pristine', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1995, 'Early-season disease-resistant yellow apple.'),
    ('redfree', 'Redfree', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1981, 'Early disease-resistant dessert apple.'),
    ('williams-pride', 'William''s Pride', 'malus-domestica', 'PRI (Purdue-Rutgers-Illinois)', 1988, 'Early scab-resistant apple suited to low-spray orchards.'),

    -- Cider
    ('kingston-black', 'Kingston Black', 'malus-domestica', NULL, NULL, 'Classic bittersharp cider cultivar.'),
    ('dabinett', 'Dabinett', 'malus-domestica', NULL, NULL, 'Traditional English bittersweet cider cultivar.'),
    ('yarlington-mill', 'Yarlington Mill', 'malus-domestica', NULL, NULL, 'Traditional English cider apple with bittersweet profile.'),
    ('harrison', 'Harrison', 'malus-domestica', NULL, NULL, 'Historic American cider cultivar.'),
    ('hewes-crab', 'Hewes Crab', 'malus-domestica', NULL, NULL, 'Historic American cider crabapple used for high-quality juice.'),

    -- Heirloom / homestead
    ('coxs-orange-pippin', 'Cox''s Orange Pippin', 'malus-domestica', NULL, NULL, 'Historic dessert apple with exceptional flavor.'),
    ('ashmeads-kernel', 'Ashmead''s Kernel', 'malus-domestica', NULL, NULL, 'Old English russet; high sugar and acid balance.'),
    ('esopus-spitzenburg', 'Esopus Spitzenburg', 'malus-domestica', NULL, NULL, 'Historic heirloom associated with early American orchards.'),
    ('northern-spy', 'Northern Spy', 'malus-domestica', NULL, NULL, 'Late-season heirloom known for storage and pie quality.'),
    ('baldwin', 'Baldwin', 'malus-domestica', NULL, NULL, 'Historic New England multipurpose heirloom cultivar.'),
    ('gravenstein', 'Gravenstein', 'malus-domestica', NULL, NULL, 'Early triploid heirloom valued for sauce/cooking/cider.'),
    ('rhode-island-greening', 'Rhode Island Greening', 'malus-domestica', NULL, NULL, 'Classic American cooking and storage apple.'),

    -- Crabapples for pollination/preserves
    ('dolgo', 'Dolgo', 'malus-baccata', NULL, NULL, 'Hardy crabapple for preserves and pollinizer use.'),
    ('chestnut-crab', 'Chestnut Crab', 'malus-baccata', NULL, NULL, 'Hardy edible crabapple with strong pollinizer value.'),
    ('wickson', 'Wickson', 'malus-domestica', 'Albert Etter', NULL, 'Small-fruited high-brix cider and fresh-eating cultivar.'),

    -- Cold-hardy
    ('honeycrisp', 'Honeycrisp', 'malus-domestica', 'University of Minnesota', 1991, 'Cold-hardy dessert apple for northern climates (zone 3).'),
    ('haralson', 'Haralson', 'malus-domestica', 'University of Minnesota', 1922, 'Reliable cold-hardy heritage cultivar.'),
    ('wealthy', 'Wealthy', 'malus-domestica', 'Peter Gideon', 1868, 'Historic cold-hardy cultivar foundational in northern breeding.'),
    ('duchess-of-oldenburg', 'Duchess of Oldenburg', 'malus-domestica', NULL, NULL, 'Early-ripening hardy heirloom for cold climates.')
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
-- PART 3: PUBLISH + NORMALIZE SPECIES LINKAGE FOR CURATED SET
-- ============================================================================

WITH target(slug, canonical_name, species_slug) AS (
  VALUES
    ('liberty', 'Liberty', 'malus-domestica'),
    ('freedom', 'Freedom', 'malus-domestica'),
    ('enterprise', 'Enterprise', 'malus-domestica'),
    ('goldrush', 'GoldRush', 'malus-domestica'),
    ('pristine', 'Pristine', 'malus-domestica'),
    ('redfree', 'Redfree', 'malus-domestica'),
    ('williams-pride', 'William''s Pride', 'malus-domestica'),
    ('kingston-black', 'Kingston Black', 'malus-domestica'),
    ('dabinett', 'Dabinett', 'malus-domestica'),
    ('yarlington-mill', 'Yarlington Mill', 'malus-domestica'),
    ('harrison', 'Harrison', 'malus-domestica'),
    ('hewes-crab', 'Hewes Crab', 'malus-domestica'),
    ('coxs-orange-pippin', 'Cox''s Orange Pippin', 'malus-domestica'),
    ('ashmeads-kernel', 'Ashmead''s Kernel', 'malus-domestica'),
    ('esopus-spitzenburg', 'Esopus Spitzenburg', 'malus-domestica'),
    ('northern-spy', 'Northern Spy', 'malus-domestica'),
    ('baldwin', 'Baldwin', 'malus-domestica'),
    ('gravenstein', 'Gravenstein', 'malus-domestica'),
    ('rhode-island-greening', 'Rhode Island Greening', 'malus-domestica'),
    ('dolgo', 'Dolgo', 'malus-baccata'),
    ('chestnut-crab', 'Chestnut Crab', 'malus-baccata'),
    ('wickson', 'Wickson', 'malus-domestica'),
    ('honeycrisp', 'Honeycrisp', 'malus-domestica'),
    ('haralson', 'Haralson', 'malus-domestica'),
    ('wealthy', 'Wealthy', 'malus-domestica'),
    ('duchess-of-oldenburg', 'Duchess of Oldenburg', 'malus-domestica')
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

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
