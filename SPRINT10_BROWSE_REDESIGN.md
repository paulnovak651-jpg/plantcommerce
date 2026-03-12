# Sprint 10: Browse Page — Category Funnel Redesign

*Created 2026-03-11. Target: Three-step browse navigation replacing flat category pills.*

## Goal

Replace the current flat 11-pill category bar with a **three-step progressive funnel** that matches how permaculture buyers actually shop:

**Step 1 → Category Cards** (Nut Trees / Berries / Tree Fruit / Support Species)
**Step 2 → Genus Cards** (Hazelnuts / Chestnuts / Walnuts / etc.)
**Step 3 → Cultivar Grid** (flat list of all cultivars, sortable + filterable)

This eliminates the cognitive overload of 11 simultaneous options, groups plants the way buyers think about them, removes subspecies-level grouping that confuses non-botanists, and introduces a "Support Species" category that signals permaculture literacy to our core audience.

---

## Background & Rationale

### What's wrong with the current browse layout

The current `BrowseHeader.tsx` renders `CATEGORY_OPTIONS` from the facet registry as a horizontal scrolling row of 11 colored pills: Nut Trees, Apples & Crabapples, Berries, Cherries & Plums, Figs, Grapes, Mulberries, Pears, Persimmons, Quinces, Other. Problems:

1. **Too many choices at once.** 11 pills is overwhelming on first visit. The user has to parse all of them before making a decision.
2. **Fruit categories are fragmented.** Apples, Cherries & Plums, Figs, Pears, Persimmons, and Quinces are all separate pills when a permaculture buyer thinks of them as "tree fruit I want in my food forest."
3. **No support species.** Nitrogen fixers like Elaeagnus and Hippophae, which are essential to permaculture system design, have nowhere natural to live.
4. **Genus→cultivar jump is abrupt.** Clicking "Nut Trees" dumps you into a flat cultivar list or genus-grouped view, with no intermediate "which kind of nut?" step.

### The new funnel

The three-step approach: 4 categories → genus cards → cultivar grid. Each step reduces the decision space. The sidebar filters (zone, sun, growth rate, etc.) remain available at every level.

---

## New Category Taxonomy

### Top-Level Categories (4)

| Category | Description | Color Token |
|----------|-------------|-------------|
| **Nut Trees** | All nut-producing trees and shrubs | `#5C4033` (existing brown) |
| **Berries** | Small fruit — shrubs, canes, vines, and berry-producing species | `#7B1FA2` (existing purple) |
| **Tree Fruit** | Standard and semi-dwarf fruit trees | `#558B2F` (existing green) |
| **Support Species** | Nitrogen fixers, wildlife corridor, chop-and-drop biomass, system plants | `#2d6a4f` (existing default green) |

### Genus Mapping per Category

**Nut Trees →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Hazelnuts | Corylus | All cultivars — no subspecies split |
| Chestnuts | Castanea | All cultivars |
| Walnuts | Juglans | All cultivars |
| Hickories & Pecans | Carya | All cultivars |
| Oaks | Quercus | Acorn-bearing species relevant to permaculture |
| Chilean Hazelnut | Gevuina | Single-species genus |

**Berries →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Blueberries | Vaccinium | All cultivars |
| Elderberries | Sambucus | All cultivars |
| Brambles | Rubus | Raspberries, blackberries, etc. |
| Grapes | Vitis | Moved here from standalone category |
| Mulberries | Morus | Moved here — buyers shop these alongside berries |
| Goumi | Elaeagnus | Fruiting varieties only (E. multiflora, etc.) |
| Sea Buckthorn | Hippophae | **Dual-listed** — also in Support Species. Fruiting varieties. |

**Tree Fruit →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Apples | Malus | Absorbs "Apples & Crabapples" category |
| Pears | Pyrus | Absorbs "Pears" category |
| Persimmons | Diospyros | American + Asian — no subspecies split |
| Pawpaws | Asimina | All cultivars |
| Cherries & Plums | Prunus | Absorbs "Cherries & Plums" category |
| Figs | Ficus | Absorbs "Figs" category |
| Kiwifruit | Actinidia | Hardy kiwi + fuzzy kiwi |

