# Search, Compare, and Mobile Fixes

> **Label:** Proposed / review only
> **Implementation status:** Not approved
> **Location status:** Safe to read, not safe to execute without explicit approval
> **Origin:** Salvaged from superseded `docs/sprints/SPRINT19_SEARCH_COMPARE_MOBILE_FIXES.md`

---

## Goal

Repair four existing product gaps that directly affect ease of use:

1. Homepage free-text search currently lands on the unfiltered browse view
2. Cultivar-page compare CTA points at a dead-end URL shape
3. Mobile users lose global search off the homepage
4. A few public empty states still expose stale or internal copy

This is a proposal for incremental repair work, not an active sprint and not a redesign.

---

## Why This Is A Proposal

- The underlying issues are worth fixing
- The old Sprint 19 artifact was not safe to execute as written
- Phase 1 was underspecified against the real homepage URL contract and mixed search-result types
- The repo contract now requires review-only plans to live under `docs/proposals/`

Implementation should begin only after Paul explicitly approves it or the work is promoted into the current root-doc flow.

---

## Current Constraints

- The homepage taxonomy explorer remains the canonical browse entrypoint
- `/browse` remains a redirect to `/`
- No wholesale UI redesigns
- Keep changes incremental and test-covered
- Root docs remain the startup truth

---

## Proposed Scope

### 1. Homepage Query-Mode Search

Fix homepage search so `/?q=...` renders actual search results instead of the normal browse explorer.

### 2. Compare Flow Repair

Fix the cultivar-page compare CTA and make compare affordances visible on mobile.

### 3. Mobile Global Search

Add a mobile header search affordance for non-homepage pages.

### 4. Public Copy Cleanup

Remove stale internal/public copy mismatches on browse and nursery surfaces.

---

## Non-Goals

- No sprint framing or sprint-status language
- No nav restructuring
- No new product areas
- No database changes
- No search-system redesign beyond wiring/fix work
- No browse architecture rewrite

---

## Workstream 1: Homepage Query-Mode Search

### Problem

The hero search bar and autocomplete "See all results" flow already push users to `/?q=...`, but [app/page.tsx](../../app/page.tsx) ignores `searchParams`. Users type a query and receive the same browse view they would have seen with no query.

### Required Architecture

This work is not safe to implement by blindly reusing [PlantCard.tsx](../../components/PlantCard.tsx) with raw search results.

Current search results include mixed entity types and separate route fields in [lib/queries/search.ts](../../lib/queries/search.ts):

- `slug`
- `species_slug`
- `index_source`

Current [PlantCard.tsx](../../components/PlantCard.tsx) accepts one `slug` prop and always links to `/plants/${slug}`.

That means:

- species results and cultivar results do not share one direct URL shape
- raw `SearchResult` rows need route adaptation before they are rendered

### Implementation Direction

#### 1a. Make homepage query-aware

Update [app/page.tsx](../../app/page.tsx) to accept `searchParams` and enter search mode when `q` is present and non-empty.

#### 1b. Preserve the actual URL contract

Do not treat `q` as the only supported homepage search param.

Current `/search` redirect behavior in [app/search/page.tsx](../../app/search/page.tsx) already forwards:

- `q`
- `category`
- `zone` mapped into `zoneMin` / `zoneMax`
- `inStock` mapped into homepage params

The homepage query-mode plan must explicitly decide how those parameters are normalized and applied instead of silently dropping them.

#### 1c. Avoid client-only blank first render

Do not make the primary search path depend on a purely client-side fetch-after-mount if there is a clean server path available.

Preferred approach:

- server-render the first result page for `/?q=...`
- hand initial results and query metadata to a client component only if pagination or refinement needs client state

If client fetching is used at all, it should be for subsequent interactions, not as the only way the first result page appears.

#### 1d. Use an adapter card, not raw `PlantCard`

Implement one of these:

- a thin `SearchResultCard` that maps `SearchResult` rows into correct hrefs and display props
- or extend `PlantCard` with an explicit `href` prop and use a search-specific adapter layer

Do not pass raw search rows straight into `PlantCard` without route adaptation.

### Suggested Files

| File | Change |
|------|--------|
| `app/page.tsx` | Read `searchParams`, branch between browse mode and query mode |
| `components/search/SearchResultsView.tsx` | Render homepage query-mode results |
| `components/search/SearchResultCard.tsx` | Adapt mixed search results into correct links and UI |
| `components/HomepageHero.tsx` | Accept a default query value when in query mode |

