# Bugfix — Cascading Availability Filter

> **Status:** Ready for implementation
> **Fixes:** Sprint 18 gap — "For sale now" filter does not cascade past genus level
> **Priority:** High — core UX broken for purchasable-only browsing

---

## Problem

The "For sale now" / "In Stock Only" filter works at two levels but breaks at the third:

1. **Homepage TaxonomyExplorer** — filters genera. If "For sale now" is checked, genera with zero offers across all their cultivars are hidden. This works, but operates at the **genus** level — it shows/hides entire genera, not individual species or cultivars within them.

2. **Genus page (`GenusPlantList.tsx`)** — has its own `inStockOnly` checkbox that filters at the **cultivar** level. This works correctly. But it's a *separate* local toggle — it doesn't read the global filter state from the homepage.

3. **Species page (`app/plants/[speciesSlug]/page.tsx`)** — has **no** availability filtering at all. All cultivar cards render regardless of offer status. This is the main bug.

### User experience today

1. User checks "For sale now" on homepage
2. User sees Hazelnuts appear (genus has some offers) ✓
3. User clicks into Hazelnuts genus page
4. User sees ALL species — including those with zero offers ✗
5. User clicks into American Hazelnut species page
6. User sees ALL cultivar cards — including those with zero offers ✗
7. User expected to only see purchasable plants, feels misled

### Root cause

The availability filter is not a global persistent state like zone. It's implemented as local component state in `TaxonomyExplorer` (homepage) and `GenusPlantList` (genus page) independently. Neither passes filter state down to subsequent pages.

---

## Solution

Make the "For sale now" preference persistent (localStorage) and read it at every level of the browse hierarchy.

### Phase 1: Persist filter state globally

**File:** `lib/zone-persistence.ts` (or new `lib/filter-persistence.ts`)

Add alongside existing zone persistence:

```typescript
const FOR_SALE_KEY = 'pc-for-sale-only';

export function getForSaleOnly(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FOR_SALE_KEY) === 'true';
}

export function setForSaleOnly(value: boolean): void {
  localStorage.setItem(FOR_SALE_KEY, value ? 'true' : 'false');
}
```

### Phase 2: Wire TaxonomyExplorer to persist state

**File:** `components/browse/TaxonomyExplorer.tsx`

Currently the "For sale now" checkbox is local state. Change it to:
- Initialize from `getForSaleOnly()` on mount
- Call `setForSaleOnly()` on change
- This way the preference follows the user to subsequent pages

### Phase 3: Wire GenusPlantList to read global state

**File:** `components/genus/GenusPlantList.tsx`

The `inStockOnly` state already exists and works correctly for filtering. Change initialization:
- Initialize `inStockOnly` from `getForSaleOnly()` on mount instead of `false`
- When user toggles the checkbox, also call `setForSaleOnly()` to persist
- This way: user arrives from homepage with "For sale now" active → genus page auto-filters to in-stock cultivars

### Phase 4: Add filtering to species page

This is the main missing piece.

**File:** `app/plants/[speciesSlug]/page.tsx`

The species page is a **server component**. It renders cultivar cards via the `CultivarSection` function component. The server cannot read localStorage.

**Approach: Client-side filter wrapper.**

Create a new thin client component:

**New file:** `components/CultivarSectionClient.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getForSaleOnly, setForSaleOnly } from '@/lib/zone-persistence';

interface Props {
  children: React.ReactNode;
  /** Cultivar IDs that have at least one active offer */
  cultivarIdsWithOffers: string[];
  /** All cultivar IDs in this section */
  allCultivarIds: string[];
}

export function CultivarFilterWrapper({ children, cultivarIdsWithOffers, allCultivarIds }: Props) {
  const [forSaleOnly, setForSaleState] = useState(false);

  useEffect(() => {
    setForSaleState(getForSaleOnly());
  }, []);

  const handleToggle = (checked: boolean) => {
    setForSaleState(checked);
    setForSaleOnly(checked);
  };

  // If all cultivars have offers, or filter is off, show everything
  const showFilter = allCultivarIds.length !== cultivarIdsWithOffers.length;

  return (
    <div>
      {showFilter && (
        <label className="flex items-center gap-1.5 text-[13px] text-text-secondary cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={forSaleOnly}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 rounded border-border-subtle accent-accent"
          />
          Show only purchasable
        </label>
      )}
      {/* Use CSS to hide/show cards based on filter */}
      <div data-for-sale-only={forSaleOnly ? 'true' : 'false'}>
        {children}
      </div>
    </div>
  );
}
```

**Alternative (simpler) approach:** Convert `CultivarSection` to a client component that receives the full cultivar list + offer map and filters locally. This avoids the CSS hide/show hack.

Recommended: **Convert `CultivarSection` to a separate client component file** `components/CultivarSection.tsx` that:
1. Accepts `cultivars`, `speciesSlug`, `nurseryCountById`, `priceById` as props
2. Reads `getForSaleOnly()` on mount
3. Has a local toggle that also calls `setForSaleOnly()`
4. Filters `cultivars` to only show those where `nurseryCountById[cv.id] > 0` when filter is active
5. Renders the same card grid as today

The species page server component passes all data down; the client component handles the filtering.

### Phase 5: Validate the cascade

Test the full flow:

1. Homepage: check "For sale now" → only genera with offers shown ✓
2. Click into a genus → `GenusPlantList` initializes with `inStockOnly=true` → only cultivars with offers shown ✓
3. Click into a species → `CultivarSection` initializes with `forSaleOnly=true` → only cultivars with offers shown ✓
4. Uncheck the filter at any level → persists to localStorage → other pages reflect the change ✓
5. Direct URL to species page (no homepage visit) → reads localStorage, defaults to `false` if no preference set ✓

---

## Files Changed

| File | Change |
|------|--------|
| `lib/zone-persistence.ts` | Add `getForSaleOnly()` / `setForSaleOnly()` |
| `components/browse/TaxonomyExplorer.tsx` | Initialize filter from localStorage, persist on change |
| `components/genus/GenusPlantList.tsx` | Initialize `inStockOnly` from localStorage, persist on change |
| `components/CultivarSection.tsx` | **New file** — extracted client component with availability filter |
| `app/plants/[speciesSlug]/page.tsx` | Replace inline `CultivarSection` function with imported client component |

## What NOT to Do

- Do NOT use URL query params for this — it's a preference, not a navigation state. localStorage is correct.
- Do NOT make the species page a client component — keep it as a server component, extract only the cultivar list into a client component.
- Do NOT change the genus page query or data loading — the data is already there, just need to read the filter preference on mount.
- Do NOT duplicate the toggle UI — use the same checkbox pattern already established in `GenusPlantList`.
- Do NOT change any API routes or Supabase queries — this is all client-side filtering of already-loaded data.
