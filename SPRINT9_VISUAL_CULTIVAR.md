# Sprint 9: Visual Cultivar Page Redesign

*Created 2026-03-11. Target: Tabbed cultivar page with visual data components.*

## Goal

Replace the current single-scroll cultivar page with a **tabbed layout** that uses visual components to convey plant data at a glance — reducing reading load and making the page instantly scannable for permaculture planners.

**Design prototype:** See `plant-page-prototype.jsx` artifact (created in Claude.ai conversation). The interactive React prototype demonstrates all visual patterns described below.

---

## Pre-existing Bug Fix (Do First)

### Bug: Duplicate React keys in PriceComparisonTable

**File:** `components/PriceComparisonTable.tsx`
**Error:** `Encountered two children with the same key, 'mobile-zs-nutty-ridge-https://znutty.com/products/...'`
**Cause:** Keys use `nurserySlug-productUrl` but when a nursery has multiple offers with the same product URL (different sale forms, sizes, etc.), the keys collide.

**Fix:** Add `id: string` to the `OfferItem` interface. Pass `offer.id` from the cultivar page. Use `offer.id` as the React key in both mobile and desktop `map()` calls:

```tsx
// Mobile view (line ~114):
key={`mobile-${offer.id}`}

// Desktop view (line ~190):
key={`desktop-${offer.id}`}
```

In the cultivar page `comparisonOffers` builder, add `id: offer.id as string` to the mapped object.

---

## New Components Already in Repo

These components were created and pushed to `master` but are **not yet wired into any page**. They are ready to be used:

| Component | Path | Description |
|-----------|------|-------------|
| `ZoneBar` | `components/ZoneBar.tsx` | Color-coded 13-column USDA zone display. Client component. Integrates with `getUserZone()` to show user's zone marker. |
| `HarvestCalendar` | `components/HarvestCalendar.tsx` | 12-month visual timeline. Highlights bloom (yellow) and harvest (orange) months. Server component. |
| `HeightSilhouette` | `components/HeightSilhouette.tsx` | SVG person-to-tree scale comparison showing min/max height. Server component. |
| `QuickFactsHero` | `components/QuickFactsHero.tsx` | Icon-based key attributes row (zones, height, sun, harvest, bearing, pollination). Server component. Designed for dark backgrounds. |
| `CultivarTabs` | `components/CultivarTabs.tsx` | Client component tab switcher. Exports `TabId` type. Accepts `Record<TabId, ReactNode>` children. |

---

## Implementation Tasks

### Phase 1: Bug Fix + Foundation (Do First)

#### Task 1.1: Fix PriceComparisonTable duplicate keys
- Fix the key collision bug described above
- Add `id: string` to the `OfferItem` interface
- Pass `offer.id` through from the cultivar page when building `comparisonOffers`
- Use `offer.id` as the React key in both mobile and desktop views
- **Test:** Navigate to any cultivar with 2+ offers from the same nursery — no console warnings

#### Task 1.2: Verify existing visual components compile
- Run `npm run dev` and import each new component in a test page or verify no TypeScript errors
- The components use these existing dependencies: `@/lib/zone-persistence` (ZoneBar), `@/lib/types` (QuickFactsHero)
- Fix any import/type issues

### Phase 2: Cultivar Page Hero Header

#### Task 2.1: Build the dark hero header
Replace the current name/species section at the top of `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` with:

```
+--------------------------------------------------+
| [Image placeholder]  Cultivar Name               |
|  160x160 dashed      Corylus avellana (italic)   |
|  border box          Species Name - Breeder (Year)|
|                                                   |
|  +---------------------------------------------+ |
|  | Zones 5-9 | 12-18ft | full sun | harvest ..|| |
|  +---------------------------------------------+ |
|                                                   |
|  Best price: $22.00 at Burnt Ridge  [View ->]    |
+--------------------------------------------------+
```

- Background: `bg-accent-hover` (dark green from design system)
- Text: `text-surface-raised` (white/cream)
- Use `QuickFactsHero` component for the icon row
- Move the existing best price callout into the hero
- Use `rounded-[var(--radius-xl)]` for the container
- Image placeholder: 160x160 dashed border div (future image support)

**Key design tokens from `globals.css`:**
- `--color-accent-hover: #1b4332` (dark green background)
- `--color-surface-raised: #ffffff` (text on dark)
- `--radius-xl: 1rem`
- Font: `font-serif` class for cultivar name (maps to Fraunces)

#### Task 2.2: Wire QuickFactsHero into the hero
- Import `QuickFactsHero` from `@/components/QuickFactsHero`
- Pass `profile={growingProfile}` — it handles null gracefully
- The component is designed for dark backgrounds (uses `/70` and `/50` opacity suffixes)

### Phase 3: Tabbed Layout

