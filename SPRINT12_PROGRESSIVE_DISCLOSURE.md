# Sprint 12: Progressive Disclosure UX Restructure

*Created 2026-03-12. Goal: Restructure the entire browse → buy flow using progressive disclosure. Simple by default, deep on demand. Every page gets a 5-second layer (what is this, is it for me, where do I get it) and a 2-minute layer (compatibility, production traits, provenance, legal).*

---

## Background & Motivation

PlantCommerce has world-class data depth — taxonomy explorer, ZoneBars, HarvestCalendars, HeightSilhouettes, PriceSparklines, faceted search. No competitor has this. But the UX presents it like a database explorer rather than a guided buying flow.

Core problems:
1. **Homepage has no value prop.** First-time visitors see "Browse All Plants" with no context for what the site does.
2. **Explore/Refine toggle is confusing.** Two unrelated UIs toggled by a tiny switch.
3. **Prices are invisible until 5 clicks deep.** The core "Kayak" value isn't surfacing.
4. **Cultivar page is a wall of data.** 36KB file, buying buried in tab #5.
5. **Marketplace in primary nav leads to empty page.** Damages trust.

This sprint is divided into 5 phases, designed to be executed sequentially. Each phase is self-contained and shippable.

---

## Design Principle — Read This First

For every page, ask:
- **What does the beginner need in 5 seconds?** → Show that by default.
- **What does the expert want in 2 minutes?** → Put that behind one click (accordion, tab, "show more").

Never mix both into one flat wall. Never hide the expert layer 5 clicks deep.

---

## Phase 1: Homepage Hero & Navigation Cleanup

*Estimated: 2-3 hours. Mostly removals and one new component. Low risk, high trust impact.*

### Task 1.1: Remove Marketplace from primary navigation

**File:** `components/NavLinks.tsx`

Remove the `{ href: '/marketplace', label: 'Marketplace' }` entry from the `links` array. The Marketplace page exists but shows "No listings yet" — keeping it in primary nav damages trust.

**Also update:** `components/MobileMenu.tsx` — remove the Marketplace link there too.

Marketplace stays in the footer (`app/layout.tsx` footer section) — do NOT remove it from footer.

### Task 1.2: Replace header search with SearchBar component

**File:** `app/layout.tsx`

The header currently has a basic HTML `<form>` with a plain `<input>` for search. Replace it with the existing `SearchBar` component from `components/ui/SearchBar.tsx`, which already has typeahead, fuzzy matching, grouped suggestions (genera/species/cultivars), keyboard navigation, and debounced API calls.

**Current code to replace** (inside the `<header>` Tier 1 section):
```tsx
<form action="/" method="GET" role="search" className="hidden md:block">
  <div className="flex items-center gap-2 rounded-full border border-border bg-surface-primary px-3 py-1.5">
    <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      name="q"
      placeholder="Search plants..."
      className="w-40 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
    />
  </div>
</form>
```

**Replace with:**
```tsx
<div className="hidden md:block w-56 lg:w-72">
  <SearchBar
    className="w-full"
    inputId="header-search"
    placeholders={['Search plants...']}
  />
</div>
```

**Important:** The `SearchBar` component is a client component (`'use client'`). The `layout.tsx` is a server component. Since `SearchBar` is already marked as a client component with `'use client'` at the top of its file, importing it into a server component is fine — Next.js handles the boundary automatically. You do NOT need to add `'use client'` to `layout.tsx`.

**Styling note:** The SearchBar renders with `rounded-[var(--radius-xl)]`, `bg-surface-raised`, `shadow-md`, and `py-3.5` by default. For the header, override to be more compact. Pass a custom `className` that keeps it small:

```tsx
<SearchBar
  className="w-full [&_input]:py-2 [&_input]:text-sm [&_input]:shadow-none [&_input]:bg-surface-primary [&_input]:border [&_input]:border-border [&_input]:rounded-full"
  inputId="header-search"
  placeholders={['Search plants...']}
/>
```

If the Tailwind child selectors (`[&_input]`) don't apply cleanly, instead create a thin wrapper: `components/HeaderSearch.tsx` (a `'use client'` component that wraps `SearchBar` with the compact styling). This is the safer path.

**Add import** to `app/layout.tsx`:
```tsx
import { SearchBar } from '@/components/ui/SearchBar';
```
Or if using the wrapper:
```tsx
import { HeaderSearch } from '@/components/HeaderSearch';
```

