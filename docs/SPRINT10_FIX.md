# Sprint 10 FIX: Restore Browse Page as Homepage

*Created 2026-03-11. This document SUPERSEDES all prior Sprint 10 documents.*

## Problem

Claude Code made the homepage into a mess. It put the full `BrowseContent` cultivar grid on the homepage AND kept all the marketing sections (Recently Restocked, Best Deals, How It Works, etc.) below it. The result is a bloated page that looks nothing like the original browse page.

## What The Homepage Should Be

**The homepage should look EXACTLY like the old `/browse` page did** (reference: the screenshot showing the three-column layout with Categories / Genera / Species columns). Specifically:

```
+----------------------------------------------------------+
| Browse All Plants                                  (h1)  |
+----------------------------------------------------------+
| [Search bar]                    [Explore] [Refine]       |
+----------------------------------------------------------+
| CATEGORIES   | GENERA          | SPECIES                 |
| ------------ | --------------- | ----------------------- |
| Nut Trees    | Hazelnuts       | American Hazelnut  Z4-9 |
| Berries      | Hickories...    | Asian Hazelnut     Z3-8 |
| Tree Fruit   | Walnuts         | Beaked Hazelnut    Z3-7 |
| Support Sp.  | Chestnuts       | European Hazelnut  Z4-8 |
|              |                 | Euro x Amer Hybrid Z4-8 |
|              |                 | Turkish Tree Hazel Z4-7 |
+----------------------------------------------------------+
```

That's the ENTIRE homepage. No hero section with big green background. No stat counters. No "Recently Restocked" cards. No "Best Deals" cards. No "How It Works" section. No "Zone Recommendations". None of that. Just the browse page.

## Exact Implementation

### Step 1: Rewrite `app/page.tsx`

Make the homepage render EXACTLY what `app/browse/page.tsx` used to render before it was turned into a redirect. Here is the exact content `app/page.tsx` should have:

```typescript
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { getTaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { Text } from '@/components/ui/Text';
import { BrowsePageClient } from '@/components/browse/BrowsePageClient';
import { BrowseGridSkeleton } from '@/components/PlantCardSkeleton';

export const metadata: Metadata = {
  title: 'Plant Commerce',
  description:
    'Search once, compare nursery stock across North America. Plant Commerce aggregates cultivars, pricing, and availability across nurseries.',
  openGraph: {
    title: 'Plant Commerce',
    description:
      'Search once, compare nursery stock across North America.',
    url: 'https://plantcommerce.app/',
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const [allPlants, taxonomyTree] = await Promise.all([
    getAllBrowsePlants(supabase),
    getTaxonomyTree(supabase),
  ]);

  return (
    <div>
      {/* Compact page header */}
      <div className="border-b border-border-subtle bg-surface-primary px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <Text variant="h2" as="h1">Browse All Plants</Text>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <BrowseGridSkeleton />
          </div>
        }>
          <BrowsePageClient allPlants={allPlants} taxonomyTree={taxonomyTree} />
        </Suspense>
      </div>
    </div>
  );
}
```

This is essentially the same as what the old `app/browse/page.tsx` was before it was replaced with a redirect. The `BrowsePageClient` component renders the search bar, Explore/Refine toggle, and the `TaxonomyExplorer` three-column layout.

### Step 2: Remove all the old homepage junk

The following imports and sections should be REMOVED from `app/page.tsx` — they should NOT appear anywhere on the homepage:

- `JsonLd` component and its data
- Hero `<section>` with green background, display heading, search bar, stat counters
- `SeasonalBanner` component
- `DealCard` function component
- `HomepageSection` components (Recently Restocked, Best Deals, New to Database)
- `ScrollReveal` wrappers
- `ZoneRecommendations` component
- "How It Works" section
- All data fetches for deal cards (`getRecentlyRestocked`, `getBestDeals`, `getNewAdditions`, `getZoneRecommendationSpecies`)
- The nursery offer count query and `trackedNurseryCount` calculation
- The `publishedCultivarCount` query

### Step 3: Keep `/browse` redirect

The `app/browse/page.tsx` redirect to `/` is fine and should stay. Old bookmarks to `/browse` will still work.

### Step 4: Apply the category consolidation

This is the ONLY data change. In `lib/queries/taxonomy-tree.ts`, add the `CATEGORY_REMAP` in the accumulation loop so the TaxonomyExplorer shows 4 categories instead of 11:

```typescript
const CATEGORY_REMAP: Record<string, string> = {
  'Nut Trees': 'Nut Trees',
  'Berries': 'Berries',
  'Grapes': 'Berries',
  'Mulberries': 'Berries',
  'Persimmons': 'Tree Fruit',
  'Pears': 'Tree Fruit',
  'Apples & Crabapples': 'Tree Fruit',
  'Pawpaw': 'Tree Fruit',
  'Stone Fruit': 'Tree Fruit',
  'Kiwi': 'Tree Fruit',
  'Nitrogen Fixers': 'Support Species',
  'Other': 'Support Species',
};

function remapCategory(raw: string): string {
  return CATEGORY_REMAP[raw] ?? 'Support Species';
}
```