#### Task 3.1: Wire CultivarTabs into the cultivar page
- Import `CultivarTabs` and `TabId` from `@/components/CultivarTabs`
- Build tabs array dynamically based on available data:
  - `overview` — always present
  - `growing` — always present
  - `production` — show if `growingProfile?.harvest_season` or `growingProfile?.years_to_bearing_min != null`
  - `pollination` — show if `growingProfile` exists (species-level data available)
  - `availability` — always present, show offer count: `{ id: 'availability', label: 'Buy', count: offers.length }`
- Pass all tab content as `Record<TabId, ReactNode>` children
- All content is server-rendered — the client component just toggles visibility with `hidden` class

#### Task 3.2: Overview tab content
Move/reorganize existing page content:
1. `cultivar.notes` description text
2. **NEW:** Side-by-side grid with `ZoneBar` and `HeightSilhouette` in `Surface` cards
3. **NEW:** `HarvestCalendar` in a `Surface` card
4. Existing metadata cards (breeder, origin, released, patent)
5. Existing `ZoneCompatibility` badge
6. Existing aliases/legal disclosures

#### Task 3.3: Growing tab content
1. `ZoneBar` (full width, in Surface)
2. `HeightSilhouette` with spread text (in Surface)
3. Existing `TraitGrid` component (already renders range bars, icon ratings)
4. `EmptyState` fallback if no growing profile

#### Task 3.4: Production tab content
1. `HarvestCalendar`
2. Big-number stat cards in a 3-column grid: years to bearing, harvest season, growth rate
3. Cultivar notes in a Surface card

#### Task 3.5: Pollination tab content (placeholder)
For now, show an informational card explaining pollination data is coming:
- Use `Surface` with `className="border-l-4 border-l-community"` (amber accent)
- Link to `/pollination/${speciesSlug}` if it exists
- Show `HarvestCalendar` with `bloomPeriod="mid"` to display bloom timing
- **Future:** Wire to `species_pollination_profiles`, `pollination_groups`, `cultivar_pollination_groups`, and `pollination_compatibility` tables

#### Task 3.6: Availability tab content
Move ALL existing pricing/availability content here:
1. Price comparison table (with the fixed keys)
2. Price history sparklines
3. Alert signup form
4. Nursery map
5. Community listings section

### Phase 4: Section Labels

Each visual component card should have a consistent label style:
```tsx
<Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
  USDA Hardiness Zones
</Text>
```

Use this pattern for: "USDA Hardiness Zones", "Size at Maturity", "Annual Calendar", "Cultivar Notes", "Seasonal Timeline"

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `components/PriceComparisonTable.tsx` | **Edit** | Fix duplicate key bug, add `id` to OfferItem |
| `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` | **Rewrite** | Hero header + tabbed layout |
| `components/ZoneBar.tsx` | Already exists | No changes needed |
| `components/HarvestCalendar.tsx` | Already exists | No changes needed |
| `components/HeightSilhouette.tsx` | Already exists | No changes needed |
| `components/QuickFactsHero.tsx` | Already exists | No changes needed |
| `components/CultivarTabs.tsx` | Already exists | No changes needed |

---

## Testing Checklist

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No duplicate key console warnings on any cultivar page
- [ ] Cultivar pages with growing data show all 5 tabs
- [ ] Cultivar pages WITHOUT growing data show Overview + Growing (empty state) + Buy tabs
- [ ] ZoneBar displays correctly and shows user zone marker if zone is set
- [ ] HarvestCalendar renders correct months for early/mid/late/extended seasons
- [ ] HeightSilhouette scales correctly (person should be ~40px for 6ft reference)
- [ ] QuickFactsHero shows only available data points (handles null fields)
- [ ] Tab switching is instant (no layout shift, no loading)
- [ ] All existing functionality preserved: price comparison, sparklines, alerts, nursery map, community listings, aliases, legal identifiers, JSON-LD structured data
- [ ] Mobile responsive: tabs should scroll horizontally on small screens
- [ ] Breadcrumbs still work correctly
- [ ] OG metadata generation unchanged

## Design Reference

**Color tokens (from `globals.css`):**
- Hero bg: `--color-accent-hover` (#1b4332)
- Hero text: `--color-surface-raised` (#ffffff)
- Active tab: `border-accent text-accent`
- Inactive tab: `border-transparent text-text-tertiary`
- Section labels: `text-text-tertiary`, uppercase, 11px, tracking-wider
- Zone bar active: HSL green gradient (computed in component)
- Harvest months: `#e67e22` (orange), bloom: `#f1c40f` (yellow)

**Existing components to reuse:**
- `Surface` for card containers (use `elevation="raised" padding="default"`)
- `Text` for typography hierarchy
- `Tag` for metadata badges
- `Disclosure` for collapsible sections
- `EmptyState` for missing data fallbacks

---

## Not In Scope (Future Sprints)

- Actual plant/fruit images (need image pipeline)
- Disease resistance meter component (needs `cultivar_traits.disease_resistance` data)
- Nut/fruit profile card (needs cultivar_traits data: nut_weight_g, kernel_pct, flavor_notes)
- Pollination S-allele badges and compatibility chips (needs `cultivar_pollination_groups` data seeded)
- Species page getting the same tabbed treatment
- ResistanceMeter visual component
