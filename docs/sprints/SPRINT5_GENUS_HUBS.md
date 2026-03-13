# Sprint 5: Genus Hub Pages — "One Plant, Many Lenses"

> **Goal:** Add a genus-level browsing layer so users can discover all plants within a genus (e.g., "all Hazelnuts") without getting overwhelmed by species/cultivar scatter.
> **No new migrations required.** All data already exists in `taxonomy_nodes`.
> **Priority:** Do steps 1-3 first (core genus hub). Steps 4-5 are polish.

---

## Problem

Right now, hazelnuts appear as 4 separate species cards on the browse page: European Hazelnut, American Hazelnut, Beaked Hazelnut, Turkish Tree Hazel. A user who just wants "a hazelnut" has to scan all four individually and may miss some. There's no unified "Hazelnuts" page that shows everything at a glance.

The navigation currently goes: **Category → Species → Cultivar**. We're inserting a **Genus** level in between: **Category → Genus → Species → Cultivar**.

---

## Implementation Steps

### Step 1: Create `lib/queries/genus.ts`

New query file. Pattern matches the existing query files.

```typescript
// lib/queries/genus.ts

import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenusOverview {
  // From taxonomy_nodes
  id: string;
  slug: string;
  name: string;           // e.g. "Corylus"
  botanical_name: string | null;
  description: string | null;
  // Aggregated
  species: GenusSpeciesSummary[];
  total_cultivar_count: number;
  total_nursery_count: number;
  // Parent info for breadcrumbs
  family_name: string | null;
  family_slug: string | null;
  order_name: string | null;
}

export interface GenusSpeciesSummary {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  description: string | null;
  display_category: string | null;
  cultivar_count: number;
  nursery_count: number;
  // From growing profile
  zone_min: number | null;
  zone_max: number | null;
  sun_requirement: string | null;
  growth_rate: string | null;
  mature_height_min_ft: number | null;
  mature_height_max_ft: number | null;
}
```

**Functions to implement:**

#### `getGenusBySlug(supabase, genusSlug)`
1. Query `taxonomy_nodes` where `slug = genusSlug` and `rank = 'genus'`.
2. If not found, return null.
3. Get the parent node (family) via `parent_id` for breadcrumbs. Then get the family's parent (order) as well.
4. Query `plant_entities` where `taxonomy_node_id = genusNode.id` and `curation_status = 'published'`.
5. For each species, get cultivar count, nursery count, and growing profile — use the same parallel-query + in-memory aggregation pattern as `getAllBrowsePlants` in `browse.ts`.
6. Sum up total_cultivar_count and total_nursery_count across all species.
7. Return `GenusOverview`.

#### `getAllGenera(supabase)`
1. Query `taxonomy_nodes` where `rank = 'genus'` and `permaculture_relevant = true`.
2. For each genus, count species (via `plant_entities.taxonomy_node_id`) and cultivars.
3. Return array of `{ slug, name, botanical_name, species_count, cultivar_count, nursery_count }`.
4. This powers the browse page genus-grouped view.

**Important:** Follow the same error handling pattern as existing query files — `console.error` on failure, return empty/null.

---

### Step 2: Create `app/plants/genus/[genusSlug]/page.tsx`

New route. This is the genus hub page — the main deliverable.

**URL:** `/plants/genus/corylus` → "All Hazelnuts"

**Page structure:**

```
Breadcrumbs: Home > Nut Trees > Hazelnuts
─────────────────────────────────────────
h1: Hazelnuts
botanical: Corylus L.
stats: 4 species · 28 cultivars · 3 nurseries with stock

description: (from taxonomy_nodes.description)
─────────────────────────────────────────
h2: Species in this Genus

[Species Card Grid — 1-2 columns]
Each card shows:
  - canonical_name (linked to /plants/[speciesSlug])
  - botanical_name italic
  - Zone range bar (if growing profile exists)
  - cultivar_count + nursery_count badges
  - description snippet (line-clamp-2)
  - sun/growth rate tags if available
─────────────────────────────────────────
```

