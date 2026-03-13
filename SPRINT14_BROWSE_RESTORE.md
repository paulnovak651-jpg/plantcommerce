# Sprint 14: Restore Three-Column Browse Layout

> **Goal:** Replace the current sidebar + card-grid browse page with the clean three-column taxonomy explorer layout (Categories | Genera | Species). Add a USDA zone filter bar above the explorer. Restore the Marketplace tab in the main nav. Remove all redundant category UI elements.
> **No new migrations required.** All data and APIs already exist.
> **Priority:** This is a simplification sprint — we are REMOVING complexity, not adding it.

---

## Problem

The browse page has accumulated redundant UI layers across multiple sprints:
1. Category chips appear under the search bar (in `BrowseHeader.tsx`)
2. A `CategoryTreeSidebar` appears in the left sidebar with accordion-style category/genus navigation
3. A `PlantFilterSidebar` appears below the tree sidebar with checkbox-based category/type filters
4. The actual content area shows a card grid (`BrowseGrid`) with pagination

The result is that categories appear in **three places** and the page feels cluttered. The original three-column taxonomy explorer (`TaxonomyExplorer.tsx`) — which shows Categories | Genera | Species in a clean columnar layout — already exists in the codebase but is not being used on the main browse page.

Additionally, the Marketplace tab was lost from the main navigation at some point.

---

## Target Layout (matches the approved prototype)

```
┌─────────────────────────────────────────────────────┐
│  Browse  |  Compare  |  Nurseries  |  Marketplace   │  ← nav bar
├─────────────────────────────────────────────────────┤
│  Browse All Plants (h1)                             │
├─────────────────────────────────────────────────────┤
│  [ Search 'bare root hazel'...          ] [Explore] │  ← search bar, Explore only
├─────────────────────────────────────────────────────┤
│  Refine results    USDA Zone: [Min ▾] to [Max ▾]   │  ← zone filter bar
├─────────────┬──────────────┬────────────────────────┤
│ CATEGORIES  │ GENERA       │ SPECIES (right panel)  │
│             │              │                        │
│ Nut Trees ● │ Hazelnuts  › │ American Hazelnut Z4-9 │
│ Berries     │ Hickories  › │ Asian Hazelnut    Z3-8 │
│ Tree Fruit  │ Walnuts    › │ Beaked Hazelnut   Z3-7 │
│ Support Sp. │ Chestnuts  › │ European Hazelnut Z4-8 │
│             │              │ ...                    │
└─────────────┴──────────────┴────────────────────────┘
```

- Three-column explorer is the primary browse interface (desktop)
- Mobile gets the drill-down version (already built in `TaxonomyExplorer`)
- Zone filter bar sits above the explorer
- Search bar has Explore button only (no Refine button)
- No sidebar. No card grid. No category chips under search.

---

## Implementation Steps

### Step 1: Add Marketplace to NavLinks and MobileMenu

**File: `components/NavLinks.tsx`**

Add the Marketplace link to the `links` array:

```typescript
const links = [
  { href: '/', label: 'Browse' },
  { href: '/compare', label: 'Compare' },
  { href: '/nurseries', label: 'Nurseries' },
  { href: '/marketplace', label: 'Marketplace' },
];
```

**File: `components/MobileMenu.tsx`**

The mobile menu currently only has Browse and Nurseries. Add Compare and Marketplace:

```typescript
// Inside the {open && ...} block, the link list should be:
<MobileLink href="/" onClick={close}>Browse</MobileLink>
<MobileLink href="/compare" onClick={close}>Compare</MobileLink>
<MobileLink href="/nurseries" onClick={close}>Nurseries</MobileLink>
<MobileLink href="/marketplace" onClick={close}>Marketplace</MobileLink>
```

**Verify:** `app/marketplace/` directory already exists with a page. Confirm it renders. If it has issues, fix them — but do NOT create a new marketplace page from scratch.

---

### Step 2: Create ZoneFilterBar component

**New file: `components/browse/ZoneFilterBar.tsx`**

A simple horizontal bar with USDA Zone min/max select dropdowns. This replaces the zone controls that were buried inside `PlantFilterSidebar`.

```typescript
'use client';

interface ZoneFilterBarProps {
  zoneMin: string;
  zoneMax: string;
  onZoneMinChange: (value: string) => void;
  onZoneMaxChange: (value: string) => void;
}

export function ZoneFilterBar({ zoneMin, zoneMax, onZoneMinChange, onZoneMaxChange }: ZoneFilterBarProps) {
  const zones = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-inset px-4 py-2.5 mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        Refine results
      </span>
      <span className="text-sm text-text-secondary">USDA Zone:</span>
      <select
        value={zoneMin}
        onChange={(e) => onZoneMinChange(e.target.value)}
        className="rounded-md border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
      >
        <option value="">Min</option>
        {zones.filter(z => z !== '').map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
      <span className="text-sm text-text-secondary">to</span>
      <select
        value={zoneMax}
        onChange={(e) => onZoneMaxChange(e.target.value)}
        className="rounded-md border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
      >
        <option value="">Max</option>
        {zones.filter(z => z !== '').map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
    </div>
  );
}
```

