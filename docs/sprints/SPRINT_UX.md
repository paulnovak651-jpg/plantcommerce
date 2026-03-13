# PlantCommerce — UX Improvement Task Spec

> **Created:** 2026-03-11
> **Purpose:** Single source of truth for all UX/UI improvements before public launch.
> **For:** Claude Code execution. Every task maps to specific files, components, and queries.
> **Status:** All tasks approved. Execution order is flexible — do them in whatever sequence makes sense.

---

## Strategic Frame

PlantCommerce must do one job extremely well:

**Help a user find a plant quickly, trust the data, and see where to buy it at the best price.**

That means the product has three layers, in order of importance:

1. **Discovery** — search, browse, filters, taxonomy hierarchy
2. **Decision support** — zone compatibility, growing facts, pollination, comparisons
3. **Transaction intelligence** — price, inventory, nursery trust, freshness, alerts

Every task below serves one of these layers. Nothing is decorative-first.

---

## A. UNIFIED EXPLORATION

### A1 — Merge search + browse into one surface

**Problem:** `/search` and `/browse` are separate pages. Users shouldn't choose between keyword and filters — they should do both in one place.

**What to do:**
- Add a `q` (keyword) parameter to the existing BrowseContent filter state
- Add a persistent search input at the top of the browse page (above the sort bar)
- When `q` is set, filter `allPlants` client-side using the same trigram/substring matching the search page uses — OR switch to a server query against `material_search_index` when keyword is present
- URL state becomes: `/browse?q=hazelnut&category=Nut+Trees&zoneMin=4&zoneMax=4&available=true&sort=name-asc`
- Every state is shareable/bookmarkable (already true for filters — extend to include `q`)
- Redirect `/search?q=X` to `/browse?q=X` (keep `/search` working via redirect for existing links)

**Files to modify:**
- `components/BrowseContent.tsx` — add `q` to `BrowseFiltersState`, add search input above sort bar, integrate keyword filtering
- `app/browse/page.tsx` — pass search query to BrowseContent if switching to server-side keyword search
- `lib/queries/browse.ts` — add optional `q` parameter to `filterBrowsePlants()` if doing client-side filtering; or create a new hybrid query that combines keyword search with faceted filters
- `app/search/page.tsx` — add a redirect or `<meta>` redirect to `/browse?q=...`
- `components/ui/SearchBar.tsx` — the homepage SearchBar currently navigates to `/search`. Update to navigate to `/browse?q=...`

**New component:** None needed — reuse `SearchBar` inline within BrowseContent.

### A2 — Search autocomplete

**Problem:** Users type blind. No feedback until they hit enter.

**What to do:**
- Add a debounced autocomplete dropdown to the SearchBar component
- On 3+ characters typed, query a lightweight endpoint (or client-side filter) that returns top 8 matches: genus common names, species common names, cultivar names
- Dropdown shows results grouped: "Genera", "Species", "Cultivars" with links
- Clicking a result navigates directly to that page
- Keyboard navigation: arrow keys + enter

**Data source:** The existing `material_search_index` materialized view has `search_text`, `canonical_name`, and `slug` — query it with `ilike` and limit 8.

**Files to modify:**
- `components/ui/SearchBar.tsx` — add autocomplete state, dropdown rendering, debounce logic
- Create `app/api/autocomplete/route.ts` — lightweight GET endpoint accepting `?q=haz` returning `[{name, slug, type}]`

**Alternatively:** Do it entirely client-side in BrowseContent by filtering the already-loaded `allPlants` array. This avoids a new API endpoint but only works within /browse. The API approach works from the homepage too.

### A3 — Filter counts on every option

**Problem:** `PlantFilterSidebar` shows checkboxes with no indication of how many results each option produces. Users filter blind.

**What to do:**
- For each filter option (every category, every sun value, every growth rate, the "In stock" toggle), compute the count of plants that match the *current* filters with that option toggled on
- Display counts inline: `Nut Trees (47)`, `Full Sun (23)`, `In stock (38)`
- Gray out / reduce opacity on options that would produce 0 results (but still allow clicking to clear other filters)
- Counts must update dynamically as other filters change

