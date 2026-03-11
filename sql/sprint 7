# Sprint 7: Navigation, Consistency & Browse Surface

## Status
Ready for execution

## What this sprint is NOT

This is not a feature sprint. Most Sprint 6 and Sprint UX features are already built:
- Facet registry, facet state, facet query builder — done
- Browse decomposition (BrowseShell, BrowseGrid, BrowseHeader) — done
- /api/browse route — done
- SearchBar with autocomplete and alias display — done
- ZonePrompt, ZoneBanner, zone persistence, zone-changed events — done
- ZoneCompatibility component — done
- Active filter pills — done
- Smart empty state with recovery hints — done
- Homepage dynamic sections (Recently Restocked, Best Deals, New to Database) — done
- Zone recommendations — done
- Seasonal banner — done
- Toast system — done
- Full-screen mobile filter sheet — done
- Price sparkline — done

**This sprint fixes the seams between those features.** The site has good parts that don't feel like one product yet.

---

## Problem statement

A user who lands on the homepage, clicks a category, and arrives on /browse experiences a visual disconnect. The homepage has colorful gradient category cards, a warm hero, and dynamic editorial sections. The browse page opens with a redundant hero, different typography feel, and a clinical filter+grid layout that looks like a separate application.

Additionally, the top nav shows "Browse" and "Search" as two separate items, but /search is just a redirect to /browse. The header search form in the layout still submits to /search. These are small inconsistencies that erode user trust.

---

## Deliverables

### 1. Remove "Search" from navigation

The /search route already redirects to /browse (confirmed in `app/search/page.tsx`). Showing it as a separate nav item is a bug.

**Files to modify:**

`components/NavLinks.tsx` — Remove the search entry from the links array:
```ts
// CURRENT
const links = [
  { href: '/browse', label: 'Browse' },
  { href: '/search', label: 'Search' },   // ← remove this line
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/nurseries', label: 'Nurseries' },
];

// AFTER
const links = [
  { href: '/browse', label: 'Browse' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/nurseries', label: 'Nurseries' },
];
```

`components/MobileMenu.tsx` — Remove the /search link from the mobile menu. Inspect the file and remove the equivalent entry.

`app/layout.tsx` — Two changes:
1. The header search form (`<form action="/search" method="GET">`) must change to `action="/browse"`.
2. In the footer, the "Browse" list currently has both "Browse Plants" and "Search" links. Remove the separate "Search" link.

**Do not delete** `app/search/page.tsx`. It must remain as a redirect for existing bookmarks, crawlers, and the SearchBar fallback.

**Acceptance:**
- Only three items in the desktop nav: Browse, Marketplace, Nurseries
- Mobile menu matches
- Header search bar navigates to /browse?q=...
- Footer has no separate "Search" link
- /search?q=hazelnut still works (redirects to /browse?q=hazelnut)

---

### 2. Remove the browse page hero

The browse page (`app/browse/page.tsx`) currently has a `<section className="bg-accent px-4 py-16 text-center">` hero with "Browse All Plants" heading. This is wasted space — the user already knows they're browsing because they clicked "Browse" or a category card. The BrowseHeader component inside BrowseContent already has a search bar and sort controls.

**File to modify:** `app/browse/page.tsx`

Remove the entire hero section:
```tsx
// DELETE THIS BLOCK
<section className="bg-accent px-4 py-16 text-center">
  <div className="mx-auto max-w-7xl">
    <h1 className="font-serif text-4xl font-semibold text-text-inverse md:text-5xl">
      Browse All Plants
    </h1>
    <p className="mt-3 text-lg text-text-inverse/80">
      Filter, sort, and compare availability across nurseries.
    </p>
  </div>
</section>
```

Replace with a compact header that maintains the h1 for SEO but doesn't waste vertical space:
```tsx
<div className="border-b border-border-subtle bg-surface-primary px-4 py-4">
  <div className="mx-auto max-w-7xl">
    <h1 className="font-serif text-xl font-semibold text-text-primary">Browse All Plants</h1>
  </div>
</div>
```

