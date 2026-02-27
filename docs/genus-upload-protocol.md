# Genus Upload Protocol

**Purpose:** You are an implementation agent converting a filled genus research template into a SQL migration. The research has already been done — your job is mechanical: map fields to columns, generate correct SQL, lint it, apply it, and verify.

**Inputs you receive:**

1. A filled `genus-research-[genus].md` file (structured data, no SQL)
2. This protocol document

---

## Step-by-Step Process

### 1. Read the filled research document

Parse every species block. Confirm the genus header is filled. Note any hybrid_species entities (they need parentage rows).

### 2. Look up taxonomy_node_uuid (if blank)

```sql
SELECT slug, id FROM taxonomy_nodes WHERE slug = 'genus-[name]';
```

Known UUIDs (check `sql/MIGRATION_GUIDE.md` for the full list):

| Genus | UUID |
|---|---|
| Castanea | `d0000000-0000-0000-0000-000000000003` |
| Juglans | `d0000000-0000-0000-0000-000000000005` |
| Carya | `d0000000-0000-0000-0000-000000000006` |
| Asimina | `d0000000-0000-0000-0000-000000000015` |
| Corylus | `d0000000-0000-0000-0000-000000000001` |
| Malus | `d0000000-0000-0000-0000-000000000007` |
| Pyrus | `d0000000-0000-0000-0000-000000000008` |
| Prunus | `d0000000-0000-0000-0000-000000000009` |

### 3. Determine the next migration number

Check `sql/migrations/` for the highest existing number. The migration guide also tracks this. Use `NNN` format (zero-padded to 3 digits).

### 4. Generate the migration SQL

Create `sql/migrations/NNN_genus_[slug].sql` following the exact pattern below.

### 5. Lint, apply, verify, publish

See the post-upload checklist at the bottom of this document.

---

## Field Mapping: Research Template → SQL

### `plant_entities` table

| Template field | SQL column | Notes |
|---|---|---|
| `slug` | `slug` | exact, e.g. `pyrus-communis` |
| `canonical_name` | `canonical_name` | exact |
| `botanical_name` | `botanical_name` | exact |
| `family` | `family` | exact |
| `genus` (from header) | `genus` | capitalize first letter |
| `species_epithet` | `species` | the column name is `species` |
| `entity_type` | `entity_type` | enum: `species \| subspecies \| hybrid_species \| species_group` |
| `taxonomy_confidence` | `taxonomy_confidence` | enum: `verified \| provisional \| needs_review` |
| `taxonomy_node_uuid` (from header) | `taxonomy_node_id` | UUID |
| `description` | `description` | text |
| *(always)* | `curation_status` | **always `'draft'`** |

### `species_growing_profiles` table

| Template field | SQL column | Type | Notes |
|---|---|---|---|
| `usda_zone_min` | `usda_zone_min` | SMALLINT | |
| `usda_zone_max` | `usda_zone_max` | SMALLINT | |
| `soil_ph_min` | `soil_ph_min` | NUMERIC | or NULL |
| `soil_ph_max` | `soil_ph_max` | NUMERIC | or NULL |
| `soil_drainage` | `soil_drainage` | enum | `well_drained \| moderate \| tolerates_wet \| requires_wet` |
| `soil_texture_tolerances` | `soil_texture_tolerances` | TEXT[] | `ARRAY['loam','sandy_loam']` |
| `sun_requirement` | `sun_requirement` | enum | `full_sun \| part_shade \| full_shade \| shade_tolerant` |
| `growth_rate` | `growth_rate` | enum | `slow \| moderate \| fast \| very_fast` |
| `root_architecture` | `root_architecture` | enum | `taproot \| fibrous \| spreading \| suckering` |
| `native_range_description` | `native_range_description` | TEXT | **NOT** `native_range` |
| `mature_height_min_ft` | `mature_height_min_ft` | NUMERIC | |
| `mature_height_max_ft` | `mature_height_max_ft` | NUMERIC | |
| `mature_spread_min_ft` | `mature_spread_min_ft` | NUMERIC | |
| `mature_spread_max_ft` | `mature_spread_max_ft` | NUMERIC | |
| `years_to_bearing_min` | `years_to_bearing_min` | INTEGER | |
| `years_to_bearing_max` | `years_to_bearing_max` | INTEGER | |
| `harvest_season` | `harvest_season` | enum | `very_early \| early \| early_mid \| mid \| mid_late \| late \| very_late` |
| `data_sources` | `data_sources` | TEXT[] | `ARRAY['source1','source2']` — **always an array** |
| *(always)* | `curation_status` | enum | **always `'draft'`** |

**Extended columns (include only if the research template provided non-null values):**

