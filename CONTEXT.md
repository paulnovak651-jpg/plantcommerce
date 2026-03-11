# PlantCommerce — Project Context

> **Last updated:** 2026-03-11
> **Owner:** Paul Novak / Even Flow Nursery LLC
> **Repo:** github.com/paulnovak651-jpg/plantcommerce (private)
> **Supabase project:** plantfinder
> **Live URL:** https://plantfinder-cyan.vercel.app
> **Vercel project:** plantfinder (paulnovak651-jpgs-projects)

---

## What This Is

A comprehensive plant information and sourcing platform for the permaculture community. It combines a structured plant database (taxonomy, growing profiles, pollination data), a nursery inventory aggregator (automated scrapers pull live pricing across North America), and a community marketplace (WTS/WTB listings).

No user accounts (v1). No payments. Nursery offers are read-only aggregated data; community listings are anon-submitted and admin-moderated.

---

## Current State (as of 2026-03-11)

- **Foundation:** Solid. 230+ tests passing, TypeScript strict, CI green. 49 SQL migrations applied (+ migration 050 pending deploy).
- **Multi-genus:** 15+ genera seeded — hazelnuts, chestnuts, walnuts, hickories, apples, stone fruit, persimmons, mulberries, elderberries, grapes, blueberries, figs, pears, gooseberries/currants, raspberries/blackberries, kiwi, goumi, sea buckthorn, hackberry.
- **Live data:** 3 nurseries live (Burnt Ridge, Grimo, Raintree). Pipeline consent-gated. Cron: Monday 6am UTC.
- **Deployment:** Live at https://plantfinder-cyan.vercel.app.
- **Scrapers:** Data-driven registry with generic Shopify + WooCommerce scrapers. Config-driven — adding a nursery is a registry entry.
- **Knowledge graph:** Taxonomy tree (37+ nodes, Kingdom→Genus) + growing profiles + pollination profiles.
- **Browse/Search:** Registry-driven faceted filtering (zone, category, sun, growth rate, availability, chill hours, bearing age, height, pH, spread), active filter pills, skeleton loaders, sort options, pagination, search autocomplete with alias matching. Hybrid data flow: SSR seed for instant first render, API-driven for subsequent changes with 300ms debounce.
- **Facet system:** Single-source-of-truth `FACET_REGISTRY` drives sidebar, URL state, filter predicates, and count computation. Cross-facet counts (each facet counted against results filtered by all OTHER facets). Recovery hints for zero-result states show which filter to remove and expected result count.
- **Genus hubs:** `/plants/genus/[slug]` pages with species cards, growing profiles, breadcrumbs (Category → Genus → Species → Cultivar).
- **Price comparison:** Side-by-side nursery comparison tables with best-price tags, trust badges (Live/Tracked/Community), price sparklines, mobile card layout.
- **Nursery maps:** Leaflet + OpenStreetMap on nursery index + cultivar pages.
- **Community marketplace:** Anonymous WTS/WTB listings, admin moderation, 90-day expiry.
- **Stock alerts:** Email signup for availability/price notifications, toast confirmations.
- **Pollination checker:** Species-level pollination compatibility tool.
- **Admin tools:** `/admin/unmatched` + `/admin/listings` (token-protected).
- **Homepage:** Dynamic sections (Recently Restocked, Best Deals, New to Database), seasonal banner, zone recommendations, scroll reveal animations.
- **UI polish:** 30+ visual refinements — nav highlighting, custom checkboxes, filter chips, animations, skeleton loaders, grain textures, per-category card colors, botanical sketch placeholders, typography refinements, tabular-nums pricing, hover micro-interactions, toast notifications, progressive disclosure.
- **Zone awareness:** Zone persistence in localStorage, zone prompt on browse pages, zone-changed events propagate to facet state, ZoneCompatibility badges on species/cultivar pages.

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
- **material_search_index** — materialized view with trigram indexes, zone token expansion, and `alias_names` column (pipe-separated display aliases from aliases table, migration 050)

---

## API

10 endpoints with consistent response envelope, HATEOAS links, and structured data (llms.txt + JSON-LD) for AI agent discoverability.

Endpoints cover: plants, cultivars, nurseries, search, browse (facet-driven filtering + counts), pipeline trigger, community listings (POST submit + GET approved).

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
| Burnt Ridge | ✅ Live (custom scraper) |
| Grimo Nut Nursery | ✅ Live (custom scraper) |
| Raintree Nursery | ✅ Live (custom scraper) |
| One Green World | ❌ Needs consent |
| 6 others | ❌ In DB, needs consent first |

