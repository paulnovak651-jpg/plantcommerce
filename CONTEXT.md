# PlantCommerce — Project Context

> **Last updated:** 2026-03-01
> **Owner:** Paul Novak / Even Flow Nursery LLC
> **Repo:** github.com/paulnovak651-jpg/plantcommerce (private)
> **Supabase project:** plantfinder
> **Live URL:** https://plantfinder-cyan.vercel.app
> **Vercel project:** plantfinder (paulnovak651-jpgs-projects)

---

## What This Is

A plant comparison and community marketplace platform for the permaculture community. Users search for a cultivar, see which nurseries carry it, compare prices and availability, and post WTS/WTB community listings. Think "Kayak for plants" with a community trading layer.

No user accounts (v1). No payments. Nursery offers are read-only aggregated data; community listings are anon-submitted and admin-moderated.

---

## Current State (Honest Assessment)

- **Foundation:** Solid. 99 tests passing, TypeScript strict, CI green. 33 routes (API + UI).
- **Live data:** 3 nurseries live (Burnt Ridge 18 offers, Grimo 28 offers, Raintree validated). Pipeline consent-gated.
- **Deployment:** ✅ Live at https://plantfinder-cyan.vercel.app (commit 4b57a89). Cron: Monday 6am UTC.
- **Knowledge graph:** Taxonomy tree (37 nodes, Kingdom→Genus) + growing profiles for 4 Corylus species in Supabase.
- **Visual data:** Sprint 4 Phase 1 ✅ — RangeBar, IconRating, TraitGrid components. Species + cultivar pages show visual growing bars.
- **Explorer:** Sprint 4 Phase 2 ✅ — `/browse` Explorer: FilterBar (zone/category/availability), enhanced Cladogram (mini zone bars, cultivar counts, category dimming), detail panel with TraitGrid, nav: Search | Explore | Nurseries.
- **Species pages:** Stats line (N cultivars · N nurseries with stock), availability badges on cultivar cards.
- **Nursery maps:** Sprint 4 Phase 3 ✅ — Leaflet + OpenStreetMap, green pins, fitBounds. 300px map on nursery index, 200px mini-map on cultivar page. Nursery detail cleanup (ALL CAPS names → title case, no Sales Type card, Last Updated hidden if null).
- **Community marketplace:** Sprint 4 Phase 4 ✅ — `community_listings` table (migration 013, RLS), anonymous WTS/WTB submissions at `/listings/new`, auto-resolver (ilike cultivar match), 90-day expiry. Admin moderation at `/admin/listings`. ListingCard + ListingForm components. Listing sections on cultivar + species pages.
- **Search:** Zone-aware materialized view — "zone 4 hazelnut" returns results.
- **Admin tools:** `/admin/unmatched` + `/admin/listings` (both token-protected).
- **User stickiness:** Low. Community listings are the first user-generated content hook. No accounts yet.

---

## Tech Stack

| Layer | Technology
|-------|-----------|
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16 (App Router), server-rendered |
| Hosting | Vercel (live) — https://plantfinder-cyan.vercel.app |
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
- **nurseries** — 10 in DB (lat/lng added migration 012); 3 live with inventory
- **inventory_offers** — what a nursery sells, linked to cultivar or plant_entity

### Community tables
- **community_listings** — user-submitted WTS/WTB listings (migration 013); anonymous v1, admin-moderated; RLS: anon can insert + read approved, service role bypasses

### Pipeline tables
- **import_runs** — tracks each scrape session
- **raw_inventory_rows** — verbatim scraped data (always preserved)
- **unmatched_names** — product names the resolver couldn't match

### Taxonomy & Knowledge
- **taxonomy_ranks** — 6 ranks (Kingdom → Genus)
- **taxonomy_nodes** — 37 nodes, self-referential tree
- **species_growing_profiles** — USDA zones, chill hours, height/spread, pH, bearing age, sun/water/growth rate

### Search
- **material_search_index** — materialized view with trigram indexes + zone token expansion

---

## API

