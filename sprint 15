# Sprint 15: Restore Visual Cultivar & Species Page Design

*Created 2026-03-13. Priority: HIGH — restoring lost UX.*

## Background

A React prototype was built (see `plant-page-prototype.jsx` artifact and screenshot) demonstrating a rich, visual cultivar/species page with tabbed navigation, color-coded zone bars, height silhouettes, harvest calendars, disease resistance meters, nut profiles, pollination compatibility chips, and a green hero header. Sprint 9 (`SPRINT9_VISUAL_CULTIVAR.md`) defined the implementation plan and the individual visual components were built and pushed to `master`:

- `components/ZoneBar.tsx` ✅ exists
- `components/HarvestCalendar.tsx` ✅ exists
- `components/HeightSilhouette.tsx` ✅ exists
- `components/QuickFactsHero.tsx` ✅ exists
- `components/CultivarTabs.tsx` ✅ exists

**The problem:** The cultivar page (`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`) was partially updated — it has a dark hero header and uses `QuickFactsHero` — but the **tabbed layout was never wired in**. All the visual components (ZoneBar, HarvestCalendar, HeightSilhouette) are buried inside `<Disclosure>` accordions that default to **closed**. Users see a wall of text sections with collapsed accordions instead of the scannable, visual-first experience shown in the prototype.

The species page (`app/plants/[speciesSlug]/page.tsx`) was never touched — it remains a plain text layout.

## Goal

Transform both cultivar AND species pages to match the prototype's visual-first, tabbed design. Users should see the most important visual data (zones, height, calendar, disease resistance) **immediately on page load** without clicking anything open.

---

## Reference: Design Prototype Key Patterns

The prototype (code attached to this sprint, also in screenshot) demonstrates these 8 patterns that must be replicated:

1. **Dark green hero header** — cultivar name, botanical name, breeder/year, icon quick-facts row, best price callout
2. **Tabbed navigation** — Overview, Growing, Fruit & Nut, Pollination, Buy tabs replacing the current scroll layout
3. **Zone Bar** — 13-column color-coded USDA zone display, prominent on Overview tab
4. **Height Silhouette** — SVG person-to-tree scale comparison in a card on Overview tab
5. **Harvest Calendar** — 12-month visual with bloom (yellow) and harvest (orange) highlighting
6. **Disease Resistance Meters** — 4-segment progress bars per disease (immune/resistant/moderate/susceptible)
7. **Pollination Compatibility** — S-allele badges, green "Good Partners" chips, red "Incompatible" chips
8. **Nut/Fruit Profile** — Visual nut with kernel percentage bar, flavor notes, storage quality

**Design tokens (from `globals.css` and `DESIGN_SYSTEM.md`):**
- Hero bg: `bg-accent-hover` (`--color-accent-hover: #1b4332`)
- Hero text: `text-surface-raised` (white/cream)
- Card containers: `Surface elevation="raised" padding="default"`
- Section labels: `text-text-tertiary`, uppercase, 11px, tracking-wider, font-semibold
- Border radius: `rounded-[var(--radius-lg)]` for cards, `rounded-[var(--radius-xl)]` for hero
- Spacing: `space-y-[var(--spacing-zone)]` between major sections

---

## Phase 1: Cultivar Page — Wire Tabbed Layout (MUST DO)

### Task 1.1: Activate CultivarTabs on the cultivar page

**File:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

Replace the current linear layout (hero → "Where to Buy" → notes → Disclosure accordions → etc.) with the `CultivarTabs` component.

**Steps:**
1. Import `CultivarTabs` and `TabId` from `@/components/CultivarTabs`
2. Keep the hero header (section 1) ABOVE the tabs — it stays fixed
3. Remove all `<Disclosure>` wrappers — content should be directly visible within tabs
4. Build the tabs array dynamically:
   ```tsx
   const tabs = [
     { id: 'overview' as TabId, label: 'Overview' },
     { id: 'growing' as TabId, label: 'Growing' },
     // Only show if production data exists
     ...(growingProfile?.harvest_season || growingProfile?.years_to_bearing_min != null
       ? [{ id: 'production' as TabId, label: 'Fruit & Nut' }]
       : []),
     { id: 'availability' as TabId, label: 'Buy', count: offers.length },
   ];
   ```