**Implementation notes:**
- Server component (async function, no 'use client').
- Use `getGenusBySlug()` from Step 1.
- Use the existing `Text`, `Tag`, `Breadcrumbs`, `RangeBar` components — do NOT create new UI components.
- Call `notFound()` if genus not found.
- Add `generateMetadata` for SEO (same pattern as species page).
- Add JSON-LD `ItemList` schema (same pattern as species page).
- Sort species by nursery_count desc, then canonical_name asc.

**Breadcrumb logic:**
- Use the `display_category` from the first species in the genus to determine the category label (e.g., "Nut Trees").
- If no display_category, fall back to family name.
- Breadcrumb items: `[{ label: 'Home', href: '/' }, { label: categoryName, href: '/browse?category=...' }, { label: genusCommonName }]`

**Common name mapping:**
The genus `name` field is the Latin name (Corylus, Castanea, etc.). We need a human-friendly common name for the h1. Add a simple lookup object at the top of the page (or in a shared util):

```typescript
const GENUS_COMMON_NAMES: Record<string, string> = {
  corylus: 'Hazelnuts',
  castanea: 'Chestnuts',
  juglans: 'Walnuts',
  carya: 'Hickories & Pecans',
  diospyros: 'Persimmons',
  sambucus: 'Elderberries',
  malus: 'Apples',
  prunus: 'Stone Fruits',
  gevuina: 'Chilean Hazelnut',
};
```

Put this in `lib/genus-names.ts` so it can be reused on the browse page.

---

### Step 3: Update browse page to support genus grouping

**Modify `components/BrowseContent.tsx`:**

Add a "Group by" toggle at the top of the browse content, next to the existing sort dropdown. Two modes:
- **Species** (current behavior, flat list) — default
- **Genus** (new, grouped view)

When genus mode is active:
- Group species by their genus (via taxonomy_node_id or a genus field).
- Display one card per genus showing: genus common name, species count, total cultivar count, total nursery count.
- Each genus card links to `/plants/genus/[genusSlug]`.
- Species that don't have a taxonomy_node_id show individually as "ungrouped" at the bottom.

**Modify `lib/queries/browse.ts`:**

Add a `genus_slug` and `genus_name` field to the `BrowsePlant` interface by joining through `plant_entities.taxonomy_node_id → taxonomy_nodes`. This requires adding one more parallel query to `getAllBrowsePlants`:

```typescript
// Add to the Promise.all:
supabase
  .from('taxonomy_nodes')
  .select('id, slug, name')
  .eq('rank', 'genus')
```

Then build a `Map<string, { slug: string; name: string }>` from taxonomy_node_id → genus info, and add `genus_slug` and `genus_name` to each BrowsePlant.

**Add to `BrowseFilters`:**
```typescript
groupBy?: 'species' | 'genus';
```

**New function `groupBrowsePlantsByGenus`:**
Takes the filtered `BrowsePlant[]` and returns:
```typescript
interface GenusBrowseGroup {
  genus_slug: string;
  genus_name: string;         // Latin name from taxonomy_nodes
  genus_common_name: string;  // from GENUS_COMMON_NAMES lookup
  species_count: number;
  cultivar_count: number;
  nursery_count: number;
  display_category: string | null;  // from first species
}
```

The BrowseContent component renders these as cards in genus mode, linking to `/plants/genus/[slug]`.

---

### Step 4: Update species page breadcrumbs & cross-links

**Modify `app/plants/[speciesSlug]/page.tsx`:**

The species page already fetches `taxonomyPath` (the recursive CTE lineage). Use this to:

1. **Enhance breadcrumbs** — currently `Home > European Hazelnut`. Change to:
   `Home > Nut Trees > Hazelnuts > European Hazelnut`

   The genus link in the breadcrumb goes to `/plants/genus/[genusSlug]`.

   Logic: find the genus node in `taxonomyPath`, use `GENUS_COMMON_NAMES` for the label, and find `display_category` for the category crumb.

