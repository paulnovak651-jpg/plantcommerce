# Sprint 6: Discovery UX — "Surface What You've Already Built"

> **Goal:** Close the gap between PlantCommerce's rich data model (growing profiles, pollination, cultivar traits, aliases) and the thin discovery UX that currently exposes only a handful of hardcoded filters. Make the browse/search experience feel like the "Kayak for permaculture plants" that the product aims to be.
> **Priority:** Steps 1–4 are the core deliverables (ship together). Steps 5–6 are high-value polish.
> **Migrations required:** 1 (alias search enrichment in Step 5).

---

## Context

PlantCommerce already has 30+ growing profile fields, pollination compatibility data, cultivar traits (disease resistance, flavor, bloom timing, vigor), and an aliases table with normalized text and priority. But the browse page only exposes zone, category, sun, growth rate, and availability as filters — all hardcoded as arrays in `PlantFilterSidebar.tsx` (16KB) and `BrowseContent.tsx` (22KB).

Every analysis agrees: the single highest-ROI work is surfacing this existing data as discoverable, filterable facets. This sprint does that.

### What exists today
- `lib/zone-persistence.ts` — localStorage get/set/clear for `plantcommerce-user-zone`
- `components/ZonePrompt.tsx` — zone selection UI
- `components/PlantFilterSidebar.tsx` — hardcoded filter arrays for zone, category, sun, growth rate, availability
- `components/BrowseContent.tsx` — client-side facet counting, filter application, plant grid
- `lib/queries/browse.ts` — `getAllBrowsePlants`, `BrowsePlant` interface, `BrowseFilters` type
- `lib/queries/search.ts` — `material_search_index` queries
- `app/api/autocomplete/route.ts` — genus/species/cultivar interleaving, 3-char minimum
- `aliases` table — normalized text, target types, priority rankings (NOT in search index)
- `species_growing_profiles` — zone_min/max, sun_requirement, soil_ph_min/max, drought_tolerance, growth_rate, years_to_bearing, harvest_season, root_architecture, mature_height/spread, and more
- `pollination_profiles` — self_fertile, pollination_type, pollination_notes
- `cultivar_traits` — disease_resistance (JSONB), flavor_profile, bloom_time, harvest_time, vigor, form

### What this sprint builds
1. Zone-first experience — zone becomes the primary onboarding question, persists globally, pre-filters everything
2. Config-driven facet registry — adding a filter = adding a config object, not touching component code
3. Dynamic query builder — composes Supabase filters from any combination of active facets
4. Zero-result prevention — facet counts, disabled impossible combos, smart fallback suggestions
5. Alias-enriched search — material_search_index includes aliases so "filbert" → Hazelnut works
6. Better autocomplete — synonym-aware, with alias matches shown as secondary labels

---

## Step 1: Zone-First Persistence & Global Banner

**What:** Make zone the first thing a new visitor sets. Show a persistent "Showing plants for Zone X" banner across browse and search. Pre-filter all results by zone automatically.

### 1a. Enhance `components/ZonePrompt.tsx`

Currently ZonePrompt is a standalone component. Modify it to:

1. Show automatically on first visit to `/browse` or homepage if no zone is set (check `getUserZone()` from `lib/zone-persistence.ts`).
2. After selection, fire a `CustomEvent('zone-changed', { detail: { zone } })` on `window` so other components can react without prop drilling.
3. Store zone via existing `setUserZone()`.

**Do NOT** make this a modal/blocker — render it as a prominent banner at the top of the page content area, above the filter sidebar. Design: warm amber/gold background from the Field Guide palette, with a zone selector dropdown and "Set My Zone" button. Dismissible after setting.

### 1b. Create `components/ZoneBanner.tsx`

New client component. Persistent banner shown on browse, search, species, and genus pages when a zone is set.

```
┌─────────────────────────────────────────────────────┐
│ 🌱 Showing plants for Zone 5  [Change] [Clear]     │
└─────────────────────────────────────────────────────┘
```