| Template field | SQL column | Type |
|---|---|---|
| `ahs_heat_zone_max` | `ahs_heat_zone_max` | INTEGER |
| `chill_hours_min` | `chill_hours_min` | INTEGER |
| `chill_hours_max` | `chill_hours_max` | INTEGER |
| `chill_hours_notes` | `chill_hours_notes` | TEXT |
| `soil_notes` | `soil_notes` | TEXT |
| `water_needs` | `water_needs` | TEXT |
| `drought_tolerance` | `drought_tolerance` | INTEGER |
| `flood_tolerance` | `flood_tolerance` | INTEGER |
| `form_description` | `form_description` | TEXT |
| `nitrogen_fixer` | `nitrogen_fixer` | BOOLEAN |
| `allelopathic` | `allelopathic` | BOOLEAN |
| `allelopathic_notes` | `allelopathic_notes` | TEXT |
| `wildlife_value` | `wildlife_value` | TEXT[] |
| `ecological_notes` | `ecological_notes` | TEXT |
| `productive_lifespan_years` | `productive_lifespan_years` | INTEGER |
| `companion_plants` | `companion_plants` | TEXT[] |
| `spacing_notes` | `spacing_notes` | TEXT |
| `pruning_notes` | `pruning_notes` | TEXT |

### `species_pollination_profiles` table

| Template field | SQL column | Type | Notes |
|---|---|---|---|
| `pollination_type` | `pollination_type` | TEXT | `self_fertile`, `cross_required`, `partially_self`, `wind_cross` |
| `pollination_mechanism` | `pollination_mechanism` | TEXT | `wind`, `insect`, `wind_and_insect` |
| `min_pollinizer_count` | `min_pollinizer_count` | INTEGER | omit if null |
| `max_pollinizer_distance_ft` | `max_pollinizer_distance_ft` | INTEGER | omit if null |
| `bloom_period_general` | `bloom_period_general` | TEXT | free text |
| `pollination_notes` | `notes` | TEXT | **column name is `notes`**, not `pollination_notes` |

### `plant_entity_parents` table (hybrids only)

| Template field | SQL column | Notes |
|---|---|---|
| `parents[].slug` | `parent_id` | Use subquery: `(SELECT id FROM plant_entities WHERE slug = '...')` |
| *(the hybrid itself)* | `hybrid_id` | Use subquery: `(SELECT id FROM plant_entities WHERE slug = '...')` |
| `parents[].contribution_percent` | `contribution_percent` | NUMERIC |
| `parentage_data_source` | `data_source` | TEXT |

**Column is `hybrid_id`** (NOT `child_id`).

---

## SQL Construction Rules

Follow these exactly. The linter (`scripts/lint-migration.ts`) enforces most of them.

### 1. Transaction wrapper

```sql
BEGIN;
-- ... all statements ...
COMMIT;
```

### 2. Part 1: Plant entities — single multi-row INSERT

```sql
INSERT INTO plant_entities (
  slug, canonical_name, botanical_name, family, genus, species,
  entity_type, taxonomy_confidence, taxonomy_node_id, description, curation_status
) VALUES
( 'genus-species', 'Common Name', 'Genus species', 'Family', 'Genus', 'species',
  'species', 'verified', 'UUID-HERE', 'Description text.', 'draft' ),
( ... next species ... )
ON CONFLICT (slug) DO NOTHING;
```

### 3. Part 2: Growing profiles — one INSERT per species using SELECT for entity_id

```sql
-- genus-species
INSERT INTO species_growing_profiles (
  plant_entity_id,
  usda_zone_min, usda_zone_max,
  soil_ph_min, soil_ph_max,
  soil_drainage, soil_texture_tolerances,
  sun_requirement, growth_rate, root_architecture,
  native_range_description,
  mature_height_min_ft, mature_height_max_ft,
  mature_spread_min_ft, mature_spread_max_ft,
  years_to_bearing_min, years_to_bearing_max,
  harvest_season,
  curation_status, data_sources
)
SELECT
  pe.id,
  4, 9,                                          -- usda zones
  NULL, NULL,                                     -- soil pH
  'well_drained',                                 -- soil_drainage
  ARRAY['loam','sandy_loam','clay_loam'],         -- soil_texture_tolerances
  'full_sun',                                     -- sun_requirement
  'moderate',                                     -- growth_rate
  'spreading',                                    -- root_architecture
  'Native range description here.',               -- native_range_description
  40, 50,                                         -- height
  25, 35,                                         -- spread
  3, 7,                                           -- years to bearing
  'mid',                                          -- harvest_season
  'draft',                                        -- curation_status
  ARRAY['Source 1', 'Source 2']                   -- data_sources
FROM plant_entities pe
WHERE pe.slug = 'genus-species'
ON CONFLICT (plant_entity_id) DO NOTHING;
```

**Key pattern:** Use `SELECT pe.id ... FROM plant_entities pe WHERE pe.slug = '...'` to resolve the entity UUID. **Do not hardcode UUIDs for plant entities.**

