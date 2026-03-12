# Sprint 10: Category Consolidation + Homepage Integration

*Created 2026-03-11.*

## Goal

Two changes, nothing else:

1. **Consolidate the 11 categories down to 4** in the existing three-column TaxonomyExplorer (Nut Trees / Berries / Tree Fruit / Support Species), re-mapping genera accordingly.
2. **Move the TaxonomyExplorer from `/browse` onto the homepage**, replacing the old CategoryCard grid. Remove the `/browse` page.

**The existing three-column layout, sizing, fonts, hover behavior, keyboard navigation, mobile drill-down, and every other visual/interaction detail of the TaxonomyExplorer is PRESERVED EXACTLY.** Nothing about the component's appearance or behavior changes. The only thing that changes is WHICH categories appear in column 1 and WHICH genera appear under each category.

---

## Critical Rule: DO NOT Redesign the TaxonomyExplorer

The following components are **NOT to be visually modified, restyled, or restructured** in any way:

- `components/browse/TaxonomyExplorer.tsx` — the three-column desktop layout and mobile drill-down
- `components/browse/CategoryColumn.tsx` — left column with categories
- `components/browse/GenusColumn.tsx` — middle column with genera
- `components/browse/SpeciesPreviewPanel.tsx` — right column with species list
- `components/browse/BrowsePageClient.tsx` — client wrapper

The grid template (`200px 250px 1fr`), min/max heights (`480px`/`600px`), font sizes (`13px`, `10px`, `11px`), colors, borders, hover debounce timers (150ms), keyboard navigation, ARIA roles, the "CATEGORIES" / "GENERA" headers, the colored left-accent bars, the "In Stock" badges, the species zone badges, nursery count badges — **ALL of it stays exactly as-is.**

The screenshot from the working site (showing Nut Trees selected → Hazelnuts hovered → 6 species in the right column) is the **reference implementation**. The result of this sprint must look identical to that screenshot, just with the new 4-category grouping.

---

## Change 1: Consolidate Categories

### Current State (11 categories in `display_category`):

Nut Trees, Berries, Persimmons, Pears, Apples & Crabapples, Pawpaw, Grapes, Stone Fruit, Mulberries, Kiwi, Nitrogen Fixers, Other

### New State (4 categories):

| New Category | Absorbs these old `display_category` values |
|---|---|
| **Nut Trees** | `Nut Trees` |
| **Berries** | `Berries`, `Grapes`, `Mulberries` |
| **Tree Fruit** | `Persimmons`, `Pears`, `Apples & Crabapples`, `Pawpaw`, `Stone Fruit`, `Kiwi` |
| **Support Species** | `Nitrogen Fixers`, `Other` |

### Dual-Listed Genera

Sea Buckthorn (Hippophae) should appear under **both** Berries and Support Species.
Goumi (Elaeagnus multiflora) should appear under **Berries**.
Autumn Olive / Silverberry (other Elaeagnus) should appear under **Support Species**.

If dual-listing is too complex for the current `display_category` field (which is per plant entity, not per genus), then for now just place:
- Hippophae under **Support Species** (can dual-list in a future sprint)
- Elaeagnus under **Support Species** (can split goumi out later)

The simpler version is fine — we can refine the dual-listing later.

### Implementation Approach

The `getTaxonomyTree()` function in `lib/queries/taxonomy-tree.ts` reads `display_category` from `plant_entities` and groups by it. The simplest approach:

**Option A — Remap in code (preferred, no DB migration):**

Add a mapping function in `lib/queries/taxonomy-tree.ts` that runs AFTER fetching the raw categories and BEFORE building the final tree. It merges the old categories into the new 4:

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

Apply `remapCategory()` when reading `plant.display_category` in the accumulation loop. Genera that were under separate old categories (e.g., Vitis under "Grapes" and Morus under "Mulberries") will now appear together under "Berries" in the genera column.

**Option B — DB migration:** Update `display_category` values directly in `plant_entities`. This is cleaner long-term but requires a migration. Either approach works; Option A is faster and safer.

### Category Sort Order

The 4 categories should display in this fixed order (not sorted by cultivar count):
1. Nut Trees
2. Berries
3. Tree Fruit
4. Support Species

Add a sort-order map or array to enforce this, since the current code sorts by `total_cultivars desc`.

### Category Colors

Update `lib/category-colors.ts` to include entries for the new categories:

```typescript
export const categoryColors: Record<string, { from: string; to: string }> = {
  'Nut Trees': { from: '#5C4033', to: '#3E2723' },
  'Berries': { from: '#7B1FA2', to: '#4A148C' },
  'Tree Fruit': { from: '#558B2F', to: '#33691E' },
  'Support Species': { from: '#2d6a4f', to: '#1b4332' },
};
```

The old per-fruit-type entries (Grapes, Mulberries, Pears, etc.) can be kept for backward compatibility or removed — they won't be referenced once the remap is in place.

---

## Change 2: Move TaxonomyExplorer to Homepage

### What to do in `app/page.tsx`:

1. **Add data fetches:** Import and call `getAllBrowsePlants()` and `getTaxonomyTree()` in the server component, same as `app/browse/page.tsx` currently does.

2. **Replace the "Browse by Category" section** (the `CategoryCard` grid + "Browse All Plants" button) with the `BrowsePageClient` component (which wraps `TaxonomyExplorer` + `BrowseContent`). Or, if simpler, just render the `TaxonomyExplorer` directly if the full browse grid isn't needed on the homepage.

3. **Keep everything else on the homepage exactly as-is:**
   - Hero section (search bar, stat counters) — KEEP
   - SeasonalBanner — KEEP
   - Recently Restocked section — KEEP
   - Best Deals section — KEEP
   - New to the Database section — KEEP
   - ZoneRecommendations — KEEP
   - How It Works — KEEP