- Reads from `getUserZone()` on mount.
- Listens for `zone-changed` CustomEvent to update without page reload.
- "Change" opens an inline dropdown (not a new page).
- "Clear" calls `clearUserZone()` and fires `zone-changed` with `{ zone: null }`.
- Render nothing if no zone set (the ZonePrompt banner handles that case).

### 1c. Wire zone into browse pre-filtering

**Modify `components/BrowseContent.tsx`:**

On mount, read `getUserZone()`. If a zone is set and the URL doesn't already have a `?zone=` param, auto-apply it to the filter state. This means:
- First-time visitor sets zone → browse page immediately shows only plants viable in their zone.
- The zone filter dropdown in PlantFilterSidebar should reflect this auto-applied value.
- URL state should update to include `?zone=X` so the filtered view is shareable.

**Important:** If the user manually changes or clears the zone filter in the sidebar, that takes precedence over the persisted zone. Don't fight the user.

### 1d. Wire zone into species/cultivar page context

**Modify species page (`app/plants/[speciesSlug]/page.tsx`)** and **cultivar page (`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`):**

If user has a persisted zone, show a small contextual note near the growing profile section:
- If plant IS in their zone: "✓ Grows in your zone (Zone 5)"
- If plant is NOT in their zone: "⚠ Outside your zone (Zone 5) — this plant needs Zone 6–9"

This is a client component snippet (needs localStorage access). Create a small `components/ZoneCompatibility.tsx` for this.

---

## Step 2: Config-Driven Facet Registry

**What:** Replace hardcoded filter arrays with a declarative facet configuration. Adding a new filter dimension becomes adding a config object, not editing component internals.

### 2a. Create `lib/facets/registry.ts`

Define the facet system types and the registry:

```typescript
// lib/facets/registry.ts

export type FacetType = 'select' | 'multi-select' | 'range' | 'boolean' | 'zone-range';

export interface FacetDefinition {
  /** Unique key used in URL params and filter state */
  key: string;
  /** User-facing label */
  label: string;
  /** Type of UI control */
  type: FacetType;
  /** Which DB table/column this reads from */
  dataSource: {
    table: 'species_growing_profiles' | 'pollination_profiles' | 'plant_entities' | 'cultivar_traits';
    column: string;
    /** Join key to link back to plant_entities */
    joinOn: string;
  };
  /** Static options (for select/multi-select). If omitted, derive from data. */
  options?: FacetOption[];
  /** For range facets: min/max bounds */
  range?: { min: number; max: number; step: number; unit?: string };
  /** Display order in sidebar (lower = higher) */
  sortOrder: number;
  /** Group label for sidebar sections */
  group: 'growing' | 'pollination' | 'availability' | 'taxonomy';
  /** Whether to show result count next to each option */
  showCounts: boolean;
  /** Whether to disable options with 0 results */
  disableEmpty: boolean;
}

export interface FacetOption {
  value: string;
  label: string;
}
```

Then define the initial registry — migrating existing hardcoded filters plus new ones:

```typescript
export const FACET_REGISTRY: FacetDefinition[] = [
  // --- Taxonomy group ---
  {
    key: 'category',
    label: 'Category',
    type: 'multi-select',
    dataSource: { table: 'plant_entities', column: 'display_category', joinOn: 'id' },
    sortOrder: 10,
    group: 'taxonomy',
    showCounts: true,
    disableEmpty: true,
  },

  // --- Growing group ---
  {
    key: 'zone',
    label: 'Hardiness Zone',
    type: 'zone-range',
    dataSource: { table: 'species_growing_profiles', column: 'usda_zone_min', joinOn: 'species_id' },
    range: { min: 1, max: 13, step: 1 },
    sortOrder: 20,
    group: 'growing',
    showCounts: false,
    disableEmpty: false,
  },
  {
    key: 'sun',
    label: 'Sun Requirement',
    type: 'multi-select',
    dataSource: { table: 'species_growing_profiles', column: 'sun_requirement', joinOn: 'species_id' },
    options: [
      { value: 'Full Sun', label: 'Full Sun' },
      { value: 'Full Sun to Partial Shade', label: 'Full Sun to Part Shade' },
      { value: 'Partial Shade', label: 'Partial Shade' },
      { value: 'Full Shade', label: 'Full Shade' },
    ],
    sortOrder: 30,
    group: 'growing',
    showCounts: true,
    disableEmpty: true,
  },
  {
    key: 'growth_rate',
    label: 'Growth Rate',
    type: 'multi-select',
    dataSource: { table: 'species_growing_profiles', column: 'growth_rate', joinOn: 'species_id' },
    options: [
      { value: 'slow', label: 'Slow' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'fast', label: 'Fast' },
    ],
    sortOrder: 40,
    group: 'growing',
    showCounts: true,
    disableEmpty: true,
  },
  {
    key: 'drought_tolerance',
    label: 'Drought Tolerance',
    type: 'multi-select',
    dataSource: { table: 'species_growing_profiles', column: 'drought_tolerance', joinOn: 'species_id' },
    options: [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ],
    sortOrder: 50,
    group: 'growing',
    showCounts: true,
    disableEmpty: true,
  },
  {
    key: 'years_to_bearing',
    label: 'Years to Bearing',
    type: 'range',
    dataSource: { table: 'species_growing_profiles', column: 'years_to_bearing_min', joinOn: 'species_id' },
    range: { min: 1, max: 15, step: 1, unit: 'years' },
    sortOrder: 60,
    group: 'growing',
    showCounts: false,
    disableEmpty: false,
  },
  {
    key: 'mature_height',
    label: 'Mature Height',
    type: 'range',
    dataSource: { table: 'species_growing_profiles', column: 'mature_height_max_ft', joinOn: 'species_id' },
    range: { min: 0, max: 100, step: 5, unit: 'ft' },
    sortOrder: 70,
    group: 'growing',
    showCounts: false,
    disableEmpty: false,
  },
  {
    key: 'soil_ph',
    label: 'Soil pH',
    type: 'range',
    dataSource: { table: 'species_growing_profiles', column: 'soil_ph_min', joinOn: 'species_id' },
    range: { min: 3.0, max: 9.0, step: 0.5 },
    sortOrder: 80,
    group: 'growing',
    showCounts: false,
    disableEmpty: false,
  },

  // --- Pollination group ---
  {
    key: 'self_fertile',
    label: 'Self-Fertile',
    type: 'boolean',
    dataSource: { table: 'pollination_profiles', column: 'self_fertile', joinOn: 'species_id' },
    sortOrder: 90,
    group: 'pollination',
    showCounts: true,
    disableEmpty: true,
  },

  // --- Availability group ---
  {
    key: 'in_stock',
    label: 'In Stock Now',
    type: 'boolean',
    dataSource: { table: 'plant_entities', column: 'has_offers', joinOn: 'id' },
    sortOrder: 100,
    group: 'availability',
    showCounts: true,
    disableEmpty: false,
  },
];
```

### 2b. Create `lib/facets/state.ts`

Utility to convert between URL search params and facet filter state:

```typescript
// lib/facets/state.ts

import { FACET_REGISTRY } from './registry';

/** Active filter values keyed by facet key */
export type FacetFilterState = Record<string, string | string[] | number | [number, number] | boolean | null>;

/** Parse URL search params into FacetFilterState */
export function parseFacetParams(params: URLSearchParams): FacetFilterState { ... }

/** Serialize FacetFilterState back to URL search params */
export function serializeFacetParams(state: FacetFilterState): URLSearchParams { ... }

/** Get the human-readable summary of active filters (for zero-result messaging) */
export function describeActiveFilters(state: FacetFilterState): string[] { ... }
```

The URL format should match the existing pattern — `?zone=5&category=Nut+Trees&sun=Full+Sun` — so existing bookmarks don't break. Multi-select values are comma-separated: `?category=Nut+Trees,Berries`. Range values use dash: `?years_to_bearing=2-5`.

---

## Step 3: Dynamic Query Builder

