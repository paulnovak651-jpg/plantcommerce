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
| Autumn Olive & Silverberry | Elaeagnus | N-fixing varieties (E. umbellata, E. angustifolia) |
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

### Layout Principle: Vertical Stack

**CRITICAL:** All layout at every step is a **single-column vertical stack**. No 2×2 grids, no multi-column card layouts. Category cards, genus cards, and cultivar cards all stack vertically in a single column, full width. This matches the existing browse page layout and maintains consistency across the site.

The existing interaction patterns are preserved:
- **Desktop:** Hover over a card to reveal detail / expand, click to navigate
- **Mobile:** Tap to reveal detail / navigate (no hover available)

### Step 1: Category Selection (Landing State)

When no category is selected, the browse page shows 4 full-width cards stacked vertically.

```
+----------------------------------------------------------+
|  🌰  Nut Trees                                           |
+----------------------------------------------------------+
|  🫐  Berries                                              |
+----------------------------------------------------------+
|  🍎  Tree Fruit                                           |
+----------------------------------------------------------+
|  🌿  Support Species                                      |
+----------------------------------------------------------+
```

**Card design:**
- Container: `Surface` component with `elevation="raised"` — `rounded-[var(--radius-xl)]`
- Layout: **Full-width, single column** — `flex flex-col gap-3` or `gap-4`
- Size: min-height `80px` per card — enough for the icon + title row to breathe
- Background: `bg-surface-raised` with a subtle left accent border (4px) in the category color
- Icon: Emoji or lucide icon, `text-2xl`, inline left of the title
- Title: `font-serif text-lg font-semibold` — just the category name, nothing else
- **Desktop hover:** Card expands or reveals a subtitle showing the genus names within (e.g., "Hazelnuts · Chestnuts · Walnuts · Hickories & Pecans · Oaks · Chilean Hazelnut"). Use a smooth height transition or opacity reveal. This gives the user a preview before committing to a click.
- **Mobile tap:** Tap navigates directly to Step 2 (no hover preview available on touch)
- Click: Sets `selectedTopCategory` state, triggers Step 2 transition
- Cursor: `cursor-pointer`

**Desktop hover reveal detail:**
```typescript
// On hover, show genera list beneath the title
<div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-20">
  <p className="text-sm text-text-secondary pt-1">
    Hazelnuts · Chestnuts · Walnuts · Hickories & Pecans · Oaks · Chilean Hazelnut
  </p>
</div>
```

**Icons per category:**
- Nut Trees: 🌰 or `<TreeDeciduous />` from lucide
- Berries: 🫐 or `<Cherry />` from lucide
- Tree Fruit: 🍎 or `<Apple />` from lucide
- Support Species: 🌿 or `<Leaf />` from lucide

### Step 2: Genus Cards (Within Selected Category)

After selecting a category, a back-navigation breadcrumb appears and genus cards fill the area — **stacked vertically, full-width, single column**.

**Back navigation:**
```
← All Categories  /  Nut Trees
```
- "← All Categories" is a clickable link that clears the category selection (returns to Step 1)
- Current category name shown after the divider
- Style: `text-sm text-text-tertiary hover:text-accent` on the link

**Genus card stack:**
```
← All Categories  /  Nut Trees

+----------------------------------------------------------+
|  Hazelnuts                                                |
|  Corylus · 12 cultivars · 3 nurseries                    |
+----------------------------------------------------------+
|  Chestnuts                                                |
|  Castanea · 8 cultivars · 2 nurseries                    |
+----------------------------------------------------------+
|  Walnuts                                                  |
|  Juglans · 6 cultivars · 4 nurseries                     |
+----------------------------------------------------------+
|  Hickories & Pecans                                       |
|  Carya · 10 cultivars · 3 nurseries                      |
+----------------------------------------------------------+
|  Oaks                                                     |
|  Quercus · 4 cultivars · 1 nursery                       |
+----------------------------------------------------------+
|  Chilean Hazelnut                                         |
|  Gevuina · 2 cultivars · 1 nursery                       |
+----------------------------------------------------------+
```