---

### SearchBar Component Reference

**File: `components/ui/SearchBar.tsx`** — DO NOT MODIFY this file.

The SearchBar is a fully-featured autocomplete search input. It is a `'use client'` component. Here is its interface:

```typescript
interface SearchBarProps {
  defaultValue?: string;        // Uncontrolled initial value
  value?: string;               // Controlled value (when provided, component is "controlled")
  onValueChange?: (value: string) => void;  // Called on every keystroke
  action?: string;              // Form action URL (default: '/')
  className?: string;           // Outer form className (default: 'relative mx-auto w-full max-w-xl')
  inputId?: string;             // Input element ID (default: 'search-input')
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;  // Form submit handler
  placeholders?: string[];      // Rotating placeholder strings
}
```

**Key behaviors:**
- Renders as a `<form>` element wrapping an `<input type="search" name="q">`
- Has a built-in search icon (magnifying glass SVG) on the left side
- Fetches autocomplete suggestions from `/api/autocomplete?q=...` after 3+ characters (250ms debounce)
- Shows a dropdown with results grouped by Genera / Species / Cultivars
- Selecting a suggestion navigates directly to that plant's page
- Has rotating placeholder text that fades between options every 4 seconds
- Supports both controlled (`value` + `onValueChange`) and uncontrolled (`defaultValue`) modes
- The component wraps everything in a `<form>` tag, so the Explore button should be placed **outside** the SearchBar, not inside it

**How to use in the new BrowseContent:**

Use it in **controlled mode** — pass `value` and `onValueChange`. Wrap the SearchBar and the Explore button together in a flex container. The SearchBar's `onSubmit` handler should prevent default form submission (since the Explore button handles navigation). Override `className` to `"w-full max-w-none flex-1"` so it fills the row.

```tsx
<div className="flex gap-2 mb-4">
  <SearchBar
    value={query}
    onValueChange={setQuery}
    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
    className="w-full max-w-none flex-1"
    placeholders={[
      "Search 'bare root hazel'...",
      "Search 'disease resistant'...",
      "Search 'EFB resistant'...",
    ]}
    inputId="browse-search-input"
  />
  <button
    onClick={handleSearch}
    className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-text-inverse hover:bg-accent-hover transition-colors"
  >
    Explore
  </button>
</div>
```

The Explore button and Enter key should both navigate to `/search?q={query}` when the user wants a full-text search. The autocomplete dropdown handles direct navigation to specific plants.

---

### Step 3: Rewrite BrowseContent.tsx — the core change

**File: `components/BrowseContent.tsx`**

This is the biggest change. The current file is ~600 lines of complex facet/filter/API orchestration. **Replace the entire render output** so the page shows:

1. Search bar (with Explore button only — no category chips, no Refine button)
2. `ZoneFilterBar` component
3. `TaxonomyExplorer` component (the three-column layout)

**What to KEEP from the current BrowseContent:**
- The search bar (`SearchBar` component + `onQueryChange`)
- Zone state management (reading from localStorage, listening to `zone-changed` events)
- URL sync for search query and zone params

**What to REMOVE from the current BrowseContent:**
- All `PlantFilterSidebar` usage and its related callbacks (`handleMultiSelectToggle`, `handleBooleanToggle`, `handleRangeChange`)
- All `CategoryTreeSidebar` usage and its related state (`selectedTopCategory`, `selectedGenus`, `handleCategorySelect`, `handleGenusSelect`)
- All `BrowseShell` usage (the sidebar layout wrapper)
- All `BrowseHeader` usage (the header with category chips, sort, species/genus toggle)
- All `BrowseGrid` usage (the card grid with pagination)
- All `BrowseBreadcrumb` usage
- All `ActiveFilterPills` / pill building logic
- All facet state management (`FacetState`, `parseFacetState`, `serializeFacetState`, etc.)
- All API fetch logic (`/api/browse` calls, debouncing, abort controllers)
- All `groupBy` / genus grouping logic for the card grid
- The `allPlants` prop — the TaxonomyExplorer fetches its own data via the taxonomy tree

**New BrowseContent structure:**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { ZoneFilterBar } from '@/components/browse/ZoneFilterBar';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { getUserZone } from '@/lib/zone-persistence';