**Support Species →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Autumn Olive / Silverberry | Elaeagnus | N-fixing varieties (E. umbellata, E. angustifolia) |
| Sea Buckthorn | Hippophae | **Dual-listed** — also in Berries. N-fixing + fruit. |
| Alders | Alnus | Primary N-fixing tree genus |
| Hackberries | Celtis | Wildlife corridor, hardy understory |

### Dual-Category Species Rule

Some genera span categories based on the use case. The rule is:

- Assignment is at the **species or cultivar level**, not the genus level
- A genus card can appear in multiple categories if different species serve different purposes
- The `display_category` field on the cultivar/species record determines which category it appears in
- If a species is dual-listed (e.g., sea buckthorn), it appears as a genus card in BOTH categories
- Clicking "Sea Buckthorn" under Berries or under Support Species leads to the same cultivar list

**Implementation:** Add a `browse_categories` text array column (or use the existing `display_category` with a new mapping config) so a single species can resolve to multiple top-level categories. The genus card query filters by category, so the same genus can appear under Berries and Support Species with the appropriate species scoped to each.

---

## UI Design Specification

### Step 1: Category Selection (Landing State)

When no category is selected, the browse page shows 4 large cards in a 2×2 grid (desktop) or stacked column (mobile).

```
+----------------------------+----------------------------+
|                            |                            |
|        🌰 Nut Trees        |       🫐 Berries           |
|                            |                            |
+----------------------------+----------------------------+
|                            |                            |
|       🍎 Tree Fruit        |      🌿 Support Species    |
|                            |                            |
+----------------------------+----------------------------+
```

**Card design:**
- Container: `Surface` component with `elevation="raised"` — `rounded-[var(--radius-xl)]`
- Size: min-height `160px` on desktop, `120px` on mobile
- Background: Subtle gradient using the category color (10% opacity) over `bg-surface-raised`
- Left accent: 4px left border in the category color
- Icon: Emoji or lucide icon, `text-3xl`, positioned top-left or centered
- Title: `font-serif text-xl font-semibold` — just the category name, nothing else
- Hover: `scale-[1.02] shadow-lg` transition, category color border brightens
- Click: Sets `selectedCategory` state, triggers Step 2 transition
- Cursor: `cursor-pointer`
- Grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`

**Icons per category:**
- Nut Trees: 🌰 or `<TreeDeciduous />` from lucide
- Berries: 🫐 or `<Cherry />` from lucide  
- Tree Fruit: 🍎 or `<Apple />` from lucide
- Support Species: 🌿 or `<Leaf />` from lucide

### Step 2: Genus Cards (Within Selected Category)

After selecting a category, a back-navigation breadcrumb appears and the area fills with genus cards.

**Back navigation:**
```
← All Categories  /  Nut Trees
```
- "← All Categories" is a clickable link that clears the category selection (returns to Step 1)
- Current category name shown after the divider
- Style: `text-sm text-text-tertiary hover:text-accent` on the link

**Genus card grid:**
```
+------------------+------------------+------------------+
|   🌰 Hazelnuts   |  🌰 Chestnuts    |   🌰 Walnuts    |
|   12 cultivars   |   8 cultivars    |   6 cultivars   |
|   3 nurseries    |   2 nurseries    |   4 nurseries   |
+------------------+------------------+------------------+
|  🌰 Hickories    |    🌰 Oaks       | 🌰 Chilean      |
|  & Pecans        |   4 cultivars    |   Hazelnut      |
|  10 cultivars    |   1 nursery      |   2 cultivars   |
+------------------+------------------+------------------+
```

**Genus card design:**
- Container: `Surface` with `elevation="default"` — `rounded-[var(--radius-lg)]`
- Size: min-height `100px`
- Left accent: 3px left border in the parent category color
- Title: `font-serif text-base font-semibold` — common name
- Subtitle: `text-xs text-text-tertiary italic` — botanical genus name
- Stats line: `text-xs text-text-secondary` — "{N} cultivars · {N} nurseries"
- Hover: `shadow-md` transition, slight scale
- Click: Filters the browse grid to show only cultivars in this genus (Step 3)
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`