9 endpoints with consistent response envelope, HATEOAS links, and structured data (llms.txt + JSON-LD) for AI agent discoverability.

Endpoints cover: plants, cultivars, nurseries, search, pipeline trigger, community listings (POST submit + GET approved).

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
| Grimo | ✅ Live (run completed 2026-02-26) |
| Raintree | ✅ Live (pipeline validated 2026-02-26) |
| One Green World | ❌ Needs scraper (consent required first) |
| 6 others | ❌ In DB, nothing built (consent required first) |

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
1. ~~**Vercel deployment**~~ ✅ Done — live at plantfinder-cyan.vercel.app
2. ~~**Unmatched names queue**~~ ✅ Admin UI implemented and operational
3. **Parser generalization** — hazelnut-specific, needs work before expanding to other plant families
4. ~~**Cron automation**~~ ✅ Done — Vercel cron registered, runs Monday 6am UTC
5. ~~**Search refresh**~~ ✅ Validated end-to-end with Raintree live run

### Architecture gaps
6. ~~**No admin interface**~~ ✅ `/admin/unmatched` implemented for unmatched review workflow
7. **No user accounts yet** — community listings work without auth (v1); next step is Supabase Auth for trust tier progression, saved searches, price alerts
8. ~~**No error monitoring**~~ ✅ `/api/pipeline/health` endpoint implemented
9. **No nursery consent tracking** — need `consent_status` on nurseries table before scaling scraper count

### Strategic questions (unanswered)
10. What's the user retention story beyond v1?
11. How does the parser generalize across plant families without becoming a maintenance nightmare?
12. What is the first concrete growth loop to reach 50 recurring users?
13. What's the right consent model for nursery data? (See Nursery Consent Strategy below)

---

## Priority Order

1. ~~**Deploy to Vercel**~~ ✅ Live at plantfinder-cyan.vercel.app
2. ~~**Admin UI for unmatched queue**~~ ✅ Implemented
3. ~~**Run Grimo scraper live**~~ ✅ Completed (2026-02-26)
4. ~~**Set up Vercel Cron**~~ ✅ Registered, runs Monday 6am UTC
5. ~~**Foundation hardening sprint**~~ ✅ Done (2026-02-26)
6. ~~**Generalize the parser**~~ ✅ Done (2026-02-26) — config-driven, genus registry
7. ~~**UI polish pass (Sprint 2)**~~ ✅ Deployed to Vercel (2026-02-26)
8. ~~**Sprint 3: "Depth Before Breadth"**~~ ✅ Complete (2026-02-26) — taxonomy, growing profiles, UI polish deployed
9. ~~**Sprint 4 Phase 1**~~ ✅ Done — RangeBar, IconRating, TraitGrid; species + cultivar pages show visual bars; homepage cleanup
10. ~~**Sprint 4 Phase 2**~~ ✅ Done (2026-02-26) — Explorer page, FilterBar, enhanced Cladogram, nav simplified, species page stats + badges
11. ~~**Sprint 4 Phase 3**~~ ✅ Done — Leaflet nursery maps (index + cultivar mini-map), nursery detail cleanup
12. ~~**Sprint 4 Phase 4**~~ ✅ Done — Community marketplace foundation (listings table, API, form, admin, cards on cultivar/species pages)
13. **Nursery consent & outreach** ← NEXT — draft outreach template, contact existing 3 nurseries
14. **Build remaining scrapers** — One Green World + others, only after consent obtained
15. **Phase 5: Auth + engagement** — Supabase Auth, tie listings to accounts, trust tier progression, price alerts

---

## Nursery Consent Strategy

**Policy: Consent first, scrape second.** No new nursery scrapers should be built or run without nursery awareness/approval.

### Approach
- **Existing 3 nurseries (Burnt Ridge, Grimo, Raintree):** Reach out now to notify and request retroactive approval. Offer immediate removal if preferred.
- **New nurseries:** Contact first, get approval, then build scraper. Ask if they have a product feed or API (Shopify `/products.json`, CSV export, etc.) as alternative to HTML scraping.
- **Consent tracking:** Add `consent_status` enum to `nurseries` table: `pending`, `approved`, `declined`, `no_response`. Pipeline should only scrape `approved` nurseries.
- **Value proposition in outreach:** PlantCommerce drives traffic TO nurseries. All purchases happen on their sites. We're making their inventory more discoverable, not competing with them.