5. Pass tab content as `Record<TabId, ReactNode>`

### Task 1.2: Overview tab content

Reorganize into this order:
1. `cultivar.notes` description text (if exists)
2. **Side-by-side grid** (`grid gap-4 sm:grid-cols-2`) containing:
   - Left card: `ZoneBar` component in a `Surface` card with "USDA HARDINESS ZONES" label
   - Right card: `HeightSilhouette` component in a `Surface` card with "SIZE AT MATURITY" label
3. `HarvestCalendar` in a `Surface` card with "ANNUAL CALENDAR" label
4. **Metadata cards** in a 4-column grid (`grid gap-3 sm:grid-cols-2 lg:grid-cols-4`): Breeder, Origin, Released, Patent Status
5. `ZoneCompatibility` badge
6. Aliases and legal identifiers (if any)

**Section label pattern** (consistent across all cards):
```tsx
<Text variant="caption" color="tertiary"
  className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
  USDA HARDINESS ZONES
</Text>
```

### Task 1.3: Growing tab content

1. Growing requirements card (sun, water, soil pH) — use `Surface` with icon + label + value rows
2. Growth characteristics card (growth rate, root system, drought tolerance with bar, nitrogen fixer, lifespan, native range) — use `Surface` with label-value rows
3. `ZoneBar` full-width
4. `HeightSilhouette` with spread text
5. Existing `TraitGrid` component for detailed data
6. `EmptyState` fallback if no `growingProfile`

### Task 1.4: Production (Fruit & Nut) tab content

1. `HarvestCalendar` in a `Surface` card
2. Big-number stat cards in a 3-column grid (`grid gap-3 sm:grid-cols-3`):
   - Years to bearing (e.g., "3–5" large, "years" small)
   - Harvest season/window
   - Productive lifespan
3. Cultivar notes in a Surface card (if they mention production details)
4. Disease resistance section if data available (see Phase 3)

### Task 1.5: Availability (Buy) tab content

Move ALL existing pricing/availability content here:
1. Price comparison table (`PriceComparisonTable`)
2. Price history sparklines (`PriceSparkline`)
3. Alert signup form (`AlertSignupForm`)
4. Nursery map (`NurseryMap`)
5. Community listings section
6. "Know a nursery?" link

**Important:** The "Where to Buy" section currently sits directly after the hero — it should move INTO the Buy tab. The hero's "Best price" callout stays in the hero as a teaser.

---

## Phase 2: Species Page — Add Visual Components (SHOULD DO)

### Task 2.1: Add hero header to species page

**File:** `app/plants/[speciesSlug]/page.tsx`

Currently the species page has a plain `Text variant="h1"` header. Add a hero header matching the cultivar page pattern:

```tsx
<section className="rounded-[var(--radius-xl)] bg-accent-hover p-4 sm:p-6 text-surface-raised">
  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
    {/* Category icon placeholder */}
    <div className="hidden sm:flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-raised/10">
      <span className="text-4xl opacity-40">{getCategoryIcon(species.display_category)}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-surface-raised">
        {species.canonical_name}
      </h1>
      <p className="mt-1 text-surface-raised/70 italic">{species.botanical_name}</p>
      {/* Stats line: X cultivars · Y nurseries */}
      {/* QuickFactsRibbon or QuickFactsHero */}
    </div>
  </div>
</section>
```

Import `getCategoryIcon` from `@/lib/browse-categories` and `QuickFactsHero` from `@/components/QuickFactsHero`.

### Task 2.2: Add visual growing data to species page

After the cultivar list sections, add the visual components if `growingProfile` exists:

1. Side-by-side grid with `ZoneBar` and `HeightSilhouette` (matching cultivar Overview tab layout)
2. `HarvestCalendar`
3. Keep the existing `TraitGrid` in a `Disclosure` for full details

Currently the species page has:
```tsx
{growingProfile && (
  <section>
    <QuickFactsRibbon facts={buildQuickFacts(growingProfile)} />
    <ZoneCompatibility ... />
  </section>
)}
```

Replace with the richer visual layout while keeping `QuickFactsRibbon` in the hero.

---

## Phase 3: New Visual Components (NICE TO HAVE)

These components exist in the prototype but NOT in the repo. They require cultivar-level data that may not yet be seeded for all plants. Implement with graceful fallbacks.

