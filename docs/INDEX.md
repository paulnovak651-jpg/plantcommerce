# Documentation Index

> **Label:** Current doc map

Start here if you need project context and do not know which documents are current.

## Current Startup Truth

Read these first and in this order:

1. `../README.md`
2. `../AGENTS.md`
3. `../CONTEXT.md`
4. `../ROADMAP.md`

Optional after that:

- `../PROJECT_REORG_PLAN.md` for repo hygiene and workflow cleanup context

## Task Routing

- Homepage and taxonomy: `../app/page.tsx`, `../components/BrowseContent.tsx`, `../components/browse/TaxonomyExplorer.tsx`
- Species and cultivar pages: `../app/plants/[speciesSlug]/page.tsx`, `../app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`, `../components/CultivarTabs.tsx`
- Browse filters, query state, and API: `../app/browse/page.tsx`, `../lib/facets/registry.ts`, `../lib/queries/facet-query-builder.ts`, `../app/api/browse/route.ts`
- Pipeline and scraper work: `../lib/scraper/`, `../lib/resolver/`, `../lib/pipeline/`, `../app/api/pipeline/scrape/route.ts`
- Dashboard and sessions: `../app/dashboard/page.tsx`, `../app/api/dashboard/`, `../scripts/`
- Schema and data: `../sql/migrations/`, `../sql/MIGRATION_GUIDE.md`, `architecture/KNOWLEDGE_GRAPH_SCHEMA.md`

## Operational Reference

- `operations/nursery-scraper-playbook.md`
- `operations/nursery-outreach-template.md`
- `operations/parser-generalization-audit.md`
- `operations/facebook-consented-ingestion-roadmap.md`

## Architecture Reference

- `architecture/DESIGN_SYSTEM.md`
- `architecture/VISION.md`
- `architecture/KNOWLEDGE_GRAPH_SCHEMA.md`
- `architecture/status-api.md`
- `architecture/ux-foundation-spec.md`
- `architecture/UX_PRODUCT_SPEC.md`

## Research Reference

- `research/data-buildout-plan.md`
- `research/genus-research-protocol.md`
- genus-specific research files under `research/`

## Historical Reference Only

- `sprints/INDEX.md`
- all completed sprint and bugfix docs under `sprints/`

## Rules

- Current operating truth lives in the root docs.
- `docs/sprints/` is historical reference only, not startup truth.
- If a document conflicts with `README.md`, `AGENTS.md`, `CONTEXT.md`, or `ROADMAP.md`, fix the conflict instead of guessing.
- Keep this index current when startup docs, task routing, or doc labels change.
