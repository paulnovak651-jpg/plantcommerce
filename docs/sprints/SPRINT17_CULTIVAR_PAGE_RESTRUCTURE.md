# Sprint 17 — Cultivar Page Restructure

> **Status:** Ready for implementation  
> **Depends on:** Nothing (standalone)  
> **Blocked by:** Nothing  
> **Must complete before:** Sprint 18 (Browse Filter + Availability)

---

## Goal

Restructure the cultivar page from the current 4-tab layout (Overview / Growing / Fruit & Nut / Buy) to a new 4-tab layout organized around buyer decision sequence. Eliminate data duplication across tabs. Add progressive disclosure (expandable sections) inside each tab so the page is scannable at a glance but deep on demand.

## Design Principle

**Keep the page about the plant. Keep the Buy layer about the offer.**

Every tab should answer a clear buyer question. No data field should appear in full form on more than one tab.

---

## Current State

### Files to modify

| File | Role | Change scope |
|------|------|--------------|
| `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` | Cultivar page (35KB, server component) | **Heavy** — restructure all tab content |
| `components/CultivarTabs.tsx` | Client-side tab switcher | **Light** — update `TabId` union type |
| `lib/types/index.ts` | `GrowingProfile`, `Cultivar` types | **Medium** — add new optional fields |

### Current tab structure in code

`CultivarTabs.tsx` defines `TabId = 'overview' | 'growing' | 'production' | 'availability'`.

The cultivar page builds a `tabs` array dynamically and passes content as `Record<TabId, ReactNode>` to `CultivarTabs`.

### Current data duplication

- `ZoneBar` renders in both Overview and Growing tabs
- `HeightSilhouette` renders in both Overview and Growing tabs
- `HarvestCalendar` renders in both Overview and Production tabs
- `ZoneCompatibility` renders in Overview only but logically belongs in Growing

---

## New Tab Structure

### Tab 1: At a Glance (id: `'glance'`)

**Buyer question:** "What is this and is it for me?"

**5-second layer (always visible):**
- `QuickFactsHero` in the hero section (already exists, keep as-is)
- Cultivar description / notes (2 sentences max, currently `cultivar.notes`)
- Truth badges row: 3-5 compact badges derived from data:
  - `material_type` badge (already exists as `Tag`)
  - "Native" badge (if `native_range_description` exists)
  - "Needs pollinizer" badge (new field, see schema below)
  - "Suckers / colony-forming" badge (new field)
  - Patent status badge (already exists, keep if not 'none'/'unknown')
- Price preview: best offer price + nursery name (already in hero, keep)
- "Available as" chips: seed / plant / cutting (derived from offer `sale_form` values)

**2-minute layer (expandable via `Disclosure` component):**
- Breeder, origin, year released metadata cards (move from current Overview)
- Aliases section (move from current Overview)
- Legal identifiers (move from current Overview)

**What moves OUT of this tab:**
- `ZoneBar` → moves to Growing tab exclusively
- `HeightSilhouette` → moves to Growing tab exclusively
- `HarvestCalendar` → moves to Harvest + Ecosystem tab exclusively
- `ZoneCompatibility` → moves to Growing tab

### Tab 2: Growing (id: `'growing'`)

**Buyer question:** "Will this work on my site and what does it need?"

**5-second layer:**
- `ZoneBar` (sole location, remove from Overview)
- Growing requirements card: sun / soil drainage / soil pH (already exists in Growing tab)
- `HeightSilhouette` + spread (sole location)
- Growth habit badge: upright / spreading / colony-forming (new field)

**2-minute layer (expandable `Disclosure` sections):**
- "Site tolerance" section: drought tolerance, wet-feet tolerance, shade tolerance, salt tolerance (new fields, render only if data exists)
- "Care & maintenance" section: pruning needs, irrigation during establishment, deer browse pressure (new fields)
- "Problems & resilience" section: disease resistance/susceptibility, pest concerns, climate risks (new fields)
- "Rootstock options" section: available rootstocks with size class and disease trait notes (new field, render only if data exists)
- "Landscape use" section: hedgerow / screen / orchard / windbreak / small-space suitability tags (new fields)
- `TraitGrid` full detail (already exists, move inside a Disclosure)

### Tab 3: Harvest + Ecosystem (id: `'harvest'`)

**Buyer question:** "What will I get and how does this fit my system?"

**5-second layer:**
- `HarvestCalendar` (sole location)
- Pollination status: self-fertile / needs pollinizer / recommended pollinizer (new field)
- Compatible pollinizers list (new field, render as linked chips if cultivars exist in DB)
- Years to bearing + harvest window + growth rate stat cards (move from current Production tab)