### Task 3.1: Disease Resistance Meter

**New file:** `components/ResistanceMeter.tsx`

A 4-segment horizontal bar per disease. Each segment fills based on the resistance level: immune (4/4, green), resistant (3/4, light green), moderate (2/4, amber), susceptible (1/4, red).

**Data source:** `cultivar_traits` table → `disease_resistance` JSONB field. If no data exists, don't render.

```tsx
interface ResistanceMeterProps {
  diseases: Record<string, 'immune' | 'resistant' | 'moderate' | 'susceptible' | 'unknown'>;
}
```

**Colors:**
- immune: `#27ae60`
- resistant: `#7daa5c`
- moderate: `#f39c12`
- susceptible: `#e74c3c`

Show on the Overview tab in the cultivar page, next to or below the ZoneBar/HeightSilhouette grid.

### Task 3.2: Pollination Compatibility Visual

**New file:** `components/PollinationVisual.tsx`

Shows S-allele badges, compatible partners (green chips), and incompatible partners (red chips).

**Data source:** `cultivar_pollination_groups`, `pollination_compatibility` tables. If no data, show a placeholder card: "Pollination data coming soon" with a link to `/pollination/${speciesSlug}`.

```tsx
interface PollinationVisualProps {
  sAlleles: string[];
  compatiblePartners: { name: string; slug: string }[];
  incompatiblePartners: { name: string; slug: string }[];
  pollinationMechanism: string;
  maxPollinatorDistance?: number;
}
```

Compatible partner chips should link to the partner's cultivar page. Use green badge styling for compatible (`bg-accent-light border-accent-subtle text-accent`), red for incompatible.

### Task 3.3: Nut/Fruit Profile Card

**New file:** `components/NutProfile.tsx`

Visual representation of nut/fruit characteristics: weight, kernel percentage (as a fill bar), flavor notes, storage quality.

**Data source:** `cultivar_traits` table → `nut_weight_g`, `kernel_pct`, `flavor_notes`, `storage_quality` fields. If no data, don't render.

---

## File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` | **Major rewrite** — wire CultivarTabs, reorganize content into tab panels, remove Disclosure wrappers, promote visual components | MUST |
| `app/plants/[speciesSlug]/page.tsx` | **Edit** — add hero header, add visual growing components below cultivar list | SHOULD |
| `components/ResistanceMeter.tsx` | **New** — disease resistance 4-segment bar | NICE TO HAVE |
| `components/PollinationVisual.tsx` | **New** — S-allele + partner compatibility visual | NICE TO HAVE |
| `components/NutProfile.tsx` | **New** — nut/fruit characteristics card | NICE TO HAVE |

