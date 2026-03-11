Not quite.

What I gave you is a strong strategy document, but a repo-ready sprint doc for coding agents should be tighter, more operational, and less advisory. It should read like something an agent can execute against without guessing what is optional, what is deferred, and what counts as done.

Below is a **repo-ready version** you can drop in as `docs/sprints/SPRINT_6_DISCOVERY_UX.md` or similar.

---

# Sprint 6: Discovery UX — Surface What You’ve Already Built

## Status

Planned

## Owner

PlantCommerce

## Objective

Close the gap between PlantCommerce’s rich plant data model and the relatively thin discovery UX that currently exposes only a small subset of that value.

This sprint makes browse and search feel substantially more useful by surfacing existing growing-profile, pollination, and alias data through a better discovery interface.

## Core principle

Increase discovery power without adding unnecessary system complexity.

## Problem statement

PlantCommerce already has strong underlying assets:

* taxonomy and genus/species/cultivar structure
* species growing profiles
* pollination data
* aliases
* cultivar traits
* materialized search index
* strict TypeScript and organized query layers

But the current discovery UX still underexposes that value.

Current issues:

* too few surfaced facets
* hardcoded sidebar filter definitions
* weak zero-result handling
* zone is not treated as persistent user context
* alias data is underused in search/autocomplete
* browse UI complexity is concentrated in large client components

## Sprint outcome

By the end of this sprint, PlantCommerce should provide:

1. persistent zone-aware discovery
2. registry-driven browse facets
3. richer plant discovery via growing and pollination filters
4. visible/removable active filters
5. helpful zero-result recovery
6. alias-aware search/autocomplete
7. smaller, safer browse components
8. optional server-side browse query optimization if Phase B is completed

---

# Scope structure

This sprint is implemented in two internal phases under one sprint.

## Sprint 6A — Discovery UX surface

User-facing discovery improvements with lower implementation risk.

## Sprint 6B — Browse query/data optimization

Server-side browse/filter architecture after the discovery model is stable.

This split is intentional. Do not let Sprint 6 turn into a refactor sprint disguised as a UX sprint.

---

# In scope

## Sprint 6A

* zone-first persistence
* persistent zone banner
* zone compatibility note on plant pages
* facet registry
* facet URL/state utilities
* registry-driven sidebar
* first-pass facet set
* active filter pills
* smart empty state v1
* browse component decomposition
* alias-aware autocomplete/search display
* alias search index enrichment migration, after inspecting current search view definition

## Sprint 6B

* dynamic facet query builder
* `/api/browse`
* API-driven browse fetching
* facet counts from server/query layer
* browse performance cleanup

---

# Out of scope

Do not do these in this sprint:

* auth or user accounts
* Plant Finder Wizard
* cross-classification/permaculture function tags
* cultivar comparison tool
* pipeline/resolver redesign
* scraper architecture changes
* search engine replacement
* ElasticSearch
* Redis
* BullMQ / job queues
* microservice split
* large repo-wide bounded-context reorganization as a standalone task

Bounded-context thinking is encouraged while touching code, but Sprint 6 is not a structural rewrite.

---

# Deliverables

## 1. Zone-first persistence

### Goal

Treat USDA zone as persistent discovery context rather than an occasional filter.

### Required changes

#### 1.1 Enhance `components/ZonePrompt.tsx`

Modify the existing component so that it:

* auto-appears on first visit to browse or homepage when no stored zone exists
* stores selected zone using existing zone persistence utilities
* dispatches a browser event when zone changes

### Event contract

Use:

```ts
new CustomEvent('zone-changed', { detail: { zone } })
```

Where `zone` is `number | null`.

### UX requirements

* non-modal
* banner-style
* prominent but not blocking
* use warm Field Guide tones
* dismissible after setting

---

#### 1.2 Create `components/ZoneBanner.tsx`

A persistent lightweight banner that appears when a zone is already set.

### Responsibilities

* read persisted zone on mount
* listen for `zone-changed`
* show current zone
* support inline change
* support clear
* render nothing if no zone is set

### Example

```text
🌱 Showing plants for Zone 5   [Change] [Clear]
```

---

#### 1.3 Apply persisted zone to browse by default

Browse should auto-apply persisted zone if:

* a stored zone exists
* and there is no explicit `zone` query param in the URL

### Rules

* persisted zone becomes initial default only
* if user changes or clears zone manually, their explicit choice wins
* URL must reflect applied zone so the state is shareable

---

#### 1.4 Create `components/ZoneCompatibility.tsx`

Small client component for species and cultivar pages.

### Behavior

If compatible:

* `✓ Grows in your zone (Zone 5)`

If incompatible:

* `⚠ Outside your zone (Zone 5) — this plant needs Zone 6–9`

### Placement

Near growing requirements / profile section.

---

## 2. Config-driven facet registry

### Goal

Replace hardcoded filter definitions with a declarative facet system.

### Required files

#### 2.1 Create `lib/facets/registry.ts`

Must define:

* facet type system
* facet option type
* facet definition contract
* facet registry array

The registry must be the single source of truth for:

* key
* label
* type
* group
* sort order
* display options
* count behavior
* disable-empty behavior
* mapping to validated data source fields

### Important rule

Do not trust planning prose as schema truth.

Before implementation, validate all field names and types against the actual DB schema / generated Supabase types.

---

#### 2.2 Create `lib/facets/state.ts`

Must provide utilities to:

* parse URL search params into facet state
* serialize facet state back to URL params
* describe active filters for UI display

### URL requirements

* preserve current meaningful URL behavior where possible
* multi-select values may use comma-separated values
* state format must be stable and predictable

---

## 3. Registry-driven sidebar

### Goal

Render browse filters from the facet registry rather than hardcoded arrays.

### Required changes

#### 3.1 Refactor `components/PlantFilterSidebar.tsx`

This component must render from `FACET_REGISTRY`.

### First-pass facet set

Ship these first:

* zone
* category
* sun
* growth_rate
* drought_tolerance
* self_fertile
* in_stock

### Defer from first pass

Do not make these blockers for Sprint 6A:

* years_to_bearing
* mature_height
* soil_ph

They can be added after the first registry-driven system is stable.

### Sidebar requirements

* group facets by section
* support active state
* show counts where available
* disable impossible options where supported
* keep design aligned with existing UI

---

#### 3.2 Create `components/browse/FacetControl.tsx`

Generic facet renderer.

### Must support

* multi-select checkbox groups
* boolean toggles
* zone selector handling
* future range support, but full range UI is not required to block 6A

### UX requirements

* counts visible but muted
* disabled options clearly non-interactive
* groups collapsible
* Growing Conditions open by default
* Pollination collapsed by default

---

## 4. Active filters and zero-result recovery

### Goal

Users must always understand what is narrowing results and how to recover.

### Required files

#### 4.1 Create `components/browse/ActiveFilterPills.tsx`

Show removable pills for active filters above results.

### Example

```text
Zone 5 ×   Nut Trees ×   Full Sun ×   Self-Fertile ×   [Clear all]
```

### Requirements

* remove individual filters
* clear all
* reflect current facet state accurately

---

#### 4.2 Create `components/browse/SmartEmptyState.tsx`

Replace dead-end empty results with recovery-focused UX.

### v1 requirements

* explain that no plants match the current combination
* show active filters clearly
* provide filter-removal guidance
* provide clear-all action

### Important scope rule

Do not block Sprint 6 on perfect combinatorial empty-state logic.

Version 1 can be useful without exhaustively recalculating all possible alternatives.

---

#### 4.3 Disable obviously empty options where counts exist

Where counts are available and trustworthy, grey out impossible options instead of allowing dead-end selections.

---

## 5. Browse component decomposition

### Goal

Reduce browse UI complexity and enforce safer server/client boundaries.

### Required files

Create or extract as appropriate:

* `components/browse/BrowseGrid.tsx`
* `components/browse/BrowseHeader.tsx`
* `components/browse/BrowseShell.tsx`

`components/BrowseContent.tsx` remains the orchestrator.

### Rules

* pages remain server components where possible
* interactive pieces remain client components
* do not pass client handlers into server components
* reduce oversized browse component files

---

## 6. Alias-aware autocomplete and search

### Goal

Let users discover plants through alternate/common terms.

### Required changes

#### 6.1 Update autocomplete behavior

Autocomplete should surface alias context when relevant.

### Example

```text
European Hazelnut
also known as: Filbert
```

---

#### 6.2 Update search query logic

Search queries should intentionally surface alias-enriched results where appropriate.

This must integrate with the existing search model rather than bypassing it.

---

## 7. Alias search index enrichment migration

### Goal

Enrich the materialized search index with alias data.

### Critical caution

This is core search infrastructure. Treat it as a careful patch, not a rewrite.

### Required process

Before writing the migration:

1. inspect current `material_search_index` definition
2. inspect dependent queries
3. preserve required columns and behavior
4. patch minimally
5. preserve or recreate necessary indexes
6. verify refresh behavior

### Rule

Do not assume the draft migration shape in planning notes is correct.

---

## 8. Search index refresh after pipeline runs

### Goal

Ensure newly imported data becomes discoverable promptly.

### Scope

After alias search enrichment is complete, refresh the materialized search index at the appropriate post-import point.

### Rule

Follow the refresh semantics already known to work safely in this project. Do not introduce a refresh pattern just because it looks cleaner on paper.

---

# Sprint 6B deliverables

## 9. Dynamic facet query builder

### Goal

Move browse filtering toward composable server-side query logic.

### Required file

Create `lib/queries/facet-query-builder.ts`

### Responsibilities

* accept normalized facet state
* apply validated filters
* support sorting and pagination
* return results and total count
* avoid combinatorial query-function sprawl

---

## 10. Browse API route

### Goal

Provide a server-side browse endpoint for facet-driven querying.

### Required file

Create `app/api/browse/route.ts`

### Responsibilities

* parse facet params
* run query builder
* return results
* return counts where supported
* support sort and pagination
* follow existing API/rate-limit conventions

---

## 11. API-driven `BrowseContent`