**2-minute layer (expandable `Disclosure` sections):**
- "Fruit & nut detail" section: nut/fruit size, flavor profile, shell thickness, kernel percentage, culinary uses, storage (new fields)
- "Pollination deep dive" section: bloom timing, pollen shed timing, pollination group (new fields)
- "Ecosystem role" section: food forest layer, wildlife food value, pollinator value, host plant value, native range description (new + existing fields)
- "Guild & companions" section: nitrogen fixer status, dynamic accumulator status, companion plant suggestions (new fields — only populate with evidence-based data)

### Tab 4: Buy (id: `'buy'`)

**Buyer question:** "Where do I get this?"

Keep current Buy tab content largely as-is:
- `PriceComparisonTable` (already exists)
- `PriceSparkline` (already exists)
- `AlertSignupForm` (already exists)
- `NurseryMap` (already exists)
- Community listings section (already exists)

**Add:**
- "Compare similar cultivars" link to `/compare` with this cultivar pre-selected
- "Alternatives" section: if no offers, show related cultivars that DO have offers (already partially exists as `relatedSpeciesWithOffers`)

---

## Schema Changes

### New optional columns on `species_growing_profiles` table

These are additive — all nullable, no breaking changes. Add via Supabase migration.

```sql
ALTER TABLE species_growing_profiles
  ADD COLUMN IF NOT EXISTS drought_tolerance text,
  ADD COLUMN IF NOT EXISTS shade_tolerance text,
  ADD COLUMN IF NOT EXISTS growth_habit text,
  ADD COLUMN IF NOT EXISTS deer_browse_pressure text,
  ADD COLUMN IF NOT EXISTS suckering_tendency text,
  ADD COLUMN IF NOT EXISTS pollination_requirement text,
  ADD COLUMN IF NOT EXISTS food_forest_layer text,
  ADD COLUMN IF NOT EXISTS wildlife_value text,
  ADD COLUMN IF NOT EXISTS pollinator_value text;
```

### Update `GrowingProfile` type in `lib/types/index.ts`

Add corresponding optional fields:

```typescript
export interface GrowingProfile {
  // ... existing fields ...
  drought_tolerance: string | null;
  shade_tolerance: string | null;
  growth_habit: string | null;
  deer_browse_pressure: string | null;
  suckering_tendency: string | null;
  pollination_requirement: string | null;
  food_forest_layer: string | null;
  wildlife_value: string | null;
  pollinator_value: string | null;
}
```

---

## Implementation Steps

### Phase A: Schema + types (no UI changes)

1. Run migration to add new columns to `species_growing_profiles`
2. Update `GrowingProfile` type in `lib/types/index.ts`
3. Verify `getGrowingProfile` query in `lib/queries/growing.ts` returns new fields (it should if using `select *`, otherwise add them)
4. Run `npx tsc --noEmit` — must pass
5. Run `npm test` — must pass

### Phase B: Update CultivarTabs

1. Change `TabId` type in `components/CultivarTabs.tsx`:
   ```typescript
   export type TabId = 'glance' | 'growing' | 'harvest' | 'buy';
   ```
2. No other changes to CultivarTabs needed — it's a generic tab renderer

### Phase C: Restructure cultivar page

1. Update the `tabs` array construction in `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`:
   ```typescript
   const tabs: { id: TabId; label: string; count?: number }[] = [
     { id: 'glance', label: 'At a Glance' },
     { id: 'growing', label: 'Growing' },
     { id: 'harvest', label: 'Harvest & Ecosystem' },
     { id: 'buy', label: 'Buy', count: offers.length },
   ];
   ```
2. Move content blocks between tabs per the spec above
3. Wrap deep content in `<Disclosure>` components (already imported)
4. Add truth badges row to the Glance tab
5. Add "Available as" chips derived from: `[...new Set(offers.map(o => o.sale_form).filter(Boolean))]`

### Phase D: Validation

1. `npx tsc --noEmit` — clean
2. `npm test` — 230+ tests pass
3. Visual check: navigate to `/plants/corylus-americana/dwarf-american-hazelnut` and verify all 4 tabs render, no data duplication, Disclosure sections expand/collapse
4. Check mobile: tab bar should not overflow with 4 tabs (current 4 tabs already fit)

---

## What NOT to Do

- Do NOT create new components for this sprint — reuse `Disclosure`, `Surface`, `Tag`, `Text`, existing design system
- Do NOT add data population — this sprint restructures the UI only. New fields will be null and sections will gracefully hide
- Do NOT change the species page (`app/plants/[speciesSlug]/page.tsx`) — that's a separate concern
- Do NOT change URLs or routing
- Do NOT touch the browse system, PlantCard, or TaxonomyExplorer