**Implementation:**
- In `BrowseContent.tsx`, compute facet counts using a `useMemo` that runs `filterBrowsePlants()` for each possible option value against the current filter state (excluding that facet)
- Pass counts to `PlantFilterSidebar` as a new prop: `facetCounts: { categories: Record<string, number>, sun: Record<string, number>, growthRate: Record<string, number>, available: number }`
- This is client-side computation on the already-loaded `allPlants` array — no new queries needed

**Files to modify:**
- `components/BrowseContent.tsx` — compute facet counts, pass to sidebar
- `components/PlantFilterSidebar.tsx` — accept `facetCounts` prop, render counts next to each checkbox label, apply muted styling when count === 0

### A4 — Zero-result filter prevention

**Problem:** Users can select filter combinations that produce zero results, then see a dead-end empty state.

**What to do:**
- When a filter option's count is 0 (from A3 above), apply `opacity-50 cursor-not-allowed` styling
- Optionally: prevent selection of zero-result filters entirely, or allow it but show an inline message: "No plants match this combination"
- The existing "No plants match your filters" empty state + "Clear all filters" button should remain as a safety net

**Files to modify:**
- `components/PlantFilterSidebar.tsx` — conditional styling based on facet counts

### A5 — Mobile full-screen filter sheet

**Problem:** The current mobile filter is a 320px slide-in from the left. It's cramped and doesn't follow the standard mobile e-commerce pattern (full-screen modal with sticky apply/clear).

**What to do:**
- Replace the current mobile sheet with a full-screen overlay
- Sticky header: "Filters" title + close button + live result count ("Showing 47 plants")
- Filter sections as expandable accordions (reuse `Disclosure` component)
- Sticky footer: "Clear All" (left) + "Show X Results" button (right, primary CTA)
- Tapping "Show X Results" closes the sheet and scrolls to top of results
- Filter count badge on the trigger button: `Filters (3)` when 3 filters are active
- Scroll position of results preserved when sheet opens/closes

**Files to modify:**
- `components/PlantFilterSidebar.tsx` — rewrite the `sheetOpen` mobile section. Change from `w-80 left-slide` to `inset-0 full-screen`. Add sticky header/footer with result count and apply button.
- `app/globals.css` — update or replace `filter-sheet-enter` / `filter-sheet-backdrop-enter` animations for full-screen

**The desktop sidebar layout (`<aside className="hidden lg:block">`) stays exactly as-is.** Only the mobile `lg:hidden` path changes.

---

## B. TRUST & PRICING SIGNALS

### B1 — PlantCard redesign

**Problem:** PlantCard currently shows name, botanical name, zone range (small text), and nursery count. It doesn't surface the most important signal: price.

**What to do:**
- Add `lowestPrice` prop (number | null) and `bestNursery` prop (string | null) to `PlantCardProps`
- When price data exists, show: "from $18.00" in a prominent position (below botanical name, above zone)
- Promote zone badge: change from plain text `Zone 3–7` to a styled `Tag` component: `<Tag type="neutral">Z3–7</Tag>`
- Keep the existing nursery count overlay on the image
- Keep cultivar count as hover-reveal (current behavior is good)

**Files to modify:**
- `components/PlantCard.tsx` — add price/nursery props, restructure card layout
- `lib/queries/browse.ts` — extend `BrowsePlant` interface and `getAllBrowsePlants()` query to include `lowest_price_cents` and `best_nursery_name` from a join against `inventory_offers`
- `app/browse/page.tsx` — pass new data through

**Query sketch for lowest price:**
```sql
LEFT JOIN LATERAL (
  SELECT io.price_cents, n.name AS nursery_name
  FROM inventory_offers io
  JOIN nurseries n ON n.id = io.nursery_id
  WHERE io.plant_entity_id = pe.id AND io.offer_status = 'active' AND io.price_cents IS NOT NULL
  ORDER BY io.price_cents ASC
  LIMIT 1
) best_offer ON true
```

