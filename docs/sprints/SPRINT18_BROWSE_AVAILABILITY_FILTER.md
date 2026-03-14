# Sprint 18 — Browse Availability & Stock Type Filter

> **Status:** Ready for implementation  
> **Depends on:** Sprint 17 (Cultivar Page Restructure) — not a hard dependency but should go after  
> **Blocked by:** Nothing

---

## Goal

Add a stock type filter (Seeds / Plants / Either) and an availability toggle ("For sale now") to the browse experience. Show all cultivars by default (including those without nursery listings), but clearly differentiate buyable vs data-only cultivars on browse cards.

## Design Principles

1. **Show all cultivars by default.** The platform is both a research tool and a marketplace. Hiding data-rich cultivars because they lack listings makes the catalog feel thinner than it is.
2. **Explicit availability status on every card.** Users must never guess whether a cultivar is purchasable. Every card shows either a price or "No current listings."
3. **Stock type is a listing-level filter, not a page-level concept.** Seeds vs plants vs cuttings live in the offer/listing layer. The cultivar page describes the genetics.

---

## Current State

### Browse architecture

| File | Role |
|------|------|
| `app/page.tsx` | Homepage, renders `TaxonomyExplorer` |
| `components/browse/TaxonomyExplorer.tsx` | Three-column taxonomy browser |
| `app/browse/page.tsx` | Faceted browse page |
| `components/browse/BrowsePageClient.tsx` | Browse page client wrapper |
| `app/api/browse/route.ts` | Browse API endpoint |
| `lib/queries/facet-query-builder.ts` | Builds Supabase queries from facet params |
| `lib/facets/registry.ts` | Facet definitions |
| `components/PlantCard.tsx` | Species/cultivar card in browse results |
| `lib/zone-persistence.ts` | Persists user's zone selection to localStorage |

### Current filter bar

The zone filter already exists as a persistent global filter. Zone is stored in localStorage via `lib/zone-persistence.ts` and applied to browse queries.

### PlantCard current behavior

`components/PlantCard.tsx` currently shows: canonical name, botanical name, zone range, display category, and offer count / price if available. Cards without offers show no price information — they don't explicitly say "no listings."

### Offer data model

Offers have a `sale_form` column (values like: `'bare_root'`, `'potted'`, `'seed'`, `'cutting'`, `'unknown'`). This is the field we'll filter on for stock type.

---

## New Filter: Stock Type

### Filter bar addition

Add a stock type selector next to the existing zone filter in the persistent filter bar. Three options:

| Value | Label | Behavior |
|-------|-------|----------|
| `'either'` | **Any type** (default) | Show all cultivars. Prices show cheapest of any stock type. |
| `'seed'` | **Seeds** | In browse: only show cultivars with at least one offer where `sale_form = 'seed'`. Price preview shows seed price. |
| `'plant'` | **Plants** | In browse: only show cultivars with at least one offer where `sale_form IN ('bare_root', 'potted', 'cutting', 'grafted')`. Price shows plant price. |

### Persistence

Store stock type preference in localStorage alongside zone, using the same pattern in `lib/zone-persistence.ts`. Add:

```typescript
// In lib/zone-persistence.ts (or a new lib/filter-persistence.ts)
const STOCK_TYPE_KEY = 'pc-stock-type';

export type StockTypeFilter = 'either' | 'seed' | 'plant';

export function getStockType(): StockTypeFilter {
  if (typeof window === 'undefined') return 'either';
  return (localStorage.getItem(STOCK_TYPE_KEY) as StockTypeFilter) ?? 'either';
}

export function setStockType(value: StockTypeFilter): void {
  localStorage.setItem(STOCK_TYPE_KEY, value);
}
```

### API integration

Add `stockType` as an optional query parameter to `app/api/browse/route.ts`. When present and not `'either'`, the facet query builder should:

1. Join through `cultivar_nursery_offers` to filter cultivars that have at least one active offer matching the stock type
2. Adjust the price aggregation to only consider matching offers

This is a listing-level filter that surfaces at the cultivar level.

---

## New Toggle: For Sale Now

### Behavior

