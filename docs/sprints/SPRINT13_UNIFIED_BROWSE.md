# Sprint 13: Unified Browse Layout & Compare Fix

*Created 2026-03-12. Goal: Eliminate the three-screen browse funnel (Categories → Genera → Cultivars) and replace it with ONE consistent layout everywhere. Fix the broken Compare page. Clean up dead code and redundant search bars.*

---

## Background & Problem Statement

The browse experience currently has **three completely different layouts** depending on which step of the funnel the user is at:

1. **Step 1 (Categories)** — Narrow centered column, emoji cards with colored left border, no sidebar, no filters. Component: `CategoryCards.tsx`.
2. **Step 2 (Genera)** — Narrow centered column with breadcrumb, metadata cards showing species/cultivar/nursery counts. Component: `GenusCards.tsx`.
3. **Step 3 (Cultivars)** — Full-width layout with 280px filter sidebar, plant card grid, search bar, sort controls. Components: `BrowseShell.tsx`, `PlantFilterSidebar.tsx`, `BrowseHeader.tsx`, `BrowseGrid.tsx`.

Each step feels like a different website. **Step 3 is the good layout.** The goal is to make Step 3's layout the ONLY layout, with category and genus navigation integrated into the sidebar as a collapsible tree.

### Additional Bugs

- **Compare page "Browse Plants" button** links to `/` which dumps users into the category funnel instead of the plant grid.
- **Compare selections are lost on navigation** — stored only in React state, no localStorage persistence.
- **Compare page has no inline plant picker** — users must leave the page entirely to add plants.
- **Three search bars visible** — HomepageHero search, BrowsePageClient search, and BrowseHeader search all render at various stages.
- **Quick-start buttons use `?mode=refine`** parameter that nothing reads, and `category=Nut+Trees` (display_category DB value) while the funnel uses `cat=nut-trees` (slug). Inconsistent.
- **`taxonomyTree` prop** is fetched on homepage and passed to `BrowsePageClient` but silently dropped — dead code.
- **URL state uses `window.history.replaceState`** instead of Next.js router — breaks prefetching/caching.
- **`/browse` route is just a redirect to `/`** — the BROWSE nav link has no distinct destination.
- **`BrowseContent.tsx` is 23KB / ~600 lines** — a monolith orchestrating all three funnel steps, API fetching, facet state, URL syncing, debouncing, and rendering. Needs decomposition.

---

## Design Vision — The Unified Layout

After this sprint, the homepage browse area looks like this at ALL times:

```
┌─────────────────────────────────────────────────────┐
│  HomepageHero (search bar + quick-start chips)      │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                        │
│              │                                      │
│  🌰 Nut Trees    │  Search bar + Sort controls         │
│    Hazelnuts │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│    Chestnuts │  │ Card │ │ Card │ │ Card │ │ Card ││
│    Walnuts   │  └──────┘ └──────┘ └──────┘ └──────┘│
│    Hickories │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  🫐 Berries  │  │ Card │ │ Card │ │ Card │ │ Card ││
│  🍎 Tree Fruit│  └──────┘ └──────┘ └──────┘ └──────┘│
│  🌿 Support  │                                      │
│              │  Pagination                          │
│  ─────────── │                                      │
│  FILTERS     │                                      │
│  Plant Type  │                                      │
│  USDA Zone   │                                      │
│  In Stock    │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Key behaviors:**
- Categories are always visible in the sidebar as collapsible sections.
- Clicking a category **expands** it to show genera underneath (accordion-style). It also filters the main grid to that category.
- Clicking a genus filters the main grid further to just that genus.
- Clicking "All Categories" at the top of the sidebar clears category/genus filters.
- The existing facet filters (Plant Type checkboxes, USDA Zone, In Stock toggle) remain BELOW the category tree in the sidebar.
- Only ONE search bar exists in the main content area (the `BrowseHeader` search). The Hero search bar remains in the hero section above.
- The Hero search bar and the BrowseHeader search bar are synced — typing in either updates the same `q` parameter.

---

## Phase 1: Unified Sidebar Navigation (CRITICAL — Do First)

*This phase eliminates the 3-step funnel and creates one consistent layout.*

### Task 1.1: Create `CategoryTreeSidebar` component

**New file:** `components/browse/CategoryTreeSidebar.tsx`

This is a `'use client'` component that renders the category → genus navigation tree. It lives ABOVE the existing `PlantFilterSidebar` inside the sidebar column.

```tsx
'use client';

import { useState, useCallback } from 'react';
import { TOP_CATEGORIES, type TopCategory } from '@/lib/browse-categories';
import type { GenusCount } from '@/lib/queries/genus-counts';

