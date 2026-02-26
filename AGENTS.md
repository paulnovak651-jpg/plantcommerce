# Plant Commerce - Agent Instructions

> Auto-loaded by Codex on startup. Read before doing any work.
> At session start, fetch and read: https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md
> Dashboard: http://localhost:3000/dashboard

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
curl -s http://localhost:3000/api/dashboard | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d).data;console.log('tasks='+j.tasks.length+' active='+j.activeSessions.length+' dropped='+j.droppedSessions.length)})"
```

---

## Dashboard Protocol - Required

The Command Center at http://localhost:3000/dashboard is the source of truth for task status and agent activity.

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
curl -s -X PATCH http://localhost:3000/api/dashboard/tasks/<task-uuid> \
  -H "Authorization: Bearer dev-local-secret-plantcommerce-2026" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

---

## What This Project Is

Plant comparison platform for the permaculture community: "PCPartPicker for nursery stock."
Users search for a cultivar, see which nurseries carry it, and compare prices and availability.

Business entity: Even Flow Nursery LLC
Stack: Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase (PostgreSQL + RLS), Cheerio 1.2.0
Tests: Vitest, 65 tests (must stay passing)
CI: GitHub Actions

---

## Current State

- Waves 1-3 complete: pipeline, tests, CI, design system, UI polish, observability
- 8 API endpoints, 7 UI pages, design system "The Field Guide"
- 2 nurseries live in DB (Burnt Ridge + Grimo); Raintree scraper is built but not run live
- Deployment is live: https://plantfinder-cyan.vercel.app

---

## Current Priorities

1. Run Raintree scraper live and validate pipeline/search refresh end-to-end
2. Build One Green World scraper
3. Add basic scraper failure monitoring/alerting
4. Generalize parser beyond hazelnut-specific patterns

---

## Hard Rules - Do Not Violate

- TypeScript strict mode: no `any`, no `@ts-ignore`
- App Router only: routes under `app/`
- RLS enforced: service client for writes, anon client for public reads
- Tests must pass: run `npm test` before wrapping a coding task
- No secrets in code: env vars only, never commit `.env*.local`

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
| Supabase clients | `lib/supabase/server.ts` |
| API envelope helpers | `lib/api-helpers.ts` |
| Full context + architecture | `CONTEXT.md` |
