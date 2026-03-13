# BUGFIX: USDA Zone Filter Not Filtering Results

**Type:** Bug fix  
**Priority:** High  
**Scope:** Browse section zone filter + query layer

---

## Bug

The USDA Zone min/max dropdowns in the "Browse All Plants" section are cosmetic — selecting a zone range does not filter out plants, genera, or categories that fall outside that range. The dropdowns set state but nothing downstream reads it to filter query results.

---

## Fix

**Design for extensibility.** We'll likely add more filter types in the future (stock status, sun exposure, native region, etc.), so don't patch zone filtering in isolation. Build a clean, reusable filter architecture that zone plugs into and future filters hook into with minimal effort.

### 1. Create a centralized browse filter state

If one doesn't already exist, create a single source of truth for all browse filters — either a React context, URL search params, or a shared state hook. Shape it so adding future filters is just adding a field:

```ts
type BrowseFilters = {
  zoneMin?: number;
  zoneMax?: number;
  // Future filters plug in here:
  // stockStatus?: 'in_stock' | 'all';
  // sunExposure?: 'full_sun' | 'partial' | 'shade';
};
```

### 2. Wire the zone dropdowns to filter state

When the user selects Min: 4, Max: 7, the filter state should update immediately.

### 3. Pass filters into the data-fetching layer

The query that loads genera/species/cultivars for the browse columns must accept these filters and apply them. This means:

- Adding `zone_min` / `zone_max` parameters to the Supabase query in the browse query file (e.g., `lib/queries/browse.ts`)
- Filtering on the plant's `usda_zone_min` and `usda_zone_max` columns using **overlap logic**: a plant is "in range" if its zone range overlaps with the user's selected range
- **The correct filter is:** `plant.zone_min <= selected_max AND plant.zone_max >= selected_min`
- Example: User selects Zone 5–7. A plant rated Zone 3–8 still appears (it grows in 5–7). A plant rated Zone 9–10 does not.

### 4. Filter propagates through all three columns

- **Categories:** Show updated genus/species counts reflecting the filtered set
- **Genera:** Only show genera that have at least one species/cultivar in the zone range
- **Plants & Cultivars:** Only show plants matching the zone range

### 5. Keep the filter bar layout extensible

The "REFINE RESULTS" row should use a flex/grid layout that wraps naturally as filters are added later. Don't hardcode it as a single-purpose zone widget.

---

## Edge Cases

| Min | Max | Expected behavior |
|-----|-----|-------------------|
| —   | —   | Show everything (no filter active) |
| 5   | 7   | Only plants whose zone range overlaps 5–7. Genera with zero matches disappear or show 0 count. |
| 3   | 3   | Only plants that grow in Zone 3 (`zone_min ≤ 3 AND zone_max ≥ 3`) |
| 9   | 10  | Removes most temperate trees. Empty categories should show 0 counts or be hidden. |
| 7   | 4   | Invalid range (min > max) — either prevent in the UI (disable max values below min) or treat as "no filter" |

---

## Files Likely Affected

- The browse filter/refine bar component (wherever the Min/Max dropdowns live)
- `lib/queries/browse.ts` (or wherever the browse section's Supabase queries live)
- The browse data-fetching hook or server component that passes data to the columns
- If filter state is managed via URL params, the page component that reads/writes those params