**What:** Replace the current filter logic in `BrowseContent.tsx` (client-side filtering of a full dataset) with a query builder that composes Supabase filters dynamically from the facet state.

### 3a. Create `lib/queries/facet-query-builder.ts`

```typescript
// lib/queries/facet-query-builder.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FacetFilterState } from '../facets/state';
import { FACET_REGISTRY } from '../facets/registry';
import type { BrowsePlant } from './browse';

/**
 * Build and execute a browse query with dynamic facet filters.
 * 
 * Strategy: Query plant_entities as the base, then join/filter against
 * growing profiles, pollination profiles, etc. based on active facets.
 * 
 * This replaces the "fetch everything, filter client-side" pattern in
 * BrowseContent.tsx with targeted DB queries.
 */
export async function queryBrowseWithFacets(
  supabase: SupabaseClient,
  filters: FacetFilterState,
  sort: { field: string; direction: 'asc' | 'desc' },
  pagination: { page: number; pageSize: number }
): Promise<{ plants: BrowsePlant[]; totalCount: number }> { ... }

/**
 * For each active facet, compute how many results each option would yield
 * given the OTHER active filters (cross-facet counts).
 * 
 * This powers the "(12)" count next to each filter option and the
 * greyed-out impossible combinations.
 */
export async function computeFacetCounts(
  supabase: SupabaseClient,
  filters: FacetFilterState
): Promise<Record<string, Record<string, number>>> { ... }
```

**Implementation approach for `queryBrowseWithFacets`:**

1. Start with the existing `getAllBrowsePlants` parallel-query pattern from `lib/queries/browse.ts` — it already fetches plant_entities, growing profiles, and offers in parallel.
2. Instead of fetching all and filtering client-side, apply SQL-level filters:
   - For `plant_entities` columns (category, has_offers): add `.eq()` / `.in()` to the base query.
   - For `species_growing_profiles` columns (zone, sun, growth_rate, drought_tolerance, etc.): query growing_profiles with the relevant filters, collect matching species IDs, then filter plant_entities with `.in('id', matchingIds)`.
   - For `pollination_profiles` columns (self_fertile): same ID-collection pattern.
   - For range facets (years_to_bearing, mature_height, soil_ph): use `.gte()` / `.lte()`.
3. Apply pagination with `.range(offset, offset + pageSize - 1)`.
4. Return `{ plants, totalCount }` where totalCount comes from a parallel count query.

**Implementation approach for `computeFacetCounts`:**

For each facet in the registry where `showCounts: true`:
1. Apply ALL other active filters (excluding the current facet).
2. Group by the current facet's column and count.
3. Return the counts map.

This is N queries for N count-enabled facets. For the initial 4-5 countable facets this is fine. If performance becomes an issue later, batch them into a single SQL function.

### 3b. Create API route `app/api/browse/route.ts`

New server-side API endpoint that BrowseContent calls instead of fetching all plants client-side:

```typescript
// app/api/browse/route.ts
// GET /api/browse?zone=5&category=Nut+Trees&sun=Full+Sun&sort=name&page=1

// 1. Parse facet params from URL
// 2. Call queryBrowseWithFacets()
// 3. Call computeFacetCounts()
// 4. Return { plants, totalCount, facetCounts }
```

Rate limit with existing `lib/api-rate-limit.ts` pattern.

### 3c. Refactor `components/BrowseContent.tsx`

This is the biggest component change. The 22KB file currently does:
- Fetches all plants as a prop from the server component
- Applies filters client-side
- Computes facet counts client-side
- Renders the grid

Refactor to:
1. **Remove** the all-plants prop. Instead, call `/api/browse` with the active facet state.
2. **Remove** client-side filter logic. The API handles it.
3. **Remove** client-side facet counting. The API returns `facetCounts`.
4. **Keep** the grid rendering, sort controls, pagination, and genus grouping toggle.
5. Add loading states (use existing `PlantCardSkeleton.tsx` pattern).
6. Debounce filter changes (300ms) before calling the API to avoid excessive requests.

**Decompose into smaller files while refactoring:**

