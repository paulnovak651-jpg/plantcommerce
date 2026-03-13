# Sprint 10: Homepage Browse Funnel Redesign

*Created 2026-03-11. Target: Three-step browse funnel consolidated onto the homepage.*

## Goal

Replace the **two separate browse experiences** — the homepage "Browse by Category" grid and the dedicated `/browse` page — with a **single three-step funnel that lives on the homepage**:

**Step 1 → Category Cards** (Nut Trees / Berries / Tree Fruit / Support Species)
**Step 2 → Genus Cards** (Hazelnuts / Chestnuts / Walnuts / etc.)
**Step 3 → Cultivar Grid** (flat list of all cultivars, sortable + filterable)

The browse funnel lives **on the homepage** (`/`), directly below the hero. The `/browse` route becomes a redirect to `/`. There is no longer a separate browse page.

---

## What Exists Today (To Be Replaced)

### Homepage (`app/page.tsx`)
The homepage currently has:
1. **Hero section** — search bar, stat counters (species, cultivars, nurseries). **KEEP.**
2. **SeasonalBanner** — contextual banner. **KEEP.**
3. **"Browse by Category" section** — `CategoryCard` components in a `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` grid, each linking to `/browse?category=...`, plus a "Browse All Plants" button. **REMOVE — replaced by the new funnel.**
4. **Dynamic sections** — Recently Restocked, Best Deals, New to the Database (horizontal scroll `DealCard` lists). **KEEP.**
5. **ZoneRecommendations** — zone-based suggestions. **KEEP.**
6. **How It Works** — 3-step explainer. **KEEP.**

### Browse Page (`app/browse/page.tsx`)
A full dedicated page with:
- `BrowsePageClient` → `BrowseContent` orchestrator
- 11 colored category pills in `BrowseHeader`
- Species/Genus toggle
- Sidebar with facet filters (zone, sun, growth rate, etc.)
- `BrowseGrid` with `PlantCard` components
- Pagination, search bar, sort bar

**This entire page gets absorbed into the homepage.** The `/browse` route redirects to `/`.

### Components affected
- `CategoryCard.tsx` — homepage category cards in the current grid. **REMOVE** (replaced by new `CategoryCards.tsx`).
- `BrowseContent.tsx` — the browse orchestrator. **EDIT** — add funnel state.
- `BrowseHeader.tsx` — the 11-pill bar + genus toggle. **EDIT** — strip pills and toggle in Step 3 mode.
- `BrowsePageClient.tsx` — client wrapper for browse. **REUSE** on homepage.

---

## New Category Taxonomy

### Top-Level Categories (4)

| Category | Color |
|----------|-------|
| **Nut Trees** | `#5C4033` |
| **Berries** | `#7B1FA2` |
| **Tree Fruit** | `#558B2F` |
| **Support Species** | `#2d6a4f` |

### Genus Mapping per Category

**Nut Trees →**
| Common Name | Genus |
|-------------|-------|
| Hazelnuts | Corylus |
| Chestnuts | Castanea |
| Walnuts | Juglans |
| Hickories & Pecans | Carya |
| Oaks | Quercus |
| Chilean Hazelnut | Gevuina |

**Berries →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Blueberries | Vaccinium | |
| Elderberries | Sambucus | |
| Brambles | Rubus | Raspberries, blackberries |
| Grapes | Vitis | Moved from standalone category |
| Mulberries | Morus | Moved — buyers shop these with berries |
| Goumi | Elaeagnus | Fruiting varieties (E. multiflora) |
| Sea Buckthorn | Hippophae | **Dual-listed** — also in Support Species |

**Tree Fruit →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Apples | Malus | Absorbs "Apples & Crabapples" |
| Pears | Pyrus | |
| Persimmons | Diospyros | American + Asian, no subspecies split |
| Pawpaws | Asimina | |
| Cherries & Plums | Prunus | |
| Figs | Ficus | |
| Kiwifruit | Actinidia | Hardy kiwi + fuzzy kiwi |

