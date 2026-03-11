# Plant Commerce — Vision & Status Document

*Last updated: 2026-03-11. For sharing with collaborators and AI agents.*


## What Is This?

Plant Commerce is a **comprehensive plant information and sourcing platform for the permaculture community**. It combines three things that don't exist together anywhere else:

1. **A plant database** — structured botanical data across multiple genera, with taxonomy, growing profiles, pollination info, and cultivar-level detail.
2. **A nursery inventory aggregator** — automated scrapers pull live pricing and availability from nurseries across North America, letting users compare options side-by-side.
3. **A community marketplace** — users can post WTS/WTB listings for plant material, connecting growers directly.

The platform solves a real problem: permaculture growers spend hours manually checking individual nursery websites to find specific cultivars. There's no aggregator. Nurseries don't list on Amazon. Product names are inconsistent. The information is scattered, unstandardized, and tedious to compare. Plant Commerce brings it all into one place.

**Business entity:** Even Flow Nursery LLC
**Live URL:** https://plantfinder-cyan.vercel.app

## The Core Insight

The hardest part isn't building a website — it's **resolving messy nursery product names to canonical cultivar identities**. Every nursery names things differently. The same plant might be listed as:

- `Jefferson Hazelnut (Corylus avellana)`
- `JEFFERSON FILBERT`
- `'Jefferson' Hazel Layer(cultivar)`
- `Jefferson — A great variety for Pacific Northwest`