interface BrowseContentProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowseContent({ taxonomyTree }: BrowseContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [zoneMin, setZoneMin] = useState('');
  const [zoneMax, setZoneMax] = useState('');

  // Pre-fill zone from localStorage
  useEffect(() => {
    const zone = getUserZone();
    if (zone) {
      setZoneMin(String(zone));
      setZoneMax(String(zone));
    }
  }, []);

  // Handle search submission — navigate to /search?q=...
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  return (
    <>
      {/* Search bar with Explore button */}
      <div className="flex gap-2 mb-4">
        <SearchBar
          value={query}
          onValueChange={setQuery}
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="w-full max-w-none flex-1"
          placeholders={[
            "Search 'bare root hazel'...",
            "Search 'disease resistant'...",
            "Search 'EFB resistant'...",
          ]}
          inputId="browse-search-input"
        />
        <button
          onClick={handleSearch}
          className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-text-inverse hover:bg-accent-hover transition-colors"
        >
          Explore
        </button>
      </div>

      {/* Zone filter bar */}
      <ZoneFilterBar
        zoneMin={zoneMin}
        zoneMax={zoneMax}
        onZoneMinChange={setZoneMin}
        onZoneMaxChange={setZoneMax}
      />

      {/* Three-column taxonomy explorer */}
      <TaxonomyExplorer taxonomyTree={taxonomyTree} />
    </>
  );
}
```

**IMPORTANT:** The zone filter bar does NOT currently filter the TaxonomyExplorer results. The zone values are stored in state for now and will be wired to filter in a future sprint. For now it sets the UI state. This is intentional — ship the layout first.

---

### Step 4: Update the homepage (app/page.tsx)

**File: `app/page.tsx`**

The current page fetches `allPlants` via `getAllBrowsePlants()` and passes them to `BrowsePageClient`. Since we're switching to the `TaxonomyExplorer`, we need to fetch the `taxonomyTree` instead.

**Change the data fetching:**

```typescript
import { getTaxonomyTree } from '@/lib/queries/taxonomy-tree';

export default async function HomePage() {
  const supabase = await createClient();
  const taxonomyTree = await getTaxonomyTree(supabase);

  return (
    <div>
      <HomepageHero />
      <div id="browse" className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
          Browse All Plants
        </h2>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-inset" />}>
          <BrowsePageClient taxonomyTree={taxonomyTree} />
        </Suspense>
      </div>
    </div>
  );
}
```

**Remove** the `getAllBrowsePlants` import — it's no longer needed for the homepage.

---

### Step 5: Update BrowsePageClient

**File: `components/browse/BrowsePageClient.tsx`**

Change the props to accept `taxonomyTree` instead of `allPlants`:

```typescript
'use client';

import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';