Apply `remapCategory()` where the code reads `plant.display_category` in the accumulation loop (around line where it does `const category = plant.display_category?.trim() || 'Other'`). Change to:

```typescript
const rawCategory = plant.display_category?.trim() || 'Other';
const category = remapCategory(rawCategory);
```

### Step 5: Enforce fixed category sort order

Replace the current sort-by-cultivar-count with a fixed order:

```typescript
const CATEGORY_ORDER = ['Nut Trees', 'Berries', 'Tree Fruit', 'Support Species'];

categories.sort((a, b) => {
  const aIdx = CATEGORY_ORDER.indexOf(a.category);
  const bIdx = CATEGORY_ORDER.indexOf(b.category);
  return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
});
```

### Step 6: Add category colors for new categories

In `lib/category-colors.ts`, ensure these entries exist:

```typescript
'Tree Fruit': { from: '#558B2F', to: '#33691E' },
'Support Species': { from: '#2d6a4f', to: '#1b4332' },
```

---

## Files Changed

| File | Action | What |\n|------|--------|------|\n| `app/page.tsx` | **Rewrite** | Replace entire homepage with the old browse page layout (BrowsePageClient + TaxonomyExplorer) |
| `lib/queries/taxonomy-tree.ts` | **Edit** | Add CATEGORY_REMAP, apply in accumulation loop, enforce fixed sort order |
| `lib/category-colors.ts` | **Edit** | Add Tree Fruit and Support Species color entries |
| `app/browse/page.tsx` | **No change** | Already redirects to `/`, keep as-is |

### Files NOT Changed

| File | Why |
|------|-----|
| `components/browse/TaxonomyExplorer.tsx` | Do NOT touch — layout preserved exactly |
| `components/browse/CategoryColumn.tsx` | Do NOT touch |
| `components/browse/GenusColumn.tsx` | Do NOT touch |
| `components/browse/SpeciesPreviewPanel.tsx` | Do NOT touch |
| `components/browse/BrowsePageClient.tsx` | Do NOT touch |
| `components/BrowseContent.tsx` | Do NOT touch |
| `components/browse/BrowseHeader.tsx` | Do NOT touch |
| `components/browse/BrowseGrid.tsx` | Do NOT touch |

---

## Testing Checklist

### Homepage must look like old /browse page
- [ ] "Browse All Plants" h1 header at top
- [ ] Search bar with Explore/Refine toggle below header
- [ ] Three-column TaxonomyExplorer renders (200px / 250px / 1fr grid)
- [ ] NO hero section with green background
- [ ] NO stat counters (Species / Cultivars / Nurseries boxes)
- [ ] NO "Recently Restocked" section
- [ ] NO "Best Deals" section
- [ ] NO "New to the Database" section
- [ ] NO "Zone Recommendations" section
- [ ] NO "How It Works" section
- [ ] NO SeasonalBanner
- [ ] NO DealCard components anywhere

### Category Consolidation
- [ ] Column 1 shows exactly 4 categories: Nut Trees, Berries, Tree Fruit, Support Species (in that order)
- [ ] Hovering Nut Trees shows: Hazelnuts, Hickories & Pecans, Walnuts, Chestnuts
- [ ] Hovering Berries shows: Blueberries, Elderberries, Grapes, Mulberries, plus any others merged in
- [ ] Hovering Tree Fruit shows: Apples, Persimmons, Pears, Pawpaws, Stone Fruits, Figs, Kiwifruit
- [ ] Hovering Support Species shows: genera from Nitrogen Fixers + Other
- [ ] Species counts and genera counts are correct
- [ ] "In Stock" badges still work
- [ ] Column 3 species preview still loads on genus hover
- [ ] Zone and nursery badges on species still display
- [ ] Left accent color bars show correct colors for each category

### Visual Fidelity
- [ ] Three-column grid sizing UNCHANGED (200px / 250px / 1fr)
- [ ] Min/max height UNCHANGED (480px / 600px)
- [ ] All font sizes UNCHANGED (13px, 10px, 11px)
- [ ] CATEGORIES / GENERA header bars UNCHANGED
- [ ] Hover timing UNCHANGED (150ms debounce)
- [ ] Keyboard navigation UNCHANGED
- [ ] Mobile drill-down UNCHANGED

### /browse redirect
- [ ] `/browse` redirects to `/`
- [ ] `/browse?category=Pears` redirects to `/?category=Pears`

### No Regressions
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Cultivar detail pages still accessible
- [ ] Explore/Refine toggle still works