### B2 — "Last updated" timestamps everywhere

**Problem:** Users see prices but don't know if they're from yesterday or 3 months ago. This erodes trust.

**What to do:**
- On cultivar pages: show "Prices last checked: March 10, 2026" below the PriceComparisonTable — derived from the most recent `import_runs.finished_at` for the relevant nurseries
- On nursery detail pages: show "Inventory last updated: March 10, 2026" from `nurseries.last_scraped_at` (column already exists)
- On PlantCard: optionally show a subtle "Updated 2d ago" or a green dot indicating data is <7 days old

**Files to modify:**
- `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` — add timestamp query and display
- `app/nurseries/[nurserySlug]/page.tsx` — display `last_scraped_at`
- `lib/queries/nurseries.ts` — ensure `last_scraped_at` is included in nursery queries
- `components/PriceComparisonTable.tsx` — accept optional `lastCheckedAt: string` prop, render below table

### B3 — Cultivar page restructured price-first

**Problem:** Cultivar pages currently present botanical info first, with price comparison lower. But the user's primary question on a cultivar page is: "Can I buy it, from whom, for how much?"

**What to do:**
Reorder the cultivar page layout to:

1. **Name + species** (breadcrumbs, canonical name, botanical name, species link)
2. **Best price callout** — if offers exist: "Best price: $18.00 at Burnt Ridge" with direct link CTA
3. **Price comparison table** (PriceComparisonTable component — already exists and is good)
4. **Stock freshness** — "Prices last checked March 10, 2026"
5. **Stock alert** — if no offers OR always: AlertSignupForm
6. **Quick facts ribbon** — 4-5 key growing attributes as compact icon+label pairs (zone, height, sun, bearing age, pollination type)
7. **Growing detail** — full TraitGrid in a collapsible `Disclosure`
8. **Pollination info** — in a collapsible `Disclosure`
9. **Nursery map** — NurseryMap component (already exists)
10. **Community listings** — ListingCard list (already exists)

**Files to modify:**
- `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` — reorder sections, wrap lower sections in `Disclosure` components
- Create `components/QuickFactsRibbon.tsx` — compact horizontal display of 4-5 key traits extracted from growing profile

### B4 — Price history sparkline

**Problem:** `price_history` table exists and `lib/queries/price-history.ts` exists but there's no frontend surface.

**What to do:**
- On cultivar pages, if there are 3+ price history entries for any offer, render a small SVG sparkline chart (no library — pure SVG, ~50 lines of code)
- Show below the PriceComparisonTable: a small line per nursery, x-axis = time, y-axis = price
- Keep it simple: no axes labels, just the line + hover tooltip showing date + price
- If insufficient data (<3 points), don't render anything — no empty state needed here

**Files to modify:**
- Create `components/PriceSparkline.tsx` — pure SVG line chart component
- `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` — query price history, render sparkline
- `lib/queries/price-history.ts` — already has `getPriceHistory()` — verify it returns what the sparkline needs

### B5 — Nursery trust badges

**Problem:** Users don't know whether inventory data is live-scraped or stale.

**What to do:**
- In the PriceComparisonTable and on nursery detail pages, show a trust indicator:
  - **"Live Inventory"** (green) — nursery has `consent_status = 'approved'` AND `last_scraped_at` within 14 days
  - **"Tracked"** (amber) — nursery has active scraper but `consent_status != 'approved'`
  - **"Community Data"** (gray) — no active scraper, data from community listings
- Use the existing `Tag` component with appropriate `type` prop

**Files to modify:**
- `components/PriceComparisonTable.tsx` — add trust badge column/indicator
- `lib/queries/nurseries.ts` — include `consent_status` and `last_scraped_at` in nursery queries used by comparison tables

### B6 — Data completeness badges on PlantCard

**Problem:** Many species have growing data but no inventory. Users can't tell at a glance what kind of information is available.

**What to do:**
- Add a subtle signal to PlantCard:
  - If `nurseryCount > 0`: the existing green nursery overlay is sufficient
  - If `nurseryCount === 0` but growing profile exists: show a small "Growing info" badge (amber)
  - If neither: show nothing extra (the card is still useful as a database entry)
