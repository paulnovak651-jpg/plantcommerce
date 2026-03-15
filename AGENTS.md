# Plant Commerce — Agent Instructions

> **Label:** Current agent operating contract
> Auto-loaded by agents on startup. Read before doing substantial work.

---

## Operator Preference

- Paul pre-approves all non-critical permissions and escalations needed for normal work.
- Do not pause for permission chat on non-critical execution; proceed directly.
- Discuss decisions about scope, architecture, or tradeoffs before changing direction.

---

## Source Of Truth

- GitHub `master` is the shared source of truth.
- The local repo is an execution and testing environment, not an alternate source of truth.
- Always assume the remote may be ahead of local until you verify otherwise.
- Never treat unpushed local state as durable project truth.

---

## Session Start Protocol

Run these before substantial work:

1. `git pull --rebase origin master`
2. Confirm the working tree is clean or understand any local changes with `git status --short`
3. Read `AGENTS.md`, `CONTEXT.md`, `ROADMAP.md`, and `docs/INDEX.md`
4. Start local dev on `http://localhost:3000` when the task needs the app or Command Center
5. Register a Command Center session with `scripts/register-session.sh` or `scripts/register-session.ps1`

If `git pull --rebase origin master` is blocked by local changes, stop and understand the local state before proceeding.

If local and GitHub disagree, GitHub wins unless Paul explicitly says otherwise.

---

## Local-First Workflow

Use this order every time:

1. Pull latest shared state
2. Check local status
3. Read only the current startup docs
4. Run locally on `localhost`
5. Make changes locally
6. Test locally before wrapping up
7. Review the actual diff
8. Commit only the intended files
9. Push to GitHub
10. Deploy separately when appropriate

Do not use production or Vercel previews to discover whether a change works.

---

## Command Center Contract

- Local base URL: `http://localhost:3000`
- Dashboard API namespace: `/api/dashboard/*`
- Canonical routes:
  - `GET /api/dashboard`
  - `POST /api/dashboard/sessions`
  - `PATCH /api/dashboard/sessions/[id]`
  - existing task routes stay under `/api/dashboard/*`
- Auth: `ADMIN_STATUS_SECRET` primary, `CRON_SECRET` fallback
- Preferred scripts:
  - `scripts/register-session.sh`
  - `scripts/register-session.ps1`
  - `scripts/end-session.sh`
  - `scripts/end-session.ps1`
  - `scripts/dashboard-snapshot.ps1`

Session handoffs should leave:

- touched surfaces
- current state
- next step

---

## What This Project Is

A plant information and sourcing platform for the permaculture community. Users search for a cultivar, see which nurseries carry it, compare prices, and browse structured plant data. The app also includes a community marketplace for private sellers and buyers.

- **Business entity:** Even Flow Nursery LLC
- **Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase PostgreSQL, Cheerio
- **Tests:** Vitest, 230+ tests (must stay passing)
- **Live:** https://plantfinder-cyan.vercel.app
- **Deploy:** `npx vercel --prod` from project root

---

## Current State (2026-03-14)

- No active sprint. The UI is stable after the Sprint 8–18 browse/page iterations.
- The homepage taxonomy explorer is the canonical browse entrypoint.
- `/browse` redirects to `/` and preserves query params for old links.
- Facet/query/API browse surfaces still exist in the repo, but they are secondary infrastructure, not the primary user entrypoint.
- Species pages, cultivar tabs, compare flow, nursery pages, stock alerts, and the marketplace are live.
- 3 nurseries are live: Burnt Ridge, Grimo, and Raintree.

Current priorities are in `ROADMAP.md`.

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

## Task Routing

| Work Type | Start Here |
|-----------|------------|
| Homepage / taxonomy | `app/page.tsx` -> `components/browse/BrowsePageClient.tsx` -> `components/BrowseContent.tsx` |
| Species / cultivar pages | `app/plants/[speciesSlug]/page.tsx`, `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`, `components/CultivarTabs.tsx` |
| Browse filters / queries / API | `app/browse/page.tsx`, `lib/facets/registry.ts`, `lib/queries/facet-query-builder.ts`, `app/api/browse/route.ts` |
| Scraper / resolver / pipeline | `lib/scraper/`, `lib/resolver/`, `lib/pipeline/`, `app/api/pipeline/scrape/route.ts` |
| Dashboard / sessions / status | `app/dashboard/page.tsx`, `app/api/dashboard/`, `lib/status/`, `scripts/` |
| Schema / data / migrations | `sql/migrations/`, `sql/MIGRATION_GUIDE.md`, `docs/architecture/KNOWLEDGE_GRAPH_SCHEMA.md` |

---

## Documentation Map

| Label | Document | Purpose |
|-------|----------|---------|
| Current | `README.md` | Human startup guide and canonical local workflow |
| Current | `CONTEXT.md` | Technical state and key structural decisions |
| Current | `ROADMAP.md` | Active priorities |
| Current | `docs/INDEX.md` | Doc map and task routing |
| Operational | `docs/operations/` | Playbooks and operational reference |
| Architecture | `docs/architecture/` | Design system, vision, schema, and API reference |
| Historical | `docs/sprints/` | Archived sprint and bugfix history only |

Key structural decisions should be recorded in `CONTEXT.md`, not in a separate ADR system.