**Support Species →**
| Common Name | Genus | Notes |
|-------------|-------|-------|
| Autumn Olive & Silverberry | Elaeagnus | N-fixing varieties |
| Sea Buckthorn | Hippophae | **Dual-listed** — also in Berries |
| Alders | Alnus | Primary N-fixing tree |
| Hackberries | Celtis | Wildlife corridor, hardy understory |

### Dual-Category Rule

Some genera span categories. Assignment is at the species/cultivar level, not the genus level. A genus card can appear in multiple categories. Sea Buckthorn appears under both Berries and Support Species. Goumi appears under Berries; Autumn Olive appears under Support Species — both are Elaeagnus.

---

## New Homepage Structure

After this sprint, the homepage renders top-to-bottom:

```
1. Hero (search bar, stats)             ← UNCHANGED
2. SeasonalBanner                       ← UNCHANGED
3. ★ BROWSE FUNNEL (Step 1/2/3)         ← NEW — replaces old category grid
4. Recently Restocked                   ← UNCHANGED
5. Best Deals                           ← UNCHANGED
6. New to the Database                  ← UNCHANGED
7. ZoneRecommendations                  ← UNCHANGED
8. How It Works                         ← UNCHANGED
```

The browse funnel section occupies the same position the old "Browse by Category" grid held. Everything above and below it is untouched.

---

## UI Design Specification

### Layout Principle: Vertical Stack

**CRITICAL:** All layout at every funnel step is a **single-column vertical stack**. No 2×2 grids, no multi-column card layouts. Category cards, genus cards, and the cultivar grid all stack vertically, full-width. This matches the existing browse page layout.

### Interaction Pattern: Hover (Desktop) / Tap (Mobile)

The existing site uses hover-to-reveal on desktop and tap-to-navigate on mobile. This sprint preserves that exact pattern:

- **Desktop:** Hover over a card to reveal additional detail (smooth CSS height/opacity transition). Click to navigate to the next funnel step.
- **Mobile:** Tap navigates directly to the next step. No hover preview (touch devices don't fire `hover`).

**Implementation pattern (same for category and genus cards):**
```tsx
<div className="group cursor-pointer" onClick={handleClick}>
  <Surface elevation="raised" className="border-l-4 ...">
    {/* Always visible */}
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-serif text-lg font-semibold">{label}</h3>
    </div>

    {/* Revealed on hover (desktop only — CSS group-hover) */}
    <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100">
      <p className="text-sm text-text-secondary pt-2">
        {hoverDetailText}
      </p>
    </div>
  </Surface>
</div>
```

No special mobile detection needed — `group-hover` doesn't fire on touch devices, so the reveal stays hidden and the tap fires `onClick`.

### Step 1: Category Selection (Landing State)

When no category is selected, the funnel section shows 4 full-width cards stacked vertically.

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
- Layout: `flex flex-col gap-3` — full-width, single column, NO grid
- Container: `Surface` with `elevation="raised"`, `rounded-[var(--radius-xl)]`
- Min-height: `80px` per card
- Background: `bg-surface-raised` with 4px left border in category color
- Icon + title in a single row: `flex items-center gap-3`
- Title: `font-serif text-lg font-semibold` — just the category name
- Desktop hover reveals genera list: "Hazelnuts · Chestnuts · Walnuts · Hickories & Pecans · Oaks · Chilean Hazelnut"
- Mobile tap navigates to Step 2
- `cursor-pointer`

**Icons:**
- Nut Trees: 🌰 or `<TreeDeciduous />` from lucide
- Berries: 🫐 or `<Cherry />` from lucide
- Tree Fruit: 🍎 or `<Apple />` from lucide
- Support Species: 🌿 or `<Leaf />` from lucide

### Step 2: Genus Cards (Within Selected Category)

A breadcrumb appears and genus cards fill the section — stacked vertically, full-width.

**Breadcrumb:**
```
← All Categories  /  Nut Trees
```

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
           ... etc ...
```

**Genus card design:**
- Layout: `flex flex-col gap-3` — full-width, single column, NO grid
- Container: `Surface` with `elevation="default"`, `rounded-[var(--radius-lg)]`
- 3px left border in parent category color
- Title: `font-serif text-base font-semibold` — common name
- Detail line: `text-xs text-text-tertiary` — botanical name (italic) · cultivar count · nursery count
- Desktop hover reveals additional info (short description or key species)
- Mobile tap navigates to Step 3
- Genera with 0 cultivars: show card with "Coming Soon" badge, dimmed but visible

### Step 3: Cultivar Grid (Within Selected Genus)

**Breadcrumb:**
```
← All Categories  /  Nut Trees  /  Hazelnuts
```

This step renders the **existing browse infrastructure** (`BrowseContent` orchestrator, sidebar filters, `BrowseGrid`, search bar, sort bar, pagination) — scoped to the selected genus. The layout looks and feels exactly like the current `/browse` page, just embedded in the homepage and filtered to one genus.

**Key changes from the current BrowseHeader:**
- Category pills row: **HIDDEN** — breadcrumb handles navigation
- Species/Genus toggle: **REMOVED** — user already chose a genus
- Search bar: **VISIBLE** — works within genus scope
- Sort bar: **VISIBLE**
- Sidebar filters: **VISIBLE** — zone, sun, growth rate, etc. all active

---

## State Machine

```
CATEGORY_SELECT  →  GENUS_SELECT  →  CULTIVAR_BROWSE
   (Step 1)          (Step 2)          (Step 3)
```

**State variables (in BrowseContent or a new wrapper):**

```typescript
const [browseStep, setBrowseStep] = useState<'categories' | 'genera' | 'cultivars'>('categories');
const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null);
const [selectedGenus, setSelectedGenus] = useState<string | null>(null);
```

**Transitions:**
- Step 1 → 2: Click category card → sets `selectedTopCategory`, advances to `'genera'`
- Step 2 → 3: Click genus card → sets `selectedGenus`, applies genus filter, advances to `'cultivars'`
- Step 3 → 2: Click category name in breadcrumb → clears genus, returns to `'genera'`
- Step 2 → 1: Click "← All Categories" → clears category, returns to `'categories'`
- Step 3 → 1: Click "← All Categories" → clears both, returns to `'categories'`

**URL sync:**
- Step 1: `/` (no params)
- Step 2: `/?cat=nut-trees`
- Step 3: `/?cat=nut-trees&genus=corylus`

Browser back/forward works via URL param changes + `popstate` listener.

---

## Data Model Changes

### New: `lib/browse-categories.ts`

Pure config file — no DB migration. Single source of truth for the 4-category taxonomy.

```typescript
export interface TopCategory {
  slug: string;          // URL param: 'nut-trees', 'berries', etc.
  label: string;         // Display: 'Nut Trees', 'Berries', etc.
  icon: string;          // Emoji
  color: string;         // Hex for accent border
  genera: GenusEntry[];  // Ordered genus list
}

export interface GenusEntry {
  genusSlug: string;     // Matches genus-names key: 'corylus', etc.
  commonName: string;    // Card title: 'Hazelnuts', etc.
  botanicalName: string; // Italic subtitle: 'Corylus', etc.
}

export const TOP_CATEGORIES: TopCategory[] = [
  {
    slug: 'nut-trees',
    label: 'Nut Trees',
    icon: '🌰',
    color: '#5C4033',
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
    genera: [
      { genusSlug: 'elaeagnus', commonName: 'Autumn Olive & Silverberry', botanicalName: 'Elaeagnus' },
      { genusSlug: 'hippophae', commonName: 'Sea Buckthorn', botanicalName: 'Hippophae' },
      { genusSlug: 'alnus', commonName: 'Alders', botanicalName: 'Alnus' },
      { genusSlug: 'celtis', commonName: 'Hackberries', botanicalName: 'Celtis' },
    ],
  },
];