- This is a lightweight addition — don't over-design it

**Files to modify:**
- `components/PlantCard.tsx` — add `hasGrowingProfile: boolean` prop, conditional badge rendering
- `lib/queries/browse.ts` — extend `BrowsePlant` to include `has_growing_profile` boolean from a left join on `species_growing_profiles`

---

## C. EMPTY STATE STRATEGY

### C1 — Rich empty states with actionable CTAs

**Problem:** When a cultivar has no offers, the page shows minimal info. Users hit dead ends.

**What to do:**
- When `offers.length === 0` on a cultivar page:
  - Primary message: "No tracked nurseries currently stock [Cultivar Name]"
  - CTA 1: AlertSignupForm (already exists) — "Get notified when it's available"
  - CTA 2: "Know a nursery that carries this? Let us know" — link to `/marketplace/submit` prefilled with the cultivar name
  - CTA 3: "Browse other [Species Name] cultivars" — link back to species page
- When species has no cultivars:
  - "No cultivar data yet for [Species Name]. This species is being catalogued."
  - "Browse related species" — link to genus hub page
- On browse page when filters produce zero results:
  - Current "No plants match your filters" + "Clear all filters" is fine — keep it

**Files to modify:**
- `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` — replace the bare EmptyState with richer content and CTAs
- `components/ui/EmptyState.tsx` — extend to accept a `children` slot for custom CTA content (currently only accepts `title` and `description` strings)
- `app/plants/[speciesSlug]/page.tsx` — enhance the "No cultivar data yet" empty state with genus hub link

### C2 — Cross-links on sparse pages

**Problem:** Sparse genus pages (few cultivars) feel like dead ends.

**What to do:**
- On genus hub pages (`/plants/genus/[genusSlug]`), if the genus has fewer than 3 species with offers, add a "Related categories" section linking to populated genera in the same category
- On species pages with 0 offers across all cultivars, add: "Looking to buy? These related species have nursery stock:" + links to species in the same genus that DO have offers

**Files to modify:**
- `app/plants/genus/[genusSlug]/page.tsx` — add related genera section
- `app/plants/[speciesSlug]/page.tsx` — add "species with stock" cross-links when current species has no offers
- `lib/queries/plants.ts` — add `getRelatedSpeciesWithOffers()` query

---

## D. PAGE RESTRUCTURING

### D1 — Species page progressive disclosure

**Problem:** Species page currently shows everything in a flat stack: breadcrumbs, header, growing profile, cultivar sections, related species, community listings. The growing profile (TraitGrid) is prominently displayed even though most users are scanning for cultivar availability.

**What to do:**
Restructure the species page layout:

1. **Hero section** — breadcrumbs, name, botanical name, stats line (already exists and is good)
2. **Quick facts ribbon** — 4-5 key traits as compact icon+label pairs extracted from growing profile. Always visible. (Reuse the `QuickFactsRibbon` component from B3.)
3. **Cultivars section** — default open, the most important content. Keep the current grouped layout (clones, seed strains, populations). Already works well.
4. **Growing Guide** — wrap the full `TraitGrid` in a `Disclosure` component, default *collapsed*
5. **Pollination** — if pollination data exists, wrap in `Disclosure`, default collapsed
6. **Related Species** — keep as-is (pill links), no disclosure needed
7. **Community Listings** — keep as-is

The key change: move TraitGrid from always-visible to collapsed, and replace its visual prominence with the compact QuickFactsRibbon.

**Files to modify:**
- `app/plants/[speciesSlug]/page.tsx` — wrap TraitGrid in `<Disclosure title="Full Growing Guide" defaultOpen={false}>`, add QuickFactsRibbon above cultivars
- `components/ui/Disclosure.tsx` — already exists and works

### D2 — Homepage dynamic sections

**Problem:** Homepage is Hero → "How It Works" → Category Grid → "Browse All". It's a brochure. No reason to come back.

**What to do:**
Add dynamic data sections to the homepage, between the category grid and the footer:

