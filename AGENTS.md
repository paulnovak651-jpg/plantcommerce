# Plant Commerce — Agent Instructions

> Auto-loaded by agents on startup. Read before doing any work.

---

## Operator Preference

- Paul pre-approves all non-critical permissions and escalations needed for normal work.
- Do not pause for permission chat on non-critical execution; proceed directly.
- Discuss decisions (scope/architecture/tradeoffs) before changing direction.

---

## What This Project Is

A plant information and sourcing platform for the permaculture community. Users search for a cultivar, see which nurseries carry it, compare prices, and browse structured plant data. Also has a community marketplace for private sellers/buyers.

- **Business entity:** Even Flow Nursery LLC
- **Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase PostgreSQL, Cheerio
- **Tests:** Vitest, 230+ tests (must stay passing)
- **Live:** https://plantfinder-cyan.vercel.app
- **Deploy:** `npx vercel --prod` from project root (linked to `plantfinder` Vercel project)

---

## Current State (Sprint 15 complete, 2026-03-13)

The UI is stable after significant iteration in Sprints 8–15. No active sprint.

**What's working:**
- Three-column taxonomy explorer as homepage
- Species pages with dark green hero, growing guide, cultivar cards
- Cultivar pages with tabbed layout (Overview / Growing / Fruit & Nut / Buy)
- Faceted browse, compare flow, price comparison, nursery maps
- 3 nurseries live (Burnt Ridge, Grimo, Raintree), 15+ genera seeded
- 230+ tests passing, TypeScript strict, CI green

**Current priorities:** See `ROADMAP.md` — nursery consent outreach, data quality, empty-state CTAs.

---

## Hard Rules — Do Not Violate

- TypeScript strict mode: no `any`, no `@ts-ignore`
- App Router only: routes under `app/`
- RLS enforced: service client for writes, anon client for public reads
- Tests must pass: run `npm test` before wrapping a coding task
- `npx tsc --noEmit` must be clean
- No secrets in code: env vars only, never commit `.env*.local`
- No new scrapers without nursery consent
- No raw Tailwind color classes — use design tokens from `docs/architecture/DESIGN_SYSTEM.md`
- **No wholesale UI redesigns** — browse layout and page structure are settled. Make incremental improvements only.

---

## Key File Locations

| What | Where |
|------|-------|
| Homepage | `app/page.tsx` → `components/browse/TaxonomyExplorer.tsx` |
| Species page | `app/plants/[speciesSlug]/page.tsx` |
| Cultivar page | `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` |
| Cultivar tabs | `components/CultivarTabs.tsx` |
| Browse page | `app/browse/page.tsx` → `components/browse/BrowsePageClient.tsx` |
| Genus hub | `app/plants/genus/[genusSlug]/page.tsx` |
| Facet registry | `lib/facets/registry.ts` |
| Facet query builder | `lib/queries/facet-query-builder.ts` |
| Browse API | `app/api/browse/route.ts` |
| Scraper registry | `lib/scraper/index.ts` |
| Resolver (12-method chain) | `lib/resolver/resolver.ts` |
| Parser | `lib/resolver/parser.ts` |
| Supabase client | `lib/supabase/server.ts` |
| API helpers | `lib/api-helpers.ts` |
| Design system components | `components/ui/` |
| Category colors | `lib/category-colors.ts` |
| Zone persistence | `lib/zone-persistence.ts` |

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| `CONTEXT.md` | Technical state, schema, pipeline, sprint history |
| `ROADMAP.md` | Priorities and what's next |
| `docs/architecture/DESIGN_SYSTEM.md` | Typography, colors, components ("The Field Guide") |
| `docs/architecture/VISION.md` | Product vision for collaborators |
| `docs/architecture/KNOWLEDGE_GRAPH_SCHEMA.md` | Taxonomy + growing profile migrations |
| `docs/sprints/` | All sprint specs (archived, for reference) |
| `docs/research/` | Genus research data and protocols |
| `docs/operations/` | Scraper playbook, outreach template, parser audit |