The TaxonomyExplorer replaces ONLY the "Browse by Category" `<section>` and its contents.

### What to do with `app/browse/page.tsx`:

Replace its contents with a redirect to `/`:

```typescript
import { redirect } from 'next/navigation';

export default function BrowsePage() {
  redirect('/');
}
```

### What to do with internal links:

Search the codebase for any `href="/browse"` or `href={/browse...}` links and update them to point to `/` (or `/#browse` if we add an anchor). Key files to check:
- `components/NavLinks.tsx`
- `components/HomepageSection.tsx` (seeAllHref props)
- `components/SeasonalBanner.tsx`
- Any other component linking to `/browse`

### What to remove:

- `components/CategoryCard.tsx` — the old homepage category cards (replaced by TaxonomyExplorer)
- The `getHomepageCategories()` call and its import in `app/page.tsx` (no longer needed if only the TaxonomyExplorer is used for browsing)
- The `CategoryGroup` type if unused elsewhere

---

## Files Changed

| File | Action | What changes |
|------|--------|--------------|
| `lib/queries/taxonomy-tree.ts` | **Edit** | Add `CATEGORY_REMAP` mapping, apply in accumulation loop, enforce fixed sort order |
| `lib/category-colors.ts` | **Edit** | Add `Tree Fruit` and `Support Species` color entries |
| `app/page.tsx` | **Edit** | Replace CategoryCard grid section with TaxonomyExplorer, add data fetches |
| `app/browse/page.tsx` | **Edit** | Replace with redirect to `/` |
| `components/NavLinks.tsx` | **Edit** | Update `/browse` links to `/` |
| `components/HomepageSection.tsx` | **Check** | Update seeAllHref if pointing to `/browse` |
| `components/SeasonalBanner.tsx` | **Check** | Update link if pointing to `/browse` |
| `components/CategoryCard.tsx` | **Delete** | No longer used |

### Files NOT Changed (do not touch these)

| File | Why |
|------|-----|
| `components/browse/TaxonomyExplorer.tsx` | Layout/styling preserved exactly |
| `components/browse/CategoryColumn.tsx` | Layout/styling preserved exactly |
| `components/browse/GenusColumn.tsx` | Layout/styling preserved exactly |
| `components/browse/SpeciesPreviewPanel.tsx` | Layout/styling preserved exactly |
| `components/browse/BrowsePageClient.tsx` | Wrapper logic preserved exactly |
| `components/BrowseContent.tsx` | Browse orchestrator preserved exactly |
| `components/browse/BrowseHeader.tsx` | Preserved exactly |
| `components/browse/BrowseGrid.tsx` | Preserved exactly |
| `lib/facets/registry.ts` | Not touched — old CATEGORY_OPTIONS still used internally |

---

## Testing Checklist

### Category Consolidation
- [ ] Column 1 shows exactly 4 categories: Nut Trees, Berries, Tree Fruit, Support Species (in that order)
- [ ] Hovering "Nut Trees" shows genera: Hazelnuts, Hickories & Pecans, Walnuts, Chestnuts (from old Nut Trees)
- [ ] Hovering "Berries" shows genera: Blueberries, Elderberries, Grapes, Mulberries, Brambles, Goumi/Sea Buckthorn (merged from old Berries + Grapes + Mulberries)
- [ ] Hovering "Tree Fruit" shows genera: Apples, Persimmons, Pears, Pawpaws, Stone Fruits, Figs, Kiwifruit (merged from old per-fruit categories)
- [ ] Hovering "Support Species" shows genera from old Nitrogen Fixers + Other
- [ ] Species counts in column 1 are correct (sum of merged categories)
- [ ] Genera counts are correct
- [ ] "In Stock" badges still appear correctly on genera with active inventory
- [ ] Column 3 species preview still works (hover genus → species list loads)
- [ ] Zone badges and nursery count badges on species still display

### Visual Fidelity (compare against reference screenshot)
- [ ] Three-column grid is 200px / 250px / 1fr — UNCHANGED
- [ ] Min height 480px, max height 600px — UNCHANGED
- [ ] Font sizes (13px category names, 10px subtexts, 11px headers) — UNCHANGED
- [ ] Colored left accent bars on active category — UNCHANGED
- [ ] "CATEGORIES" and "GENERA" header bars — UNCHANGED
- [ ] Hover debounce timing (150ms) — UNCHANGED
- [ ] Keyboard navigation (arrow keys, Enter) — UNCHANGED
- [ ] Mobile drill-down (below lg breakpoint) — UNCHANGED

### Homepage Integration
- [ ] Homepage shows TaxonomyExplorer where the old category grid was
- [ ] Hero section (search bar, stats) still renders above it
- [ ] SeasonalBanner still renders
- [ ] Recently Restocked, Best Deals, New to Database sections still render below
- [ ] ZoneRecommendations still works
- [ ] How It Works section still renders
- [ ] Old CategoryCard grid and "Browse All Plants" button are gone

### /browse Redirect
- [ ] `/browse` redirects to `/`
- [ ] No broken internal links pointing to `/browse`

### No Regressions
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Cultivar detail pages still accessible (clicking through genus → species → cultivar)
- [ ] JSON-LD structured data on homepage still correct
- [ ] OG metadata unchanged

---

## Not In Scope

- Dual-listing genera across multiple categories (Sea Buckthorn in both Berries and Support Species) — future sprint
- Product form filter (seeds / cuttings / bare root) — future sprint
- Any visual changes to the TaxonomyExplorer — explicitly forbidden in this sprint
- Adding new genera or cultivar data
- Changing the browse sidebar filters or facet system