- **"Recently Restocked"** — 6-8 cultivar cards where `inventory_offers.updated_at > NOW() - 7 days`
- **"Best Deals"** — 6-8 cultivars with lowest `price_cents` across all active offers
- **"New to the Database"** — 6-8 recently added cultivars by `cultivars.created_at` (need to verify this column exists)
- **"Popular in Zone X"** — if user's zone is detected (from `getUserZone()`), show species matching that zone. This is a *client-side* section since zone comes from localStorage.

Each section: horizontal scrolling row on mobile (CSS `overflow-x-auto` + `snap-x`), wrapped grid on desktop. Reuse PlantCard or create a smaller `CompactCard` variant.

Demote "How It Works" — move it below the dynamic sections, or move it to an `/about` route.

**Files to modify:**
- `app/page.tsx` — add server queries for recently restocked, best deals, new additions. Add section rendering.
- `lib/queries/plants.ts` — add `getRecentlyRestocked()`, `getBestDeals()`, `getNewAdditions()` queries
- Create `components/HomepageSection.tsx` — reusable horizontal scrolling section with title, "See all →" link, and card slots

**Query sketches:**

Recently restocked:
```sql
SELECT DISTINCT c.slug, c.canonical_name, pe.slug AS species_slug, pe.botanical_name, io.price_cents, n.name
FROM inventory_offers io
JOIN cultivars c ON c.id = io.cultivar_id
JOIN plant_entities pe ON pe.id = c.plant_entity_id
JOIN nurseries n ON n.id = io.nursery_id
WHERE io.offer_status = 'active' AND io.updated_at > NOW() - INTERVAL '7 days'
ORDER BY io.updated_at DESC LIMIT 8
```

Best deals:
```sql
SELECT c.slug, c.canonical_name, pe.slug AS species_slug, pe.botanical_name, MIN(io.price_cents) AS lowest_price, COUNT(DISTINCT io.nursery_id) AS nursery_count
FROM inventory_offers io
JOIN cultivars c ON c.id = io.cultivar_id
JOIN plant_entities pe ON pe.id = c.plant_entity_id
WHERE io.offer_status = 'active' AND io.price_cents IS NOT NULL
GROUP BY c.id, c.slug, c.canonical_name, pe.slug, pe.botanical_name
ORDER BY lowest_price ASC LIMIT 8
```

---

## E. VISUAL DENSITY & DESIGN REFINEMENT

### E1 — Reduce over-containerization

**Problem:** Cards on browse/genus pages use heavy borders + background + padding + radius. At scale this creates visual noise.

**What to do:**
- On the browse grid: lighten `PlantCard` — reduce or remove the `bg-surface-raised` when there are many cards. Use border-only or subtle shadow.
- On genus hub groups (`GenusGroupCard` in BrowseContent): lighten the border treatment. Consider `border-border-subtle` instead of `border-border`.
- Species page cultivar cards: already use `border-border-subtle` — good. Keep as-is.
- Goal: when 20+ cards are on screen, the grid should feel like a cohesive browsing surface, not a pile of boxes.

**Files to modify:**
- `components/PlantCard.tsx` — consider `bg-surface-primary` (lighter) instead of `bg-surface-raised`
- `components/BrowseContent.tsx` — `GenusGroupCard` border/bg treatment

### E2 — Stronger typography hierarchy

**Problem:** Some pages use `Text` component variants inconsistently. Section headers, card titles, and metadata text don't always have clear visual hierarchy.