A simple toggle/checkbox in the filter bar: **"For sale now"**

| State | Behavior |
|-------|----------|
| OFF (default) | Show all cultivars with data, regardless of offer status |
| ON | Only show cultivars with at least one active offer (respecting stock type filter if set) |

### Implementation

This is a `WHERE EXISTS (SELECT 1 FROM cultivar_nursery_offers WHERE ...)` clause added to the browse query when the toggle is on. When combined with stock type:

- `stockType='seed'` + `forSaleNow=true` → only cultivars with active seed offers
- `stockType='plant'` + `forSaleNow=true` → only cultivars with active plant offers
- `stockType='either'` + `forSaleNow=true` → only cultivars with any active offer
- `forSaleNow=false` (any stock type) → all cultivars shown

---

## PlantCard Changes

### Availability status badge

Every `PlantCard` must show one of two states:

**Has offers:**
```
From $4.50 · 3 nurseries
```
(Already works this way when offer data exists)

**No offers:**
```
No current listings
```
(New — render a muted text badge where the price would normally go)

### Stock-type-aware pricing

When the stock type filter is active, the price shown on the card should reflect that filter:

- Filter = Seeds → show cheapest seed offer price
- Filter = Plants → show cheapest plant offer price  
- Filter = Either → show cheapest offer of any type

This requires the browse API to return `min_price_cents` scoped to the active stock type filter.

### "Available as" chips (optional enhancement)

Small inline chips on the card showing which stock types exist: `Seed` `Plant` `Cutting`. Derived from distinct `sale_form` values across that cultivar's offers.

---

## Implementation Steps

### Phase A: Filter persistence + UI

1. Add `StockTypeFilter` type and getter/setter to `lib/zone-persistence.ts` (or new file)
2. Add `forSaleNow` boolean getter/setter to same file
3. Create `StockTypeFilter` UI component (segmented control or dropdown, 3 options)
4. Create `ForSaleToggle` UI component (simple checkbox/toggle)
5. Add both to the filter bar in the browse experience
6. Wire to localStorage persistence

### Phase B: API changes

1. Add `stockType` and `forSaleNow` query params to `app/api/browse/route.ts`
2. Update `lib/queries/facet-query-builder.ts` to:
   - Add offer existence subquery when `forSaleNow=true`
   - Add stock type filter to offer join when `stockType !== 'either'`
   - Scope `min_price_cents` aggregation to matching stock type
3. Return `has_offers: boolean` flag on each result for card rendering

### Phase C: PlantCard updates

1. Add availability badge: show "No current listings" when `has_offers === false`
2. Make price display respect stock type context from the active filter
3. Mute card styling slightly for no-offer cultivars (reduce opacity of price area, not the whole card)

### Phase D: Cultivar page integration

1. When user arrives at cultivar page with stock type filter active (via URL param or localStorage):
   - Buy tab defaults to showing matching stock type offers first
   - "Available as" chips in At a Glance tab highlight the active filter type
2. No-offer cultivar pages: Buy tab shows `AlertSignupForm` (already exists) with "Get notified" CTA

### Phase E: Validation

1. `npx tsc --noEmit` — clean
2. `npm test` — all passing
3. Test matrix:
   - Default browse (either + all) → all cultivars visible, prices show cheapest
   - Seeds filter → only cultivars with seed offers, seed prices shown
   - Plants filter → only cultivars with plant offers, plant prices shown  
   - For sale toggle ON → data-only cultivars hidden
   - For sale toggle OFF → data-only cultivars visible with "No current listings"
   - Combined: Seeds + For sale → only cultivars with seed offers
   - Mobile: filter bar doesn't overflow with zone + stock type + toggle

---

## What NOT to Do

- Do NOT create separate pages for seeds vs plants — stock type is a filter, not a route
- Do NOT hide cultivars by default — "show all" is the default, "for sale only" is opt-in
- Do NOT change the cultivar page URL structure
- Do NOT add stock type as a tab on the cultivar page
- Do NOT modify the scraper or nursery pipeline
- Do NOT add any new database tables — this uses existing `cultivar_nursery_offers.sale_form`
