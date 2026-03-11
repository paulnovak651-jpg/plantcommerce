# Sprint 8: Explore Mode — Taxonomy-Driven Browse Discovery

## Status

Planned

## Owner

PlantCommerce

## Objective

Replace the flat species-card grid as the default browse landing with a compact, taxonomy-driven exploration interface that groups plants naturally and dramatically increases information density. Preserve the existing Sprint 6 faceted search system as a parallel precision mode.

## Core principle

**Make PlantCommerce easier to understand at a glance without making the interface busier.**

## Problem statement

Sprint 6 delivered strong filtering architecture, but the browse page still has a structural discoverability problem:

1. **Species cards are too large for orientation.** The current browse grid renders rich `PlantCard` components (~200×350px each with images, pricing, zones, tags). Users see 6–8 plants per viewport. This is fine for evaluating known options, but too visually heavy for understanding what the catalog contains.

2. **The hierarchy is flattened too early.** The data model supports Category → Genus → Species → Cultivar. Routes already exist for genus hub pages (`/plants/genus/[genusSlug]`) and species pages (`/plants/[speciesSlug]`). But the browse UI collapses everything into a flat species list, scattering related plants. Hazelnuts (Corylus) appear as 3–4 separate cards — American, European, Beaked, Asian — with no visual grouping.

3. **Browse is strong for refinement, weak for orientation.** The facet sidebar answers "narrow this down." It does not help users answer "what categories exist?" or "what belongs together?" or "where should I start?"

## Sprint outcome

By the end of this sprint:

1. `/browse` defaults to an **Explore mode** with a three-panel taxonomy explorer
2. The existing faceted browse is preserved as a **Refine mode** accessible via a clear toggle
3. Users can scan the entire catalog structure (all categories, genera, species) without scrolling through large cards
4. Related plants are visually grouped at the genus level
5. The explorer routes clicks into existing pages/browse states — no new page architecture
6. Mobile users get a clean drill-down equivalent
7. Search remains first-class and always accessible

---

## Scope structure

### Phase A — Data foundation

Lightweight taxonomy query and genus name coverage.

### Phase B — Explore mode MVP

Two-mode browse page, desktop taxonomy explorer, mobile drill-down.

### Phase C — Polish

Density tuning, hover behavior, transitions, edge cases.

---

## In scope

### Phase A

* taxonomy tree query: full Category → Genus → Species hierarchy with counts
* `GENUS_COMMON_NAMES` audit and expansion to cover all genera in DB
* species-with-cultivar preview API endpoint for lazy-loading explorer column 3

### Phase B

* Explore / Refine mode toggle on `/browse`
* three-panel desktop taxonomy explorer (categories | genera | species+cultivars)
* mobile drill-down equivalent
* URL state for mode (`?mode=explore` or `?mode=refine`)
* explorer click actions routing into existing pages

### Phase C

* hover intent with 150ms delay (desktop)
* density and spacing refinement
* loading skeleton for column 3
* keyboard navigation basics (arrow keys within columns)
* verify no clutter regressions vs current browse

---

## Out of scope

Do not do these in this sprint:

* nav bar mega-menu (follow-up, not MVP)
* compact card redesign for genus/species pages (follow-up)
* PlantCard image removal or redesign
* auth or user accounts
* Plant Finder Wizard
* search engine changes
* scraper or pipeline changes
* new database tables or schema changes
* route restructuring (no new `/browse/[category]` routes)

---

## Deliverables

## 1. Taxonomy tree query

### Goal

Provide the explorer with its data: the full Category → Genus → Species hierarchy with counts, assembled from existing tables.

### Required file

Create `lib/queries/taxonomy-tree.ts`

### Interface

```ts
export interface TaxonomyTreeGenus {
  genus_slug: string;
  genus_name: string;        // botanical name from taxonomy_nodes
  common_name: string;       // from GENUS_COMMON_NAMES
  species_count: number;
  cultivar_count: number;
  has_stock: boolean;         // any species in this genus has nursery_count > 0
}

export interface TaxonomyTreeCategory {
  category: string;
  genera: TaxonomyTreeGenus[];
  total_species: number;
  total_cultivars: number;
}

export interface TaxonomyTree {
  categories: TaxonomyTreeCategory[];
  total_species: number;
  total_cultivars: number;
}
```

### Data source

Use existing tables. The query should:

1. Fetch all published `plant_entities` with `display_category` and `taxonomy_node_id`
2. Fetch all published `cultivars` to count per species
3. Fetch `taxonomy_nodes` joined with `taxonomy_ranks` where `rank_name = 'genus'`
4. Fetch active `inventory_offers` to determine stock availability
5. Group species under genus (via `taxonomy_node_id` → genus node), then genus under `display_category`
6. Sort categories by cultivar count desc (matching homepage sort)
7. Sort genera within category by cultivar count desc, then name asc

### Implementation rule

This query runs server-side at page load for the browse page. It does NOT run on every interaction. The taxonomy tree is fetched once and passed to the client explorer as props.

Reuse the same parallel-fetch pattern used in `getAllBrowsePlants()` and `getHomepageCategories()`. Do not create a new Supabase view or materialized view.

---

## 2. GENUS_COMMON_NAMES expansion

### Goal

Every genus in the database should have a common name mapping so the explorer shows human-friendly names, not just botanical Latin.

### Required changes

Modify `lib/genus-names.ts`

### Process

1. Query all distinct genus slugs from `taxonomy_nodes` where rank = genus
2. Compare against current `GENUS_COMMON_NAMES` (currently 9 entries)
3. Add missing entries with appropriate common names
4. For genera where no standard common name exists, use the botanical name as-is

### Rule

Do not invent common names. If a genus doesn't have a well-known common name, use the botanical name. The explorer will show common name first, botanical name second — having the botanical name in both positions is acceptable and better than a made-up label.

---

## 3. Species preview endpoint

### Goal

When a user hovers over a genus in the explorer (or taps on mobile), column 3 populates with species and top cultivars for that genus. This data should be lazy-loaded to keep the initial page payload small.

### Required file

Create `app/api/taxonomy/genus/[genusSlug]/route.ts`

### Response shape

```ts
{
  ok: true,
  data: {
    genus_slug: string;
    genus_name: string;
    common_name: string;
    species: Array<{
      slug: string;
      canonical_name: string;
      botanical_name: string | null;
      zone_min: number | null;
      zone_max: number | null;
      nursery_count: number;
      cultivar_count: number;
      top_cultivars: Array<{
        slug: string;
        name: string;
        lowest_price_cents: number | null;
      }>;
    }>;
  }
}
```

### Implementation

Reuse `getGenusBySlug()` from `lib/queries/genus.ts` as the base, but adapt for a lighter response:

* fetch species in this genus with growing profile data (zone only)
* fetch cultivars per species (limit 5 per species, sorted by availability then name)
* fetch lowest offer price per cultivar
* return lightweight JSON

### Caching

Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` header. Genus data changes slowly.

---

## 4. Browse page: Explore/Refine mode structure

### Goal

The browse page becomes a two-mode interface. Explore is the default for orientation. Refine is the existing filter+grid system for precision.

### Required changes

Modify `app/browse/page.tsx`

### New behavior

1. Fetch taxonomy tree data server-side (parallel with `getAllBrowsePlants`)
2. Pass both `taxonomyTree` and `allPlants` to a new `BrowsePageClient` orchestrator
3. Default mode: `explore` (or read from `?mode=` URL param)
4. Render mode toggle + search bar in a shared header
5. Below the header:
   * `mode=explore` → render `TaxonomyExplorer`
   * `mode=refine` → render existing `BrowseContent`

### URL state

* `?mode=explore` — default, can be omitted
* `?mode=refine` — shows existing filter/grid view
* All existing facet params (`category`, `zoneMin`, etc.) are preserved in refine mode
* Switching from explore to refine preserves any category selection as a filter

### Search behavior

The search bar in the header should:
* On typing + enter → switch to refine mode with `q=` param applied
* Search is always visible regardless of mode

### Required files

* Create `components/browse/BrowsePageClient.tsx` — new client orchestrator that manages mode state and renders either explorer or BrowseContent
* Modify `app/browse/page.tsx` — server component that fetches data and renders BrowsePageClient

### Rules

* `BrowseContent.tsx` must not be modified in a way that breaks its existing behavior
* The mode toggle must be visually lightweight — two segment buttons, not a full tab bar
* The search bar should be the same `SearchBar` component already used, placed above the mode toggle

---

## 5. Desktop taxonomy explorer

### Goal

A three-panel component that shows Categories | Genera | Species+Cultivars with hover-to-preview and click-to-navigate.

### Required files

* Create `components/browse/TaxonomyExplorer.tsx` — main container, manages column selection state
* Create `components/browse/CategoryColumn.tsx` — column 1
* Create `components/browse/GenusColumn.tsx` — column 2
* Create `components/browse/SpeciesPreviewPanel.tsx` — column 3

### Layout

```
┌──────────────┬──────────────────┬───────────────────────────┐
│  Categories  │  Genera          │  Species + Cultivars      │
│  (~200px)    │  (~250px)        │  (remaining width)        │
│              │                  │                           │
│  min-h: 480px, max-h: 600px, internal scroll per column    │
└──────────────┴──────────────────┴───────────────────────────┘
```

Container: `border border-border-subtle rounded-[var(--radius-lg)] bg-surface-primary overflow-hidden`

Use CSS grid: `grid-template-columns: 200px 250px 1fr`

Each column scrolls independently with `overflow-y: auto`.

### Column 1: Categories

Data source: `taxonomyTree.categories` (from props, no fetch needed)

Each row:

```
[3px color accent bar] Category Name
                        X genera · Y species