export function getTopCategory(slug: string): TopCategory | undefined {
  return TOP_CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoriesForGenus(genusSlug: string): TopCategory[] {
  return TOP_CATEGORIES.filter((c) =>
    c.genera.some((g) => g.genusSlug === genusSlug)
  );
}
```

### Old→New Category Mapping

The existing `display_category` values in the DB and `CATEGORY_OPTIONS` in the facet registry are **not changed**. The new config is a UI layer on top:

```typescript
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

---

## Implementation Tasks

### Phase 1: Config & Data Layer

#### Task 1.1: Create `lib/browse-categories.ts`
- TopCategory interface, TOP_CATEGORIES array, helpers
- Pure config — no DB changes

#### Task 1.2: Create `lib/queries/genus-counts.ts`
- `getGenusCounts(plants: BrowsePlant[]): Record<string, { cultivarCount: number; nurseryCount: number }>`
- Aggregates allPlants by genus slug for genus card stats

### Phase 2: New Browse Components

#### Task 2.1: Create `components/browse/CategoryCards.tsx`
- 4 full-width category cards, **single column vertical stack** (`flex flex-col gap-3`)
- Props: `onCategorySelect: (slug: string) => void`
- Desktop hover reveals genera list (CSS `group-hover:max-h` transition)
- Mobile tap navigates directly
- Left accent border in category color

#### Task 2.2: Create `components/browse/GenusCards.tsx`
- Genus cards for a selected category, **single column vertical stack** (`flex flex-col gap-3`)
- Props: `category: TopCategory`, `genusCounts: Record<...>`, `onGenusSelect: (genusSlug: string) => void`
- Shows: common name, botanical name (italic), cultivar count, nursery count
- Desktop hover reveals additional detail
- Mobile tap navigates directly
- 0-cultivar genera show "Coming Soon" badge (dimmed, not hidden)

#### Task 2.3: Create `components/browse/BrowseBreadcrumb.tsx`
- Progressive: ← All Categories → Category Name → Genus Name
- Each clickable except the last (current)
- Props: `step`, `categoryLabel?`, `genusLabel?`, `onNavigate: (step) => void`

### Phase 3: Homepage Integration

#### Task 3.1: Rewrite `app/page.tsx` — replace "Browse by Category" section
- Remove the `CategoryCard` grid, the `categories` query from `getHomepageCategories`, and the "Browse All Plants" button
- In their place, render the browse funnel:
  - Fetch `allPlants` and `taxonomyTree` (same queries currently in `app/browse/page.tsx`)
  - Render `BrowsePageClient` (or a new `HomepageBrowseFunnel` wrapper) with the funnel state
- All other homepage sections (hero, seasonal banner, deal cards, zone recommendations, how it works) remain untouched

#### Task 3.2: Add funnel state to `BrowseContent.tsx`
- Add `browseStep`, `selectedTopCategory`, `selectedGenus` state
- Initialize from URL params (`cat`, `genus`)
- Sync to URL via `replaceState`
- Conditional rendering:
  - Step 1: `CategoryCards` — hide sidebar
  - Step 2: `BrowseBreadcrumb` + `GenusCards` — hide sidebar
  - Step 3: `BrowseBreadcrumb` + existing `BrowseHeader` (minus pills/toggle) + `BrowseGrid` — show sidebar

#### Task 3.3: Update `BrowseHeader.tsx` for Step 3 mode
- Hide category pill row (breadcrumb handles nav)
- Remove Species/Genus toggle (user already chose a genus)
- Keep: search bar, sort bar, result count
- Existing vertical layout completely preserved

#### Task 3.4: Wire genus filter into browse API
- When `selectedGenus` is set, filter the browse query to that genus
- May just require setting a facet state value, or add `genus` URL param to `/api/browse`

### Phase 4: Remove `/browse` Page

#### Task 4.1: Redirect `/browse` to `/`
- Change `app/browse/page.tsx` to redirect to homepage: `redirect('/')`
- Or add a `next.config.ts` redirect rule
- Preserve any existing URL params in the redirect (e.g., `/browse?cat=berries` → `/?cat=berries`)

#### Task 4.2: Update all internal links
- Any `<Link href="/browse">` or `<Link href="/browse?...">` throughout the codebase should point to `/?...` instead
- Check: `NavLinks.tsx`, `CategoryCard.tsx` (being removed anyway), `HomepageSection.tsx` seeAllHref, any other components

#### Task 4.3: Clean up removed components
- `CategoryCard.tsx` — can be deleted (replaced by `CategoryCards.tsx`)
- `getHomepageCategories` query in `lib/queries/plants.ts` — can be removed if no longer called
- The `CategoryGroup` type — remove if unused

### Phase 5: Polish & Edge Cases

#### Task 5.1: Animate transitions between steps
- Subtle opacity + height transition when switching steps (200ms)

#### Task 5.2: Back button support
- URL params (`cat`, `genus`) on the homepage URL enable back/forward
- `popstate` listener updates funnel state
- Test: Step 1 → 2 → 3 → Back → Back → should be at Step 1

#### Task 5.3: Direct URL access
- `/?cat=berries` lands on Step 2 with Berries genus cards
- `/?cat=nut-trees&genus=corylus` lands on Step 3 with Hazelnut cultivars
- Invalid slugs fall back to Step 1

#### Task 5.4: Empty state for genera with no data yet
- Genera with 0 cultivars show "Coming Soon" badge (dimmed, not hidden)
- Clicking shows: "We're building our {genus} database. Check back soon."
- Don't hide — signals the platform's planned scope

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `lib/browse-categories.ts` | **Create** | Category config, genus mappings, helpers |
| `lib/queries/genus-counts.ts` | **Create** | Genus count aggregation |
| `components/browse/CategoryCards.tsx` | **Create** | Step 1: 4 category cards, vertical stack |
| `components/browse/GenusCards.tsx` | **Create** | Step 2: Genus cards, vertical stack |
| `components/browse/BrowseBreadcrumb.tsx` | **Create** | Progressive breadcrumb nav |
| `app/page.tsx` | **Edit** | Replace category grid with browse funnel, add data fetches |
| `components/BrowseContent.tsx` | **Edit** | Add funnel state, conditional rendering by step |
| `components/browse/BrowseHeader.tsx` | **Edit** | Hide pills + toggle in Step 3 |
| `app/browse/page.tsx` | **Edit** | Replace with redirect to `/` |
| `components/CategoryCard.tsx` | **Delete** | Replaced by new CategoryCards |
| `lib/facets/registry.ts` | **No change** | Existing CATEGORY_OPTIONS preserved |
| `lib/category-colors.ts` | **No change** | Reused by new components |
| `lib/genus-names.ts` | **No change** | Reused by new components |

---

## Migration Notes

### Removed
- The `CategoryCard` component and homepage category grid
- The "Browse All Plants" button
- The dedicated `/browse` page (becomes a redirect)
- The 11-pill category bar in `BrowseHeader`
- The Species/Genus toggle
- The `CategoryContext` component usage
- The `getHomepageCategories` query (if unused elsewhere)

### Preserved exactly as-is
- Hero section (search bar, stat counters)
- SeasonalBanner
- Dynamic sections (Recently Restocked, Best Deals, New to Database)
- ZoneRecommendations
- How It Works
- All sidebar facet filters (zone, sun, growth rate, etc.) — visible in Step 3
- Search bar, sort bar, pagination — visible in Step 3
- `PlantCard` component
- `BrowseGrid` component
- All facet state logic, URL serialization, API calls
- The browse API endpoint
- The overall vertical layout pattern of the entire page
- Desktop hover / mobile tap interaction patterns

---

## Testing Checklist

### Funnel Navigation
- [ ] Homepage shows 4 category cards stacked vertically in the funnel section
- [ ] Clicking a category card transitions to Step 2 with correct genus cards
- [ ] Clicking a genus card transitions to Step 3 with correct cultivar grid
- [ ] Breadcrumb "← All Categories" returns to Step 1 from Step 2 and Step 3
- [ ] Breadcrumb category name returns to Step 2 from Step 3
- [ ] Browser back/forward buttons navigate steps correctly
- [ ] `/?cat=berries` lands on Step 2
- [ ] `/?cat=nut-trees&genus=corylus` lands on Step 3
- [ ] Invalid `cat` or `genus` params fall back gracefully

### Category Cards (Step 1)
- [ ] All 4 categories display with correct icon, name, and color accent
- [ ] Cards are full-width, stacked vertically — NO multi-column grid
- [ ] Desktop: Hovering reveals genera list with smooth transition
- [ ] Mobile: Tap navigates directly to Step 2 (no hover state)
- [ ] Cards are keyboard accessible

### Genus Cards (Step 2)
- [ ] Correct genera display for each category
- [ ] Cards are full-width, stacked vertically — NO multi-column grid
- [ ] Cultivar count and nursery count are accurate
- [ ] Genera with 0 cultivars show "Coming Soon" badge
- [ ] Sea Buckthorn appears under both Berries and Support Species
- [ ] Goumi appears under Berries; Autumn Olive under Support Species
- [ ] Desktop hover reveals detail; mobile tap navigates

### Cultivar Grid (Step 3)
- [ ] Cultivars correctly filtered to selected genus
- [ ] Sidebar filters work within genus scope
- [ ] Search bar works within genus scope
- [ ] Sort and pagination work
- [ ] Category pills are NOT shown
- [ ] Species/Genus toggle is NOT shown
- [ ] Layout matches existing browse page exactly (vertical stack)

### Homepage Sections
- [ ] Hero section unchanged and functional
- [ ] SeasonalBanner still renders
- [ ] Recently Restocked, Best Deals, New to Database sections still render below funnel
- [ ] ZoneRecommendations still works
- [ ] How It Works section still renders
- [ ] Stat counters (species, cultivars, nurseries) still accurate

### /browse Redirect
- [ ] `/browse` redirects to `/`
- [ ] `/browse?category=Nut+Trees` redirects to `/?cat=nut-trees` (or graceful fallback)
- [ ] No broken links remain pointing to `/browse`

### Mobile (test at 375px)
- [ ] Category and genus cards stack vertically, tappable
- [ ] Breadcrumb doesn't overflow
- [ ] No horizontal scrollbar at any step
- [ ] Touch targets at least 44px tall
- [ ] All homepage sections below funnel render correctly

### No Regressions
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Cultivar detail pages still accessible from browse grid
- [ ] Zone persistence still works
- [ ] Facet URL serialization works in Step 3
- [ ] JSON-LD structured data on homepage still correct
- [ ] OG metadata on homepage unchanged

---

## Design Reference

**Colors:** Nut Trees `#5C4033`, Berries `#7B1FA2`, Tree Fruit `#558B2F`, Support Species `#2d6a4f`. Card surface: `var(--color-surface-raised)`. Card border: `var(--color-border)`.

**Typography:** Category title: `font-serif text-lg font-semibold`. Hover text: `text-sm text-text-secondary`. Genus title: `font-serif text-base font-semibold`. Genus botanical: `text-xs text-text-tertiary italic`. Genus stats: `text-xs text-text-secondary`. Breadcrumb: `text-sm text-text-tertiary` / `hover:text-accent`.

**Existing components to reuse:** `Surface`, `Text`, `EmptyState`.

---

## Not In Scope (Future Sprints)

- **Product form filter** (seeds / cuttings / bare root / potted) — needs nursery data tagging
- **Category/genus hero images** — needs image pipeline
- **Global search across funnel steps** — search currently only works in Step 3
- **Quinces** (Cydonia) — add to Tree Fruit when data seeded
- **Ribes** (currants/gooseberries) — add to Berries when data seeded
- **Aronia** (chokeberries) — add to Berries when data seeded