**Omit null columns:** If the research template has a field as `null`, omit that column from the INSERT entirely (don't insert NULL explicitly). This keeps the SQL clean. Exception: `soil_ph_min/max` — include as `NULL` if other growing data is present, for clarity.

**Extended columns:** Only add extended columns (chill hours, ecology, etc.) to the INSERT if the research template provided non-null values for that species. If a species has extended data, include all filled extended fields in that species' INSERT.

### 4. Part 3: Pollination profiles — one INSERT per species using subquery

```sql
INSERT INTO species_pollination_profiles (
  plant_entity_id,
  pollination_type, pollination_mechanism,
  min_pollinizer_count, max_pollinizer_distance_ft,
  bloom_period_general, notes
)
VALUES (
  (SELECT id FROM plant_entities WHERE slug = 'genus-species'),
  'cross_required', 'insect',
  1, 100,
  'spring',
  'Pollination notes here.'
)
ON CONFLICT (plant_entity_id) DO NOTHING;
```

**Omit `min_pollinizer_count` and `max_pollinizer_distance_ft`** if the research template has them as `null`.

### 5. Part 4 (hybrids only): Parentage rows

```sql
INSERT INTO plant_entity_parents (hybrid_id, parent_id, contribution_percent, data_source)
SELECT
  (SELECT id FROM plant_entities WHERE slug = 'genus-hybrid-slug'),
  (SELECT id FROM plant_entities WHERE slug = 'parent-species-slug'),
  50,
  'Source text'
WHERE NOT EXISTS (
  SELECT 1 FROM plant_entity_parents
  WHERE hybrid_id = (SELECT id FROM plant_entities WHERE slug = 'genus-hybrid-slug')
    AND parent_id = (SELECT id FROM plant_entities WHERE slug = 'parent-species-slug')
);
```

Repeat for each parent.

### 6. Part 5: Refresh search index

```sql
REFRESH MATERIALIZED VIEW material_search_index;
```

**No `CONCURRENTLY`.** It fails via the MCP apply_migration endpoint.

### 7. Header comment

```sql
-- ============================================================================
-- MIGRATION NNN: [Genus] Genus ([Common Name])
-- PlantCommerce genus seeding for core [Genus] species used in NA orchards
-- Taxonomy node UUID: [uuid]
-- ============================================================================
```

---

## Common Mistakes to Avoid

These are errors that agents have made before. The linter catches most of them, but check anyway.

| Mistake | Correct |
|---|---|
| `soil_textures` | `soil_texture_tolerances` |
| `root_type` | `root_architecture` |
| `native_range` | `native_range_description` |
| `data_source 'string'` | `data_sources ARRAY['string']` |
| `full_to_part_sun` | Does not exist — use `full_sun` or `part_shade` |
| `REFRESH MATERIALIZED VIEW CONCURRENTLY` | Remove `CONCURRENTLY` |
| `child_id` in parentage | Use `hybrid_id` |
| `pollination_notes` column | Column name is `notes` |
| Missing `ON CONFLICT` | Every INSERT needs `ON CONFLICT DO NOTHING` |
| Missing `BEGIN;`/`COMMIT;` | Must wrap entire migration |
| Hardcoded plant entity UUIDs | Use slug subqueries |
| `plant_search_index` | View name is `material_search_index` |

---

## Post-Upload Checklist

Run these steps in order after generating the SQL file.

### 1. Lint

```bash
npx tsx scripts/lint-migration.ts sql/migrations/NNN_genus_[slug].sql
```

All 7 rules must pass. Fix any failures before proceeding.

### 2. Apply

Use the Supabase MCP tool:

```
mcp__supabase__apply_migration(
  project_id: "bwfhdyjjuubpzwjngquo",
  name: "NNN_genus_[slug]",
  query: <contents of the SQL file>
)
```

### 3. Verify

```bash
npx tsx scripts/check-genus.ts [Genus]
```

Confirm every entity has: growing profile present, pollination profile present, growing profile complete (has sun_requirement, growth_rate, usda zones, data_sources).

### 4. Publish

Apply a one-liner migration (or execute directly):

```sql
UPDATE plant_entities SET curation_status = 'published' WHERE genus = '[Genus]';
```

Then refresh the search index:

```sql
REFRESH MATERIALIZED VIEW material_search_index;
```

### 5. Commit and push

```bash
git add sql/migrations/NNN_genus_[slug].sql
git commit -m "seed: [Genus] genus (N species, N growing, N pollination)"
git push
```

---

## Reference Migration

Use `sql/migrations/023_genus_pyrus.sql` as the canonical reference for minimal-profile genera (core columns only).

Use `sql/migrations/022_genus_prunus.sql` as the reference for extended-profile genera (chill hours, ecology, etc.).

---

## Workflow Summary

```
1. Read filled genus-research-[genus].md
2. Look up taxonomy_node_uuid if blank
3. Determine next migration number
4. Generate sql/migrations/NNN_genus_[slug].sql
5. npx tsx scripts/lint-migration.ts <file>     ← must pass
6. mcp__supabase__apply_migration               ← apply to DB
7. npx tsx scripts/check-genus.ts [Genus]        ← verify
8. Publish (UPDATE curation_status)
9. git commit + push
```