| New file | Responsibility | Max size |
|----------|---------------|----------|
| `components/browse/BrowseGrid.tsx` | Plant card grid rendering + genus grouping | ~150 lines |
| `components/browse/BrowseHeader.tsx` | Result count, sort dropdown, group-by toggle | ~80 lines |
| `components/browse/BrowseShell.tsx` | Layout container: sidebar + main content area | ~60 lines |
| `components/BrowseContent.tsx` | Orchestrator: state management, API calls, wires children together | ~200 lines |

Mark all of these `'use client'`. The parent `app/browse/page.tsx` remains a Server Component.

---

## Step 4: Zero-Result Prevention

**What:** Never show a dead-end "No plants match your filters" message. Instead: show counts on filter options before selecting, grey out impossible combinations, and suggest refinements when results are empty.

### 4a. Facet counts in sidebar

**Modify `components/PlantFilterSidebar.tsx`:**

Rewrite this component to render from the `FACET_REGISTRY` instead of hardcoded arrays. For each facet:

1. Read the facet definition from registry.
2. Render the appropriate control (dropdown, checkbox group, range slider, boolean toggle) based on `facet.type`.
3. Show counts from the `facetCounts` prop next to each option: `Full Sun (14)`.
4. If `disableEmpty: true` and count is 0, render the option as greyed out / non-interactive.
5. Group facets by `facet.group` with section headers: "Growing Conditions", "Pollination", "Availability".

**New component: `components/browse/FacetControl.tsx`**

Generic facet renderer that takes a `FacetDefinition` and renders the right control:
- `select` / `multi-select` → checkbox group with counts
- `range` → dual-handle range slider (use native `<input type="range">` or a lightweight component)
- `boolean` → single toggle/checkbox
- `zone-range` → zone number dropdown (special case, reuse existing zone UI)

### 4b. Smart empty state

**Create `components/browse/SmartEmptyState.tsx`:**

When the API returns 0 results, show a helpful message instead of just "No plants match":

```
┌─────────────────────────────────────────────────────────┐
│  No plants match all your filters.                      │
│                                                         │
│  Try removing one:                                      │
│  ✕ Zone 2          (124 results without this)           │
│  ✕ Self-Fertile    (3 results without this)             │
│  ✕ Nut Trees       (45 results without this)            │
│                                                         │
│  Or  [Clear all filters]                                │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
1. When result count is 0, for each active filter, call the API with that filter removed and show the count.
2. These counts can come from the same `computeFacetCounts` response — the count for each option when the filter is removed tells you how many results you'd get.
3. Sort suggestions by "most results if removed" descending.
4. Include a "Clear all filters" link.

### 4c. Active filter pills

**Create `components/browse/ActiveFilterPills.tsx`:**

Show removable pills above the results grid for each active filter:

```
Zone 5 ✕ | Nut Trees ✕ | Full Sun ✕ | Self-Fertile ✕    [Clear all]
```

Clicking ✕ on a pill removes that filter and re-queries. This gives users an at-a-glance view of what's narrowing their results and a quick way to broaden.

---

## Step 5: Alias-Enriched Search Index

**What:** Add aliases to `material_search_index` so searching "filbert" finds Hazelnut, "pawpaw" finds Asimina, etc.

### 5a. Migration `sql/migrations/050_alias_search_enrichment.sql`

The `aliases` table already exists with `normalized_text`, `target_type`, `target_id`, and `priority`. The `material_search_index` materialized view needs to include alias text.

```sql
-- 050_alias_search_enrichment.sql
-- Recreate material_search_index to include alias text in the search vector

-- Drop and recreate the materialized view
DROP MATERIALIZED VIEW IF EXISTS material_search_index;

