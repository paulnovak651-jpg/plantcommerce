# PlantCommerce — Project Context

> **Last updated:** 2026-02-25
> **Owner:** Paul Novak / Even Flow Nursery LLC
> **Repo:** github.com/paulnovak651-jpg/plantcommerce (private)
> **Supabase project:** plantfinder

---

## What This Is

A read-only plant comparison platform that aggregates nursery inventory from across North America, resolves messy product names into structured botanical data, and lets users search/compare availability and pricing. Think "Kayak for plants."

No e-commerce. No payments. No accounts. Purely informational for v1.

---

## Current State (Honest Assessment)

- **Foundation:** Solid. Database schema stress-tested with hazelnuts (104 real product names, 100% resolution accuracy).
- **Live data:** 1 nursery (Burnt Ridge, 18 offers in DB). Grimo scraper built but not run live yet.
- **Deployment:** Localhost only. No Vercel deployment yet. No cron running.
- **Pipeline:** Works end-to-end manually. Not tested with Grimo yet.
- **Search:** Materialized view exists, needs manual refresh after scrapes (automated in code, untested e2e).
- **Admin tools:** None. Unmatched names queue has no UI. Resolution rate across real data is unknown.
- **User stickiness:** Zero. No accounts, saved searches, price alerts, or notifications.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16 (App Router), server-rendered |
| Hosting (planned) | Vercel |
| Design system | "The Field Guide" — warm linen palette, Fraunces + Satoshi fonts, 7 shared components |
| External services | Supabase only. No Stripe, shipping, auth, or email. |

---

## Database Schema (Supabase)

### Core tables
- **plant_entities** — species level (e.g., "European Hazelnut")
- **cultivars** — named varieties (e.g., "Jefferson")
- **aliases** — alternate names for cultivars
- **legal_identifiers** — patent/trademark info

### Commerce tables
- **nurseries** — 10 in DB currently
- **inventory_offers** — what a nursery sells, linked to cultivar or plant_entity

### Pipeline tables
- **import_runs** — tracks each scrape session
- **raw_inventory_rows** — verbatim scraped data (always preserved)
- **unmatched_names** — product names the resolver couldn't match

### Search
- **material_search_index** — materialized view with trigram indexes for fuzzy search

---

## API

8 endpoints with consistent response envelope, HATEOAS links, and structured data (llms.txt + JSON-LD) for AI agent discoverability.

Endpoints cover: plants, cultivars, nurseries, search, pipeline trigger.

---

## The Pipeline (Core Engine)

This is the heart of the system:

```
Scraper (fetches nursery HTML)
  → Parser (decomposes raw product name into structured fields)
    → Resolver (matches against alias index, 12-method priority chain)
      → Writer (upserts to Supabase)
```

- Pipeline triggered via protected cron endpoint (currently manual)
- Parser is hazelnut-specific — noise terms and botanical patterns are hardcoded
- Generalizing parser to other plant families requires a dedicated pass

### Scraper Status

| Nursery | Status |
|---------|--------|
| Burnt Ridge | ✅ Live, 18 offers in DB |
| Grimo | 🔨 Built (by Codex), not run live |
| Raintree | ❌ Needs scraper |
| One Green World | ❌ Needs scraper |
| 6 others | ❌ In DB, nothing built |

---

## Agent Responsibilities

### Claude Code (CLI)
- Persistent memory across sessions, Supabase MCP, GitHub MCP
- Good for: architecture decisions, reviews, cross-cutting concerns, TypeScript issues, DB queries
- Updates this file and the shared context repo after significant sessions

### Codex (local, runs in project folder)
- Edits files directly, pushes to git
- Good for: scraper implementation, refactoring, UI work
- No persistent memory. Reads AGENTS.md on startup for context.

### Claude Opus (desktop, separate account)
- Strategy, design decisions, system thinking
- Fetches raw context URL at session start: https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md

---

## Known Gaps & Open Questions

### Immediate blockers
1. **Vercel deployment** — app is localhost only, blocks real users, cron, and feedback
2. **Unmatched names queue** — no admin UI, nobody reviewing, resolution rate unknown
3. **Parser generalization** — hazelnut-specific, needs work before expanding to other plant families
4. **Cron automation** — pipeline trigger is manual, no scheduled runs
5. **Search refresh** — materialized view refresh after scrapes untested end-to-end with Grimo

### Architecture gaps
6. **No admin interface** — no way to review unmatched names, monitor pipeline health, or see resolution rates
7. **No user accounts or engagement features** — no saved searches, price alerts, stock notifications
8. **No error monitoring** — if a scraper breaks, nobody knows

### Strategic questions (unanswered)
9. What's the user retention story beyond v1?
10. How does the parser generalize across plant families without becoming a maintenance nightmare?
11. When do we deploy to Vercel and start getting real users?

---

## Priority Order

1. **Deploy to Vercel** — everything else is blocked by localhost-only
2. **Admin UI for unmatched queue** — flying blind on data quality
3. **Run Grimo scraper live** — validates multi-nursery pipeline
4. **Set up Vercel Cron** — automate pipeline runs
5. **Generalize the parser** — required before non-hazelnut expansion
6. **Build remaining scrapers** — Raintree, One Green World, 6 others

---

## System Map

```
[User Browser]
      │
      ▼
[Next.js App (localhost / Vercel planned)]
      │
      ├── Pages: home, search, species, cultivar, nursery index, nursery detail
      │   └── Server-rendered, pulls from Supabase directly
      │
      ├── API (8 endpoints)
      │   └── Plants, cultivars, nurseries, search, pipeline trigger
      │
      └── Pipeline (cron endpoint, manual trigger)
            │
            ├── Scraper → fetches nursery HTML
            ├── Parser → decomposes product names (hazelnut-specific)
            ├── Resolver → 12-method priority chain against alias index
            └── Writer → upserts to Supabase
                  │
                  ▼
          [Supabase PostgreSQL]
            ├── plant_entities, cultivars, aliases, legal_identifiers
            ├── nurseries, inventory_offers
            ├── import_runs, raw_inventory_rows, unmatched_names
            └── material_search_index (materialized view)
```

Interactive system map available at `/system-map` (dev tool, not linked in nav).

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Pre-2026 | Supabase PostgreSQL as sole backend | Simplicity, real-time capabilities, generous free tier |
| Pre-2026 | Read-only platform for v1 | Validate data model and pipeline before adding commerce |
| Pre-2026 | Preserve raw_inventory_rows always | Never lose source data, enables re-parsing as resolver improves |
| Pre-2026 | 12-method resolver priority chain | Maximizes match accuracy across messy nursery naming conventions |
| 2026-02 | Codex for scraper implementation, Claude Code for architecture | Play to each tool's strengths |
| 2026-02 | Shared context repo for cross-AI sync | Single source of truth across Claude Code, Codex, Claude Opus, ChatGPT |

---

## How to Use This File

**Every AI session working on PlantCommerce should start by reading this file.**

- Claude Code: loaded via memory system automatically
- Codex: reads `AGENTS.md` on startup (references this file)
- Claude Opus (desktop): fetch https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md
- ChatGPT: browse the same URL above