### Goal

Move browse UI from broad client-side filtering toward targeted API-driven updates.

### Required changes

Refactor `components/BrowseContent.tsx` to:

* manage facet state
* debounce filter changes
* call `/api/browse`
* show loading states
* consume result/count data
* preserve sort/pagination/grouping behavior

### Rule

Do not regress browse UX while improving architecture.

---

## 12. Server-side facet counts

### Goal

Support better counts for:

* sidebar options
* disabled options
* empty-state recovery

### Scope rule

A simple, correct count strategy is acceptable for this sprint. Optimize further only if needed.

---

# Implementation order

## Sprint 6A

1. zone persistence changes
2. `ZoneBanner`
3. `ZoneCompatibility`
4. facet registry
5. facet state utilities
6. registry-driven sidebar
7. `FacetControl`
8. `ActiveFilterPills`
9. `SmartEmptyState` v1
10. browse component decomposition
11. autocomplete/search alias display
12. alias search migration after inspecting current search view

## Sprint 6B

1. facet query builder
2. browse API route
3. API-driven `BrowseContent`
4. server-side counts
5. pagination/sort/count cleanup
6. post-import search index refresh if migration work supports it safely

---

# File plan

## New files

* `lib/facets/registry.ts`
* `lib/facets/state.ts`
* `lib/queries/facet-query-builder.ts`
* `app/api/browse/route.ts`
* `components/ZoneBanner.tsx`
* `components/ZoneCompatibility.tsx`
* `components/browse/BrowseGrid.tsx`
* `components/browse/BrowseHeader.tsx`
* `components/browse/BrowseShell.tsx`
* `components/browse/FacetControl.tsx`
* `components/browse/SmartEmptyState.tsx`
* `components/browse/ActiveFilterPills.tsx`
* alias search enrichment migration file

## Modified files

* `components/ZonePrompt.tsx`
* `components/PlantFilterSidebar.tsx`
* `components/BrowseContent.tsx`
* `app/browse/page.tsx`
* species/cultivar page files where zone compatibility is shown
* `app/api/autocomplete/route.ts`
* `lib/queries/search.ts`
* pipeline completion/refresh location if index refresh is added

---

# Technical guardrails

## Schema truth

Actual DB/generated types are the source of truth.

## Type safety

No `any`. No `@ts-ignore`. No hand-wavy schema assumptions.

## Registry discipline

Once the registry exists, browse facets must come from it. Do not reintroduce hardcoded filter arrays elsewhere.

## Server/client boundaries

Keep pages server-side where possible. Keep interactive state in explicit client components.

## URL stability

Facet state serialization must be stable and predictable.

## Migration caution

Search index changes are infrastructure work. Inspect first, patch second.

---

# Acceptance criteria

## Zone-first

* new visitor without stored zone sees prompt banner
* selecting zone persists it
* browse defaults to stored zone when no explicit zone param exists
* URL reflects applied zone
* species/cultivar pages show zone compatibility note

## Facet system

* sidebar renders from registry
* first-pass facets work correctly
* active filter pills reflect current state
* clear/remove actions work
* empty/impossible options are disabled where supported

## Empty state

* zero-result combinations do not dead-end
* user gets recovery actions
* clear-all works

## Search/autocomplete

* alias-driven queries can return relevant plants
* alias context is visible in autocomplete when relevant

## Phase B

* `/api/browse` returns correct filtered results
* pagination and sort remain correct
* no major browse regression introduced

---

# Testing requirements

All existing tests must continue passing.

## Add tests for

* facet parse/serialize round-trip
* active filter description helpers
* smart empty state rendering
* autocomplete alias formatting
* facet query builder logic once introduced

## Manual checks

* first-visit zone prompt behavior
* stored zone browse defaulting
* species/cultivar zone compatibility note
* registry-driven sidebar rendering
* filter pill removal
* zero-result recovery
* alias autocomplete results
* browse API correctness in 6B

---

# Design notes

* follow the Field Guide visual system
* use warm neutral / amber tones for zone and empty-state assistance
* do not use error-red for recoverable empty states
* counts should be present but subdued
* filter pills should align with existing tag styling
* zone UI should feel helpful, not blocking

---

# Definition of done

Sprint 6 is done when:

* zone is persistent and visible across discovery flows
* browse filters are registry-driven instead of hardcoded
* users can filter by a richer set of plant attributes
* active filters are visible and removable
* zero-result states help users recover
* aliases materially improve search/autocomplete discoverability
* browse UI is split into smaller, safer components
* Phase B is completed or intentionally deferred with Phase A shipped cleanly
* tests pass
* no major discovery regressions were introduced

---

# Decision rule for coding agents

When making tradeoffs during this sprint, use this rule:

> Prefer the change that makes plant discovery better now with the least additional complexity.

That means:

* yes to zone persistence
* yes to registry-driven facets
* yes to visible filter recovery UX
* yes to alias-aware search
* yes to smaller browse components

And:

* no to premature infrastructure expansion
* no to broad refactors without immediate discovery value
* no to making the sprint depend on perfect backend elegance before shipping visible wins