**Acceptance:**
- Browse page loads with results visible immediately (no scrolling past a hero)
- Page still has an h1 element for SEO/accessibility
- The search bar within BrowseHeader is the primary search surface

---

### 3. Fix header search form destination

Confirmed in `app/layout.tsx`: the header contains `<form action="/search" method="GET">`. This should be `/browse`.

**File to modify:** `app/layout.tsx`

Change:
```tsx
<form action="/search" method="GET" role="search" className="hidden md:block">
```
to:
```tsx
<form action="/browse" method="GET" role="search" className="hidden md:block">
```

Also change the input `name` from `q` to `q` (it's already `q`, just verify).

**Acceptance:**
- Typing in the header search bar and pressing Enter navigates to /browse?q=...
- No intermediate redirect through /search

---

### 4. Homepage-to-Browse visual continuity

The homepage uses colorful CategoryCard gradient cards. When a user clicks one, they land on /browse?category=Nut+Trees — but the visual language completely changes. The browse page has no color, no category context, just a clinical filter sidebar.

**What to do:**

Add a compact "category context bar" to the top of the browse results area when a category filter is active. This reuses the CategoryCard color palette to show which category is selected.

**File to create:** `components/browse/CategoryContext.tsx`

A small component that:
- Accepts the currently selected category name (from facet state)
- If exactly one category is selected, renders a compact bar with the category's gradient color, name, and species/cultivar count
- If zero or multiple categories are selected, renders nothing

Pull the color map from `components/CategoryCard.tsx` — extract `categoryColors` into a shared constant file `lib/category-colors.ts` so both `CategoryCard` and `CategoryContext` can use it.

**Files to modify:**
- Create `lib/category-colors.ts` — export `categoryColors` and `defaultColor`
- `components/CategoryCard.tsx` — import colors from the shared file instead of defining inline
- Create `components/browse/CategoryContext.tsx` — compact category banner
- `components/BrowseContent.tsx` — render `CategoryContext` above `BrowseHeader` when one category is selected

**Design:**
The category context bar should be:
- A thin horizontal strip (py-3) with the category's gradient as background
- White text showing: category name, species count, cultivar count
- A subtle "× Clear" button to remove the category filter
- Rounded corners matching the site's radius tokens

**Acceptance:**
- Clicking "Nut Trees" on the homepage → /browse?category=Nut+Trees shows the brown gradient context bar with "Nut Trees — 23 species · 104 cultivars"
- Clicking × removes the category filter
- With no category or multiple categories selected, no context bar appears
- Colors match between homepage CategoryCard and browse CategoryContext

---

### 5. Compact category quick-filter chips on browse (no category selected)

When the user arrives on /browse with no category selected, the sidebar's "Plant Type" disclosure is the primary discovery mechanism. But there's no visual invitation to browse by category — it's just checkboxes.

**What to do:**

When no category is active, render a horizontal row of compact category chips above the search bar in BrowseHeader. Each chip uses the category's gradient color as a background pill. Clicking a chip sets that category filter.

**File to modify:** `components/browse/BrowseHeader.tsx`

Add a new prop: `selectedCategories: string[]` and `onCategorySelect: (category: string) => void`.

When `selectedCategories.length === 0`, render a scrollable row of chips:
```tsx
<div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
  {CATEGORY_OPTIONS.map((cat) => (
    <button
      key={cat.value}
      onClick={() => onCategorySelect(cat.value)}
      className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
      style={{ background: categoryColors[cat.value]?.from ?? defaultColor.from }}
    >
      {cat.label}
    </button>
  ))}
</div>
```

When categories are selected, don't show the chips (the CategoryContext bar handles it).

**Files to modify:**
- `components/browse/BrowseHeader.tsx` — add category chip row
- `components/BrowseContent.tsx` — pass selectedCategories and a handler to BrowseHeader

**Acceptance:**
- /browse with no filters shows colorful category chips above the search bar
- Clicking a chip applies that category filter and the chips disappear (replaced by CategoryContext bar)
- Chips match homepage CategoryCard colors

---

### 6. Audit and fix remaining raw Tailwind typography

UI_POLISH.md prescribed converting all raw Tailwind text classes to `<Text>` component usage. Review the following files for raw `font-serif text-[...]` or `text-sm text-text-*` patterns that should use `<Text>`:

**Files to audit (not modify blindly — inspect and fix only actual violations):**
- `app/page.tsx` — homepage
- `app/browse/page.tsx` — after hero removal
- `components/CategoryCard.tsx` — currently uses raw classes for card text
- `components/HomepageSection.tsx`
- `components/SeasonalBanner.tsx`
- `components/ZoneRecommendations.tsx`

**Rule:** Only convert text that is clearly a heading, body paragraph, or caption. Do NOT convert:
- Text inside `className` for layout/spacing purposes
- Inline text within complex component layouts where `<Text>` would add unwanted elements
- SVG or icon labels

**Acceptance:**
- All page-level headings use `<Text variant="h1">` or `<Text variant="h2">`
- All body text uses `<Text variant="body">` or `<Text variant="sm">`
- All captions use `<Text variant="caption">`
- No raw `font-serif text-[1.8rem]` patterns remain on page files
- All existing tests pass

---

## Implementation order

1. Task 1 (nav cleanup) — smallest change, immediate credibility improvement
2. Task 3 (header search form) — one-line fix, pairs with task 1
3. Task 2 (browse hero removal) — small, clears space for the next changes
4. Task 4 (category context bar) — requires extracting color constants
5. Task 5 (category chips on browse) — builds on the color extraction from task 4
6. Task 6 (typography audit) — final sweep, do last so it doesn't conflict with other changes

---

## Files plan

### New files
- `lib/category-colors.ts`
- `components/browse/CategoryContext.tsx`

### Modified files
- `components/NavLinks.tsx`
- `components/MobileMenu.tsx`
- `app/layout.tsx`
- `app/browse/page.tsx`
- `components/CategoryCard.tsx`
- `components/browse/BrowseHeader.tsx`
- `components/BrowseContent.tsx`
- (Typography audit): `app/page.tsx`, `components/HomepageSection.tsx`, `components/SeasonalBanner.tsx`, `components/ZoneRecommendations.tsx`

### Unchanged
- `app/search/page.tsx` — keep as redirect
- `lib/facets/*` — no changes needed
- `lib/queries/*` — no changes needed
- `components/browse/FacetControl.tsx` — no changes needed
- `components/PlantFilterSidebar.tsx` — no changes needed

---

## Technical guardrails

- All 99+ existing tests must pass after every task
- `npx tsc --noEmit` must be clean
- No new npm dependencies
- No raw Tailwind color classes (use design tokens)
- No `any` types, no `@ts-ignore`
- URL state behavior must not change — all current browse URLs must continue working
- Homepage CategoryCard click behavior must not change
- /search redirect must continue working

---

## What this sprint does NOT include

- No new facets or filter types
- No new API routes
- No database migrations
- No changes to the scraper/pipeline
- No new pages
- No auth/accounts
- No conversational agent work
- No data quality work (that's a separate effort)

---

## Definition of done

Sprint 7 is done when:
1. The site has exactly 3 nav items: Browse, Marketplace, Nurseries
2. Clicking "Browse" from the homepage drops you straight into the filter+grid interface with no wasted hero space
3. The header search bar navigates to /browse?q=... not /search
4. Clicking a category on the homepage and landing on /browse shows a visual bridge (the category context bar) that connects the two experiences
5. /browse with no filters shows category chips that invite exploration
6. All text on public pages uses the `<Text>` component system
7. All tests pass
8. TypeScript is clean