### Required Tests

- homepage query mode renders results for `q`
- homepage query mode preserves or normalizes current redirected search params
- search result card resolves correct hrefs for species vs cultivar rows

---

## Workstream 2: Compare Flow Repair

### Problem A

The cultivar-page compare CTA currently points to `/compare?cultivar=...` in [app/plants/[speciesSlug]/[cultivarSlug]/page.tsx](../../app/plants/%5BspeciesSlug%5D/%5BcultivarSlug%5D/page.tsx), but [app/compare/page.tsx](../../app/compare/page.tsx) only reads `ids`.

### Proposed Fix

Replace the dead-end link with a small client component that adds the cultivar to `CompareContext` and lets the existing tray drive the `/compare?ids=...` flow.

### Problem B

The compare affordance in [components/PlantCard.tsx](../../components/PlantCard.tsx) is hover-gated, which hides it on touch devices.

### Proposed Fix

Make the compare button visible by default on mobile while preserving hover reveal on larger screens.

### Suggested Files

| File | Change |
|------|--------|
| `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` | Replace dead-end compare link |
| `components/compare/CultivarCompareButton.tsx` | Add cultivar-page compare button |
| `components/PlantCard.tsx` | Make compare affordance visible on mobile |

### Required Tests

- cultivar compare CTA adds to `CompareContext`
- mobile compare button class or behavior is visible without hover

---

## Workstream 3: Mobile Global Search

### Problem

[HeaderSearch.tsx](../../components/HeaderSearch.tsx) is desktop-only in [app/layout.tsx](../../app/layout.tsx). Mobile users lose global search once they leave the homepage.

### Proposed Fix

Add a mobile-only search affordance in the header.

Recommended implementation:

- add a mobile search toggle component
- reveal the existing `SearchBar` in a lightweight panel beneath the header
- keep query submission aligned with homepage query-mode search

Do not bury the only mobile search affordance inside unrelated navigation copy if a cleaner header-level toggle is practical.

### Suggested Files

| File | Change |
|------|--------|
| `components/MobileSearchToggle.tsx` | New mobile search toggle |
| `app/layout.tsx` | Render mobile search control in header |

### Required Tests

- mobile search toggle renders in mobile header state
- mobile search submission resolves to homepage query mode

---

## Workstream 4: Public Copy Cleanup

### Problem

Some public empty states still reference removed or internal concepts.

### Proposed Fixes

- Update the TaxonomyExplorer empty state in [components/browse/TaxonomyExplorer.tsx](../../components/browse/TaxonomyExplorer.tsx) to reference current filters instead of the removed "Refine view"
- Update the nursery empty state in [app/nurseries/page.tsx](../../app/nurseries/page.tsx) to use user-facing copy instead of developer language

### Required Tests

- not required beyond existing route coverage unless empty-state rendering logic changes materially

---

## Recommended Order

1. Homepage query-mode search architecture and tests
2. Compare flow repair
3. Mobile global search
4. Public copy cleanup

---

## Risks

- Homepage search can regress existing redirected URL behavior if the parameter contract is not made explicit
- Mixed species/cultivar search results can produce broken links if route adaptation is skipped
- Mobile search can create duplicate or conflicting header state if the interaction model is not kept small

---

## Acceptance Criteria

- `/?q=hazelnut` shows actual search results
- `/search?q=hazelnut` redirects to a homepage URL that still renders actual results
- homepage query mode does not silently drop current supported filter params
- species and cultivar result cards link to the correct routes
- cultivar compare CTA no longer lands on a dead-end compare state
- mobile compare affordances are visible without hover
- mobile users can initiate global search off the homepage
- no public page references removed or internal product concepts

---

## Open Questions

- Should homepage query mode server-render only the first result page, or also own pagination?
- Is extending `PlantCard` with an explicit `href` cleaner than adding a dedicated `SearchResultCard`?
- Should the copy-cleanup items ship as part of the same approval, or as separate low-risk fixes?

---

## Definition Of Ready

This proposal is safe to implement only when:

- Paul explicitly approves execution
- homepage query mode has an explicit route and data contract
- mixed search-result routing is solved by an adapter layer
- regression tests are identified up front for search, compare, and mobile flows
