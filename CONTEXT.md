# PlantCommerce — Project Context

> **Last updated:** 2026-03-13
> **Owner:** Paul Novak / Even Flow Nursery LLC
> **Repo:** github.com/paulnovak651-jpg/plantcommerce (private)
> **Supabase project:** plantfinder (id: bwfhdyjjuubpzwjngquo, region: us-west-2)
> **Live URL:** https://plantfinder-cyan.vercel.app
> **Vercel project:** plantfinder (paulnovak651-jpgs-projects)

---

## What This Is

A plant information and sourcing platform for the permaculture community. Combines:
- **Plant database** — taxonomy, growing profiles, pollination data across 15+ genera
- **Nursery inventory aggregator** — automated scrapers pull live pricing from 3 nurseries
- **Community marketplace** — anonymous WTS/WTB listings, admin-moderated

No user accounts (v1). No payments. Nursery offers are read-only aggregated data.

---

## Current State (Sprint 15 complete)

### What's live at plantfinder-cyan.vercel.app
- **Three-column taxonomy explorer** as homepage (Category → Genus → Species/Cultivar)
- **Species pages** with dark green hero header, growing guide, cultivar cards
- **Cultivar pages** with tabbed layout (Overview / Growing / Fruit & Nut / Buy)
- **Faceted browse** at `/browse` with 10 filters, cross-facet counts, recovery hints
- **Price comparison** tables with best-price tags, trust badges, sparklines
- **Nursery pages** with Leaflet maps, inventory listings
- **Community marketplace** (WTS/WTB listings, admin moderation)
- **Stock alerts** and **pollination checker**
- **Compare** flow with tray + comparison table

### Data
- 15+ genera: hazelnuts, chestnuts, walnuts, hickories, apples, pears, stone fruit, persimmons, mulberries, elderberries, grapes, blueberries, figs, gooseberries/currants, raspberries/blackberries, kiwi, goumi, sea buckthorn, hackberry
- 3 nurseries live: Burnt Ridge, Grimo, Raintree (consent-gated pipeline, cron Monday 6am UTC)
- 49+ SQL migrations applied

### Foundation
- 230+ tests passing (Vitest)
- TypeScript strict, CI green
- Next.js 16 App Router, React 19, Tailwind CSS 4

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict |
| Styling | Tailwind CSS 4.2.1, "The Field Guide" design system |
| Hosting | Vercel (Hobby) — plantfinder-cyan.vercel.app |
| Scraping | Cheerio 1.2.0, config-driven registry |
| External | Supabase only. No Stripe, auth, email, or search infra. |

---

## Database Schema

### Core: `plant_entities` → `cultivars` → `aliases` → `legal_identifiers`
### Commerce: `nurseries` (with lat/lng) → `inventory_offers`
### Community: `community_listings` (anon v1, admin-moderated, 90-day expiry, RLS)
### Pipeline: `import_runs` → `raw_inventory_rows` → `unmatched_names`
### Taxonomy: `taxonomy_ranks` (6) → `taxonomy_nodes` (37+, self-referential tree)
### Growing: `species_growing_profiles` (zones, chill hours, height, pH, sun, bearing age)
### Search: `material_search_index` (materialized view, trigram + alias_names)

---

## The Pipeline

```
Scraper (fetches nursery HTML via config-driven registry)
  → Parser (decomposes product name into structured fields)
    → Resolver (12-method priority chain against alias index)
      → Writer (upserts to Supabase)
```

- Triggered via protected cron endpoint
- Generic Shopify + WooCommerce scrapers available — new nurseries need only a config entry
- 3 of 10 nurseries live; others blocked on consent

---

## Key File Locations

| What | Where |
|------|-------|
| Homepage (taxonomy explorer) | `app/page.tsx` → `components/browse/TaxonomyExplorer.tsx` |
| Species page | `app/plants/[speciesSlug]/page.tsx` |
| Cultivar page | `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` |
| Cultivar tabs component | `components/CultivarTabs.tsx` |
| Browse page | `app/browse/page.tsx` → `components/browse/BrowsePageClient.tsx` |
| Genus hub | `app/plants/genus/[genusSlug]/page.tsx` |
| Facet registry | `lib/facets/registry.ts` |
| Facet query builder | `lib/queries/facet-query-builder.ts` |
| Browse API | `app/api/browse/route.ts` |
| Scraper registry | `lib/scraper/index.ts` |
| Resolver | `lib/resolver/resolver.ts` |
| Parser | `lib/resolver/parser.ts` |
| Supabase client | `lib/supabase/server.ts` |
| API helpers | `lib/api-helpers.ts` |
| Design system components | `components/ui/` |
| Category colors | `lib/category-colors.ts` |
| Zone persistence | `lib/zone-persistence.ts` |

---

## Nursery Consent Strategy

**Policy: Consent first, scrape second.** No new scrapers without nursery approval.

- Existing 3 nurseries need retroactive consent outreach
- `consent_status` column exists on `nurseries` table (pending/approved/declined/no_response)
- Pipeline skips `declined` nurseries
- Outreach template: `docs/operations/nursery-outreach-template.md`

---

## Known Gaps

1. **No user accounts** — zone persistence via localStorage, listings are anonymous
2. **Nursery consent outreach** — not yet sent to any nursery
3. **Data enrichment** — many cultivars have sparse attribute data
4. **Parser** — works well but has hazelnut-centric patterns; generalizing is ongoing

---

## Sprint History

All sprint specs archived in `docs/sprints/`. Key progression:

| Sprint | Focus | Outcome |
|--------|-------|---------|
| 1–3 | Foundation, schema, pipeline, scrapers | Core platform working |
| 4 | Homepage, marketplace, maps, alerts | User-facing features |
| 5 | Genus hub pages | Hierarchical browsing |
| 6 | Faceted browse, autocomplete | Discovery UX |
| 7 | Nav cleanup, typography | Consistency |
| 8 | Taxonomy explorer | Three-panel compact browse |
| 9 | Visual cultivar components | Rich data display |
| 10 | Browse redesign | Multiple iterations (see rework note) |
| 11 | Flatten genus browse | Remove species grouping layer |
| 12 | Progressive disclosure | Decompose pages, compare flow |
| 13 | Unified browse | Consolidate browse approaches |
| 14 | Browse restore | Back to three-column taxonomy explorer |
| 15 | Visual restore | Tabbed cultivar pages, species hero headers |

**Rework pattern (Sprints 10–15):** Browse and page layout went through significant churn. The browse surface was redesigned (S10), flattened (S11), restructured with progressive disclosure (S12), unified (S13), then restored to the three-column explorer (S14). Cultivar pages were decomposed (S12) then visually restored (S15). The current state is stable — future UI work should be incremental, not wholesale redesigns.

---

## Documentation

| Document | Location |
|----------|----------|
| Agent instructions | `AGENTS.md` |
| Product roadmap | `ROADMAP.md` |
| Design system | `docs/architecture/DESIGN_SYSTEM.md` |
| Vision (for collaborators) | `docs/architecture/VISION.md` |
| Knowledge graph schema | `docs/architecture/KNOWLEDGE_GRAPH_SCHEMA.md` |
| Sprint specs (all) | `docs/sprints/` |
| Genus research | `docs/research/` |
| Scraper playbook | `docs/operations/nursery-scraper-playbook.md` |
| Outreach template | `docs/operations/nursery-outreach-template.md` |
