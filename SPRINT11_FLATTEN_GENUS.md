# Sprint 11: Flatten Genus Browse — Remove Species Grouping Layer

*Created 2026-03-11. Target: Eliminate the species navigation step so users go directly from Category → Genus → individual plants (species + cultivars in one flat list).*

---

## Background & Motivation

The current browse flow is: **Category → Genus → Species → Cultivars** (4 clicks to reach a buyable plant).

This sprint removes the species grouping step so the flow becomes: **Category → Genus → Plants** (3 clicks). When a user clicks "Hazelnuts" under "Nut Trees", they immediately see ALL hazelnut species and cultivars in one browsable, filterable, sortable list — rather than first having to pick between *Corylus americana* vs *Corylus avellana*.

**Why this matters:** Most permaculture shoppers think in common names ("I want a hazelnut"), not in Linnaean binomials. Forcing them through an extra species-selection step adds friction and makes comparison harder. The species info is still valuable — it just belongs as metadata on each card, not as a navigation barrier.

---

## Terminology — Read This First

To avoid confusion between "species" as a taxonomy rank and "species" as data, this sprint uses these terms:

- **"plant"** = a row in `plant_entities` (what we currently call a "species" in the DB — e.g., "American Hazelnut" / *Corylus americana*)
- **"cultivar"** = a named variety under a plant (e.g., "Jefferson" under *Corylus avellana*)
- **"plant card"** = the UI card shown in the flat list. Each card represents EITHER a plant (species) that has cultivars under it, OR a plant with no cultivars that is itself the end-level item.
- **"genus hub page"** = the page at `/plants/genus/[genusSlug]` — this is the page being redesigned

---

## What Changes (Summary)

| Area | Current Behavior | New Behavior |
|------|-----------------|--------------|
| **Homepage TaxonomyExplorer (column 3 / mobile depth 2)** | Shows species cards grouped by species, with expandable cultivar lists underneath | Shows a flat list of ALL plants + cultivars for the selected genus, with sort/filter controls |
| **Genus Hub Page** (`/plants/genus/[genusSlug]/page.tsx`) | Shows a grid of species cards — clicking one goes to the species page | Shows a flat, sortable, filterable list of ALL plants AND their cultivars. Species (botanical) name appears as metadata on each card, not as a navigation level |
| **API endpoint** (`/api/taxonomy/genus/[genusSlug]/route.ts`) | Returns `{ species: [...] }` where each species has `top_cultivars` nested inside | Returns a flat `{ plants: [...] }` array where each item is either a species-level entry OR a cultivar, with species name as a metadata field |
| **Genus Hub navigation from explorer** | Clicking a genus in the explorer goes to genus hub page | Same — no change to this routing |

---

## What Does NOT Change

- **The homepage Category → Genus navigation** in columns 1 and 2 of the TaxonomyExplorer — these stay exactly the same
- **The `/plants/[speciesSlug]` species detail page** — still exists, still accessible, just not the primary navigation path anymore
- **The `/plants/[speciesSlug]/[cultivarSlug]` cultivar detail page** — completely untouched
- **The "Refine" mode / BrowseContent** — untouched
- **Database schema** — no migrations needed. `plant_entities` and `cultivars` tables stay as-is
- **The `getTaxonomyTree()` query** — stays the same (it powers columns 1 & 2)
- **The `SearchBar` and search functionality** — untouched
- **The Explore/Refine mode toggle** — untouched

---

## Phase 1: New API Endpoint — Flat Genus Plants

### Task 1.1: Create new API route `/api/taxonomy/genus/[genusSlug]/plants/route.ts`

This new endpoint returns a FLAT list of all browsable items for a genus. Each item represents one "row" the user can see — either a plant (species-level) with no cultivars, or an individual cultivar.

**Request:** `GET /api/taxonomy/genus/{genusSlug}/plants?sort=name&species=corylus-avellana`

**Query params (all optional):**
- `sort` — one of: `name` (default), `price_low`, `price_high`, `nursery_count`
- `species` — filter to a specific species slug (e.g., `corylus-avellana`)
- `in_stock` — if `true`, only items with at least one active offer

**Response shape:**