CREATE MATERIALIZED VIEW material_search_index AS
SELECT
  pe.id,
  pe.canonical_name,
  pe.botanical_name,
  pe.slug,
  pe.display_category,
  pe.curation_status,
  -- Combine canonical name + botanical name + alias text into search vector
  setweight(to_tsvector('english', coalesce(pe.canonical_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(pe.botanical_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(alias_agg.alias_text, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(cultivar_agg.cultivar_names, '')), 'D')
    AS search_vector,
  -- Store alias text for display in autocomplete
  alias_agg.alias_text
FROM plant_entities pe
LEFT JOIN (
  SELECT target_id, string_agg(normalized_text, ' ') AS alias_text
  FROM aliases
  WHERE target_type IN ('species', 'genus')
  GROUP BY target_id
) alias_agg ON alias_agg.target_id = pe.id
LEFT JOIN (
  SELECT species_id, string_agg(name, ' ') AS cultivar_names
  FROM cultivars
  GROUP BY species_id
) cultivar_agg ON cultivar_agg.species_id = pe.id
WHERE pe.curation_status = 'published';

-- Recreate the index for search performance
CREATE INDEX idx_material_search_index_search ON material_search_index USING gin(search_vector);
-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_material_search_index_id ON material_search_index(id);
```

**Important:** Review the existing `material_search_index` definition first (it may be in an earlier migration or created outside migrations). Adapt the above to match the current column set — do NOT drop columns that other queries depend on. The key addition is:
1. Join `aliases` into the search vector at weight C.
2. Expose `alias_text` as a column so autocomplete can show "Filbert → Hazelnut".

### 5b. Enhance autocomplete to show alias matches

**Modify `app/api/autocomplete/route.ts`:**

When a search matches via an alias rather than the canonical name, return the alias as a secondary label:

```typescript
// Current result shape:
{ name: 'European Hazelnut', slug: 'corylus-avellana', type: 'species' }

// Enhanced result shape:
{ name: 'European Hazelnut', slug: 'corylus-avellana', type: 'species', matchedAlias: 'Filbert' }
```

The frontend autocomplete dropdown should render this as:
```
European Hazelnut                    (species)
  also known as: Filbert
```

**Modify `lib/queries/search.ts`:**

Update the search query to return alias match info. When the query matches `alias_text` but not `canonical_name`, include the matching alias. Use `ts_headline()` or a simple substring match on the `alias_text` column.

---

## Step 6: Refresh search index after pipeline runs

**What:** After each scrape/import run, refresh the materialized view so new data appears in search immediately.

**Modify `app/api/pipeline/scrape/route.ts`** (or wherever the pipeline completion handler is):

After a successful import run, add:

```typescript
await supabase.rpc('refresh_material_search_index');
```

**Create the RPC function** (add to migration 050 or a new migration):

```sql
CREATE OR REPLACE FUNCTION refresh_material_search_index()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY material_search_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This ensures the search index stays fresh without manual intervention.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| **Create** | `lib/facets/registry.ts` | `FacetDefinition` type + `FACET_REGISTRY` config array |
| **Create** | `lib/facets/state.ts` | URL ↔ facet state serialization utilities |
| **Create** | `lib/queries/facet-query-builder.ts` | `queryBrowseWithFacets`, `computeFacetCounts` |
| **Create** | `app/api/browse/route.ts` | Server-side browse API with facet filtering |
| **Create** | `components/ZoneBanner.tsx` | Persistent "Showing plants for Zone X" banner |
| **Create** | `components/ZoneCompatibility.tsx` | Per-plant zone compatibility note |
| **Create** | `components/browse/BrowseGrid.tsx` | Plant card grid + genus grouping (extracted) |
| **Create** | `components/browse/BrowseHeader.tsx` | Result count, sort, group-by toggle (extracted) |
| **Create** | `components/browse/BrowseShell.tsx` | Sidebar + content layout container (extracted) |
| **Create** | `components/browse/FacetControl.tsx` | Generic facet renderer by type |
| **Create** | `components/browse/SmartEmptyState.tsx` | Zero-result suggestions with removal counts |
| **Create** | `components/browse/ActiveFilterPills.tsx` | Removable filter pill bar |
| **Create** | `sql/migrations/050_alias_search_enrichment.sql` | Alias-enriched materialized view |
| **Modify** | `components/ZonePrompt.tsx` | Auto-show on first visit, fire CustomEvent |
| **Modify** | `components/PlantFilterSidebar.tsx` | Render from FACET_REGISTRY, show counts, grey out empties |
| **Modify** | `components/BrowseContent.tsx` | Refactor to API-driven, decompose into browse/* children |
| **Modify** | `app/browse/page.tsx` | Pass minimal props, remain Server Component |
| **Modify** | `app/plants/[speciesSlug]/page.tsx` | Add ZoneBanner + ZoneCompatibility |
| **Modify** | `app/api/autocomplete/route.ts` | Return alias match info |
| **Modify** | `lib/queries/search.ts` | Include alias_text in search results |
| **Modify** | `app/api/pipeline/scrape/route.ts` | Refresh search index after import runs |

## Files NOT to modify

- No changes to the pipeline, scrapers, or resolver logic
- No changes to cultivar pages or cultivar_traits queries (comparison is a later sprint)
- No changes to `KNOWLEDGE_GRAPH_SCHEMA.md` or `DESIGN_SYSTEM.md`
- No new genus data migrations (data expansion is a separate workstream)
- No auth, no user accounts (Phase 3)
- No Plant Finder Wizard (Phase 3 — needs this facet system first)
- No cross-classification tags (Phase 2)

---

## Implementation Order (Dependency Chain)

```
Step 2a (facet registry types)
  └→ Step 2b (URL state utils)
      └→ Step 3a (query builder)
          └→ Step 3b (API route)
              └→ Step 3c (BrowseContent refactor)
                  └→ Step 4a (sidebar from registry + counts)
                  └→ Step 4b (smart empty state)
                  └→ Step 4c (active filter pills)

Step 1a–1d (zone-first) — can be done in parallel with Step 2

Step 5 (alias search) — independent, can be done any time
Step 6 (index refresh) — after Step 5
```

**Suggested execution order for Claude Code:**
1. Step 2a → 2b (foundation, no UI yet)
2. Step 3a → 3b (query layer, testable with curl)
3. Step 1a → 1b → 1c → 1d (zone UX, visible improvement)
4. Step 3c → 4a (refactor BrowseContent + new sidebar, biggest visual change)
5. Step 4b → 4c (zero-result polish)
6. Step 5 → 6 (alias search, independent migration)

---

## Testing Notes

- After Steps 2–3: `curl /api/browse?zone=5&category=Nut+Trees` should return only nut trees viable in Zone 5 with facet counts.
- After Step 1: A new visitor to `/browse` sees the zone prompt banner. After setting Zone 5, the URL updates to `?zone=5` and results filter. Navigating to a species page shows "✓ Grows in your zone" or "⚠ Outside your zone".
- After Step 4: Setting Zone 2 + Persimmons shows the smart empty state with "try removing Zone 2 (X results)" and "try removing Persimmons (Y results)".
- After Step 5: Typing "filbert" in the search autocomplete returns "European Hazelnut (also known as: Filbert)". Typing "pawpaw" returns Asimina triloba.
- All existing tests must continue passing (`npm test`). Add new tests for:
  - `lib/facets/state.ts` — round-trip URL param serialization
  - `lib/queries/facet-query-builder.ts` — filter composition logic (mock Supabase)
  - `components/browse/SmartEmptyState.tsx` — renders suggestions correctly

---

## Design Notes

- Follow "The Field Guide" design system — warm linen palette, Fraunces + Satoshi fonts.
- The ZoneBanner should feel ambient, not aggressive — think of it like Kayak's "Searching from: New York" bar. A gentle reminder, not a blocker.
- Facet sidebar sections should use collapsible groups. "Growing Conditions" expanded by default, "Pollination" collapsed. Mobile: sidebar becomes a slide-out drawer.
- Range sliders (years to bearing, height, pH) should show the current selected range as text: "2–5 years".
- Active filter pills should use the same tag styling as existing `Tag` component from the design system.
- Zero-result state should feel helpful, not apologetic. Use the warm amber/gold tone, not error red.
- Facet counts should be slightly muted (text-stone-400) so they inform without cluttering.
