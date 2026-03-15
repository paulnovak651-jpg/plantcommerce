# PlantCommerce — Project Context

> **Label:** Current technical snapshot
> **Last updated:** 2026-03-14
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

No user accounts in v1. No payments. Nursery offers are read-only aggregated data.

---

## Current Product State

### What is live

- Homepage taxonomy explorer as the canonical browse entrypoint
- Species pages with dark green hero headers, growing guides, and cultivar cards
- Cultivar pages with tabs for Overview, Growing, Fruit & Nut, and Buy
- Price comparison tables, nursery pages, community marketplace, stock alerts, and compare flow
- Homepage browse filters for zone, stock type, and "for sale now"

### Browse truth

- `app/page.tsx` is the live browse entrypoint
- `components/BrowseContent.tsx` owns the homepage browse funnel
- `app/browse/page.tsx` redirects to `/` and preserves query params for old links
- `app/api/browse/route.ts`, `lib/facets/`, and `lib/queries/facet-query-builder.ts` remain in the repo as secondary browse/query infrastructure
- Current docs should not describe `/browse` as the primary user-facing entrypoint

### Data and foundation

- 3 nurseries live: Burnt Ridge, Grimo, Raintree
- 49+ SQL migrations applied
- 230+ tests passing
- TypeScript strict and CI green
- Next.js 16 App Router, React 19, Tailwind CSS 4

---

## Current Operating Contracts

### Startup truth

Read in this order:

1. `README.md`
2. `AGENTS.md`
3. `CONTEXT.md`
4. `ROADMAP.md`
5. `docs/INDEX.md`

Historical sprint docs are not startup truth.

### Local workflow

- GitHub `master` is canonical
- work locally first
- test on `http://localhost:3000`
- review diff before commit
- deploy separately after the local change is verified

### Command Center

- base URL: `http://localhost:3000`
- namespace: `/api/dashboard/*`
- auth: `ADMIN_STATUS_SECRET` primary, `CRON_SECRET` fallback
- preferred scripts: `scripts/register-session.*`, `scripts/end-session.*`, `scripts/dashboard-snapshot.ps1`

### Key structural decisions

- Keep the current monolith shape: `app/`, `components/`, `lib/`, `docs/`, `scripts/`, `sql/`
- Do not introduce a `features/` directory reorganization in this cleanup
- Record key structural decisions in current docs instead of introducing ADR files

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict |
| Styling | Tailwind CSS 4.2.1, "The Field Guide" design system |
| Hosting | Vercel (Hobby) |
| Scraping | Cheerio 1.2.0, config-driven registry |
| External | Supabase only |

---

## Database Schema

### Core: `plant_entities` -> `cultivars` -> `aliases` -> `legal_identifiers`
### Commerce: `nurseries` -> `inventory_offers`
### Community: `community_listings`
### Pipeline: `import_runs` -> `raw_inventory_rows` -> `unmatched_names`
### Taxonomy: `taxonomy_ranks` -> `taxonomy_nodes`
### Growing: `species_growing_profiles`
### Search: `material_search_index`

---

## The Pipeline

```text
Scraper -> Parser -> Resolver -> Writer
```

- Triggered via protected cron endpoint
- Generic Shopify and WooCommerce scrapers are available
- New scrapers still require nursery consent

---

## Task Routing

| Work Type | Start Here |
|-----------|------------|
| Homepage / taxonomy | `app/page.tsx`, `components/BrowseContent.tsx`, `components/browse/TaxonomyExplorer.tsx` |
| Species / cultivar | `app/plants/[speciesSlug]/page.tsx`, `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`, `components/CultivarTabs.tsx` |
| Browse query / filters / API | `app/browse/page.tsx`, `lib/facets/registry.ts`, `lib/queries/facet-query-builder.ts`, `app/api/browse/route.ts` |
| Pipeline / scraper / resolver | `lib/scraper/`, `lib/resolver/`, `lib/pipeline/`, `app/api/pipeline/scrape/route.ts` |
| Dashboard / sessions | `app/dashboard/page.tsx`, `app/api/dashboard/`, `scripts/` |
| Schema / data | `sql/migrations/`, `sql/MIGRATION_GUIDE.md`, `docs/architecture/KNOWLEDGE_GRAPH_SCHEMA.md` |

---

## Nursery Consent Strategy

**Policy: Consent first, scrape second.**

- Existing live nurseries still need retroactive consent outreach
- `consent_status` exists on `nurseries`
- Pipeline skips `declined` nurseries
- Outreach template: `docs/operations/nursery-outreach-template.md`

---

## Known Gaps

1. No user accounts yet
2. Nursery consent outreach still needs execution
3. Many cultivars still need data enrichment
4. Parser generalization is still ongoing

---

## Documentation Labels

- **Current:** `README.md`, `AGENTS.md`, `CONTEXT.md`, `ROADMAP.md`, `docs/INDEX.md`
- **Operational:** `docs/operations/`
- **Architecture reference:** `docs/architecture/`
- **Historical:** `docs/sprints/`