2. **Add "See all" link** — Near the "Related Species" section (or replacing it when genus data is available), add a line:
   `Part of Hazelnuts (4 species) → View all`

   This can reuse the `relatedSpecies` query data — the count of related species + 1 (current) gives the total.

**Changes to Breadcrumbs component:**
The existing `Breadcrumbs` component already accepts an `items` array with `{ label, href? }`. No component changes needed — just pass more items from the species page.

---

### Step 5: Update homepage category cards

**Modify `lib/queries/plants.ts` → `getHomepageCategories`:**

Currently `top_species` returns the top 3 species by nursery count within each category. Change this to return genus-level entries instead:

```typescript
// Instead of:
top_species: [{ slug: 'corylus-avellana', canonical_name: 'European Hazelnut' }, ...]

// Return:
top_genera: [{ slug: 'corylus', common_name: 'Hazelnuts', species_count: 4 }, ...]
```

This requires grouping the species within each category by their genus (via taxonomy_node_id), then picking the top 3 genera by cultivar count.

**Modify `components/CategoryCard.tsx`:**
Update the card to render genus links (`/plants/genus/[slug]`) instead of species links (`/plants/[slug]`). Label them with the common name from `GENUS_COMMON_NAMES`.

**Fallback:** If a species has no taxonomy_node_id, it still appears directly as a species link (for ungrouped/uncategorized plants).

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| **Create** | `lib/genus-names.ts` | `GENUS_COMMON_NAMES` lookup map |
| **Create** | `lib/queries/genus.ts` | `getGenusBySlug`, `getAllGenera` |
| **Create** | `app/plants/genus/[genusSlug]/page.tsx` | Genus hub page |
| **Modify** | `lib/queries/browse.ts` | Add genus_slug/genus_name to BrowsePlant, add `groupBrowsePlantsByGenus` |
| **Modify** | `components/BrowseContent.tsx` | Add genus grouping toggle + genus card rendering |
| **Modify** | `app/plants/[speciesSlug]/page.tsx` | Enhanced breadcrumbs with genus + category levels, "see all" link |
| **Modify** | `lib/queries/plants.ts` | `getHomepageCategories` returns top_genera instead of top_species |
| **Modify** | `components/CategoryCard.tsx` | Render genus links instead of species links |

## Files NOT to modify

- No database migrations
- No changes to `lib/queries/cultivars.ts` or cultivar pages
- No changes to the pipeline, scrapers, or resolver
- No changes to the admin pages
- No changes to `KNOWLEDGE_GRAPH_SCHEMA.md` or `DESIGN_SYSTEM.md`
- No new UI components — reuse `Text`, `Tag`, `Breadcrumbs`, `RangeBar`, `TraitGrid`, `EmptyState`

---

## Testing Notes

- After Step 2, visiting `/plants/genus/corylus` should show all 4 Corylus species with their cultivar counts and growing profiles.
- After Step 3, the browse page should have a toggle that groups plants by genus. Selecting it should show ~9 genus cards instead of the flat species list.
- After Step 4, the European Hazelnut breadcrumb should read `Home > Nut Trees > Hazelnuts > European Hazelnut`, and clicking "Hazelnuts" should go to the genus hub.
- Species with no taxonomy_node_id should still work everywhere — they just show without genus grouping or genus breadcrumbs.

---

## Design Notes

- Follow "The Field Guide" design system — warm linen palette, Fraunces + Satoshi fonts.
- Genus hub page layout should feel like a calm overview, not a dense data dump. One column of species cards on mobile, two on desktop.
- Each species card on the genus hub should show just enough to differentiate: name, zone range, cultivar count, availability badge. Don't overload with every trait.
- The browse page genus-grouped cards should be visually distinct from species cards — slightly larger, showing the genus common name prominently with a count subtitle like "4 species · 28 cultivars".