interface BrowsePageClientProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({ taxonomyTree }: BrowsePageClientProps) {
  return <BrowseContent taxonomyTree={taxonomyTree} />;
}
```

---

### Step 6: Verify TaxonomyExplorer and its API

The `TaxonomyExplorer` component (`components/browse/TaxonomyExplorer.tsx`) already exists and is fully functional. It:
- Shows the 3-column desktop layout (Categories | Genera | Species preview)
- Shows a mobile drill-down version
- Fetches species data via `/api/taxonomy/genus/[slug]` on genus hover/click
- Has keyboard navigation support

**Verify these work:**
1. `lib/queries/taxonomy-tree.ts` — `getTaxonomyTree()` must return a valid `TaxonomyTree` object
2. `app/api/taxonomy/genus/[slug]/route.ts` — must return species preview data
3. `components/browse/CategoryColumn.tsx` — renders category list
4. `components/browse/GenusColumn.tsx` — renders genus list
5. `components/browse/GenusPreviewPanel.tsx` — renders species in right column
6. `components/browse/SpeciesPreviewPanel.tsx` — may be used for deeper preview

**Do NOT modify these files** unless they have bugs. They are already built and working.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| **Modify** | `components/NavLinks.tsx` | Add `{ href: '/marketplace', label: 'Marketplace' }` to links array |
| **Modify** | `components/MobileMenu.tsx` | Add Compare and Marketplace links |
| **Create** | `components/browse/ZoneFilterBar.tsx` | Simple zone min/max select bar |
| **Rewrite** | `components/BrowseContent.tsx` | Replace entire file — search bar + zone bar + TaxonomyExplorer |
| **Modify** | `components/browse/BrowsePageClient.tsx` | Change props from `allPlants` to `taxonomyTree` |
| **Modify** | `app/page.tsx` | Fetch `taxonomyTree` instead of `allPlants`, add h2 heading |

## Files NOT to modify

- `components/ui/SearchBar.tsx` — already works, DO NOT MODIFY (see SearchBar Component Reference above)
- `components/browse/TaxonomyExplorer.tsx` — already works, leave it alone
- `components/browse/CategoryColumn.tsx` — already works
- `components/browse/GenusColumn.tsx` — already works
- `components/browse/GenusPreviewPanel.tsx` — already works
- `components/browse/SpeciesPreviewPanel.tsx` — already works
- `lib/queries/taxonomy-tree.ts` — already works
- `app/api/taxonomy/` — all taxonomy API routes already work
- `lib/browse-categories.ts` — still used by TaxonomyExplorer internals
- No database migrations
- No changes to the pipeline, scrapers, or resolver
- No changes to admin pages
- No changes to species detail pages (`app/plants/[speciesSlug]/`)
- No changes to genus hub pages (`app/plants/genus/[genusSlug]/`)
- No changes to compare, nurseries, or marketplace pages

## Files that become UNUSED (do NOT delete yet — just stop importing them)

These files are no longer imported by the new BrowseContent but may be used elsewhere. **Do not delete them** — just remove their imports from BrowseContent:

| File | Why unused |
|------|-----------|
| `components/PlantFilterSidebar.tsx` | No longer rendered — zone is in ZoneFilterBar, categories are in TaxonomyExplorer |
| `components/browse/CategoryTreeSidebar.tsx` | Replaced by TaxonomyExplorer's built-in category column |
| `components/browse/BrowseShell.tsx` | No longer needed — no sidebar layout |
| `components/browse/BrowseHeader.tsx` | Replaced by simple search bar + Explore button |
| `components/browse/BrowseGrid.tsx` | No longer rendered — replaced by TaxonomyExplorer species panel |
| `components/browse/BrowseBreadcrumb.tsx` | No longer needed at browse level |
| `components/browse/ActiveFilterPills.tsx` | No longer needed — no facet filters |
| `components/browse/FacetControl.tsx` | No longer imported from BrowseContent |
| `components/browse/SmartEmptyState.tsx` | No longer needed in browse |
| `components/SortBar.tsx` | No longer rendered on browse page |
| `components/SearchFilters.tsx` | Not imported by new BrowseContent |
| `lib/facets/state.ts` | No longer imported |
| `lib/facets/registry.ts` | No longer imported from BrowseContent (still used by PlantFilterSidebar) |
| `lib/queries/facet-query-builder.ts` | No longer imported |
| `lib/queries/genus-counts.ts` | No longer imported from BrowseContent |
| `lib/queries/browse.ts` | `getAllBrowsePlants` no longer called from homepage (still used by `/api/browse` route) |

---

## Testing Checklist

After implementation, verify:

1. **Homepage loads** — shows "Browse All Plants" heading, search bar with Explore button, zone bar, and the three-column explorer
2. **Category hover/click** — hovering a category in column 1 shows its genera in column 2
3. **Genus hover/click** — hovering a genus in column 2 shows its species in column 3
4. **Species links work** — clicking a species in column 3 navigates to the species detail page
5. **Genus links work** — clicking a genus name navigates to the genus hub page
6. **Mobile layout** — shows the drill-down version (tap category → genera → species)
7. **Search works** — typing and clicking Explore navigates to `/search?q=...`
8. **Autocomplete works** — typing 3+ characters shows suggestion dropdown from `/api/autocomplete`
9. **Zone dropdowns render** — min/max dropdowns appear and can be changed (filtering not wired yet)
10. **Marketplace nav tab** — "Marketplace" appears in the nav bar and links to `/marketplace`
11. **No category chips** — no colored category pills appear under the search bar
12. **No sidebar** — no left sidebar with filters or category tree
13. **No card grid** — no plant cards with "Check Availability" buttons
14. **No console errors** — clean console on page load and interaction
15. **Keyboard navigation** — arrow keys work in the three-column explorer (already built into TaxonomyExplorer)

---

## Design Notes

- Follow "The Field Guide" design system — warm linen palette, Fraunces (serif headings) + Satoshi (body text)
- The three-column explorer should use the existing border/rounded styling from `TaxonomyExplorer.tsx`
- Zone filter bar uses `bg-surface-inset` for a subtle background that distinguishes it from the explorer below
- Explore button uses `bg-accent` (the existing green) to match the site's accent color
- The "Browse All Plants" heading uses `font-serif` (Fraunces) to match the site's heading style
- Keep the `HomepageHero` component above the browse section — it's still the entry point

---

## What This Sprint Does NOT Do

- Does NOT wire zone filtering to the TaxonomyExplorer (future sprint)
- Does NOT add new filter types beyond zone min/max
- Does NOT change the TaxonomyExplorer component itself
- Does NOT delete any unused files (cleanup is a separate task)
- Does NOT change the `/api/browse` endpoint (still works for other consumers)
- Does NOT modify species or genus detail pages