**What to do:**
- Audit all pages for consistent use of `Text` component variants: `h1` for page titles, `h2` for sections, `h3` for card titles, `body` for content, `sm`/`caption` for metadata
- Ensure Fraunces (serif) is used for h1/h2/h3, Satoshi for body/ui text
- Price text should use `tabular-nums` for alignment in comparison tables (already applied per DESIGN_SYSTEM.md — verify it's consistent)

**Files to audit:**
- All page files in `app/` directory
- `components/PriceComparisonTable.tsx`
- `components/PlantCard.tsx`
- `components/CategoryCard.tsx`

### E3 — Card hover and interaction polish

**What to do:**
- PlantCard: the existing `plant-card-hover` class should produce a noticeable but not jarring lift. Verify it includes `translateY(-2px)` + `box-shadow` increase on hover.
- Cultivar cards on species page: add the same hover treatment
- GenusGroupCard: already has `hover:bg-surface-raised hover:border-border` — good
- All clickable cards should have `cursor-pointer` (verify)
- Focus states for keyboard nav: visible outline on all interactive cards

**Files to modify:**
- `app/globals.css` — verify `.plant-card-hover` definition
- `app/plants/[speciesSlug]/page.tsx` — add hover class to cultivar card `<div>`

### E4 — Toast notification system

**What to do:**
- Create a lightweight toast component for user feedback:
  - "Stock alert created!" (after AlertSignupForm submit)
  - "Listing submitted for review" (after marketplace submit)
- Implementation: a `ToastProvider` context + `useToast()` hook
- Position: bottom-right, auto-dismiss after 4 seconds, max 3 stacked
- Use design tokens: `bg-accent` for success, `bg-surface-raised` + `border-border` for neutral

**Files to create:**
- `components/ui/Toast.tsx` — the toast component
- `components/ui/ToastProvider.tsx` — context provider, add to `app/layout.tsx`
- `lib/hooks/useToast.ts` — hook for triggering toasts

**Files to modify:**
- `app/layout.tsx` — wrap children in `ToastProvider`
- `components/AlertSignupForm.tsx` — trigger toast on successful submit
- `components/ListingForm.tsx` — trigger toast on successful submit

### E5 — Page transitions and scroll reveals

**What to do:**
- Homepage sections: staggered fade-in as they scroll into view (IntersectionObserver, CSS transitions)
- Page-to-page: subtle opacity fade using Next.js App Router layout transitions
- Browse page: cards should appear without layout shift (skeleton loaders already exist — verify they're used)

**Implementation:** CSS-only where possible. Add `data-animate` attributes and a global IntersectionObserver in a small client component.

**Files to create:**
- `components/ScrollReveal.tsx` — lightweight wrapper using IntersectionObserver + CSS opacity/transform transition

**Files to modify:**
- `app/page.tsx` — wrap homepage sections in `ScrollReveal`
- `app/layout.tsx` — add subtle page transition if using view transitions API

### E6 — Keyboard accessibility audit

**What to do:**
- Verify all interactive elements are reachable via Tab key
- Verify all filter checkboxes, sort dropdowns, pagination buttons, and card links have visible focus indicators
- `SkipNav` component already exists — verify it targets `#main-content` and that the landmark exists
- Autocomplete dropdown (from A2) must support arrow key navigation
- Mobile filter sheet must trap focus while open

**Files to audit:**
- `components/PlantFilterSidebar.tsx`
- `components/Pagination.tsx`
- `components/ui/SearchBar.tsx`
- `components/BrowseContent.tsx`
- `app/layout.tsx` — verify `id="main-content"` on `<main>`

---

## F. CONTEXTUAL INTELLIGENCE

### F1 — Genus-specific filter facets

**Problem:** All filter options are generic. When a user selects "Nut Trees," they should see nut-tree-specific facets like chill hours or self-fertility that don't apply to grapes.

**What to do:**
- When a single category is selected, show additional filter sections relevant to that category:
  - Nut Trees: chill hours range, bearing age range
  - Berries: sun requirement (already generic, but could add soil pH)
  - All categories with growing profiles: height range, spread range
- These contextual facets appear as additional `Disclosure` sections in the sidebar
- Data comes from `species_growing_profiles` fields already present in the `BrowsePlant` type

**Files to modify:**
- `components/PlantFilterSidebar.tsx` — add conditional sections based on `filters.categories`
- `components/BrowseContent.tsx` — add corresponding filter logic to `filterBrowsePlants()`
- `lib/queries/browse.ts` — ensure `BrowsePlant` includes `chill_hours_min`, `chill_hours_max`, `years_to_bearing_min`, `years_to_bearing_max`

### F2 — "Popular in your zone" homepage section

**Problem:** Zone detection exists (ZonePrompt + localStorage) but isn't leveraged on the homepage.

**What to do:**
- Client-side section on homepage: if `getUserZone()` returns a value, show "Great picks for Zone X" with 6-8 species that thrive in that zone
- If no zone detected, show the ZonePrompt inline: "Set your zone to see personalized picks"
- On zone change (via ZonePrompt), this section updates reactively

**Files to modify:**
- `app/page.tsx` — add a client component section that reads zone from localStorage and renders results
- Create `components/ZoneRecommendations.tsx` — client component that fetches/filters by zone
- `lib/queries/plants.ts` or client-side filtering — filter species where `usda_zone_min <= zone <= usda_zone_max`

### F3 — Seasonal callout

**What to do:**
- Simple date-driven banner on the homepage:
  - Jan-Mar: "Spring planning season — browse bare root availability"
  - Apr-Jun: "Spring planting — see what's in stock now"
  - Jul-Sep: "Fall planting prep — pre-order for autumn delivery"
  - Oct-Dec: "Winter planning — research cultivars for spring"
- This is a static component with a `new Date().getMonth()` switch. No database query needed.

**Files to create:**
- `components/SeasonalBanner.tsx` — simple date-driven banner

**Files to modify:**
- `app/page.tsx` — render above or below hero

---

## Implementation Rules for Claude Code

### Testing
- All existing 99+ tests must continue passing after every change
- Add tests for new queries: facet count computation, autocomplete, homepage dynamic queries
- `npm test` + `npx tsc --noEmit` must both pass before any commit

### Design system
- Use existing UI primitives: `Text`, `Tag`, `Surface`, `EmptyState`, `Disclosure`, `SearchBar`, `BotanicalName`, `PlantImage`, `TraitGrid`, `RangeBar`, `IconRating`
- New composite components are fine (QuickFactsRibbon, PriceSparkline, HomepageSection, Toast, ScrollReveal, etc.)
- No raw Tailwind color classes — use design tokens from CSS variables
- Fraunces for headings (serif), Satoshi for body/UI

### URL state
- All filter/search state must be encoded in URL search params
- Use `window.history.replaceState` for filter changes (no full navigation)
- Use `router.push` for page navigation (search → result page)

### Performance
- Client-side facet count computation should use `useMemo` to avoid recomputation on every render
- Autocomplete should debounce at 250ms minimum
- Homepage dynamic sections should be server-rendered (no client-side fetching)
- Mobile filter sheet should use CSS transforms for animation (not JS-driven)

### Deployment
After completing any group of tasks:
1. `npm test` — all pass
2. `npx tsc --noEmit` — clean
3. `git commit` + `git push origin master`
4. Vercel auto-deploys from master
5. Verify at https://plantfinder-cyan.vercel.app
6. Update `CONTEXT.md` with completed items

---

## Task Checklist

```
[ ] A1 — Merge search + browse
[ ] A2 — Search autocomplete
[ ] A3 — Filter counts
[ ] A4 — Zero-result filter prevention
[ ] A5 — Mobile full-screen filter sheet
[ ] B1 — PlantCard redesign (price, zone badge)
[ ] B2 — Last updated timestamps
[ ] B3 — Cultivar page price-first restructure
[ ] B4 — Price history sparkline
[ ] B5 — Nursery trust badges
[ ] B6 — Data completeness badges
[ ] C1 — Rich empty states with CTAs
[ ] C2 — Cross-links on sparse pages
[ ] D1 — Species page progressive disclosure
[ ] D2 — Homepage dynamic sections
[ ] E1 — Reduce over-containerization
[ ] E2 — Typography hierarchy audit
[ ] E3 — Card hover/interaction polish
[ ] E4 — Toast notification system
[ ] E5 — Page transitions and scroll reveals
[ ] E6 — Keyboard accessibility audit
[ ] F1 — Genus-specific filter facets
[ ] F2 — Popular in your zone
[ ] F3 — Seasonal callout
```