Our pipeline decomposes these into structured components (botanical name, propagation method, sale form, patent info, marketing text), strips the noise, and matches the remaining "core name" against an alias index. This resolution engine is the platform's competitive advantage.

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Scrapers   │───▶│    Parser    │───▶│   Resolver   │───▶│    Writer    │
│  (registry)  │    │ (config-driven│    │ (12 methods) │    │ (Supabase)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                    ┌──────────────┐    ┌──────────────┐           │
                    │   Frontend   │◀───│   REST API   │◀──────────┘
                    │  (Next.js)   │    │ (20 routes)  │
                    └──────────────┘    └──────────────┘
```

**Tech stack**: Next.js 16.1.6 (App Router, Turbopack), React 19, Tailwind CSS 4, Supabase (PostgreSQL + RLS + materialized views), Cheerio (scraping), Leaflet (maps), Vitest (testing), GitHub Actions CI.

**Design system**: "The Field Guide" — warm linen palette, Fraunces + Satoshi fonts, botanical line-art aesthetic.

## What's Been Built

### Data Layer (Supabase PostgreSQL)

**Core tables:**
- `plant_entities` — species-level records across 15+ genera (Corylus, Castanea, Juglans, Carya, Malus, Prunus, Diospyros, Morus, Sambucus, Vitis, Vaccinium, Ficus, Pyrus, Ribes, Rubus, Actinidia, Elaeagnus, Hippophae, Celtis, and more)
- `cultivars` — named varieties with breeder, origin, patent status
- `aliases` — alternate name mappings for resolver matching
- `legal_identifiers` — patent/trademark info

**Commerce tables:**
- `nurseries` — 10 nurseries with lat/lng coordinates; 3 live with inventory
- `inventory_offers` — live listings linking cultivar + nursery + price
- `price_history` — tracks price changes over time

**Community tables:**
- `community_listings` — user-submitted WTS/WTB listings (anonymous v1, admin-moderated, 90-day expiry)
- `stock_alerts` — email notifications for availability/price changes

**Knowledge graph:**
- `taxonomy_ranks` — 6 ranks (Kingdom → Genus)
- `taxonomy_nodes` — 37+ nodes, self-referential tree
- `species_growing_profiles` — USDA zones, chill hours, height/spread, pH, bearing age, sun/water/growth rate
- `species_pollination_profiles` — pollination compatibility data

**Pipeline tables:**
- `import_runs` — tracks each scrape session
- `raw_inventory_rows` — verbatim scraped data (always preserved)
- `unmatched_names` — product names the resolver couldn't match

**Search:**
- `material_search_index` — materialized view with trigram indexes, zone token expansion, category filtering, availability counts, `alias_names` column (pipe-separated display aliases for autocomplete)

**49 SQL migrations** applied (+ migration 050 pending deploy).

### Pipeline (the engine)

- **Scrapers**: Data-driven registry with generic Shopify and WooCommerce scrapers + custom scrapers (Burnt Ridge, Grimo, Raintree). Config-driven — adding a nursery is a registry entry, not code.
- **Parser** (`lib/resolver/parser.ts`): Config-driven decomposition. Genus-specific noise terms and patterns loaded from `ParserConfig`. Supports multi-genus parsing.
- **Resolver** (`lib/resolver/resolver.ts`): 12-method matching chain with confidence scoring. Genus-specific configs in `lib/resolver/genus-config.ts`.
- **Writer** (`lib/pipeline/supabase-pipeline.ts`): Idempotent upserts, price change detection, stale offer management.
- **Pipeline health**: `/api/pipeline/health` tracks scraper staleness, resolve rates, error rates.
- **Consent-gated**: Pipeline skips nurseries with `consent_status = 'declined'`.
- **Cron**: Vercel cron runs Monday 6am UTC.

### Frontend (16 pages)

| Page | Description |
|------|-------------|
| `/` | Homepage with search, category cards, stats, "How It Works" |
| `/browse` | Explorer with registry-driven faceted filtering (zone, category, sun, growth rate, availability, chill hours, height, pH, spread), species or genus grouping, sort options, active filter pills, skeleton loaders, hybrid SSR seed + API-driven data flow, zero-result recovery hints |
| `/search` | Full-text search with zone/category/in-stock filters |
| `/plants/genus/[genusSlug]` | Genus hub — all species in a genus with growing profiles, breadcrumbs |
| `/plants/[speciesSlug]` | Species detail — taxonomy lineage, growing profile grid, cultivar cards with availability badges, section dividers, related species pills |
| `/plants/[speciesSlug]/[cultivarSlug]` | Cultivar detail — price comparison table (best price tag, mobile cards), nursery map, stock alert signup, pollination info |
| `/nurseries` | Nursery index with Leaflet map |
| `/nurseries/[nurserySlug]` | Nursery detail with inventory |
| `/marketplace` | Community marketplace listings |
| `/marketplace/submit` | Submit WTS/WTB listing |
| `/listings/new` | Listing submission form |
| `/pollination` | Pollination compatibility checker |
| `/admin/unmatched` | Admin: unmatched name resolution |
| `/admin/listings` | Admin: listing moderation |
| `/dashboard` | Command Center dashboard |
| `/system-map` | Interactive system architecture map |

### API (20 endpoints)

Plants, cultivars, nurseries, search, browse (facet-driven filtering with cross-facet counts and recovery hints), autocomplete (alias-aware), pipeline trigger/status/health, community listings, stock alerts, admin tools, schema endpoint, dashboard/sessions/tasks. Standard envelope: `{ ok: true, data, meta, links }`. Rate-limited. AI-readable docs at `/llms.txt` and `/llms-full.txt`.

### UI Polish

- Nav active state highlighting
- Custom-styled checkboxes
- Active filter chips with clear-all
- Mobile filter sheet slide animation
- Skeleton loaders for browse grid
- Page fade-in transitions
- Botanical sketch placeholder for missing images
- Category cards with distinct per-category color gradients
- Hero grain texture overlay
- Frosted-glass stat cards
- Price comparison table with mobile card layout
- Typography refinements (serif h3, tabular price numerals)
- Species page section dividers
- Related species pill links

### Tests & CI
- **230+ tests** across multiple suites, all passing
- GitHub Actions CI: typecheck (`tsc --noEmit`) + test on push/PR to master
- Key test suites: facet query builder (27 tests), facet state (16 tests), search scoring, pipeline, resolver

## What's Generic vs. Domain-Specific

### Already generic (works for any plant genus)
- Entire database schema, types, enums, indexes, RLS policies
- Alias index building + 10 of 12 resolver strategies
- All Supabase integration code
- All UI pages (render dynamically from DB data)
- All API endpoints and query functions
- Search, sitemap, SEO structured data
- Scraper registry (Shopify/WooCommerce generic scrapers)
- Parser config system (genus configs loaded at runtime)

### Adding a new genus
1. Create a genus config in `lib/resolver/genus-config.ts` — ~50 lines
2. Seed species + cultivar data via SQL migration
3. Register in the genus config registry
4. Nursery scrapers if needed (or use generic Shopify/WooCommerce scrapers)

This has been proven — the project has expanded from a single genus (hazelnuts) to 15+ genera across nut trees, fruit trees, berries, vines, and support species.

## Current State (as of 2026-03-11)

### What's working
- Multi-genus platform with 15+ genera seeded across fruit, nut, berry, vine, and support species
- 3 nurseries live with scraped inventory (Burnt Ridge, Grimo, Raintree)
- Data-driven scraper pipeline with generic Shopify + WooCommerce support
- Config-driven parser and resolver (genus registry pattern)
- Registry-driven faceted browse with cross-facet counts, recovery hints, hybrid SSR+API data flow
- Alias-aware autocomplete (shows "also known as" in dropdown, alias_names from materialized view)
- Zone persistence (localStorage), zone prompt, zone compatibility badges on plant pages
- Genus hub pages for hierarchical browsing (Category → Genus → Species → Cultivar)
- Price comparison tables, nursery maps, stock alerts, pollination checker
- Community marketplace with anonymous listings and admin moderation
- 49 migrations, 230+ tests, TypeScript strict, CI green
- Live at https://plantfinder-cyan.vercel.app

### What's next
1. **Nursery consent & outreach** — draft outreach template, contact existing 3 nurseries for retroactive consent
2. **Build remaining scrapers** — One Green World + others, only after consent
3. **Auth & engagement** — Supabase Auth, tie listings to accounts, trust tier progression
4. **Expand genus coverage** — seed more cultivar data for existing genera, add new genera as nursery data comes in
5. **Price history UI** — surface price trends from the price_history table

## Nursery Consent Strategy

**Policy: Consent first, scrape second.** No new nursery scrapers without nursery awareness/approval.

- Existing nurseries (Burnt Ridge, Grimo, Raintree): notify and request retroactive approval
- New nurseries: contact first, get approval, then build scraper
- Value proposition: PlantCommerce drives traffic TO nurseries — all purchases happen on their sites
- The permaculture community is small and trust-based; consent eliminates legal and reputational risk

## Repository

- **GitHub**: github.com/paulnovak651-jpg/plantcommerce
- **Branch**: master (single branch)
- **Live**: https://plantfinder-cyan.vercel.app (Vercel)
- **Database**: Supabase project `plantfinder`
- **Dev**: localhost:3000 (Next.js + Turbopack)

## Key Files

| Purpose | File |
|---------|------|
| Project context | `CONTEXT.md` |
| Agent instructions | `AGENTS.md` |
| Design system | `DESIGN_SYSTEM.md` |
| Product roadmap | `ROADMAP.md` |
| Parser logic | `lib/resolver/parser.ts` |
| Resolver (12-method chain) | `lib/resolver/resolver.ts` |
| Genus configs | `lib/resolver/genus-config.ts` |
| Pipeline writer | `lib/pipeline/supabase-pipeline.ts` |
| Scraper registry | `lib/scraper/index.ts` |
| DB queries | `lib/queries/` |
| Supabase clients | `lib/supabase/server.ts` |
| API helpers | `lib/api-helpers.ts` |
| SQL migrations | `sql/migrations/` |
| Scraper playbook | `docs/nursery-scraper-playbook.md` |