**Genus card design:**
- Container: `Surface` with `elevation="default"` — `rounded-[var(--radius-lg)]`
- Layout: **Full-width, single column** — `flex flex-col gap-3`
- Left accent: 3px left border in the parent category color
- Title row: Common name in `font-serif text-base font-semibold text-text-primary`
- Detail row: `text-xs text-text-tertiary` — botanical name (italic) · cultivar count · nursery count
- **Desktop hover:** Card reveals additional info — a short description or key species list. Same `max-h` transition pattern as Step 1 cards.
- **Mobile tap:** Navigates directly to Step 3
- Click: Filters the browse grid to show only cultivars in this genus (Step 3)
- If a genus has 0 cultivars, show "Coming Soon" badge — dimmed but visible

**Data source for counts:** Query from the existing browse API — count distinct cultivar IDs and distinct nursery IDs per genus, filtered by the selected category. This can be computed client-side from the `allPlants` prop if the dataset is small enough, or via a lightweight API endpoint.

### Step 3: Cultivar Grid (Within Selected Genus)

**Back navigation (extended breadcrumb):**
```
← All Categories  /  Nut Trees  /  Hazelnuts
```
- "← All Categories" clears everything back to Step 1
- "Nut Trees" navigates back to Step 2 (genus cards for that category)
- "Hazelnuts" is the current non-linked label

**Cultivar grid:** This is the existing `BrowseGrid` component in species-view mode, but now scoped to a single genus. The sidebar filters remain fully active. Sort bar, search bar, and pagination all work as today. **The existing vertical layout of the cultivar grid is completely preserved** — no layout changes to this step beyond scoping to the selected genus.

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

## Interaction Patterns

### Desktop: Hover to Preview, Click to Navigate

On desktop, hovering a card (category or genus) reveals additional detail inline — expanding smoothly via a CSS height/opacity transition. Clicking navigates to the next funnel step. This lets users preview what's inside each option before committing.

**Implementation pattern (same for both category and genus cards):**
```tsx
<div className="group cursor-pointer" onClick={handleClick}>
  <Surface elevation="raised" className="...">
    {/* Always visible */}
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-serif text-lg font-semibold">{label}</h3>
    </div>

    {/* Revealed on hover (desktop) */}
    <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100">
      <p className="text-sm text-text-secondary pt-2">
        {hoverDetailText}
      </p>
    </div>
  </Surface>
</div>
```

### Mobile: Tap to Navigate

On mobile (touch devices), there is no hover state. Tapping a card navigates directly to the next step. The hover-reveal detail is not shown — mobile users discover what's inside by tapping through. This keeps the mobile experience fast and direct.

No special mobile detection is needed — the CSS `group-hover` pattern naturally doesn't trigger on touch devices, so the reveal stays hidden and the tap event fires the click handler.

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
- Renders the 4 top-level category cards in a **single-column vertical stack**
- Layout: `flex flex-col gap-3` — NO grid, NO multi-column
- Props: `onCategorySelect: (slug: string) => void`
- Imports `TOP_CATEGORIES` from `lib/browse-categories`
- Each card is a clickable `Surface` with the category icon and name
- Desktop hover reveals the genera list text (CSS `group-hover:max-h` transition)
- Mobile tap navigates directly
- Full-width cards, left accent border in category color

