# Plant Commerce — Agent Instructions

> Auto-loaded by Codex on startup. Read before doing any work.
> At session start, fetch and read: https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md
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

Plant comparison platform for the permaculture community: "PCPartPicker for nursery stock."
Users search for a cultivar, see which nurseries carry it, and compare prices and availability.

Business entity: Even Flow Nursery LLC
Stack: Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase (PostgreSQL + RLS), Cheerio 1.2.0
Tests: Vitest, 99 tests (must stay passing)
CI: GitHub Actions
Live: https://plantfinder-cyan.vercel.app

---

## Current State

- Sprint 4 Phase 1 ✅ complete — RangeBar, IconRating, TraitGrid visual components; species + cultivar pages show growing bars; homepage cleaned up
- Sprint 4 Phase 2 ✅ complete — Explorer page at `/browse`, FilterBar (zone/category/availability), enhanced Cladogram (mini zone bars, cultivar counts, category dimming), detail panel, nav simplified to Search | Explore | Nurseries, species page stats + availability badges
- 3 nurseries live: Burnt Ridge (18 offers), Grimo (28 offers), Raintree (validated)
- Knowledge graph: taxonomy tree + growing profiles for 4 Corylus species
- Deployment live at https://plantfinder-cyan.vercel.app (commit 37f7b95)

---

## Current Priorities

**Sprint 4 Phase 3 — Nursery Maps (Codex)**
1. Install Leaflet: `npm install leaflet react-leaflet && npm install -D @types/leaflet`
2. Apply migration `012_nursery_coordinates.sql` (add lat/lng to nurseries, seed 3 live nurseries)
3. Build `components/NurseryMap.tsx` — `'use client'` + `next/dynamic` with `ssr:false`, OSM tiles, green pins, fitBounds
4. Add map to nursery index page (`app/nurseries/page.tsx`) — above cards, 300px mobile / 400px desktop
5. Add mini-map to cultivar page (`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`) — 200px, shows nurseries carrying this cultivar
6. Nursery detail page cleanup: hide null "Last Updated", remove "Sales Type" card, clean ALL CAPS names

**After Phase 3 — Phase 4 Marketplace (Claude Code + Codex)**
- Migration 013: `community_listings` table with RLS
- Listing submission API + form
- Listing cards on cultivar/species pages
- Moderation admin at `/admin/listings`

---

## Hard Rules — Do Not Violate

- TypeScript strict mode: no `any`, no `@ts-ignore`
- App Router only: routes under `app/`
- RLS enforced: service client for writes, anon client for public reads
- Tests must pass: run `npm test` before wrapping a coding task
- No secrets in code: env vars only, never commit `.env*.local`
- No new scrapers without nursery consent — see CONTEXT.md

---

## Key File Locations

| What | Where |
|------|-------|
| Scraper interface + registry | `lib/scraper/index.ts` |
| Burnt Ridge scraper (reference) | `lib/scraper/burnt-ridge.ts` |
| Pipeline trigger | `app/api/pipeline/scrape/route.ts` |
| Parser logic | `lib/resolver/parser.ts` |
| Resolver (12-method chain) | `lib/resolver/resolver.ts` |
| DB queries | `lib/queries/` |
| Explorer query | `lib/queries/explorer.ts` |
| Growing profile query | `lib/queries/growing.ts` |
| Taxonomy query | `lib/queries/taxonomy.ts` |
| Supabase clients | `lib/supabase/server.ts` |
| API envelope helpers | `lib/api-helpers.ts` |
| Explorer page | `app/browse/page.tsx` |
| ExplorerLayout (client shell) | `components/ExplorerLayout.tsx` |
| FilterBar | `components/FilterBar.tsx` |
| Cladogram | `components/Cladogram.tsx` |
| TraitGrid | `components/ui/TraitGrid.tsx` |
| RangeBar | `components/ui/RangeBar.tsx` |
| SQL migrations | `sql/migrations/` |
| Full context + architecture | `CONTEXT.md` |
| Sprint 4 spec | `SPRINT4.md` |