### Why this matters
- The permaculture community is small and trust-based. Scraping without notification risks reputation damage.
- Nurseries who opt in provide better data (feeds, corrections, advocacy).
- Consent-first is the foundation for a potential affiliate model later.
- Legal landscape for scraping is unsettled; consent eliminates the question entirely.

### TODO
- [x] Add `consent_status` column to `nurseries` table with enum (migration 004 applied)
- [x] Gate pipeline to skip non-approved nurseries (`declined` skipped, `pending` still runs)
- [ ] Draft outreach email template
- [ ] Contact Burnt Ridge, Grimo, Raintree
- [ ] Polish site before broader outreach

---

## Future Projects Backlog

1. **Facebook consented ingestion adapter (official API only, no scraping)**  
   Plan doc: `docs/facebook-consented-ingestion-roadmap.md`
2. **Cross-platform source adapters** (e.g., forum/import adapters) through the same listing quality gate.
3. **Unified ingestion observability** for source health, sync lag, and moderation throughput.

---

## Scraper Scaling Kit

- Playbook: `docs/nursery-scraper-playbook.md`
- Scaffold command:

```bash
npm run scraper:new -- --slug <nursery-slug> --class <ClassName> --name "<Nursery Name>" --category-url "<url>"
```

This keeps scraper onboarding consistent: scaffold -> fixture tests -> registry wiring -> pipeline validation.

---

## UX Contracts

- Foundation spec: `docs/ux-foundation-spec.md`
- Shared contract code: `lib/contracts/ux.ts`

Use these as the source of truth for search URL state, result card fields, listing card fields, and moderation queue fields.

---

## System Map

```
[User Browser]
      │
      ▼
[Next.js App — plantfinder-cyan.vercel.app]
      │
      ├── Pages: home, search, species, cultivar, nursery index, nursery detail
      │   └── Server-rendered, pulls from Supabase directly
      │
      ├── API (9 endpoints)
      │   └── Plants, cultivars, nurseries, search, pipeline trigger, listings
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
            ├── nurseries (lat/lng), inventory_offers
            ├── import_runs, raw_inventory_rows, unmatched_names
            ├── community_listings (WTS/WTB, pending→approved, RLS)
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
| 2026-02-25 | Deployed to Vercel (Hobby plan, direct push) | plantfinder-cyan.vercel.app — cron registered Monday 6am UTC |
| 2026-02-25 | Vercel project "plantfinder" (diverged from plantcommerce repo) | GitHub integration points at old plantfinder repo; direct CLI deploy used for now |
| 2026-02-26 | Foundation hardening sprint completed | ESM imports, offer key safety, dead code removal, parser audit, Raintree live run, error boundaries, health monitoring |
| 2026-02-26 | Consent-first nursery policy adopted | No new scrapers without nursery awareness/approval. Existing nurseries to be notified retroactively. Trust > speed in permaculture community |
| 2026-02-26 | Sprint 4 Phase 3: Nursery maps | Leaflet + OSM, green pins, fitBounds, NurseryMap dynamic wrapper (ssr:false), 300px index map + 200px cultivar mini-map; lat/lng seeded for 3 nurseries |
| 2026-02-26 | Sprint 4 Phase 4: Community marketplace | community_listings table (no-auth v1), anon submissions → pending → admin approval, resolver auto-links cultivar on submit, 90-day expiry |

---

## How to Use This File

**Every AI session working on PlantCommerce should start by reading this file.**

- Claude Code: loaded via memory system automatically
- Codex: reads `AGENTS.md` on startup (references this file)
- Claude Opus (desktop): fetch https://raw.githubusercontent.com/paulnovak651-jpg/claude-context/main/plantcommerce.md
- ChatGPT: browse the same URL above