```typescript
interface GenusPlantItem {
  // Identity
  id: string;                    // cultivar.id if cultivar, plant_entity.id if species-level
  type: 'cultivar' | 'species';  // what this row represents
  name: string;                  // display name — cultivar name OR species canonical_name
  slug: string;                  // URL slug for linking
  species_slug: string;          // parent species slug (for linking to species page)
  species_name: string;          // parent species canonical_name (e.g., "American Hazelnut")
  botanical_name: string | null; // e.g., "Corylus avellana"

  // Availability
  nursery_count: number;
  lowest_price_cents: number | null;

  // Growing info (inherited from species profile)
  zone_min: number | null;
  zone_max: number | null;

  // For building filter UI
  display_category: string | null;
}

interface GenusPlantListResponse {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  description: string | null;
  total_count: number;
  species_filter_options: Array<{ slug: string; name: string; count: number }>;
  items: GenusPlantItem[];
}
```

**Data assembly logic:**

1. Look up the genus node (same pattern as existing route — try slug, then `genus-` prefix)
2. Fetch in parallel: `plant_entities` for this genus, `cultivars` (published), `inventory_offers` (active), `species_growing_profiles`
3. For each plant (species):
   - If it has cultivars → emit one `GenusPlantItem` per cultivar (type: `'cultivar'`), with `species_name`, `botanical_name`, `zone_min/max` inherited from the plant's profile
   - If it has ZERO cultivars → emit one `GenusPlantItem` for the plant itself (type: `'species'`), linking to `/plants/{species_slug}`
4. Apply sort and filters from query params
5. Build `species_filter_options` by counting items per species (for the filter dropdown)
6. Cache: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (same as existing)

**Implementation notes:**
- The route file goes in `app/api/taxonomy/genus/[genusSlug]/plants/route.ts`
- Use `withRateLimit` wrapper (same as existing genus route)
- Use `apiSuccess` / `apiNotFound` helpers from `@/lib/api-helpers`
- Keep the existing `/api/taxonomy/genus/[genusSlug]/route.ts` working — do NOT delete or modify it. The explorer preview panel still uses it until Phase 3.

**Link building rules (IMPORTANT — get this right):**
- For `type: 'cultivar'` items → link to `/plants/{species_slug}/{cultivar_slug}`
- For `type: 'species'` items → link to `/plants/{species_slug}`

### Task 1.2: Add TypeScript types

Create `lib/types/genus-plants.ts` with the `GenusPlantItem` and `GenusPlantListResponse` interfaces shown above. Import them in the route handler and the client components (Phases 2 & 3).

---

## Phase 2: Redesign Genus Hub Page (`/plants/genus/[genusSlug]/page.tsx`)

This is the biggest change. The current page shows a **grid of species cards**. The new page shows a **flat, sortable, filterable list of all plants/cultivars** in the genus.

### Task 2.1: Create `GenusPlantList` client component

**File:** `components/genus/GenusPlantList.tsx`

This is a `'use client'` component that receives the initial data from the server page and handles sort/filter/search interactions.

**Props:**
```typescript
interface GenusPlantListProps {
  initialItems: GenusPlantItem[];
  speciesFilterOptions: Array<{ slug: string; name: string; count: number }>;
  genusSlug: string;
}
```

**UI layout:**

```
+----------------------------------------------------------+
| [Sort: Name ▾]  [Species: All ▾]  [☑ In Stock Only]     |
|  Showing 47 plants                                        |
+----------------------------------------------------------+
| +--------------------------+ +--------------------------+ |
| | Jefferson                | | Yamhill                  | |
| | Corylus avellana         | | Corylus avellana         | |
| | Z5-9 · 3 nurseries      | | Z5-9 · 2 nurseries      | |
| | From $22.00              | | From $28.50              | |
| +--------------------------+ +--------------------------+ |
| +--------------------------+ +--------------------------+ |
| | American Hazelnut        | | Winkler                  | |
| | Corylus americana        | | Corylus avellana         | |
| | Z3-9 · 1 nursery         | | Z4-8 · 1 nursery         | |
| | From $15.00              | | From $35.00              | |
| +--------------------------+ +--------------------------+ |
|                    ... more cards ...                      |
+----------------------------------------------------------+
```

**Toolbar behavior:**

- **Sort dropdown** — options: "Name (A-Z)", "Price (Low-High)", "Price (High-Low)", "Most Nurseries". Default: "Name (A-Z)". Sorting is client-side on the already-loaded data.
- **Species filter dropdown** — shows all species in the genus with counts: "All (47)", "European Hazelnut (32)", "American Hazelnut (12)", "Beaked Hazelnut (3)". Filtering is client-side.
- **In Stock Only toggle** — checkbox that filters to `nursery_count > 0`. Client-side.
- **Count label** — "Showing X plants" (updates reactively based on active filters)