#### Task 2.2: Create `components/browse/GenusCards.tsx`
- Renders genus cards for a given top category in a **single-column vertical stack**
- Layout: `flex flex-col gap-3` — NO grid, NO multi-column
- Props: `category: TopCategory`, `genusCounts: Record<string, { cultivarCount: number; nurseryCount: number }>`, `onGenusSelect: (genusSlug: string) => void`
- Each card shows: common name, botanical name (italic), cultivar count, nursery count
- Left accent border in parent category color
- Desktop hover reveals additional detail (description or key species)
- Mobile tap navigates directly
- If a genus has 0 cultivars in the data, show the card with "Coming Soon" badge (dimmed but visible)

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
- **Step 2 (genera):** Render `BrowseBreadcrumb` + `GenusCards` for the selected category. Hide the sidebar.
- **Step 3 (cultivars):** Render `BrowseBreadcrumb` + existing `BrowseHeader` (minus the category pills and genus toggle) + `BrowseGrid`. Show the sidebar. Apply genus as a filter on the browse query.

#### Task 3.3: Update `BrowseHeader.tsx` for Step 3 mode
- When in Step 3 (genus selected), hide the category pill row entirely — the breadcrumb handles navigation now
- Remove the Species/Genus toggle — the user has already chosen a genus, so the grid is always flat cultivar cards
- Keep: search bar, sort bar, result count
- **Preserve all existing layout patterns** — the cultivar grid step should look and feel exactly like the current browse page, just scoped to one genus

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
| `components/browse/CategoryCards.tsx` | **Create** | Step 1: Four category cards, vertical stack, hover reveal |
| `components/browse/GenusCards.tsx` | **Create** | Step 2: Genus cards within a category, vertical stack, hover reveal |
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
- The search bar — visible in Step 3
- Sort bar and pagination — visible in Step 3
- `PlantCard` component — unchanged
- `BrowseGrid` component — unchanged, used in Step 3
- All existing facet state logic, URL serialization, and API calls — unchanged
- The browse API endpoint — unchanged (or minimal addition of genus filter)
- **The overall vertical layout pattern of the page** — all steps stack vertically

### What's new
- 4 top-level category cards with hover-reveal (Step 1)
- Genus cards with live counts and hover-reveal (Step 2)
- Three-step breadcrumb navigation
- URL params for funnel state (`cat`, `genus`)
- `lib/browse-categories.ts` config (single source of truth for category→genus mapping)

---

## Testing Checklist

### Funnel Navigation
- [ ] Step 1 shows 4 category cards stacked vertically on fresh `/browse` load
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
- [ ] Cards are full-width, stacked vertically — NO multi-column grid
- [ ] Desktop: Hovering reveals genera list text with smooth transition
- [ ] Mobile: Tap navigates directly to Step 2 (no hover state)
- [ ] Cards are keyboard accessible (focusable, Enter to select)

### Genus Cards (Step 2)
- [ ] Correct genera display for each category
- [ ] Cards are full-width, stacked vertically — NO multi-column grid
- [ ] Cultivar count and nursery count are accurate
- [ ] Genera with 0 cultivars show "Coming Soon" badge
- [ ] Sea Buckthorn appears under both Berries and Support Species
- [ ] Goumi (Elaeagnus) appears under Berries
- [ ] Autumn Olive (Elaeagnus) appears under Support Species
- [ ] Desktop: Hovering reveals additional detail with smooth transition
- [ ] Mobile: Tap navigates directly to Step 3 (no hover state)

### Cultivar Grid (Step 3)
- [ ] Cultivars are correctly filtered to selected genus only
- [ ] Sidebar filters (zone, sun, etc.) work within genus scope
- [ ] Search bar works within genus scope
- [ ] Sort bar works
- [ ] Pagination works
- [ ] Category pills are NOT shown (breadcrumb handles navigation)
- [ ] Species/Genus toggle is NOT shown
- [ ] Layout matches existing browse page layout exactly (vertical stack)

### Mobile (test at 375px)
- [ ] Category cards stack vertically and are tappable
- [ ] Genus cards stack vertically and are tappable
- [ ] Breadcrumb text doesn't overflow
- [ ] No horizontal scrollbar on page body at any step
- [ ] Touch targets are at least 44px tall

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

**Typography:**
- Category card title: `font-serif text-lg font-semibold text-text-primary`
- Category hover text: `text-sm text-text-secondary`
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