```

Row height: ~40px. Padding: `10px 16px`.

Active state: left border color changes to category color, light background tint.

Hover behavior: `onMouseEnter` with 150ms debounce timeout sets `activeCategory`. Clear timeout on `onMouseLeave`.

Click behavior: navigate to `/browse?mode=refine&category=<value>` (switches to refine mode filtered to that category).

Category colors: use existing `categoryColors` from `lib/category-colors.ts`.

### Column 2: Genera

Data source: `taxonomyTree.categories[activeIndex].genera` (from props, no fetch needed)

Each row:

```
Common Name                    →
Botanical Name (italic, muted)
X species · Y cultivars [In Stock]
```

Row height: ~52px. Padding: `10px 16px`.

"In Stock" badge: only if `has_stock === true`. Use `bg-accent-light text-accent` pill, `text-[10px]`.

Hover behavior: same 150ms debounce pattern. Sets `activeGenus`.

Click behavior: navigate to `/plants/genus/<slug>`.

If no category is selected, show a centered placeholder: "← Select a category to see its genera"

### Column 3: Species + Cultivar Preview

Data source: **lazy-loaded** from `/api/taxonomy/genus/<slug>` on genus selection.

Show a lightweight spinner or skeleton while loading.

Each species entry:

```
┌─────────────────────────────────────────┐
│ Species Name        Z4-9  3 nurseries   │
│ Botanical name (italic)                 │
│ from $24.50                             │
│ ▾ 5 cultivars                           │
│   'Yamhill'                         →   │
│   'Jefferson'                       →   │
│   'Theta'                           →   │
└─────────────────────────────────────────┘
```

Species entries: compact cards with `border border-border-subtle rounded-lg` inside the panel. Margin: `8px`.

Cultivar sub-list: collapsed by default. Click the "X cultivars" toggle to expand. Each cultivar row is a simple text link.

Zone badge: `bg-surface-inset text-text-secondary text-[10px] rounded-full px-1.5 py-0.5`

Availability badge: `bg-accent-light text-accent text-[10px] rounded-full px-1.5 py-0.5`

Click behavior:
* Click species name → navigate to `/plants/<slug>`
* Click cultivar name → navigate to `/plants/<speciesSlug>/<cultivarSlug>`

If no genus is selected, show a centered placeholder: "← Select a genus to see species and cultivars"

### State management

All three columns' selection state lives in `TaxonomyExplorer`:

```ts
const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
const [activeGenusSlug, setActiveGenusSlug] = useState<string | null>(null);
const [speciesPreview, setSpeciesPreview] = useState<SpeciesPreviewData | null>(null);
const [loadingPreview, setLoadingPreview] = useState(false);
```

When `activeGenusSlug` changes and is non-null, fetch `/api/taxonomy/genus/<slug>`. Cache results in a `Map<string, SpeciesPreviewData>` ref so repeated hovers don't re-fetch.

### Hover intent

Use a `useRef` timer pattern (not `setTimeout` directly in handlers):

```ts
const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleCategoryHover = (index: number) => {
  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  hoverTimerRef.current = setTimeout(() => {
    setActiveCategoryIndex(index);
    setActiveGenusSlug(null);
    setSpeciesPreview(null);
  }, 150);
};
```

Same pattern for genus hover.

On mouse leave of the entire explorer container: clear the timer but do NOT clear selection state. Selections should persist until a new hover overwrites them. This prevents flicker when moving between items.

---

## 6. Mobile drill-down

### Goal

On screens below `lg` (1024px), replace the three-column layout with a stacked drill-down navigation.

### Implementation

Inside `TaxonomyExplorer.tsx`, detect screen width and render a different layout for mobile.

Use a `mobileDepth` state: `0` = categories, `1` = genera, `2` = species/cultivars.

### Structure

```
┌─────────────────────────────┐
│ ← Genera in Nut Trees       │  (header with back button)
│─────────────────────────────│
│ Hazelnuts                    │
│ Corylus · 4 species         │
│─────────────────────────────│
│ Chestnuts                    │
│ Castanea · 3 species        │
│─────────────────────────────│
│ ...                          │
└─────────────────────────────┘
```

Requirements:
* Back button at top when depth > 0
* Tapping a row advances depth
* No hover behavior on mobile
* Same data sources as desktop — categories/genera from props, species from API
* Animate transitions with a simple slide (CSS `transform: translateX`)

### Responsive breakpoint

Use Tailwind's `lg:` breakpoint (1024px). Below that, render mobile layout. Above, render desktop three-column.

Do NOT use JS-based media queries. Use CSS/Tailwind `hidden lg:grid` and `lg:hidden` patterns on the two layout variants within the same component.

---

## Implementation order

### Phase A (data foundation)

1. Audit genus names: query DB for all genus slugs, add missing entries to `GENUS_COMMON_NAMES`
2. Create `lib/queries/taxonomy-tree.ts` with `getTaxonomyTree()` function
3. Create `/api/taxonomy/genus/[genusSlug]/route.ts` for species preview

### Phase B (explore mode MVP)

4. Create `components/browse/BrowsePageClient.tsx` — mode orchestrator
5. Modify `app/browse/page.tsx` — add taxonomy tree fetch, render new client component
6. Create `components/browse/TaxonomyExplorer.tsx` — main explorer with column state
7. Create `components/browse/CategoryColumn.tsx`
8. Create `components/browse/GenusColumn.tsx`
9. Create `components/browse/SpeciesPreviewPanel.tsx`
10. Wire mobile drill-down layout inside `TaxonomyExplorer.tsx`

### Phase C (polish)

11. Hover intent tuning and edge case testing
12. Loading skeleton for column 3
13. Keyboard navigation (arrow keys within focused column)
14. Visual density pass: verify fit in 1024×600 viewport
15. Test all click-through routes work correctly

---

## File plan

### New files

* `lib/queries/taxonomy-tree.ts`
* `app/api/taxonomy/genus/[genusSlug]/route.ts`
* `components/browse/BrowsePageClient.tsx`
* `components/browse/TaxonomyExplorer.tsx`
* `components/browse/CategoryColumn.tsx`
* `components/browse/GenusColumn.tsx`
* `components/browse/SpeciesPreviewPanel.tsx`

### Modified files

* `lib/genus-names.ts` — expand GENUS_COMMON_NAMES
* `app/browse/page.tsx` — add taxonomy tree fetch, render BrowsePageClient instead of BrowseContent directly

### Files NOT modified

* `components/BrowseContent.tsx` — remains untouched, rendered inside BrowsePageClient when mode=refine
* `components/PlantCard.tsx` — no changes
* `components/PlantFilterSidebar.tsx` — no changes
* `lib/queries/browse.ts` — no changes
* `lib/queries/facet-query-builder.ts` — no changes
* `lib/facets/*` — no changes

---

## Technical guardrails

### Schema truth

Use actual DB tables and existing TypeScript types. Do not create new Supabase views or schema changes.

### Type safety

No `any`. No `@ts-ignore`. All API responses must be typed.

### Server/client boundary

* `app/browse/page.tsx` remains a server component. It fetches data.
* `BrowsePageClient.tsx` is a client component. It manages mode state and renders the appropriate sub-component.
* `TaxonomyExplorer` and its sub-components are client components (hover/click state).
* Column 3 species data is fetched client-side via the API route.

### Performance

* Taxonomy tree is fetched once on page load. No client-side re-fetch for columns 1 and 2.
* Column 3 species data is cached in a `Map` ref — subsequent hovers over the same genus reuse cached data.
* API route returns with cache headers for CDN caching.

### URL stability

* `?mode=explore` and `?mode=refine` are the only new URL params
* All existing browse URL params continue to work in refine mode
* Switching from explore to refine can carry over a category selection

### Design system

* Use existing CSS variables from DESIGN_SYSTEM.md: `--radius-lg`, `border-border-subtle`, `bg-surface-primary`, `text-text-primary`, etc.
* Use existing `categoryColors` from `lib/category-colors.ts`
* Do not introduce new color tokens
* Use existing `Text` component for typography where practical
* Explorer should feel like it belongs with the rest of the site — same font, same colors, same spacing conventions

### Density targets

* Categories column: all 11 categories visible without scrolling in 480px height
* Genera column: 8+ genera visible without scrolling
* Species panel: 3+ species with collapsed cultivar lists visible without scrolling
* Total explorer height: 480–600px, not more

---

## Acceptance criteria

### Mode structure

* `/browse` defaults to explore mode with taxonomy explorer visible
* `/browse?mode=refine` shows the existing filter/grid browse experience
* mode toggle is visible and functional
* toggling modes does not lose search query if one was entered
* URL updates to reflect current mode

### Explorer — Categories (column 1)

* all categories from `CATEGORY_OPTIONS` appear as compact rows
* hovering a category (desktop) populates column 2 within 150ms
* clicking a category navigates to `/browse?mode=refine&category=<value>`
* active category shows left border accent in category color

### Explorer — Genera (column 2)

* genera for the selected category appear with common name, botanical name, counts
* hovering a genus (desktop) populates column 3 via API fetch
* clicking a genus navigates to `/plants/genus/<slug>`
* "In Stock" badge appears only for genera with active offers
* placeholder text shows when no category is selected

### Explorer — Species/Cultivars (column 3)

* species for the selected genus appear with name, zone, availability, price
* top cultivars are expandable under each species
* clicking a species navigates to `/plants/<slug>`
* clicking a cultivar navigates to `/plants/<speciesSlug>/<cultivarSlug>`
* loading spinner shows while API data is fetching
* previously-fetched genus data is served from cache

### Search

* search bar remains visible in both modes
* typing and pressing enter switches to refine mode with query applied
* search feels first-class, not buried behind the explorer

### Mobile

* below 1024px, explorer renders as drill-down stack
* tap category → shows genera list with back button
* tap genus → shows species/cultivars with back button
* no hover interactions exist on mobile
* all click-through routes work correctly

### Visual density

* full taxonomy explorer fits in 1024×600 viewport without page scrolling
* the explorer feels calmer and more compact than the current card grid
* no large images in the explorer
* no excessive badges — at most zone + availability per species row

### Architectural integrity

* existing BrowseContent and its entire Sprint 6 filter system work unchanged in refine mode
* no regressions in existing browse, search, or navigation behavior
* all existing tests pass

---

## Testing requirements

### Existing tests

All existing tests must continue passing without modification.

### New tests

Add tests for:

* `getTaxonomyTree()` — returns correct structure, groups correctly, counts accurately
* taxonomy tree genus sort order
* `GENUS_COMMON_NAMES` coverage — every genus slug in tree has an entry
* API route `/api/taxonomy/genus/[genusSlug]` — returns valid response shape
* API route with invalid slug — returns 404

### Manual verification

* first load of `/browse` shows explorer by default
* switching to refine mode shows existing filter/grid
* switching back to explore mode preserves state
* hover category → genera appear
* hover genus → species appear (verify API call in network tab)
* second hover on same genus → no new API call (cache hit)
* click through: category → refine mode with filter; genus → genus page; species → species page; cultivar → cultivar page
* mobile: drill-down works with back navigation
* 1024×600 viewport: explorer fits without scrolling
* all category colors render correctly

---

## Design notes

* Follow the Field Guide visual system already established
* Use warm neutral tones from existing design tokens
* Column borders: `border-border-subtle` (1px solid)
* Column headers: uppercase `text-[11px] font-semibold tracking-wide text-text-tertiary` on `bg-surface-inset` background
* Hover states: light background tint + left border accent, 150ms transition
* The explorer should feel like a calm, structured catalog — not a busy dashboard
* Placeholder states in columns 2 and 3 should use a subtle directional arrow (←) and muted helper text
* Do not add emoji to the UI
* Loading skeleton for column 3: use 3 rectangular shimmer blocks matching the species card layout

---

## Decision rule for coding agents

When making tradeoffs during this sprint:

> Prefer the change that makes catalog structure clearer without adding visual noise.

That means:

* yes to compact text-first layouts
* yes to progressive disclosure via hover/tap
* yes to preserving existing systems as-is
* yes to caching and performance optimization

And:

* no to adding images into the explorer
* no to dense badge/chip/pill decoration on every row
* no to replacing or modifying BrowseContent behavior
* no to new route structures or database schema changes
* no to combining both explore and refine views on screen simultaneously by default