**Card design (each `GenusPlantItem`):**

- Plant/cultivar name as the card title (use `Text variant="h3"` with `color="accent"`)
- Botanical name / species name in italic below (use `BotanicalName` component)
- Zone range badge if available: "Z5-9" (use existing `Tag` component)
- Nursery count badge: "3 nurseries" (use `Tag type="availability"`)
- Price: "From $22.00" if `lowest_price_cents` is set
- Card links to the correct detail page (cultivar page or species page, see link rules above)
- Use existing `Surface` component or match the card style from the current genus hub page (rounded border, hover state)

**Performance for large lists:**

- Initial render: show all items (most genera will have <100 items)
- If a genus has 50+ items after filtering, implement a simple "Show more" button that reveals 24 items at a time (NOT infinite scroll, NOT virtualization — keep it simple)
- Start by showing the first 24 items, with a "Show all X plants" button at the bottom

**Responsive design:**
- Mobile (<640px): single column of cards, toolbar stacks vertically
- Tablet (640-1023px): 2-column grid
- Desktop (1024px+): 2-column grid (keep it readable, don't go to 3 columns — the cards need space for info)

### Task 2.2: Update the Genus Hub Page server component

**File:** `app/plants/genus/[genusSlug]/page.tsx`

Changes to the page:
1. **Keep** the breadcrumbs, page header (genus name, botanical name, description), and JSON-LD
2. **Replace** the "Species in this Genus" grid section with the new `GenusPlantList` component
3. **Fetch data** using the `getGenusBySlug` query (already used) PLUS assemble the flat plant list server-side. You have two options:
   - **Option A (preferred):** Build the flat list directly in the page server component using data from `getGenusBySlug` + an additional cultivar detail query. This avoids an extra API roundtrip.
   - **Option B:** Fetch from the new `/api/taxonomy/genus/{slug}/plants` API. Simpler but adds a request.
   - Use Option A.
4. **Update the stats line** at the top to say something like "47 plants across 3 species · 12 nurseries with stock" instead of the current "3 species · 47 cultivars · 12 nurseries"
5. **Keep** the "Related Categories" section at the bottom — it's still useful

**Server-side data assembly (for Option A):**

Add a new function `getGenusPlantList()` in `lib/queries/genus.ts` (or a new file `lib/queries/genus-plants.ts`). This function:
1. Fetches the genus node, plant_entities, cultivars, offers, and profiles (same parallel pattern)
2. For each plant:
   - Get its cultivars (published)
   - For each cultivar: get nursery count, lowest price
   - If plant has cultivars → emit cultivar-level items
   - If plant has no cultivars → emit species-level item
3. Returns the flat array + species filter options

Pass the result to `GenusPlantList` as props.

### Task 2.3: Update page metadata

The `generateMetadata` function should reflect the new page purpose:
- Title: `"{CommonName} ({GenusName}) — Browse All Varieties & Availability"`
- Description: `"Compare {count} {commonName} varieties across nurseries. Filter by species, price, and availability."`

---

## Phase 3: Update TaxonomyExplorer Preview Panel (Column 3 / Mobile Depth 2)

The preview panel in the homepage TaxonomyExplorer currently shows species cards with expandable cultivar sub-lists. Update it to show a simpler flat list matching the new pattern.

### Task 3.1: Update `SpeciesPreviewPanel.tsx` → rename to `GenusPreviewPanel.tsx`

**Rename** `components/browse/SpeciesPreviewPanel.tsx` → `components/browse/GenusPreviewPanel.tsx`

**New behavior:**

Instead of showing species as cards with nested cultivar lists, show a flat list of items (same concept as the genus hub page, but in the compact preview panel format).

The existing API endpoint (`/api/taxonomy/genus/[genusSlug]`) already returns species with `top_cultivars` nested inside. Rather than creating a NEW API call for the preview, **flatten the existing response client-side**:

```typescript
// In the preview panel, flatten species + cultivars into a single list:
const flatItems: PreviewItem[] = [];
for (const species of data.species) {
  if (species.top_cultivars.length === 0) {
    // Species with no cultivars — show as its own item
    flatItems.push({
      name: species.canonical_name,
      botanical_name: species.botanical_name,
      slug: species.slug,
      href: `/plants/${species.slug}`,
      nursery_count: species.nursery_count,
      lowest_price_cents: null,
      zone_min: species.zone_min,
      zone_max: species.zone_max,
    });
  } else {
    // Emit each cultivar as its own item
    for (const cv of species.top_cultivars) {
      flatItems.push({
        name: cv.name,
        botanical_name: species.botanical_name,
        slug: cv.slug,
        href: `/plants/${species.slug}/${cv.slug}`,
        nursery_count: species.nursery_count, // approximate — shared from species level
        lowest_price_cents: cv.lowest_price_cents,
        zone_min: species.zone_min,
        zone_max: species.zone_max,
      });
    }
  }
}
```

**Preview panel card design (compact):**
- Name (bold, 13px)
- Botanical name (italic, 10px, tertiary)
- Zone badge + nursery badge inline
- Price if available
- Link to the correct page

**Keep the panel header** showing "{CommonName} — {count} plants" instead of "{CommonName} — {count} species"

**Add a "View all →" link** at the bottom of the preview panel that goes to `/plants/genus/{genusSlug}` — this is the main CTA to get users to the full genus hub page.

### Task 3.2: Update imports in `TaxonomyExplorer.tsx`

- Change import from `SpeciesPreviewPanel` → `GenusPreviewPanel`
- Update the type import if the interface name changed
- The `useSpeciesFetcher` hook and its cache can stay the same — it's still fetching from the same API endpoint

### Task 3.3: Update mobile drill-down (depth 2)

In the `MobileDrillDown` component inside `TaxonomyExplorer.tsx`:
- At depth 2, use the new `GenusPreviewPanel` instead of `SpeciesPreviewPanel`
- Same flat list treatment as desktop

---

## Phase 4: Polish & Edge Cases

### Task 4.1: Handle genera with large item counts

Some genera (Malus/apples, Prunus/stone fruit) could have 50-100+ items when flattened. Ensure:
- The "Show more" pattern from Task 2.1 works correctly
- The species filter dropdown helps narrow results
- The page doesn't feel overwhelming — consider showing the count prominently: "Showing 24 of 87 apple varieties"

### Task 4.2: Handle genera with NO cultivars

Some genera might only have species-level entries with no cultivars at all. The flat list should still work — each species becomes its own card linking to `/plants/{speciesSlug}`. The species filter dropdown should be hidden if there's only one species.

### Task 4.3: Empty states

- If ALL items are filtered out (e.g., "In Stock Only" with no stock) → show an appropriate empty state: "No {commonName} varieties currently in stock. Remove filters to see all varieties."
- If genus has zero plants → existing `notFound()` handling covers this

### Task 4.4: Update sitemap.ts if needed

Check `app/sitemap.ts` — if it references species-level URLs through the genus page structure, verify it still works. The species pages still exist, so this should be fine, but double-check.

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `app/api/taxonomy/genus/[genusSlug]/plants/route.ts` | **NEW** | Flat genus plant list API |
| `lib/types/genus-plants.ts` | **NEW** | Shared TypeScript interfaces |
| `lib/queries/genus-plants.ts` | **NEW** | Server-side query for flat plant list |
| `components/genus/GenusPlantList.tsx` | **NEW** | Client component: sortable/filterable flat list |
| `app/plants/genus/[genusSlug]/page.tsx` | **REWRITE** | Use GenusPlantList instead of species grid |
| `components/browse/SpeciesPreviewPanel.tsx` | **RENAME + REWRITE** → `GenusPreviewPanel.tsx` | Flat list instead of species→cultivar nesting |
| `components/browse/TaxonomyExplorer.tsx` | **EDIT** | Update imports from SpeciesPreviewPanel → GenusPreviewPanel |
| `app/api/taxonomy/genus/[genusSlug]/route.ts` | **NO CHANGE** | Keep working — preview panel still uses it |
| `lib/queries/taxonomy-tree.ts` | **NO CHANGE** | Powers columns 1 & 2, untouched |
| `lib/queries/genus.ts` | **NO CHANGE** | Keep existing `getGenusBySlug()` working |
| `components/browse/BrowsePageClient.tsx` | **NO CHANGE** | |
| `app/page.tsx` | **NO CHANGE** | |

---

## Design Tokens & Component Reuse

Use these existing components — do NOT create new UI primitives:

- `Surface` — card containers (`elevation="raised" padding="default"`)
- `Text` — typography (`variant="h3"` for card titles, `variant="caption"` for metadata)
- `Tag` — badges (`type="availability"` for nursery counts, `type="info"` for zone)
- `BotanicalName` — italic botanical name rendering
- `Breadcrumbs` — page breadcrumbs
- `EmptyState` — empty state fallbacks

**Colors from `globals.css`:**
- Card hover: `hover:border-border hover:bg-surface-raised`
- Accent links: `text-accent`
- Tertiary text: `text-text-tertiary`
- Filter active state: `bg-accent text-text-inverse` (match existing Explore/Refine toggle style)

---

## Testing Checklist

### Functionality
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm test` — all existing 230+ tests still pass
- [ ] New API endpoint `/api/taxonomy/genus/{slug}/plants` returns correct flat list
- [ ] Genre hub page shows flat list of plants + cultivars
- [ ] Cultivar cards link to `/plants/{speciesSlug}/{cultivarSlug}` (correct)
- [ ] Species-only cards link to `/plants/{speciesSlug}` (correct)
- [ ] Sort by name works (A-Z)
- [ ] Sort by price works (both directions, items with no price sort to end)
- [ ] Sort by nursery count works (highest first)
- [ ] Species filter dropdown shows correct species with counts
- [ ] Species filter correctly narrows the list
- [ ] "In Stock Only" toggle works
- [ ] "Show more" button appears when 50+ items, loads next batch
- [ ] Count label updates reactively ("Showing X plants")
- [ ] Preview panel in TaxonomyExplorer shows flat list
- [ ] "View all →" link in preview panel goes to genus hub page
- [ ] Mobile drill-down (depth 2) shows flat list
- [ ] Breadcrumbs on genus hub page still work: Home → Category → Genus Name
- [ ] Existing species pages (`/plants/{speciesSlug}`) still work and are accessible
- [ ] Existing cultivar pages (`/plants/{speciesSlug}/{cultivarSlug}`) still work
- [ ] JSON-LD structured data on genus hub page is valid
- [ ] Related Categories section at bottom of genus hub page still works

### Mobile (test at 375px in devtools)
- [ ] Filter toolbar stacks cleanly (no horizontal overflow)
- [ ] Cards are single-column and readable
- [ ] Sort/filter dropdowns are tappable (44px+ touch targets)
- [ ] "Show more" button is easily tappable
- [ ] Preview panel items don't overflow

### Desktop (test at 1024px+)
- [ ] Cards display in 2-column grid
- [ ] Filter toolbar is inline (horizontal)
- [ ] Preview panel in TaxonomyExplorer col 3 works correctly
- [ ] Hover states on cards work

### Edge Cases
- [ ] Genus with only 1 species and no cultivars → shows 1 card, hides species filter
- [ ] Genus with 100+ items → "Show more" pagination works
- [ ] Genus where all items lack stock → "In Stock Only" shows empty state, unchecking restores list
- [ ] Genus where no items have price data → sort by price still works (all sort to same position)

---

## What NOT To Do

1. **Do NOT delete the species detail pages** (`/plants/[speciesSlug]`). They still exist and are linked from various places.
2. **Do NOT modify the database schema.** This is purely a front-end/API change.
3. **Do NOT change the Explore/Refine toggle or BrowseContent.** Those are separate.
4. **Do NOT delete the existing `/api/taxonomy/genus/[genusSlug]/route.ts`.** The preview panel still uses it (it flattens client-side).
5. **Do NOT add infinite scroll or virtualization.** Simple "Show more" button is the right pattern for now.
6. **Do NOT introduce new npm dependencies.** Everything needed is already in the project.
7. **Do NOT break the `getTaxonomyTree()` query or the category/genus columns.** They are untouched.
8. **Do NOT use `any` or `@ts-ignore`.** TypeScript strict mode is enforced.

---

## Implementation Order

1. **Phase 1** (Task 1.1, 1.2) — New API + types. Test with curl/browser.
2. **Phase 2** (Tasks 2.1, 2.2, 2.3) — Genus hub page redesign. This is the core deliverable.
3. **Phase 3** (Tasks 3.1, 3.2, 3.3) — Preview panel update. Lower priority — can ship Phase 2 first.
4. **Phase 4** (Tasks 4.1–4.4) — Polish. Do after Phases 2 & 3 are working.

---

## Not In Scope (Future)

- Full-text search within the genus plant list (current client-side filtering is sufficient)
- Comparison mode ("compare these 3 hazelnuts side by side")
- Image thumbnails on plant cards (need image pipeline first)
- Saving/bookmarking plants
- Zone-based filtering on the genus page (zone filtering exists in Refine mode)
