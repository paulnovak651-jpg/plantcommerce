# Plant Commerce — Agent Instructions

> Auto-loaded by Codex on startup. Read before doing any work.
> **At session start, fetch and read:** https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md
> Dashboard: http://localhost:3001

---

## Dashboard Protocol — All Agents Must Follow

The **Command Center** at http://localhost:3001 is the single source of truth for all projects, tasks, and agent activity. All agents must treat it as the authoritative task list.

**At the start of every session:**
1. Fetch the context URL above
2. Check http://localhost:3001 for the current task priorities for this project

**After completing any task:**
1. Mark it done in this `AGENTS.md` (strike it out and add ✅)
2. Add a short note: what you did and any important decisions
3. Claude Code will sync these changes to the Supabase dashboard

**If you discover something that should be tracked (new bug, new task, blocker):**
- Add it to the Priority Tasks section in this file
- Claude Code will add it to the dashboard on next sync

---

## What This Project Is

Plant comparison platform for permaculture community — "PCPartPicker for nursery stock".
Users search for a plant cultivar, see which nurseries carry it, compare prices/availability.

**Business entity:** Even Flow Nursery LLC
**Stack:** Next.js 16.1.6 (App Router), React 19.2.4, TypeScript 5.9.3 strict, Tailwind CSS 4.2.1, Supabase (PostgreSQL + RLS), Cheerio 1.2.0
**Tests:** Vitest, 65 tests — all must stay passing
**CI:** GitHub Actions

---

## Current State

- Waves 1–3 complete: pipeline, tests, CI, design system, UI polish, observability
- 8 API endpoints, 7 UI pages, design system "The Field Guide"
- Only 1 of 10 nurseries has live inventory (Burnt Ridge, 18 offers)

---

## Next Priorities

1. Add nursery scrapers for Grimo, One Green World, Raintree (already in DB)
2. Scraper registry — remove hardcoded `BurntRidgeScraper` from `app/api/pipeline/scrape/route.ts`
3. Parser generalization — move noise terms/botanical patterns to config
4. Vercel cron for weekly automated scraping
5. Admin UI for unmatched names review

---

## Hard Rules — Do Not Violate

- **TypeScript strict mode** — no `any`, no `@ts-ignore`
- **App Router only** — all routes under `src/app/`, do not use Pages Router
- **RLS enforced** — all DB writes use `createServiceClient()`, public reads use anon client
- **Tests must pass** — run `npm test` before finishing any task; fix failures before stopping
- **No hardcoded colors/fonts** — use Tailwind design tokens from config
- **No secrets in code** — env vars only, never commit `.env*.local`

---

## Key File Locations

| What | Where |
|------|-------|
| Scraper interface + registry | `lib/scraper/index.ts` |
| Burnt Ridge scraper (reference impl) | `lib/scraper/burnt-ridge.ts` |
| Pipeline trigger | `app/api/pipeline/scrape/route.ts` |
| Parser logic | `lib/resolver/parser.ts` |
| Resolver (12-method chain) | `lib/resolver/resolver.ts` |
| DB queries | `lib/queries/` |
| Supabase clients | `lib/supabase/server.ts` |
| API envelope helpers | `lib/api-helpers.ts` |
| Full context + architecture | `CONTEXT.md` |