Generic Shopify and WooCommerce scrapers available — new nurseries can be onboarded via config.

---

## Agent Responsibilities

### Claude Code (CLI)
- Persistent memory across sessions, Supabase MCP, GitHub MCP
- Good for: architecture decisions, reviews, cross-cutting concerns, TypeScript issues, DB queries

### Codex (local, runs in project folder)
- Edits files directly, pushes to git
- Good for: scraper implementation, refactoring, UI work
- No persistent memory. Reads AGENTS.md on startup for context.

---

## Known Gaps & Open Questions

### Remaining work
1. **No user accounts yet** — community listings work without auth; next step is Supabase Auth for trust tiers, saved searches, price alerts
2. **Nursery consent outreach** — 3 nurseries being scraped but none formally consented yet
3. **More nursery coverage** — only 3 of 10 nurseries have live scrapers; consent needed before expanding
### Strategic questions
5. What's the user retention story beyond v1?
6. What is the first concrete growth loop to reach 50 recurring users?
7. How do we position this for nursery partnerships/affiliate model?

---

## Priority Order

### Completed
- ✅ Deploy to Vercel (live at plantfinder-cyan.vercel.app)
- ✅ Foundation hardening (ESM fix, offer key safety, error boundaries, health monitoring)
- ✅ Parser generalization (config-driven, genus registry)
- ✅ Knowledge graph (taxonomy tree, growing profiles, pollination)
- ✅ UI/UX overhaul (Explorer, filters, maps, visual data, 20+ polish items)
- ✅ Community marketplace (listings, moderation, auto-resolver)
- ✅ Stock alerts + pollination checker
- ✅ Data-driven scraper registry (Shopify + WooCommerce generic scrapers)
- ✅ Genus hub pages + genus-level browsing (Sprint 5)
- ✅ Multi-genus data seeding (15+ genera, 48 migrations)
- ✅ Price comparison tables, API rate limiting, pagination
- ✅ UX Sprint (SPRINT_UX.md) — 23 tasks across 6 groups:
  - A: Contextual Filters (smart filter sidebar, active chips, genus grouping, skeleton loaders, autocomplete)
  - B: Trust & Pricing Signals (price on cards, freshness labels, quick facts ribbon, price sparklines, trust badges, growing info badge)
  - C: Empty States & Cross-Links (cultivar empty state CTAs, related species cross-links)
  - D: Page Restructuring (progressive disclosure on species pages, homepage dynamic sections)
  - E: Visual Density & Design Refinement (card border treatment, tabular-nums, hover micro-interactions, toast notifications, scroll reveal, seasonal banner)
  - F: Zone-Aware Features (zone recommendations, search autocomplete)
- ✅ Sprint 6 Discovery (SPRINT6_DISCOVERY.md) — 12 deliverables:
  - #1-5: Zone persistence (localStorage + prompt), ZoneCompatibility badges, genus common names, browse component decomposition (BrowseShell/Header/Grid/ActiveFilterPills/SmartEmptyState/FacetControl)
  - #6-7: Alias-aware autocomplete (matchedAlias display, alias_names MV column via migration 050, ranking fix for alias-only matches)
  - #8: Search index refresh already wired into pipeline
  - #9: Registry-driven facet query builder (composable predicates, cross-facet counts, recovery hints, 27 unit tests)
  - #10: `/api/browse` endpoint (server-side faceted query, rate-limited)
  - #11: BrowseContent hybrid data flow (SSR seed + API-driven with 300ms debounce + AbortController)
  - #12: SmartEmptyState recovery hints UI (amber-toned panel, top-3 suggestions)

### Current priorities
1. **Nursery consent & outreach** ← NEXT — draft outreach template, contact existing 3 nurseries
2. **Build remaining scrapers** — One Green World + others, only after consent obtained
3. **Auth + engagement** — Supabase Auth, tie listings to accounts, trust tier progression
4. **Expand genus data** — more cultivar coverage for seeded genera

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
- [x] Polish site before broader outreach (Sprint 5 + UI polish complete)
- [ ] Draft outreach email template
- [ ] Contact Burnt Ridge, Grimo, Raintree

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
| 2026-03 | Retired shared claude-context repo | In-repo docs (CONTEXT.md, VISION.md, AGENTS.md) are the source of truth |
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