**No changes needed to these existing components** (they're ready to use):
- `components/ZoneBar.tsx`
- `components/HarvestCalendar.tsx`
- `components/HeightSilhouette.tsx`
- `components/QuickFactsHero.tsx`
- `components/CultivarTabs.tsx`

---

## Key Implementation Notes for Claude Code

### 1. Don't break the data layer
The current cultivar page has a well-structured data loading pattern — `getCultivarBySpeciesAndSlug`, `getOffersForCultivar`, `getGrowingProfile`, etc. Do NOT change any query logic. The restructuring is purely presentational: moving existing rendered content into tab panels.

### 2. Server vs Client boundary
- `CultivarTabs` is a `'use client'` component — it handles tab switching
- ALL tab content should be **server-rendered** and passed as children to CultivarTabs
- The tab component uses `hidden` class toggling, not lazy loading
- ZoneBar is `'use client'` (uses `useEffect` for user zone)
- HarvestCalendar, HeightSilhouette, QuickFactsHero are server components

### 3. Pattern for passing tab content
```tsx
<CultivarTabs tabs={tabs}>
  {{
    overview: (
      <div className="space-y-6">
        {/* Overview content */}
      </div>
    ),
    growing: (
      <div className="space-y-6">
        {/* Growing content */}
      </div>
    ),
    production: growingProfile?.harvest_season ? (
      <div className="space-y-6">
        {/* Production content */}
      </div>
    ) : <EmptyState title="No production data yet" description="..." />,
    availability: (
      <div className="space-y-6">
        {/* All pricing/availability content moved here */}
      </div>
    ),
  }}
</CultivarTabs>
```

### 4. Mobile responsiveness
- ZoneBar, HarvestCalendar: already have `overflow-x-auto` wrappers
- CultivarTabs: already has horizontal scroll for tab overflow
- Grids: use `sm:grid-cols-2` breakpoints — they stack on mobile
- Hero: uses `flex-col sm:flex-row` — stacks on mobile
- Test at 375px width

### 5. Handle missing data gracefully
Not all cultivars have growing profiles. The tab content should render `EmptyState` fallbacks when data is null:
```tsx
{growingProfile ? (
  <ZoneBar min={growingProfile.usda_zone_min} max={growingProfile.usda_zone_max} />
) : null}
```

### 6. Preserve all existing functionality
These must continue working after the restructure:
- JSON-LD structured data output
- Breadcrumbs
- OG metadata generation
- Price comparison table with offer IDs as keys
- Price sparklines
- Alert signup form
- Nursery map
- Community listings
- Related species links (species page)

---

## Testing Checklist

### Cultivar Page
- [ ] Hero header renders with dark green background, white text, cultivar name, botanical name
- [ ] QuickFactsHero shows zone, height, sun, harvest, bearing icons
- [ ] Best price callout appears in hero when offers exist
- [ ] Tab bar renders with correct tabs (Overview, Growing, Fruit & Nut, Buy)
- [ ] Tabs switch instantly (no layout shift, no loading)
- [ ] Overview tab: ZoneBar visible immediately (NOT inside a Disclosure)
- [ ] Overview tab: HeightSilhouette visible immediately
- [ ] Overview tab: HarvestCalendar visible immediately
- [ ] Overview tab: Metadata cards (breeder, origin, released, patent) visible
- [ ] Growing tab: TraitGrid renders with growing profile data
- [ ] Buy tab: PriceComparisonTable renders with all offers
- [ ] Buy tab: PriceSparkline renders for offers with history
- [ ] Buy tab: AlertSignupForm renders
- [ ] Buy tab: NurseryMap renders when pins exist
- [ ] Buy tab: Community listings section renders
- [ ] Pages with NO growing data show EmptyState in Growing tab
- [ ] Pages with NO offers show EmptyState in Buy tab with alert signup
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console warnings (especially no duplicate key warnings)

### Species Page
- [ ] Hero header renders with dark green background
- [ ] QuickFactsHero or QuickFactsRibbon shows in hero
- [ ] ZoneBar visible on page (not hidden in Disclosure)
- [ ] HeightSilhouette visible on page
- [ ] Cultivar list sections unchanged
- [ ] Related species links work
- [ ] Community listings section works

### Mobile (test at 375px width)
- [ ] Tabs scroll horizontally without clipping
- [ ] ZoneBar readable/scrollable on narrow screen
- [ ] HarvestCalendar scrollable on narrow screen
- [ ] Hero stacks vertically, no horizontal overflow
- [ ] No horizontal scrollbar on page body

### Smoke Test URLs
Test these live cultivar pages after deployment:
- A cultivar with offers and growing data (e.g., any hazelnut cultivar)
- A cultivar with NO offers (should show alert signup in Buy tab)
- A cultivar with NO growing profile (Growing tab should show EmptyState)
- A species page with multiple cultivars

---

## Prototype Source Code Reference

The full prototype React component is attached as `plant-page-prototype.jsx` in the conversation where this sprint was created. It uses mock data for a "Yamhill" hazelnut cultivar. Key visual patterns to reference:

- **ZoneBar**: Color gradient using `hsl(${140 - (z - min) * 12}, 55%, ${50 + (z - min) * 3}%)` — the repo component already implements this
- **HeightSilhouette**: Person (40px = 6ft) → tree min → tree max with SVG ellipse canopy — the repo component already implements this
- **HarvestCalendar**: 12-month grid, bloom = `#f1c40f`, harvest = `#e67e22` — the repo component already implements this
- **ResistanceMeter**: 4-segment bars, color-coded by resistance level — needs to be built (Phase 3)
- **PollinationVisual**: S-allele badges + green/red partner chips — needs to be built (Phase 3)
- **NutProfile**: Visual nut with kernel % bar — needs to be built (Phase 3)

The prototype's inline styles should be translated to Tailwind classes + CSS variables from the design system. Do NOT copy the prototype's inline styles verbatim.
