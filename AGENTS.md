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
Tests: Vitest, 99 tests (must stay passing)
CI: GitHub Actions
Live: https://plantfinder-cyan.vercel.app

---

## Current State

- Sprint 4 Phase 1 ✅ complete — RangeBar, IconRating, TraitGrid visual components; species + cultivar pages show growing bars; homepage cleaned up
- Sprint 4 Phase 2 ✅ complete — Explorer page at `/browse`, FilterBar (zone/category/availability), enhanced Cladogram (mini zone bars, cultivar counts, category dimming), detail panel, nav simplified to Search | Explore | Nurseries, species page stats + availability badges
- Sprint 4 Phase 3 ✅ complete — Leaflet nursery maps on index (300px) + cultivar mini-map (200px); nursery detail cleanup (ALL CAPS names, hide null Last Updated, remove Sales Type)
- Sprint 4 Phase 4 ✅ complete — `community_listings` table (migration 013), POST/GET `/api/listings`, ListingCard + ListingForm components, `/listings/new` submission page, `/admin/listings` moderation queue, listing sections on cultivar + species pages
- 3 nurseries live: Burnt Ridge (18 offers), Grimo (28 offers), Raintree (validated)
- Knowledge graph: taxonomy tree + growing profiles for 4 Corylus species
- Deployment live at https://plantfinder-cyan.vercel.app (commit 4b57a89)

---

## Current Priorities

**Next Up — Nursery Outreach & Consent**
- Draft outreach email template for Burnt Ridge, Grimo, Raintree
- Polish site before contacting nurseries (site is now ready)
- Contact existing 3 nurseries for retroactive consent

**After Outreach — Phase 5 (TBD)**
- Supabase Auth + lightweight user accounts (tie listings to accounts, trust tier progression)
- Price alerts / stock notifications
- Build remaining scrapers (One Green World + others, consent required first)
- Parser generalization beyond hazelnut

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
| Nursery map (dynamic wrapper) | `components/NurseryMap.tsx` |
| Nursery map (Leaflet client) | `components/NurseryMapClient.tsx` |
| Listing card | `components/ListingCard.tsx` |
| Listing submission form | `components/ListingForm.tsx` |
| Listings API | `app/api/listings/route.ts` |
| Listings submission page | `app/listings/new/page.tsx` |
| Listings moderation admin | `app/admin/listings/page.tsx` |
| Listings DB queries | `lib/queries/listings.ts` |
| SQL migrations | `sql/migrations/` |
| Full context + architecture | `CONTEXT.md` |
