# Migration Guide

Reference for writing and reviewing genus migrations. Keep this file open when editing any Codex-generated SQL before applying it.

---

## Naming Convention

```
NNN_description.sql       e.g. 018_patch_castanea_sun_requirement.sql
```

- Numbers are **sequential integers**, zero-padded to 3 digits.
- No letter suffixes (015a was a one-off; future split work gets its own number).
- Descriptive slug uses underscores, lowercase.
- File lives in `sql/migrations/`.

**Current sequence:** 001 … 024. Next available: **025**

---

## Correct Column Names (species_growing_profiles)

Codex frequently generates wrong names. Always use the names below.

| Wrong (Codex generates) | Correct (actual DB column) |
|---|---|
| `soil_textures` | `soil_texture_tolerances` (TEXT ARRAY) |
| `root_type` | `root_architecture` (enum — see below) |
| `native_range` | `native_range_description` (TEXT) |
| `data_source 'string'` | `data_sources ARRAY['string']` (TEXT ARRAY) |
| `sun` / `light` | `sun_requirement` (enum — see below) |

---

## Enum Reference (public schema, app enums only)

### `sun_requirement`
```
full_sun | part_shade | full_shade | shade_tolerant
```
> **NEVER use** `full_to_part_sun` — it does not exist and causes silent failures.

### `growth_rate`
```
slow | moderate | fast | very_fast
```

### `soil_drainage`
```
well_drained | moderate | tolerates_wet | requires_wet
```

### `root_architecture`
```
taproot | fibrous | spreading | suckering
```

### `harvest_season` / `bloom_period`
```
very_early | early | early_mid | mid | mid_late | late | very_late
```

### `curation_status`
```
draft | reviewed | published
```

### `taxonomy_confidence`
```
verified | provisional | needs_review
```

### `entity_type`
```
species | subspecies | hybrid_species | species_group
```

### `resolution_status`
```
resolved_cultivar | resolved_plant_entity | resolved_named_material |
resolved_population | unresolved | review_needed
```

### TEXT (not enums — use any string)
- `pollination_type` — common values: `self_fertile`, `cross_required`, `partially_self`, `wind_cross`
- `pollination_mechanism` — common values: `wind`, `insect`, `wind_and_insect`

---

## Genus Migration Checklist

Before applying any Codex-generated genus migration, verify each item:

- [ ] File number is next available (check `sql/migrations/` directory)
- [ ] `soil_texture_tolerances` not `soil_textures`
- [ ] `root_architecture` not `root_type`
- [ ] `native_range_description` not `native_range`
- [ ] `data_sources ARRAY[...]` not `data_source '...'`
- [ ] `sun_requirement` uses only valid enum values (no `full_to_part_sun`)
- [ ] `REFRESH MATERIALIZED VIEW` — **no `CONCURRENTLY`** (fails via MCP apply_migration endpoint even with unique index present)
- [ ] All UPDATEs and INSERTs use `WHERE NOT EXISTS` or `ON CONFLICT DO NOTHING`
- [ ] Taxonomy node UUID exists in `plant_entities` for the genus
- [ ] Hybrid parentage rows have `WHERE NOT EXISTS` guards
- [ ] `BEGIN; … COMMIT;` wraps the whole migration

---

## Taxonomy Node UUIDs

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

> To find others: `SELECT slug, id FROM taxonomy_nodes WHERE rank_id = 6 ORDER BY slug;`

---

## Key Table Schemas

### `species_growing_profiles`
```sql
plant_entity_id         UUID NOT NULL  -- FK → plant_entities
usda_zone_min/max       SMALLINT
soil_ph_min/max         NUMERIC
soil_drainage           soil_drainage enum
soil_texture_tolerances TEXT[]
sun_requirement         sun_requirement enum
growth_rate             growth_rate enum
root_architecture       root_architecture enum
native_range_description TEXT
mature_height_min/max_ft NUMERIC
mature_spread_min/max_ft NUMERIC
years_to_bearing_min/max INTEGER
harvest_season          harvest_season enum
curation_status         curation_status enum  DEFAULT 'draft'
data_sources            TEXT[]
```

### `species_pollination_profiles`
```sql
plant_entity_id           UUID NOT NULL UNIQUE  -- FK → plant_entities
pollination_type          TEXT NOT NULL   -- see TEXT enums above
pollination_mechanism     TEXT
min_pollinizer_count      INTEGER
max_pollinizer_distance_ft INTEGER
bloom_period_general      TEXT
notes                     TEXT
```

### `plant_entity_parents`
```sql
hybrid_id                 UUID  -- FK → plant_entities (the hybrid child)
parent_id                 UUID  -- FK → plant_entities (a parent species)
contribution_percent      NUMERIC
data_source               TEXT
confidence_note           TEXT
```

---

## Apply Workflow

```
1. Review against checklist above
2. mcp__supabase__apply_migration  (DDL changes)
   OR mcp__supabase__execute_sql   (data-only patches)
3. Run verification queries (see each migration's header for what to check)
4. git add sql/migrations/NNN_*.sql && git commit && git push
```

---

## Materialized View

`material_search_index` — refresh after any genus seeding:
```sql
REFRESH MATERIALIZED VIEW material_search_index;   -- no CONCURRENTLY
```
The unique index `idx_material_search_entity` exists on the view but CONCURRENTLY still fails via MCP apply_migration endpoint. Always use plain `REFRESH MATERIALIZED VIEW material_search_index;`.

---

## Gap Log

Migrations 007–009 and 011–012 are absent from the repository. They were applied directly to Supabase during early development before file-based tracking was adopted. Their schema additions are covered by existing migrations 002–006 and 010.