interface CategoryTreeSidebarProps {
  /** Currently selected top category slug, e.g. 'nut-trees' */
  selectedCategory: string | null;
  /** Currently selected genus slug, e.g. 'corylus' */
  selectedGenus: string | null;
  /** Genus-level counts from getGenusCounts (species, cultivars, nurseries per genus) */
  genusCounts: Record<string, GenusCount>;
  /** Called when user clicks a top category */
  onCategorySelect: (slug: string | null) => void;
  /** Called when user clicks a genus within a category */
  onGenusSelect: (genusSlug: string | null) => void;
}

export function CategoryTreeSidebar({
  selectedCategory,
  selectedGenus,
  genusCounts,
  onCategorySelect,
  onGenusSelect,
}: CategoryTreeSidebarProps) {
  // Track which categories are expanded (accordion-style)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (selectedCategory) initial.add(selectedCategory);
    return initial;
  });

  const toggleExpand = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleCategoryClick = useCallback(
    (slug: string) => {
      // Toggle expansion
      toggleExpand(slug);
      // If clicking the already-selected category, deselect it (show all)
      if (selectedCategory === slug) {
        onCategorySelect(null);
        onGenusSelect(null);
      } else {
        onCategorySelect(slug);
        onGenusSelect(null); // Clear genus when switching categories
      }
    },
    [selectedCategory, onCategorySelect, onGenusSelect, toggleExpand]
  );

  const handleGenusClick = useCallback(
    (genusSlug: string) => {
      if (selectedGenus === genusSlug) {
        onGenusSelect(null); // Deselect genus — show all in category
      } else {
        onGenusSelect(genusSlug);
      }
    },
    [selectedGenus, onGenusSelect]
  );

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        Browse by Category
      </h3>

      {/* "All Categories" link to clear selection */}
      <button
        type="button"
        onClick={() => {
          onCategorySelect(null);
          onGenusSelect(null);
        }}
        className={`mb-2 block w-full text-left text-sm font-medium transition-colors cursor-pointer ${
          selectedCategory === null
            ? 'text-accent'
            : 'text-text-secondary hover:text-accent'
        }`}
      >
        All Categories
      </button>

      <div className="space-y-1">
        {TOP_CATEGORIES.map((cat) => {
          const isExpanded = expanded.has(cat.slug);
          const isSelected = selectedCategory === cat.slug;

          return (
            <div key={cat.slug}>
              {/* Category row */}
              <button
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-accent-light text-accent'
                    : 'text-text-primary hover:bg-surface-raised hover:text-accent'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                <svg
                  className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>

              {/* Genus sub-items (animated expand/collapse) */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-4 border-l border-border-subtle pl-3 py-1 space-y-0.5">
                  {cat.genera.map((genus) => {
                    const counts = genusCounts[genus.genusSlug];
                    const isEmpty = !counts || counts.speciesCount === 0;
                    const isGenusSelected = selectedGenus === genus.genusSlug;

                    return (
                      <button
                        key={genus.genusSlug}
                        type="button"
                        disabled={isEmpty}
                        onClick={() => !isEmpty && handleGenusClick(genus.genusSlug)}
                        className={`block w-full text-left rounded-md px-2 py-1 text-sm transition-colors ${
                          isEmpty
                            ? 'text-text-tertiary/50 cursor-default'
                            : isGenusSelected
                            ? 'bg-accent-light text-accent font-medium'
                            : 'text-text-secondary hover:bg-surface-raised hover:text-accent cursor-pointer'
                        }`}
                      >
                        <span>{genus.commonName}</span>
                        {!isEmpty && counts && (
                          <span className="ml-1 text-xs text-text-tertiary">
                            ({counts.cultivarCount})
                          </span>
                        )}
                        {isEmpty && (
                          <span className="ml-1 text-xs text-text-tertiary/50">
                            soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Key design decisions:**
- Categories expand/collapse like an accordion. Multiple can be open simultaneously.
- The currently selected category gets `bg-accent-light text-accent` highlight.
- Genera with zero data show "soon" in muted text and are `disabled`.
- Genus items show the cultivar count in parentheses.
- A thin left border connects genus items to their parent category visually.

### Task 1.2: Rewrite `BrowseContent.tsx` — eliminate the 3-step funnel

**File:** `components/BrowseContent.tsx`

This is the biggest change. The current component has a `browseStep` state machine (`'categories' | 'genera' | 'cultivars'`) that renders completely different layouts depending on the step. **Remove the step machine entirely.** The component should ALWAYS render the Step 3 layout (sidebar + grid).

**What to change:**

1. **Remove** `browseStep` state, `setBrowseStep`, and all conditional rendering based on it.
2. **Remove** the `navigateToCategory`, `navigateToGenus`, `navigateToStep` callbacks (they drove the funnel transitions).
3. **Remove** the `// Step 1: Category selection` and `// Step 2: Genus selection` render branches at the bottom of the component.
4. **Add** `selectedCategory` and `selectedGenus` state (these already exist — keep them).
5. **Add** `CategoryTreeSidebar` into the sidebar column, ABOVE the existing `PlantFilterSidebar`.
6. **Always** render the `BrowseShell` layout (sidebar + main content) regardless of whether a category/genus is selected.
7. **When no category is selected**, show ALL plants in the grid (current default behavior when at step 3 with no filters).
8. **When a category is selected** (but no genus), filter the grid to that category by setting the `category` multiSelect facet.
9. **When a genus is selected**, further filter to that genus.

**New sidebar column content:**

```tsx
sidebar={
  <div>
    <CategoryTreeSidebar
      selectedCategory={selectedCategory}
      selectedGenus={selectedGenus}
      genusCounts={genusCounts}
      onCategorySelect={handleCategorySelect}
      onGenusSelect={handleGenusSelect}
    />
    <PlantFilterSidebar
      filterValues={toFilterValues(facetState)}
      facetCounts={sidebarCounts}
      totalResults={total}
      selectedCategories={selectedCategories}
      onMultiSelectToggle={handleMultiSelectToggle}
      onBooleanToggle={handleBooleanToggle}
      onRangeChange={handleRangeChange}
      onClearAll={clearAll}
    />
  </div>
}
```

**New handler functions (replace the old funnel navigation):**

```tsx
const handleCategorySelect = useCallback((slug: string | null) => {
  setSelectedTopCategory(slug);
  setSelectedGenus(null);
  setHasUserChanged(true);
  if (slug) {
    const displayCats = getDisplayCategoriesForSlug(slug);
    setFacetState((prev) => ({
      ...prev,
      multiSelect: { ...prev.multiSelect, category: displayCats },
      page: 1,
    }));
  } else {
    // Clear category filter
    setFacetState((prev) => ({
      ...prev,
      multiSelect: { ...prev.multiSelect, category: [] },
      page: 1,
    }));
  }
}, []);

const handleGenusSelect = useCallback((genusSlug: string | null) => {
  setSelectedGenus(genusSlug);
  setHasUserChanged(true);
  setFacetState((prev) => ({
    ...prev,
    page: 1,
  }));
}, []);
```

**Critical: The `genusCounts` computation** currently only runs when `browseStep === 'genera'`. Change it to always compute when a category is selected:

```tsx
const genusCounts = useMemo(() => {
  if (!selectedTopCategory) return {};
  return getGenusCounts(allPlants, selectedTopCategory);
}, [selectedTopCategory, allPlants]);
```

**The API fetch effect** currently has a guard `if (browseStep !== 'cultivars') return;`. **Remove this guard.** The API should always fetch when filters change, since we always show the grid.

**Remove** the genus filter from the API params and handle it via the `genus` URL param that the API already supports:

```tsx
// In the fetch effect, keep this line:
if (selectedGenus) params.set('genus', selectedGenus);
```

**The component's render section** should now ALWAYS return the `BrowseShell` layout. Remove the three conditional returns. The bottom of the render should look like:

```tsx
return (
  <>
    <BrowseBreadcrumb
      step="cultivars"
      categoryLabel={topCategory?.label}
      genusLabel={genusEntry?.commonName}
      onNavigate={(step) => {
        if (step === 'categories') {
          handleCategorySelect(null);
        } else if (step === 'genera') {
          handleGenusSelect(null);
        }
      }}
    />
    <BrowseShell
      sidebar={
        <div>
          <CategoryTreeSidebar
            selectedCategory={selectedTopCategory}
            selectedGenus={selectedGenus}
            genusCounts={genusCounts}
            onCategorySelect={handleCategorySelect}
            onGenusSelect={handleGenusSelect}
          />
          <PlantFilterSidebar
            filterValues={toFilterValues(facetState)}
            facetCounts={sidebarCounts}
            totalResults={total}
            selectedCategories={selectedCategories}
            onMultiSelectToggle={handleMultiSelectToggle}
            onBooleanToggle={handleBooleanToggle}
            onRangeChange={handleRangeChange}
            onClearAll={clearAll}
          />
        </div>
      }
    >
      <BrowseHeader
        query={facetState.q}
        sort={facetState.sort}
        groupBy={facetState.groupBy}
        total={headerTotal}
        page={headerPage}
        perPage={headerPerPage}
        selectedCategories={selectedCategories}
        onQueryChange={(value) => updateState({ q: value })}
        onSortChange={(v) => updateState({ sort: v, page: 1 })}
        onGroupByChange={(v) => updateState({ groupBy: v, page: 1 })}
        onCategorySelect={(cat) =>
          updateState({ multiSelect: { ...facetState.multiSelect, category: [cat] } })
        }
        inFunnel={true}
      />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="ml-2 text-sm text-text-tertiary">Updating results...</span>
        </div>
      )}

      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
        <BrowseGrid
          groupBy={facetState.groupBy}
          plants={plants}
          genusGroups={genusGroups}
          activePills={activePills}
          recoveryHints={recoveryHints}
          currentPage={facetState.page}
          totalPages={totalPages}
          onPageChange={(p) => updateState({ page: p })}
          onClearAll={clearAll}
        />
      </div>
    </BrowseShell>
  </>
);
```

**Pass `inFunnel={true}` to BrowseHeader** so it hides the category pills row and genus toggle (those functions are now in the sidebar tree). If you want to keep the category pills as a secondary entry point, set `inFunnel` to `!!(selectedTopCategory || selectedGenus)` so they show when nothing is selected.

### Task 1.3: Remove duplicate search bar from `BrowsePageClient.tsx`

**File:** `components/browse/BrowsePageClient.tsx`

Currently renders its own `SearchBar` above `BrowseContent`. Since `BrowseContent` always renders the `BrowseHeader` which has its own search bar, the `BrowsePageClient` search bar is redundant.

**Remove** the `SearchBar` from `BrowsePageClient`. The component becomes:

```tsx
'use client';

import type { BrowsePlant } from '@/lib/queries/browse';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';

interface BrowsePageClientProps {
  allPlants: BrowsePlant[];
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({
  allPlants,
}: BrowsePageClientProps) {
  return <BrowseContent allPlants={allPlants} />;
}
```

Remove the `useCallback`, `useRouter`, `useSearchParams`, `FormEvent`, and `SearchBar` imports — they're no longer needed.

**Note:** Keep accepting `taxonomyTree` in the interface so `app/page.tsx` doesn't need changes yet. But do NOT pass it to `BrowseContent`.

### Task 1.4: Clean up `app/page.tsx` — remove dead `taxonomyTree` fetch

**File:** `app/page.tsx`

The `getTaxonomyTree(supabase)` call is unused (BrowsePageClient ignores it). Remove it.

**Before:**
```tsx
const [allPlants, taxonomyTree] = await Promise.all([
  getAllBrowsePlants(supabase),
  getTaxonomyTree(supabase),
]);
```

**After:**
```tsx
const allPlants = await getAllBrowsePlants(supabase);
```

Remove the `getTaxonomyTree` import from `@/lib/queries/taxonomy-tree`.

Update the `BrowsePageClient` call — you can either still pass a dummy `taxonomyTree` prop or update the interface. Simplest: remove `taxonomyTree` from `BrowsePageClientProps` entirely and remove it from the JSX:

```tsx
<BrowsePageClient allPlants={allPlants} />
```

Then update `BrowsePageClient` to remove the prop from its interface too.

### Task 1.5: Fix quick-start button URL params in `HomepageHero.tsx`

**File:** `components/HomepageHero.tsx`

The quick-start buttons currently use inconsistent URL params:
```tsx
{ label: 'Fruit trees', href: '/?mode=refine&category=Tree+Fruit' },
```

The `mode=refine` param is unused. The `category=Tree+Fruit` param uses a display_category DB value while the sidebar uses category slugs.

**Fix:** Change the quick-start hrefs to use the same `cat` param the sidebar uses:

```tsx
const quickStarts = [
  { label: 'Fruit trees', href: '/?cat=tree-fruit' },
  { label: 'Nut trees', href: '/?cat=nut-trees' },
  { label: 'Nitrogen fixers', href: '/?cat=support-species' },
  { label: 'In stock now', href: '/?available=true' },
];
```

Also update the zone chip:
```tsx
onClick={() => router.push(`/?zoneMin=${zone}&zoneMax=${zone}`)}
```

(Remove `mode=refine` from all URLs.)

Then in `BrowseContent.tsx`, update the initial state parsing to read `cat` from URL params and set `selectedTopCategory` accordingly. The existing code already does this:
```tsx
const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(
  () => searchParams.get('cat'),
);
```

Ensure that when `cat` is set from URL, the category is auto-expanded in the sidebar and the facet filter is pre-applied. Add an effect or initialization logic:

```tsx
// In BrowseContent, add to the initial facetState parsing:
const initialCat = searchParams.get('cat');
// If cat is set, pre-populate the category multiSelect
if (initialCat) {
  const displayCats = getDisplayCategoriesForSlug(initialCat);
  initialState.multiSelect.category = displayCats;
}
```

### Task 1.6: Update breadcrumb to work with unified layout

**File:** `components/browse/BrowseBreadcrumb.tsx`

The breadcrumb currently shows different states for different funnel steps. Simplify:
- No category selected: don't show breadcrumb at all (the sidebar tree is the navigation)
- Category selected: show `← All Categories / Nut Trees`
- Category + Genus selected: show `← All Categories / Nut Trees / Hazelnuts`

Clicking "All Categories" calls `onNavigate('categories')` which clears category + genus.
Clicking the category name calls `onNavigate('genera')` which clears just the genus.

This should already work with the existing BrowseBreadcrumb — verify and adjust if needed.

### Task 1.7: On mobile, make sidebar collapsible

**File:** `components/browse/BrowseShell.tsx`

The current `BrowseShell` hides the sidebar column on mobile (it's `lg:grid lg:grid-cols-[280px_1fr]`). On smaller screens, the sidebar doesn't render at all.

Add a mobile filter toggle button (common pattern):

```tsx
'use client';

import { useState, type ReactNode } from 'react';

interface BrowseShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function BrowseShell({ sidebar, children }: BrowseShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      {/* Mobile filter toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mb-4 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-secondary lg:hidden cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {sidebarOpen ? 'Hide Filters' : 'Filters & Categories'}
      </button>

      {/* Sidebar: always visible on lg+, toggle on mobile */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        {sidebar}
      </div>

      <div>{children}</div>
    </div>
  );
}
```

---

## Phase 2: Fix Compare Page

*Estimated: 2-3 hours. Fixes broken routing and improves the empty state.*

### Task 2.1: Persist compare selections in localStorage

**File:** `components/compare/CompareContext.tsx`

Currently, compare items live only in React state and are lost on page navigation. Add localStorage persistence.

**Changes:**

1. On mount, read from `localStorage.getItem('compare-items')` and parse as initial state.
2. Whenever `items` changes, write to `localStorage.setItem('compare-items', JSON.stringify(items))`.
3. Handle SSR safely: only access localStorage inside `useEffect` (not in `useState` initializer).

```tsx
const [items, setItems] = useState<CompareItem[]>([]);

// Hydrate from localStorage on mount
useEffect(() => {
  try {
    const stored = localStorage.getItem('compare-items');
    if (stored) {
      const parsed = JSON.parse(stored) as CompareItem[];
      if (Array.isArray(parsed) && parsed.length <= 4) {
        setItems(parsed);
      }
    }
  } catch {
    // Ignore parse errors
  }
}, []);

// Sync to localStorage on change
useEffect(() => {
  try {
    localStorage.setItem('compare-items', JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}, [items]);
```

### Task 2.2: Fix "Browse Plants" button on compare page

**File:** `app/compare/page.tsx`

The empty state currently links to `/`:
```tsx
<Link href="/" className="...">
  Browse Plants
</Link>
```

This dumps users into the homepage hero + category funnel. With the Phase 1 changes the homepage now always shows the grid, so linking to `/` is actually OK now. But to be more helpful, link directly with a query param that scrolls past the hero:

```tsx
<Link href="/#browse" className="...">
  Browse Plants
</Link>
```

And add an `id="browse"` anchor to the browse content wrapper in `app/page.tsx`:

```tsx
<div id="browse" className="mx-auto max-w-7xl px-4 py-8">
```

This way clicking "Browse Plants" on the compare page scrolls directly to the plant grid.

### Task 2.3: Improve compare empty state

**File:** `app/compare/page.tsx`

Replace the minimal empty state with something more helpful:

```tsx
if (!ids) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <Text variant="h1" className="mb-4">Compare Cultivars</Text>
      <Text variant="body" color="secondary" className="mb-2">
        Select 2–4 cultivars from the browse page to compare them side by side.
      </Text>
      <Text variant="caption" color="tertiary" className="mb-8">
        Look for the compare checkbox on plant cards while browsing, or use the
        compare tray at the bottom of the screen.
      </Text>
      <Link
        href="/#browse"
        className="inline-block rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors"
      >
        Browse Plants
      </Link>
    </div>
  );
}
```

### Task 2.4: Add compare checkbox to PlantCard

**File:** `components/PlantCard.tsx`

Check if `PlantCard` is a client component. If it has `'use client'` at the top, proceed directly. If not, you need to either:
- (A) Convert it to a client component (add `'use client'`), or
- (B) Create a wrapper `PlantCardInteractive.tsx` that adds the compare button.

**Option A is simpler if the component doesn't do any server-side data fetching.**

Add the compare interaction:

```tsx
import { useCompare } from '@/components/compare/CompareContext';

// Inside the component:
const { add, remove, has } = useCompare();
const isComparing = has(cultivarId); // You'll need to pass cultivar_id as a prop

// In the JSX, add a compare toggle button (top-right corner of the card):
<button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComparing) {
      remove(cultivarId);
    } else {
      add({
        id: cultivarId,
        name: canonicalName,
        speciesName: botanicalName ?? '',
        speciesSlug: slug.split('/')[0] ?? slug,
        cultivarSlug: slug,
        zoneMin: zoneMin ?? null,
        zoneMax: zoneMax ?? null,
        priceCents: lowestPrice ?? null,
        nurseryCount: nurseryCount,
      });
    }
  }}
  className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all ${
    isComparing
      ? 'border-accent bg-accent text-text-inverse'
      : 'border-border-subtle bg-surface-primary/80 text-text-tertiary opacity-0 group-hover:opacity-100'
  }`}
  aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
>
  {isComparing ? '✓' : '+'}
</button>
```

**Important:** The card's parent `<Link>` wrapping will try to navigate on click. The `e.preventDefault()` + `e.stopPropagation()` on the button prevents the link from firing. Make sure the card wrapper has `className="group relative"` so the `group-hover:opacity-100` works and `absolute` positioning works.

**The PlantCard currently needs a `cultivarId` prop.** Looking at the current props, it receives `slug`, `canonicalName`, etc. but may not receive a `cultivarId`. The `BrowsePlant` type should have an `id` or `cultivar_id` field. Check the type definition and pass it through. If the browse API doesn't return cultivar IDs (it may only return species-level data), this feature may need to be limited to species-level or deferred.

**If cultivar IDs are not available in the browse grid:** Skip the compare checkbox on PlantCards for now. The compare checkbox can instead be added to the cultivar detail page (`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`) where cultivar IDs are definitely available. Add a "Compare" button next to the existing action buttons in the hero section.

---

## Phase 3: Code Cleanup & Dead Code Removal

*Estimated: 1-2 hours. Low risk, purely cleanup.*

### Task 3.1: Remove unused CategoryCards and GenusCards components

After Phase 1, these components are no longer rendered anywhere.

**Files to KEEP but NOT import anywhere:**
- `components/browse/CategoryCards.tsx` — no longer imported by BrowseContent
- `components/browse/GenusCards.tsx` — no longer imported by BrowseContent

Actually, **delete these files entirely.** They are fully replaced by `CategoryTreeSidebar.tsx`. Keeping dead components creates confusion for future development.

**Also remove** from `BrowseContent.tsx`:
```tsx
import { CategoryCards } from '@/components/browse/CategoryCards';
import { GenusCards } from '@/components/browse/GenusCards';
```

### Task 3.2: Remove `mode=refine` references everywhere

Search the codebase for `mode=refine` and `mode` param handling. Remove any references since the Explore/Refine toggle was already eliminated in Sprint 12.

Files likely affected:
- `components/HomepageHero.tsx` (fixed in Phase 1 Task 1.5)
- Any remaining references in `BrowseContent.tsx` or `BrowsePageClient.tsx`

### Task 3.3: Remove `/browse` redirect route

**File:** `app/browse/page.tsx`

This file just redirects to `/`. Since the nav link already goes to `/`, this route is pointless. Delete the file and the `app/browse/` directory.

**Also verify:** No internal links point to `/browse`. Search the codebase for `href="/browse"` or `router.push('/browse')`. Update any found to `/`.

### Task 3.4: Simplify URL state — use Next.js router

**File:** `components/BrowseContent.tsx`

Currently uses `window.history.replaceState` for URL updates and a manual `popstate` listener:

```tsx
// Current (problematic):
window.history.replaceState(null, '', url);
// ...
window.addEventListener('popstate', handlePopState);
```

Replace with Next.js `useRouter`:

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// In the URL sync effect:
router.replace(url, { scroll: false });
```

**Remove** the `popstate` event listener entirely. Next.js handles back/forward navigation when using `router.replace`.

**Note:** `router.replace` with `{ scroll: false }` prevents the page from scrolling to top on URL changes — same behavior as the current `replaceState`.

**Be careful with effect dependencies.** The current `replaceState` call is inside a `useEffect` that depends on `[facetState, selectedTopCategory, selectedGenus]`. When using `router.replace`, make sure `router` is NOT in the dependency array (it's stable). Also ensure this doesn't cause an infinite loop — the effect updates the URL, but `facetState` is driven by state, not by URL reading, so it should be fine.

---

## Phase 4: Polish & Edge Cases

*Estimated: 1-2 hours. Small improvements.*

### Task 4.1: Sync Hero search with browse search

**File:** `components/HomepageHero.tsx`

The Hero search bar currently uses the `SearchBar` component which has its own behavior (typeahead dropdown navigating to plant pages). When a user types in the hero search and submits (Enter key), it should update the browse grid below.

The `SearchBar` component has an `onSubmit` handler. Wire it to navigate:

```tsx
<SearchBar
  inputId="hero-search"
  className="w-full"
  onSubmit={(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('q') as string)?.trim();
    if (q) {
      router.push(`/?q=${encodeURIComponent(q)}`);
    }
  }}
/>
```

Check the `SearchBar` component's `onSubmit` prop signature — it may already support this. If not, this is a minor tweak.

### Task 4.2: Hide category pills in BrowseHeader when sidebar is visible

**File:** `components/browse/BrowseHeader.tsx`

The `BrowseHeader` has a row of colored category pill buttons at the top. Now that categories live in the sidebar tree, these pills are redundant on desktop. But they're still useful on mobile where the sidebar is collapsed.

**Change:** Always pass `inFunnel={true}` from `BrowseContent` to hide the pills. OR, better: rename the prop to something clearer like `hideCategoryPills` and set it based on whether the sidebar is visible:

```tsx
// In BrowseHeader, replace the category pills section:
{!inFunnel && selectedCategories.length === 0 && (
  <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
    {/* Only show on mobile where sidebar is hidden */}
    ...
  </div>
)}
```

Add `lg:hidden` to the category pills wrapper so they're mobile-only.

### Task 4.3: Auto-trigger initial data load

**File:** `components/BrowseContent.tsx`

Currently the API fetch has a guard `if (!hasUserChanged) return;` — meaning data only loads from the API after the user interacts. Before that, it uses the server-rendered `allPlants` seed data.

This is fine for the initial page load, but when a user arrives via a URL with `?cat=nut-trees`, the seed data filtering happens client-side and may be incomplete. Ensure that URL params on initial load trigger `hasUserChanged` to be true:

```tsx
const [hasUserChanged, setHasUserChanged] = useState(() => {
  // If URL has any filter params, consider it a "user change" to trigger API fetch
  const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return !!(sp.get('cat') || sp.get('genus') || sp.get('q') || sp.get('category') || sp.get('available'));
});
```

**SSR safety:** Use `typeof window !== 'undefined'` guard since `useState` initializer runs during SSR.

---

## Files Changed Summary

| File | Action | Phase |
|------|--------|-------|
| `components/browse/CategoryTreeSidebar.tsx` | **NEW** | 1 |
| `components/BrowseContent.tsx` | **MAJOR REWRITE** — remove 3-step funnel, always render grid+sidebar | 1 |
| `components/browse/BrowsePageClient.tsx` | **EDIT** — remove redundant SearchBar | 1 |
| `app/page.tsx` | **EDIT** — remove dead `taxonomyTree` fetch, add `id="browse"` | 1, 2 |
| `components/HomepageHero.tsx` | **EDIT** — fix quick-start URLs, sync search | 1, 4 |
| `components/browse/BrowseShell.tsx` | **EDIT** — add mobile filter toggle | 1 |
| `components/browse/BrowseBreadcrumb.tsx` | **EDIT** — simplify for unified layout | 1 |
| `components/compare/CompareContext.tsx` | **EDIT** — add localStorage persistence | 2 |
| `app/compare/page.tsx` | **EDIT** — fix "Browse Plants" link, improve empty state | 2 |
| `components/PlantCard.tsx` | **EDIT** — add compare checkbox (if cultivar IDs available) | 2 |
| `components/browse/CategoryCards.tsx` | **DELETE** | 3 |
| `components/browse/GenusCards.tsx` | **DELETE** | 3 |
| `app/browse/page.tsx` | **DELETE** | 3 |
| `components/browse/BrowseHeader.tsx` | **EDIT** — hide category pills on desktop | 4 |

---

## What NOT To Do

1. **Do NOT delete `TaxonomyExplorer.tsx`.** It's a good component — just not the default browse mode. Keep it for potential future use.
2. **Do NOT modify the database schema.** No migrations in this sprint.
3. **Do NOT add new npm dependencies.**
4. **Do NOT use `any` or `@ts-ignore`.** TypeScript strict mode is enforced.
5. **Do NOT break existing tests.** Run `npm test` after each phase.
6. **Do NOT modify nursery pages** in this sprint.
7. **Do NOT modify the cultivar detail page** (`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`) — that's a separate sprint.
8. **Do NOT remove the Chestnuts/Oaks/Chilean Hazelnut genera** from `TOP_CATEGORIES`. They should show as disabled/coming-soon in the sidebar tree.
9. **Do NOT remove Elaeagnus from both categories** — it's intentionally in Berries AND Support Species. This is correct.
10. **Do NOT modify `PlantFilterSidebar.tsx`** — it works well. The new `CategoryTreeSidebar` is placed ABOVE it in the sidebar, not replacing it.
11. **Do NOT create separate pages for category or genus views.** Everything stays on the homepage with URL params.
12. **Do NOT add infinite scroll.** Keep pagination.

---

## Testing Checklist

### Phase 1 — Unified Layout
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` — all existing tests pass
- [ ] Homepage loads and shows: Hero → sidebar (categories + filters) → plant grid
- [ ] Sidebar shows all 4 categories with correct emoji icons
- [ ] Clicking "Nut Trees" in sidebar: expands to show genera, filters grid to nut trees
- [ ] Clicking "Hazelnuts" under Nut Trees: further filters grid to just hazelnuts
- [ ] Clicking "All Categories" in sidebar: clears all category/genus filters, shows all plants
- [ ] Clicking an already-selected category deselects it
- [ ] Clicking an already-selected genus deselects it (shows all in parent category)
- [ ] Disabled genera (Oaks, Chilean Hazelnut) show "soon" and cannot be clicked
- [ ] Genus items show cultivar count in parentheses
- [ ] URL updates when category/genus changes (e.g. `/?cat=nut-trees&genus=corylus`)
- [ ] Direct URL access works: loading `/?cat=nut-trees&genus=corylus` pre-selects sidebar + filters grid
- [ ] Browser back/forward buttons work correctly
- [ ] Quick-start chips in hero work: "Fruit trees" → grid filtered to tree fruit
- [ ] "In stock now" chip works
- [ ] Zone chip works (if zone saved in localStorage)
- [ ] Only ONE search bar visible in the browse area (the BrowseHeader search)
- [ ] Hero search bar submitting (Enter key) updates the grid
- [ ] Facet filters (Plant Type, USDA Zone, In Stock) still work alongside category selection
- [ ] Sort dropdown still works
- [ ] Pagination still works
- [ ] Mobile (375px): sidebar hidden, "Filters & Categories" button shown
- [ ] Mobile: clicking "Filters & Categories" shows sidebar
- [ ] Mobile: clicking "Hide Filters" hides sidebar
- [ ] No console errors

### Phase 2 — Compare
- [ ] Compare selections persist across page navigation (localStorage)
- [ ] Compare tray appears at bottom when 1+ items selected
- [ ] Max 4 items enforced
- [ ] "Browse Plants" on compare page scrolls to browse grid (not category funnel)
- [ ] Compare empty state shows helpful instructions
- [ ] Compare checkbox appears on PlantCards (or on cultivar detail page if IDs unavailable)
- [ ] Refreshing page preserves compare selections

### Phase 3 — Cleanup
- [ ] `CategoryCards.tsx` and `GenusCards.tsx` deleted
- [ ] `/browse` route removed (404 or redirect — either is fine)
- [ ] No `mode=refine` in any URL
- [ ] URL updates use Next.js router (verify in React DevTools / Network tab)
- [ ] No console warnings about missing components

### Phase 4 — Polish
- [ ] Category pills hidden on desktop (visible only on mobile)
- [ ] Hero search submit updates grid results
- [ ] URL params on initial load trigger proper data fetch

---

## Implementation Order

**Phase 1 first.** This is the core change — unified layout. Everything else depends on it. Do Tasks 1.1–1.7 sequentially. Test thoroughly before moving on.

**Phase 2 second.** Compare fixes. Independent of layout changes but benefits from the unified layout being stable.

**Phase 3 third.** Cleanup. Safe to do after Phases 1–2 are confirmed working.

**Phase 4 last.** Polish. Small improvements.

Run `npx tsc --noEmit` and `npm test` after EACH phase. Do not proceed to the next phase if there are TypeScript errors or test failures.

---

## Architecture Note for Claude Code

The most complex change is **Task 1.2** — rewriting `BrowseContent.tsx`. This 600-line file is the orchestrator for everything. Approach it carefully:

1. **Read the entire file first** before making any changes.
2. **Keep all the existing state management** (facetState, API fetching, debouncing, seed data computation). These work correctly.
3. **Only remove** the `browseStep` state machine and the three conditional render branches.
4. **Only add** the `CategoryTreeSidebar` in the sidebar and the new handler functions.
5. **Do not rewrite from scratch.** Surgical edits are safer than full rewrites.
6. **Test after each sub-change** — e.g., first remove the conditional renders and always show the grid, confirm it works, THEN add the sidebar tree.

If `BrowseContent.tsx` becomes unwieldy during edits, consider extracting the state management into a custom hook (`useBrowseState`) but only AFTER the layout change is confirmed working. Don't refactor and restructure simultaneously.