**Data source for counts:** Query from the existing browse API — count distinct cultivar IDs and distinct nursery IDs per genus, filtered by the selected category. This can be computed client-side from the `allPlants` prop if the dataset is small enough, or via a lightweight API endpoint.

### Step 3: Cultivar Grid (Within Selected Genus)

**Back navigation (extended breadcrumb):**
```
← All Categories  /  Nut Trees  /  Hazelnuts
```
- "← All Categories" clears everything back to Step 1
- "Nut Trees" navigates back to Step 2 (genus cards for that category)
- "Hazelnuts" is the current non-linked label

**Cultivar grid:** This is the existing `BrowseGrid` component in species-view mode, but now scoped to a single genus. The sidebar filters remain fully active. Sort bar, search bar, and pagination all work as today.

**Key change:** The Species/Genus toggle in the current `BrowseHeader` is **removed** from this view. The user has already narrowed to a genus via the funnel. The cultivar cards are always shown flat (no genus grouping needed when you're already inside one genus).

---

## State Machine

The browse page has three mutually exclusive states:

```
CATEGORY_SELECT  →  GENUS_SELECT  →  CULTIVAR_BROWSE
   (Step 1)          (Step 2)          (Step 3)
```

**State variables (in BrowseContent):**

```typescript
// New state for funnel navigation
const [browseStep, setBrowseStep] = useState<'categories' | 'genera' | 'cultivars'>('categories');
const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null);
const [selectedGenus, setSelectedGenus] = useState<string | null>(null);
```

**Transitions:**
- **Step 1 → Step 2:** User clicks a category card. Sets `selectedTopCategory`, advances to `'genera'`.
- **Step 2 → Step 3:** User clicks a genus card. Sets `selectedGenus`, applies the genus as a facet filter, advances to `'cultivars'`.
- **Step 3 → Step 2:** User clicks the category name in the breadcrumb. Clears `selectedGenus`, returns to `'genera'`.
- **Step 2 → Step 1:** User clicks "All Categories" in breadcrumb. Clears `selectedTopCategory`, returns to `'categories'`.
- **Step 3 → Step 1:** User clicks "All Categories" in breadcrumb. Clears both, returns to `'categories'`.

**URL sync:** Encode the funnel state in URL params for shareability and back-button support:
- Step 1: `/browse` (no params)
- Step 2: `/browse?cat=nut-trees`
- Step 3: `/browse?cat=nut-trees&genus=corylus`

---

## Data Model Changes

### New: Top-Category Configuration

Create a new config file rather than a DB migration (this is UI taxonomy, not schema):

**New file: `lib/browse-categories.ts`**

```typescript
export interface TopCategory {
  slug: string;          // URL param value: 'nut-trees', 'berries', etc.
  label: string;         // Display name: 'Nut Trees', 'Berries', etc.
  icon: string;          // Emoji or lucide icon name
  color: string;         // Hex color for accents
  description: string;   // Short description for accessibility / tooltips
  genera: GenusEntry[];  // Ordered list of genus cards to show
}

export interface GenusEntry {
  genusSlug: string;     // Matches genus-names key: 'corylus', 'castanea', etc.
  commonName: string;    // Card title: 'Hazelnuts', 'Chestnuts', etc.
  botanicalName: string; // Italic subtitle: 'Corylus', 'Castanea', etc.
}

export const TOP_CATEGORIES: TopCategory[] = [
  {
    slug: 'nut-trees',
    label: 'Nut Trees',
    icon: '🌰',
    color: '#5C4033',
    description: 'Pecans, hazelnuts, chestnuts, walnuts and more',
    genera: [
      { genusSlug: 'corylus', commonName: 'Hazelnuts', botanicalName: 'Corylus' },
      { genusSlug: 'castanea', commonName: 'Chestnuts', botanicalName: 'Castanea' },
      { genusSlug: 'juglans', commonName: 'Walnuts', botanicalName: 'Juglans' },
      { genusSlug: 'carya', commonName: 'Hickories & Pecans', botanicalName: 'Carya' },
      { genusSlug: 'quercus', commonName: 'Oaks', botanicalName: 'Quercus' },
      { genusSlug: 'gevuina', commonName: 'Chilean Hazelnut', botanicalName: 'Gevuina' },
    ],
  },
  {
    slug: 'berries',
    label: 'Berries',
    icon: '🫐',
    color: '#7B1FA2',
    description: 'Blueberries, elderberries, brambles, goumi and more',
    genera: [
      { genusSlug: 'vaccinium', commonName: 'Blueberries', botanicalName: 'Vaccinium' },
      { genusSlug: 'sambucus', commonName: 'Elderberries', botanicalName: 'Sambucus' },
      { genusSlug: 'rubus', commonName: 'Brambles', botanicalName: 'Rubus' },
      { genusSlug: 'vitis', commonName: 'Grapes', botanicalName: 'Vitis' },
      { genusSlug: 'morus', commonName: 'Mulberries', botanicalName: 'Morus' },
      { genusSlug: 'elaeagnus', commonName: 'Goumi', botanicalName: 'Elaeagnus' },
      { genusSlug: 'hippophae', commonName: 'Sea Buckthorn', botanicalName: 'Hippophae' },
    ],
  },
  {
    slug: 'tree-fruit',
    label: 'Tree Fruit',
    icon: '🍎',
    color: '#558B2F',
    description: 'Apples, pears, persimmons, pawpaws and more',
    genera: [
      { genusSlug: 'malus', commonName: 'Apples', botanicalName: 'Malus' },
      { genusSlug: 'pyrus', commonName: 'Pears', botanicalName: 'Pyrus' },
      { genusSlug: 'diospyros', commonName: 'Persimmons', botanicalName: 'Diospyros' },
      { genusSlug: 'asimina', commonName: 'Pawpaws', botanicalName: 'Asimina' },
      { genusSlug: 'prunus', commonName: 'Cherries & Plums', botanicalName: 'Prunus' },
      { genusSlug: 'ficus', commonName: 'Figs', botanicalName: 'Ficus' },
      { genusSlug: 'actinidia', commonName: 'Kiwifruit', botanicalName: 'Actinidia' },
    ],
  },
  {
    slug: 'support-species',
    label: 'Support Species',
    icon: '🌿',
    color: '#2d6a4f',
    description: 'Nitrogen fixers, wildlife corridor, and system plants',
    genera: [
      { genusSlug: 'elaeagnus', commonName: 'Autumn Olive & Silverberry', botanicalName: 'Elaeagnus' },
      { genusSlug: 'hippophae', commonName: 'Sea Buckthorn', botanicalName: 'Hippophae' },
      { genusSlug: 'alnus', commonName: 'Alders', botanicalName: 'Alnus' },
      { genusSlug: 'celtis', commonName: 'Hackberries', botanicalName: 'Celtis' },
    ],
  },
];

/** Lookup a top category by slug. */
export function getTopCategory(slug: string): TopCategory | undefined {
  return TOP_CATEGORIES.find((c) => c.slug === slug);
}

/** Find all top categories containing a given genus. */
export function getCategoriesForGenus(genusSlug: string): TopCategory[] {
  return TOP_CATEGORIES.filter((c) =>
    c.genera.some((g) => g.genusSlug === genusSlug)
  );
}
```

### Update: CATEGORY_OPTIONS in Facet Registry

The old `CATEGORY_OPTIONS` in `lib/facets/registry.ts` listed 11 values matching `display_category` in the database. These need to be **mapped** to the new 4 top-level categories for the browse funnel, but the underlying `display_category` values in the DB do NOT need to change immediately. The mapping is:

```typescript
// Old display_category → New top category
const CATEGORY_MAPPING: Record<string, string> = {
  'Nut Trees': 'nut-trees',
  'Apples & Crabapples': 'tree-fruit',
  'Berries': 'berries',
  'Cherries & Plums': 'tree-fruit',
  'Figs': 'tree-fruit',
  'Grapes': 'berries',
  'Mulberries': 'berries',
  'Pears': 'tree-fruit',
  'Persimmons': 'tree-fruit',
  'Quinces': 'tree-fruit',
  'Other': 'support-species',
};
```

The existing `CATEGORY_OPTIONS` and `display_category` field stay intact — the new browse-categories config is a **UI layer on top**. The facet sidebar continues to work with the existing values; it just gets hidden during Steps 1 and 2 (it only appears at Step 3 when we're in the cultivar grid).

---

## Implementation Tasks

### Phase 1: Config & Data Layer

#### Task 1.1: Create `lib/browse-categories.ts`
- Create the config file with the `TopCategory` interface and `TOP_CATEGORIES` array as specified above
- Export the `getTopCategory()` and `getCategoriesForGenus()` helpers
- This file is pure config — no DB changes needed

#### Task 1.2: Create genus count helper
- Create `lib/queries/genus-counts.ts`
- Export a function `getGenusCounts(plants: BrowsePlant[]): Record<string, { cultivarCount: number; nurseryCount: number }>`
- This function aggregates the `allPlants` array by genus slug, counting distinct cultivar IDs and distinct nurseries
- Used by genus cards to display "{N} cultivars · {N} nurseries"

### Phase 2: New Browse Components

#### Task 2.1: Create `components/browse/CategoryCards.tsx`
- Renders the 4 top-level category cards in a 2×2 grid
- Props: `onCategorySelect: (slug: string) => void`
- Imports `TOP_CATEGORIES` from `lib/browse-categories`
- Each card is a clickable `Surface` with the category icon, name, and left accent border
- Follows the card design spec from the UI section above
- Hover animation: `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`
- Mobile: Stack to single column below `sm` breakpoint

#### Task 2.2: Create `components/browse/GenusCards.tsx`
- Renders genus cards for a given top category
- Props: `category: TopCategory`, `genusCounts: Record<string, { cultivarCount: number; nurseryCount: number }>`, `onGenusSelect: (genusSlug: string) => void`
- Each card shows: common name, botanical name (italic), cultivar count, nursery count
- Left accent border in parent category color
- 3-column grid on desktop, 2 on tablet, 1 on mobile
- If a genus has 0 cultivars in the data, show the card with "Coming soon" instead of counts (dimmed but visible — signals to users that more genera are planned)

#### Task 2.3: Create `components/browse/BrowseBreadcrumb.tsx`
- Progressive breadcrumb: All Categories → Category Name → Genus Name
- Each segment is clickable except the current (last) one
- Props: `step: 'categories' | 'genera' | 'cultivars'`, `categoryLabel?: string`, `genusLabel?: string`, `onNavigate: (step: 'categories' | 'genera') => void`
- Style: `text-sm flex items-center gap-1.5`
- Uses `←` arrow or lucide `ChevronLeft` icon before "All Categories"

### Phase 3: Rewire BrowseContent Orchestrator

#### Task 3.1: Add funnel state to `BrowseContent.tsx`
- Add `browseStep`, `selectedTopCategory`, `selectedGenus` state variables
- Initialize from URL params if present (`cat` and `genus` params)
- Sync state to URL on change (same `replaceState` pattern as existing facet URL sync)

#### Task 3.2: Conditional rendering by step
- **Step 1 (categories):** Render `CategoryCards` instead of the current `BrowseHeader` + `BrowseGrid`. Hide the sidebar.
- **Step 2 (genera):** Render `BrowseBreadcrumb` + `GenusCards` for the selected category. Hide the sidebar. Show a search bar scoped to genus names (optional — can be Phase 4).
- **Step 3 (cultivars):** Render `BrowseBreadcrumb` + existing `BrowseHeader` (minus the category pills and genus toggle) + `BrowseGrid`. Show the sidebar. Apply genus as a filter on the browse query.

#### Task 3.3: Update `BrowseHeader.tsx` for Step 3 mode
- When in Step 3 (genus selected), hide the category pill row entirely — the breadcrumb handles navigation now
- Remove the Species/Genus toggle — the user has already chosen a genus, so the grid is always flat cultivar cards
- Keep: search bar, sort bar, result count

#### Task 3.4: Wire genus filter into browse API
- When `selectedGenus` is set, add it as a filter parameter to the `/api/browse` call
- The API already supports filtering by genus via the facet system — this may just require setting the appropriate facet state value
- Alternatively, add a `genus` URL param to the API route that filters `WHERE genus_name = $1`

### Phase 4: Polish & Edge Cases

#### Task 4.1: Animate transitions between steps
- Use CSS transitions or a simple fade when switching between steps
- Consider `opacity` + `transform` transition for a smooth feel
- Keep it subtle — 200ms is enough

#### Task 4.2: Back button support
- URL params (`cat`, `genus`) enable browser back/forward to work correctly
- Listen for `popstate` events and update the funnel state accordingly
- Test: Navigate Step 1 → Step 2 → Step 3, then press browser Back twice — should return to Step 1

#### Task 4.3: Direct URL access
- `/browse?cat=berries` should land on Step 2 with Berries genus cards
- `/browse?cat=nut-trees&genus=corylus` should land on Step 3 with Hazelnut cultivars
- Handle invalid slugs gracefully — fall back to Step 1

#### Task 4.4: Empty state for genera with no data yet
- Some genera (Rubus, Actinidia, Alnus, Celtis, etc.) may have 0 cultivars in the database
- Show the genus card with a "Coming Soon" badge and dimmed styling
- Clicking it shows an empty state: "We're building our {genus common name} database. Check back soon or sign up for alerts."
- Do NOT hide genera with no data — showing them communicates the platform's planned scope

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `lib/browse-categories.ts` | **Create** | Top-level category config, genus mappings, helpers |
| `lib/queries/genus-counts.ts` | **Create** | Genus aggregation helper for card counts |
| `components/browse/CategoryCards.tsx` | **Create** | Step 1: Four category cards |
| `components/browse/GenusCards.tsx` | **Create** | Step 2: Genus cards within a category |
| `components/browse/BrowseBreadcrumb.tsx` | **Create** | Progressive breadcrumb nav for funnel steps |
| `components/BrowseContent.tsx` | **Edit** | Add funnel state, conditional rendering by step |
| `components/browse/BrowseHeader.tsx` | **Edit** | Remove category pills + genus toggle when in Step 3 |
| `lib/facets/registry.ts` | **No change** | Existing CATEGORY_OPTIONS preserved — new config is a UI layer on top |
| `lib/category-colors.ts` | **No change** | Existing colors reused by new components |
| `lib/genus-names.ts` | **No change** | Existing genus names reused by new components |

---

## Migration Notes

### What gets removed
- The 11-pill horizontal category bar in `BrowseHeader` (replaced by Step 1 cards)
- The Species/Genus toggle button group (no longer needed — the funnel handles this)
- The `CategoryContext` component usage at the top of `BrowseContent` (replaced by breadcrumb)

### What stays the same
- All sidebar facet filters (zone, sun, growth rate, etc.) — visible in Step 3
- The search bar — visible in Step 3 (and optionally Step 2 for genus search)
- Sort bar and pagination — visible in Step 3
- `PlantCard` component — unchanged
- `BrowseGrid` component — unchanged, used in Step 3
- All existing facet state logic, URL serialization, and API calls — unchanged
- The browse API endpoint — unchanged (or minimal addition of genus filter)

### What's new
- 4 top-level category cards (Step 1)
- Genus cards with live counts (Step 2)
- Three-step breadcrumb navigation
- URL params for funnel state (`cat`, `genus`)
- `lib/browse-categories.ts` config (single source of truth for category→genus mapping)

---

## Testing Checklist

### Funnel Navigation
- [ ] Step 1 shows 4 category cards on fresh `/browse` load
- [ ] Clicking a category card transitions to Step 2 with correct genus cards
- [ ] Clicking a genus card transitions to Step 3 with correct cultivar grid
- [ ] Breadcrumb "← All Categories" returns to Step 1 from Step 2
- [ ] Breadcrumb "← All Categories" returns to Step 1 from Step 3
- [ ] Breadcrumb category name returns to Step 2 from Step 3
- [ ] Browser back button navigates steps correctly
- [ ] Browser forward button navigates steps correctly
- [ ] Direct URL `/browse?cat=berries` lands on Step 2
- [ ] Direct URL `/browse?cat=nut-trees&genus=corylus` lands on Step 3
- [ ] Invalid `cat` param falls back to Step 1
- [ ] Invalid `genus` param falls back to Step 2 for the selected category

### Category Cards (Step 1)
- [ ] All 4 categories display with correct icon, name, and color accent
- [ ] Hover animation works (scale + shadow)
- [ ] 2×2 grid on desktop, single column on mobile
- [ ] Cards are keyboard accessible (focusable, Enter to select)

### Genus Cards (Step 2)
- [ ] Correct genera display for each category
- [ ] Cultivar count and nursery count are accurate
- [ ] Genera with 0 cultivars show "Coming Soon" badge
- [ ] Sea Buckthorn appears under both Berries and Support Species
- [ ] Goumi (Elaeagnus) appears under Berries
- [ ] Autumn Olive (Elaeagnus) appears under Support Species
- [ ] 3-column grid on desktop, 2 on tablet, 1 on mobile

### Cultivar Grid (Step 3)
- [ ] Cultivars are correctly filtered to selected genus only
- [ ] Sidebar filters (zone, sun, etc.) work within genus scope
- [ ] Search bar works within genus scope
- [ ] Sort bar works
- [ ] Pagination works
- [ ] Category pills are NOT shown (breadcrumb handles navigation)
- [ ] Species/Genus toggle is NOT shown

### Mobile (test at 375px)
- [ ] Category cards stack vertically and are tappable
- [ ] Genus cards stack to single column
- [ ] Breadcrumb text doesn't overflow
- [ ] No horizontal scrollbar on page body at any step

### No Regressions
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Existing cultivar detail pages still accessible from browse grid
- [ ] Zone persistence still works (auto-fills zone filter in Step 3)
- [ ] Facet URL serialization still works in Step 3

---

## Design Reference

**Color tokens (from `globals.css` / `category-colors.ts`):**
- Nut Trees: `#5C4033`
- Berries: `#7B1FA2`
- Tree Fruit: `#558B2F`
- Support Species: `#2d6a4f`
- Card surface: `var(--color-surface-raised)`
- Card border: `var(--color-border)`
- Hover shadow: `shadow-lg` utility

**Typography:**
- Category card title: `font-serif text-xl font-semibold text-text-primary`
- Genus card title: `font-serif text-base font-semibold text-text-primary`
- Genus botanical name: `text-xs text-text-tertiary italic`
- Genus stats: `text-xs text-text-secondary`
- Breadcrumb: `text-sm text-text-tertiary` / `hover:text-accent` for links

**Existing components to reuse:**
- `Surface` for all card containers
- `Text` for typography (if used elsewhere in the codebase)
- `EmptyState` for genera with no cultivars

---

## Not In Scope (Future Sprints)

- **Product form filter** (seeds / cuttings / bare root / potted) — requires nursery data tagging work first. Will be added as a filter toggle at Step 3 once scraper data consistently captures product form.
- **Category-level hero images** — need image pipeline. Cards use icons for now.
- **Genus-level hero images** — same dependency.
- **Search across all steps** — global search that auto-navigates to the right funnel step. Current search only works within Step 3.
- **Quinces** — no genus entry yet (Cydonia). Will be added to Tree Fruit when cultivar data is seeded.
- **Ribes (currants/gooseberries)** — identified in audit as missing. Will be added to Berries when data is seeded.
- **Aronia (chokeberries)** — another future Berries addition.