### Task 1.3: Create Homepage Hero component

**New file:** `components/HomepageHero.tsx`

This is a `'use client'` component that renders:
1. A headline: "Search once, compare nurseries."
2. A subtitle: "The free plant comparison tool for the permaculture community."
3. The `SearchBar` component (large, prominent, centered)
4. Quick-start chips below the search bar

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { getUserZone } from '@/lib/zone-persistence';

export function HomepageHero() {
  const router = useRouter();

  const quickStarts = [
    { label: 'Fruit trees', href: '/?mode=refine&category=Tree+Fruit' },
    { label: 'Nut trees', href: '/?mode=refine&category=Nut+Trees' },
    { label: 'Nitrogen fixers', href: '/?mode=refine&category=Support+Species' },
    { label: 'In stock now', href: '/?mode=refine&available=true' },
  ];

  // Dynamically add zone chip if user has saved zone
  const zone = typeof window !== 'undefined' ? getUserZone() : null;

  return (
    <section className="bg-surface-raised border-b border-border-subtle">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary">
          Search once, compare nurseries.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-text-secondary">
          The free plant comparison tool for the permaculture community.
        </p>

        <div className="mt-6 mx-auto max-w-xl">
          <SearchBar
            inputId="hero-search"
            className="w-full"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {zone && (
            <button
              type="button"
              onClick={() => router.push(`/?mode=refine&zoneMin=${zone}&zoneMax=${zone}`)}
              className="rounded-full border border-accent bg-accent-light px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-text-inverse cursor-pointer"
            >
              My zone ({zone})
            </button>
          )}
          {quickStarts.map((qs) => (
            <button
              key={qs.label}
              type="button"
              onClick={() => router.push(qs.href)}
              className="rounded-full border border-border-subtle bg-surface-primary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent cursor-pointer"
            >
              {qs.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Note on `getUserZone()` and SSR:** `getUserZone()` reads from `localStorage`, which doesn't exist during SSR. The `typeof window !== 'undefined'` guard handles this. The zone chip will appear after hydration on the client. This is intentional — no layout shift because the chip is inside a flex-wrap container.

**Chip routing:** The quick-start chips navigate to the existing browse page with URL params that BrowseContent already understands. The `?mode=refine` param ensures we land in the faceted grid (Refine mode), not the taxonomy explorer. This works with the current Explore/Refine toggle — we're not removing the toggle in this phase (that's Phase 1B below), just routing around it.

### Task 1.4: Update Homepage to use hero

**File:** `app/page.tsx`

Current structure:
```tsx
<div>
  <div className="border-b border-border-subtle bg-surface-primary px-4 py-4">
    <div className="mx-auto max-w-7xl">
      <Text variant="h2" as="h1">Browse All Plants</Text>
    </div>
  </div>
  <div className="mx-auto max-w-7xl px-4 py-8">
    <Suspense fallback={...}>
      <BrowsePageClient allPlants={allPlants} taxonomyTree={taxonomyTree} />
    </Suspense>
  </div>
</div>
```

**New structure:**
```tsx
<div>
  <HomepageHero />
  <div className="mx-auto max-w-7xl px-4 py-8">
    <Suspense fallback={...}>
      <BrowsePageClient allPlants={allPlants} taxonomyTree={taxonomyTree} />
    </Suspense>
  </div>
</div>
```

Remove the entire `"Browse All Plants"` header `<div>`. Replace with `<HomepageHero />`.

Add import:
```tsx
import { HomepageHero } from '@/components/HomepageHero';
```

Remove unused `Text` import if it's no longer used on this page.

### Task 1.5: Remove Explore/Refine toggle — merge browse modes

**File:** `components/browse/BrowsePageClient.tsx`

The current component has a mode toggle between `'explore'` (TaxonomyExplorer) and `'refine'` (BrowseContent). Remove the toggle. Make the BrowseContent funnel (which already has categories → genera → cultivars steps) the **only** browse path.

**Changes:**

1. Remove the `BrowseMode` type and `mode` / `setMode` state.
2. Remove the mode toggle buttons (the `<div className="inline-flex rounded-lg...` block).
3. Remove the `TaxonomyExplorer` conditional render and its import.
4. Always render `<BrowseContent allPlants={allPlants} />` .
5. Keep the `SearchBar` at the top — it's still useful for quick searching within browse.

**After changes, the component should look roughly like:**
```tsx
'use client';

import { useCallback, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BrowsePlant } from '@/lib/queries/browse';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';
import { SearchBar } from '@/components/ui/SearchBar';

interface BrowsePageClientProps {
  allPlants: BrowsePlant[];
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({
  allPlants,
  taxonomyTree,
}: BrowsePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const q = (formData.get('q') as string)?.trim();
      if (q) {
        router.push(`/?q=${encodeURIComponent(q)}`);
      }
    },
    [router]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar
            defaultValue={searchParams.get('q') ?? ''}
            onSubmit={handleSearchSubmit}
            className="w-full"
          />
        </div>
      </div>
      <BrowseContent allPlants={allPlants} />
    </div>
  );
}
```

**Note:** The `taxonomyTree` prop is no longer used by this component (it was only for TaxonomyExplorer). However, keep accepting it in the interface for now to avoid changing `app/page.tsx`'s data fetching. TypeScript won't complain about an unused prop in an interface — it only errors on unused variables.

**The TaxonomyExplorer is NOT deleted** — it remains in `components/browse/TaxonomyExplorer.tsx` and can be used later at a dedicated route like `/browse/taxonomy` if desired. Just remove its import from BrowsePageClient.

### Task 1.6: Remove Pollination "coming soon" tab from cultivar page

**File:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

In the `CultivarTabs` `tabs` prop array, there's a conditional entry for the `'pollination'` tab. Also in the `children` prop, there's a `pollination` section that says "Pollination data coming soon."

Remove both:

1. Remove the pollination entry from the `tabs` array:
```tsx
// REMOVE THIS:
...(growingProfile
  ? [{ id: 'pollination' as TabId, label: 'Pollination' }]
  : []),
```

2. Remove the `pollination` key from the `children` object (the entire `pollination: (...)` section).

This removes an empty "coming soon" section that damages credibility. When pollination data is actually populated in the future, add it back.

---

## Phase 2: Surface Prices Earlier

*Estimated: 2-3 hours. Small data query changes + UI updates. Medium impact.*

### Task 2.1: Add min price to browse API response

**File:** `app/api/browse/route.ts`

The browse API returns `BrowsePlant[]` items. These items need a new field: `min_price_cents: number | null`.

**Also update the type:**

**File:** `lib/queries/browse.ts`

The `BrowsePlant` interface needs a new field:
```typescript
min_price_cents: number | null;
```

The `getAllBrowsePlants()` function (and the browse API query) needs to join against `inventory_offers` to get the minimum active offer price per cultivar. This is a left join:

```sql
LEFT JOIN LATERAL (
  SELECT MIN(price_cents) as min_price_cents
  FROM inventory_offers io
  WHERE io.cultivar_id = c.id
    AND io.offer_status = 'active'
    AND io.price_cents IS NOT NULL
) offer_price ON true
```

The exact query structure depends on how `getAllBrowsePlants` is currently constructed. Examine the function, understand its joins, and add the min price as an additional left join or subselect.

**Fallback:** If modifying the main query is complex, add a second lightweight query that fetches `cultivar_id → min_price_cents` for all active offers, then merge client-side in the API handler. This is less elegant but safe.

### Task 2.2: Show price on PlantCard

**File:** `components/PlantCard.tsx`

The PlantCard currently shows: name, botanical name, zone, category, nursery count badge.

Add a price display when `min_price_cents` is available:

```tsx
{plant.min_price_cents != null && (
  <span className="text-sm font-medium text-accent">
    From {formatPrice(null, plant.min_price_cents)}
  </span>
)}
```

Use the existing `formatPrice` helper from `lib/format.ts`. Import it.

Place the price line BELOW the nursery count badge, or inline next to it:
```
● In stock · 3 nurseries · From $22
```

### Task 2.3: Show price on species page cultivar cards

**File:** `app/plants/[speciesSlug]/page.tsx`

The `CultivarSection` component renders cultivar cards in a grid. Currently shows: name, breeder, notes, nursery count badge.

This requires extending the data available to `CultivarSection`. The `offerStats` object already has `perCultivar` (nursery counts by cultivar ID). Add a `pricePerCultivar` map:

```typescript
interface OfferStats {
  nurseryCount: number;
  perCultivar: Record<string, number>;       // existing
  pricePerCultivar: Record<string, number>;   // NEW — min price_cents per cultivar
}
```

Populate `pricePerCultivar` in the `loadSpeciesPage` loader or by extending the offer stats query.

Then in `CultivarSection`, show the price:
```tsx
<div className="flex items-start justify-between gap-2">
  <Text variant="h3" color="accent">{cv.canonical_name}</Text>
  <div className="flex items-center gap-2 shrink-0">
    {priceCents != null && (
      <span className="text-sm font-medium text-accent">
        From {formatPrice(null, priceCents)}
      </span>
    )}
    {nurseryCount > 0 && (
      <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
        {nurseryCount} {nurseryCount === 1 ? 'nursery' : 'nurseries'}
      </span>
    )}
  </div>
</div>
```

### Task 2.4: Move price comparison table out of Buy tab on cultivar page

**File:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

Currently the `PriceComparisonTable` lives inside the `availability` tab content. Move a compact version directly below the hero section, OUTSIDE the CultivarTabs.

The structure should become:
```
Hero (name, quick facts, best price)
↓
Where to Buy section (PriceComparisonTable — always visible, not in a tab)
↓
CultivarTabs (Overview, Growing, [Production], Buy)
```

The "Buy" tab still exists for the full details (nursery map, community listings, stock alerts, price history sparklines). But the price comparison table — the core purchasing info — is immediately visible without clicking any tab.

Implementation:
1. Extract the `PriceComparisonTable` rendering (and the single-offer fallback) from the `availability` children
2. Place it as a new `<section>` between the hero and the `<CultivarTabs>` block
3. In the `availability` tab, KEEP: nursery map, community listings, stock alerts, price sparklines
4. In the `availability` tab, REMOVE: the `PriceComparisonTable` (it's now above)
5. If there are zero offers, don't show the section — the empty state with "Get notified" stays in the Buy tab

---

## Phase 3: Cultivar Page Restructure

*Estimated: 3-4 hours. Decompose the 36KB page into focused components. Apply progressive disclosure.*

### Task 3.1: Create component files

Decompose `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` into:

**New files:**
- `components/cultivar/CultivarHero.tsx` — name, botanical name, breeder, QuickFactsHero, best price callout, compare/alert buttons
- `components/cultivar/CultivarBuySection.tsx` — PriceComparisonTable (or single offer), prices last checked label
- `components/cultivar/CultivarGrowingAccordion.tsx` — ZoneBar, HeightSilhouette, HarvestCalendar, TraitGrid, wrapped in a `Disclosure`
- `components/cultivar/CultivarAboutAccordion.tsx` — breeder, origin, year released, patent status, aliases, legal identifiers, wrapped in a `Disclosure`

All these are **server components** (no `'use client'` needed) — they receive data as props.

### Task 3.2: Restructure the page layout

**File:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

The page becomes a thin orchestrator:

```tsx
export default async function CultivarPage({ params }: Props) {
  // ... data fetching (unchanged) ...

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
        <Breadcrumbs items={...} />

        {/* 1. Hero — above the fold */}
        <CultivarHero
          cultivar={cultivar}
          species={species}
          growingProfile={growingProfile}
          bestOffer={bestOffer}
        />

        {/* 2. Where to buy — immediately visible */}
        {comparisonOffers.length > 0 && (
          <CultivarBuySection
            offers={comparisonOffers}
            lastCheckedAt={pricesLastCheckedLabel}
          />
        )}

        {/* 3. Growing details — accordion, closed by default */}
        {growingProfile && (
          <CultivarGrowingAccordion profile={growingProfile} />
        )}

        {/* 4. About this cultivar — accordion, closed by default */}
        <CultivarAboutAccordion
          cultivar={cultivar}
          aliases={aliases}
          legal={legal}
        />

        {/* 5. Related species + community listings */}
        {relatedSpecies.length > 0 && (...)}
        {communityListings.length > 0 && (...)}

        {/* 6. Stock alert + nursery map (from Buy tab) */}
        {offers.length > 0 && <AlertSignupForm ... />}
        {nurseryPins.length > 0 && (...)}

        <JsonLd data={productJsonLd} />
      </div>
    </div>
  );
}
```

### Task 3.3: Remove CultivarTabs entirely

The tabbed layout is replaced by the linear progressive disclosure layout above. Remove:
- The `CultivarTabs` component usage from this page
- The entire `children` object with overview/growing/production/pollination/availability tabs

The `CultivarTabs` component file (`components/CultivarTabs.tsx`) can stay in the codebase — don't delete it — but it's no longer used on this page.

### Task 3.4: Better "no image" fallback

In `CultivarHero.tsx`, replace the current dashed-border "No image" placeholder:
```tsx
<div className="hidden sm:flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-surface-raised/30">
  <span className="text-xs text-surface-raised/40">No image</span>
</div>
```

With a category-colored icon placeholder:
```tsx
<div className="hidden sm:flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-raised/10">
  <span className="text-4xl opacity-40">
    {getCategoryIcon(species?.display_category)}
  </span>
</div>
```

Where `getCategoryIcon` maps category names to the same emoji icons used in `CategoryCards` (from `TOP_CATEGORIES` in `lib/browse-categories.ts`). Create a small helper function — it can live in `lib/browse-categories.ts` alongside the existing data.

---

## Phase 4: Compare Flow

*Estimated: 3-4 hours. New feature. Requires Phase 3 to be stable.*

### Task 4.1: Create CompareContext

**New file:** `components/compare/CompareContext.tsx`

```tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CompareItem {
  id: string;                     // cultivar ID
  name: string;                   // cultivar display name
  speciesName: string;            // parent species name
  speciesSlug: string;            // for URL building
  cultivarSlug: string;           // for URL building
  zoneMin: number | null;
  zoneMax: number | null;
  priceCents: number | null;
  nurseryCount: number;
}

interface CompareContextValue {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CompareCtx = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const add = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.length >= 4) return prev;         // max 4
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  return (
    <CompareCtx.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CompareCtx.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
```

Max 4 items. No sessionStorage — keep it in React state. If the user refreshes, the compare tray clears. This is simpler and avoids hydration mismatches.

### Task 4.2: Add CompareProvider to layout

**File:** `app/layout.tsx`

Wrap the `<main>` content with `<CompareProvider>`. Since the provider is a client component, this is fine — the layout stays a server component, and the client boundary is handled by Next.js.

```tsx
import { CompareProvider } from '@/components/compare/CompareContext';

// ... in the return:
<CompareProvider>
  <ToastProvider>
    <main id="main-content" className="page-enter">
      {children}
    </main>
  </ToastProvider>
  <CompareTray />
</CompareProvider>
```

### Task 4.3: Create CompareTray (sticky bottom bar)

**New file:** `components/compare/CompareTray.tsx`

A `'use client'` component that renders a sticky bottom bar when 1+ items are in the compare context.

```tsx
'use client';

import Link from 'next/link';
import { useCompare } from '@/components/compare/CompareContext';

export function CompareTray() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-raised shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-sm text-accent shrink-0"
            >
              {item.name}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="ml-1 text-accent/60 hover:text-accent cursor-pointer"
                aria-label={`Remove ${item.name} from comparison`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-sm text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            Clear
          </button>
          <Link
            href={`/compare?ids=${items.map((i) => i.id).join(',')}`}
            className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors"
          >
            Compare {items.length}
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Task 4.4: Create Compare page

**New file:** `app/compare/page.tsx`

This is a server component that:
1. Reads `ids` from search params (comma-separated cultivar IDs)
2. Fetches cultivar data + growing profiles + offer stats for each
3. Renders a comparison table

The comparison table rows:
- **Quick fit**: zones, mature height, years to bearing, harvest season, sun requirement
- **Buying**: best price, nursery count, in stock status
- **Details**: breeder, origin, patent status, disease resistance notes

**New file:** `components/compare/CompareTable.tsx`

A server component that takes an array of cultivar data objects and renders the comparison.

Use a responsive layout:
- Desktop: standard HTML `<table>` with sticky left column (trait name)
- Mobile: stacked cards (one per cultivar) — comparison tables don't work on narrow screens

Use the existing `Surface`, `Text`, `Tag` components.

### Task 4.5: Add compare checkbox to PlantCard

**File:** `components/PlantCard.tsx`

Add a subtle compare checkbox. Import `useCompare` from the context. Show the checkbox on hover (desktop) and always visible on mobile.

```tsx
const { add, remove, has } = useCompare();
const isComparing = has(plant.cultivar_id);

// In the card JSX, add a checkbox in the top-right corner:
<button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    isComparing ? remove(plant.cultivar_id) : add(buildCompareItem(plant));
  }}
  className="absolute top-2 right-2 ...etc"
  aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
>
  {isComparing ? '✓' : '+'}
</button>
```

**Important:** PlantCard must currently be a server or client component — check. If it's a server component, it cannot use `useCompare`. In that case, create a thin client wrapper `PlantCardWithCompare.tsx` that adds the compare checkbox around the existing card, OR convert PlantCard to a client component.

Examine `PlantCard.tsx` to determine. If it has `'use client'`, add the hook directly. If not, wrap it.

---

## Phase 5: Search Polish

*Estimated: 2 hours. The search already works — this is refinement.*

### Task 5.1: Categorized instant results in SearchBar

The `SearchBar` in `components/ui/SearchBar.tsx` already groups suggestions by genera/species/cultivars with headers. This task is about improving the visual design of the dropdown to feel more polished.

**Changes:**
- Add a "See all results" link at the bottom of the dropdown: `"See all results for '{query}' →"` that navigates to `/?q={query}`
- Slightly larger touch targets on mobile (ensure each suggestion row is 44px+ tall)
- Show a subtle count next to each group header: "Species (3)"

These are refinements to the existing `renderGroup` function in `SearchBar.tsx`.

### Task 5.2: Add "Compare" link to navigation

**File:** `components/NavLinks.tsx`

Add a Compare link to the nav:
```tsx
const links = [
  { href: '/', label: 'Browse' },
  { href: '/compare', label: 'Compare' },
  { href: '/nurseries', label: 'Nurseries' },
];
```

This only makes sense after Phase 4 is complete. Skip if Phase 4 isn't done yet.

---

## File Changes Summary

| File | Action | Phase |
|------|--------|-------|
| `components/NavLinks.tsx` | **EDIT** — remove Marketplace, add Compare (P4) | 1, 4 |
| `components/MobileMenu.tsx` | **EDIT** — remove Marketplace | 1 |
| `app/layout.tsx` | **EDIT** — replace header search form, add CompareProvider | 1, 4 |
| `components/HomepageHero.tsx` | **NEW** | 1 |
| `app/page.tsx` | **EDIT** — add hero, remove "Browse All Plants" heading | 1 |
| `components/browse/BrowsePageClient.tsx` | **EDIT** — remove Explore/Refine toggle | 1 |
| `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` | **MAJOR REWRITE** — progressive disclosure layout | 1, 2, 3 |
| `components/cultivar/CultivarHero.tsx` | **NEW** | 3 |
| `components/cultivar/CultivarBuySection.tsx` | **NEW** | 3 |
| `components/cultivar/CultivarGrowingAccordion.tsx` | **NEW** | 3 |
| `components/cultivar/CultivarAboutAccordion.tsx` | **NEW** | 3 |
| `lib/queries/browse.ts` | **EDIT** — add min_price_cents | 2 |
| `app/api/browse/route.ts` | **EDIT** — include price in response | 2 |
| `components/PlantCard.tsx` | **EDIT** — show price, add compare checkbox | 2, 4 |
| `components/compare/CompareContext.tsx` | **NEW** | 4 |
| `components/compare/CompareTray.tsx` | **NEW** | 4 |
| `components/compare/CompareTable.tsx` | **NEW** | 4 |
| `app/compare/page.tsx` | **NEW** | 4 |
| `components/ui/SearchBar.tsx` | **EDIT** — polish dropdown | 5 |

---

## What NOT To Do

1. **Do NOT delete `components/browse/TaxonomyExplorer.tsx`.** It's excellent UX — just no longer the default browse mode. Keep it for potential future use at `/browse/taxonomy`.
2. **Do NOT modify the database schema.** No migrations in this sprint. Price data comes from existing `inventory_offers` table.
3. **Do NOT add new npm dependencies.** Everything needed is already in the project.
4. **Do NOT build recommendation modules** ("similar cultivars", "best value picks"). That requires editorial curation not yet available.
5. **Do NOT build a pollination compatibility engine.** Wait until pollination data is populated.
6. **Do NOT create an "Advanced Search" as a separate page/mode.** Progressive filters on the main results page are the right pattern.
7. **Do NOT modify the nursery pages** in this sprint. Lower priority.
8. **Do NOT add infinite scroll anywhere.** "Show more" buttons are the right pattern.
9. **Do NOT use `any` or `@ts-ignore`.** TypeScript strict mode is enforced.
10. **Do NOT break existing tests.** Run `npm test` after each phase. All 230+ tests must pass.
11. **Do NOT modify `/app/search/page.tsx`** — it's a redirect shim that still works correctly.
12. **Do NOT remove the Marketplace page itself** (`app/marketplace/`) — just remove it from primary nav.

---

## Testing Checklist

### Phase 1
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` — all existing tests pass
- [ ] Homepage shows hero with search bar and quick-start chips
- [ ] Hero search bar has typeahead (type 3+ chars, suggestions appear)
- [ ] Quick-start chips navigate to correct filtered views
- [ ] Zone chip appears if user has saved zone in localStorage
- [ ] Zone chip does NOT cause hydration mismatch (renders after client mount)
- [ ] Header search bar has typeahead (replaces old plain form)
- [ ] Marketplace is NOT in primary nav (desktop or mobile)
- [ ] Marketplace IS still in footer
- [ ] Explore/Refine toggle is gone — only BrowseContent funnel shown
- [ ] Browse funnel still works: categories → genera → cultivars
- [ ] Search from hero → lands in browse with results
- [ ] Pollination tab removed from cultivar page
- [ ] Cultivar pages with growing profiles still show Overview, Growing, [Production], Buy tabs

### Phase 2
- [ ] PlantCard shows "From $X" when price data exists
- [ ] PlantCard shows NO price text when no offers exist (clean, no "From $null")
- [ ] Species page cultivar cards show price range
- [ ] Cultivar page shows PriceComparisonTable immediately below hero (not in tab)
- [ ] Buy tab still shows: nursery map, community listings, stock alerts, sparklines
- [ ] Browse API response includes `min_price_cents` field

### Phase 3
- [ ] Cultivar page loads without errors
- [ ] Hero section shows: name, botanical name, breeder, QuickFactsHero, best price
- [ ] "Where to buy" section visible immediately (no tab click needed)
- [ ] Growing details in accordion (closed by default, opens on click)
- [ ] About section in accordion (closed by default)
- [ ] No Pollination tab or "coming soon" content anywhere
- [ ] Category-colored placeholder icon where image would be
- [ ] Breadcrumbs still work
- [ ] JSON-LD still valid
- [ ] Mobile layout doesn't overflow

### Phase 4
- [ ] Compare checkbox appears on PlantCard
- [ ] Clicking compare adds item to tray (sticky bottom bar appears)
- [ ] Tray shows selected cultivar names with × buttons
- [ ] Max 4 items enforced (5th add is ignored)
- [ ] "Compare N" button in tray links to `/compare?ids=...`
- [ ] Compare page renders comparison table with correct data
- [ ] Compare page handles 2, 3, and 4 items
- [ ] Compare page shows error/redirect if <2 items or invalid IDs
- [ ] Clear button in tray empties selection
- [ ] Tray disappears when all items removed
- [ ] Compare link appears in navigation

### Phase 5
- [ ] SearchBar dropdown shows "See all results" link at bottom
- [ ] Group headers show counts
- [ ] Touch targets are 44px+ on mobile

### Cross-cutting
- [ ] Mobile (375px): all pages render without horizontal overflow
- [ ] Desktop (1280px): all layouts look correct
- [ ] Dark mode: not required but shouldn't break if CSS variables are used correctly
- [ ] No console errors in dev tools
- [ ] Page transitions feel smooth (no full reloads within browse flow)

---

## Implementation Order

**Phase 1 first.** It's mostly removals — lowest risk, highest trust impact. Ship it, test it, move on.

**Phase 2 second.** Small data changes with visible impact. Prices appearing on cards is the "Kayak" moment.

**Phase 3 third.** The cultivar page restructure is the biggest change but builds naturally on Phase 2's price work.

**Phase 4 fourth.** Compare flow is a new feature that depends on stable cultivar pages from Phase 3.

**Phase 5 last.** Search polish is low priority — existing search works fine.

Each phase is independently shippable. Run `npm test` and `npx tsc --noEmit` after each phase before moving to the next.

---

## Not In Scope (Future Sprints)

- Image pipeline / thumbnails
- Pollination compatibility engine
- Recommendation modules (similar cultivars, budget picks)
- Nursery page redesign
- User accounts / authentication
- Advanced nursery trust badges
- SEO content pages
- Performance optimization (current SSR is already fast)
