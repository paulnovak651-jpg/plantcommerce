# PlantCommerce

> **Label:** Current startup truth

PlantCommerce is a plant information and sourcing platform for the permaculture community. The application combines structured plant data, nursery inventory aggregation, and a community marketplace in one Next.js + Supabase monolith.

## Working Rules

- GitHub `master` is the canonical shared state.
- Local clones are for execution, testing, and review.
- Do not let local drift become project truth.
- Do not use production to discover whether a change works.

## Standard Workflow

Use this order every time:

1. Pull latest shared state: `git pull --rebase origin master`
2. Inspect local status: `git status --short`
3. Read only the current startup docs:
   - `AGENTS.md`
   - `CONTEXT.md`
   - `ROADMAP.md`
   - `docs/INDEX.md`
4. Start the app locally: `npm run dev`
5. Work against `http://localhost:3000`
6. Make changes locally
7. Test locally before wrapping up
8. Review the diff before commit
9. Commit only the intended files
10. Push the reviewed change to GitHub
11. Deploy separately when appropriate

If `git pull --rebase origin master` is blocked by local changes, stop and understand the local state with `git status --short` before proceeding.

## Local Development

Install dependencies:

```bash
npm ci
```

Run the app:

```bash
npm run dev
```

Validation:

```bash
npm test
npx tsc --noEmit
```

## Command Center

The Command Center is a small internal coordination tool for sessions and tasks.

- Local base URL: `http://localhost:3000`
- API namespace: `/api/dashboard/*`
- Auth: `ADMIN_STATUS_SECRET` primary, `CRON_SECRET` fallback
- Prefer the repo scripts:
  - `scripts/register-session.sh`
  - `scripts/register-session.ps1`
  - `scripts/end-session.sh`
  - `scripts/end-session.ps1`
  - `scripts/dashboard-snapshot.ps1`

## Task Routing

- Homepage and taxonomy: `app/page.tsx` -> `components/browse/BrowsePageClient.tsx` -> `components/BrowseContent.tsx`
- Species and cultivar pages: `app/plants/[speciesSlug]/page.tsx`, `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`, `components/CultivarTabs.tsx`
- Browse filters and queries: `app/browse/page.tsx`, `lib/facets/registry.ts`, `lib/queries/facet-query-builder.ts`, `app/api/browse/route.ts`
- Scraper, resolver, and pipeline: `lib/scraper/`, `lib/resolver/`, `lib/pipeline/`, `app/api/pipeline/scrape/route.ts`
- Dashboard and session flow: `app/dashboard/page.tsx`, `app/api/dashboard/`, `scripts/`
- Schema and migration work: `sql/migrations/`, `sql/MIGRATION_GUIDE.md`, `docs/architecture/KNOWLEDGE_GRAPH_SCHEMA.md`

## Repo Map

- `app/` route layer
- `components/` UI components
- `lib/` data access, pipeline, resolver, search, and shared logic
- `sql/` schema and migration guidance
- `scripts/` operational and quality scripts
- `docs/` architecture, operations, research, and historical sprint docs

## Key Documents

- `AGENTS.md`: current agent operating contract
- `CONTEXT.md`: current technical snapshot and key decisions
- `ROADMAP.md`: current priorities
- `PROJECT_REORG_PLAN.md`: current repo hygiene plan
- `docs/INDEX.md`: doc map and task routing

## Non-Negotiables

- TypeScript strict mode stays clean
- Tests must stay passing
- No secrets in code
- No new scraper work without nursery consent
- No large UI redesigns without explicit direction
