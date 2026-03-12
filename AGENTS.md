# Plant Commerce — Agent Instructions

> Auto-loaded by agents on startup. Read before doing any work.
> Dashboard: http://localhost:3001/dashboard

---

## Operator Preference

- Paul pre-approves all non-critical permissions and escalations needed for normal work.
- Do not pause for permission chat on non-critical execution; proceed directly.
- Discuss decisions (scope/architecture/tradeoffs) before changing direction.

---

## Cold Restart Checklist (2 Minutes)

1. Read `AGENTS.md` and `CONTEXT.md` for local state.
2. Register a Command Center session.
3. Run one dashboard snapshot and check dropped sessions.
4. Continue only after choosing the top open task.

PowerShell (Windows default):
```powershell
.\scripts\register-session.ps1 -Agent "codex" -Summary "Brief description of your task"
.\scripts\dashboard-snapshot.ps1
```

Bash (if available):
```bash
source scripts/register-session.sh "codex" "Brief description of your task"
curl -s http://localhost:3001/api/status | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d).data;console.log('projects='+j.projects.length+' dropped='+j.droppedSessions.length)})"
```

---

## Dashboard Protocol — Required

The Command Center at http://localhost:3001/dashboard is the source of truth for task status and agent activity.

### Start of every session

PowerShell:
```powershell
.\scripts\register-session.ps1 -Agent "codex" -Summary "Brief description" [-TaskId "<task-uuid>"]
```

Bash:
```bash
source scripts/register-session.sh "codex" "Brief description" [task-uuid]
```

Then check:
- dropped sessions (red alert)
- open tasks by priority

### End of every session

PowerShell:
```powershell
.\scripts\end-session.ps1 -SessionId $env:SESSION_ID -Status completed -Summary "One line on what you finished"
```

Bash:
```bash
bash scripts/end-session.sh "$SESSION_ID" "completed" "One line on what you finished"
```

If a task is done:
```bash
curl -s -X PATCH http://localhost:3001/api/tasks/<task-uuid> \
  -H "Authorization: Bearer dev-local-secret-dashboard-2026" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

---

## What This Project Is

All in one platform for the permaculture community: a website that aims to be single source for information about "permaculture" plants and a way to obtain material. The goals are to create an efficient scraper pipeline of nurseries with available material for sale; it will also have a marketplace for private sellers and buyers to both sell and request material. 
Users search for a cultivar, see which nurseries or private sells carry it, and compare prices and availability.
It also will provide general information about the plants in a clean easy to sort and search way. This involves incorporating easy search functions by type (fruit, nut, other) as well as searching by zone, fruiting time, etc. 

Business entity: Even Flow Nursery LLC
Stack: Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase (PostgreSQL + RLS), Cheerio 1.2.0
Tests: Vitest, 230+ tests (must stay passing)
CI: GitHub Actions
Live: https://plantfinder-cyan.vercel.app

---

## Current State

- Sprints 1–11 complete — see CONTEXT.md for full history
- **Sprint 12** (ACTIVE): Progressive Disclosure UX Restructure — see `SPRINT12_PROGRESSIVE_DISCLOSURE.md`
- 15+ genera seeded, 3 nurseries live (Burnt Ridge, Grimo, Raintree)
- 230+ tests passing, 49+ SQL migrations, TypeScript strict
- Registry-driven faceted browse, alias-aware autocomplete, zone persistence, price comparison, stock alerts
- Deployment live at https://plantfinder-cyan.vercel.app

---

## Current Priorities

**Active Sprint: SPRINT12_PROGRESSIVE_DISCLOSURE.md** — Read the full sprint doc before starting work.

Execute phases in order:

1. **Phase 1: Homepage Hero & Nav Cleanup** — Add hero with search + quick-start chips, remove Marketplace from nav, remove Explore/Refine toggle, remove Pollination "coming soon" tab, replace header search with SearchBar component
2. **Phase 2: Surface Prices Earlier** — Add min_price_cents to browse API, show "From $X" on PlantCard and species page cultivar cards, move PriceComparisonTable out of Buy tab
3. **Phase 3: Cultivar Page Restructure** — Decompose 36KB page into components, progressive disclosure layout (hero → buy → growing accordion → about accordion)
4. **Phase 4: Compare Flow** — CompareContext, CompareTray, /compare page with CompareTable
5. **Phase 5: Search Polish** — Refinements to SearchBar dropdown

Each phase is independently shippable. Run `npm test` and `npx tsc --noEmit` after each phase.

---

## Hard Rules — Do Not Violate

- TypeScript strict mode: no `any`, no `@ts-ignore`
- App Router only: routes under `app/`
- RLS enforced: service client for writes, anon client for public reads
- Tests must pass: run `npm test` before wrapping a coding task
- No secrets in code: env vars only, never commit `.env*.local`
- No new scrapers without nursery consent — see CONTEXT.md
- No new npm dependencies in Sprint 12 — everything needed is already installed

---

## Key File Locations

| What | Where |
|------|-------|
| **Sprint 12 spec** | `SPRINT12_PROGRESSIVE_DISCLOSURE.md` |
| **UX product spec** | `UX_PRODUCT_SPEC.md` |
| Scraper interface + registry | `lib/scraper/index.ts` |
| Pipeline trigger | `app/api/pipeline/scrape/route.ts` |
| Parser logic | `lib/resolver/parser.ts` |
| Resolver (12-method chain) | `lib/resolver/resolver.ts` |
| Facet registry (single source of truth) | `lib/facets/registry.ts` |
| Facet state (URL serialization) | `lib/facets/state.ts` |
| Facet query builder | `lib/queries/facet-query-builder.ts` |
| Browse orchestrator | `components/BrowseContent.tsx` |
| Browse decomposition | `components/browse/` (BrowseShell, BrowseHeader, BrowseGrid, ActiveFilterPills, SmartEmptyState, FacetControl, CategoryContext) |
| Browse page client | `components/browse/BrowsePageClient.tsx` |
| Taxonomy explorer | `components/browse/TaxonomyExplorer.tsx` |
| Category colors (shared) | `lib/category-colors.ts` |
| Category definitions | `lib/browse-categories.ts` |
| Zone persistence | `lib/zone-persistence.ts` |
| Autocomplete API | `app/api/autocomplete/route.ts` |
| Browse API | `app/api/browse/route.ts` |
| DB queries | `lib/queries/` |
| Design system components | `components/ui/` (Text, Tag, Surface, BotanicalName, SearchBar, Disclosure, EmptyState) |
| Supabase clients | `lib/supabase/server.ts` |
| API envelope helpers | `lib/api-helpers.ts` |
| SQL migrations | `sql/migrations/` |
| Full context + architecture | `CONTEXT.md` |
