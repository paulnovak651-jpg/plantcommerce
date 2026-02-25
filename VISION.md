# Plant Commerce — Vision & Status Document

*Last updated: 2026-02-24. For sharing with collaborators and AI agents.*


## What Is This?

Plant Commerce is a **plant comparison platform for the permaculture community** — think PCPartPicker for nursery stock. A user searches for a plant cultivar (say, "Jefferson Hazelnut"), sees which nurseries carry it, compares prices and availability, and finds the best option.

The platform solves a real problem: permaculture growers spend hours manually checking individual nursery websites to find specific cultivars. There's no aggregator. Nurseries don't list on Amazon. Product names are inconsistent ("Jefferson Hazelnut", "JEFFERSON FILBERT (Corylus avellana)", "'Jefferson' Hazel Layer"). The information is scattered, unstandardized, and tedious to compare.

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
│  (per-site)  │    │ (decompose)  │    │ (12 methods) │    │ (Supabase)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                    ┌──────────────┐    ┌──────────────┐           │
                    │   Frontend   │◀───│   REST API   │◀──────────┘
                    │  (Next.js)   │    │  (7 routes)  │
                    └──────────────┘    └──────────────┘
```

**Tech stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, Supabase (PostgreSQL + RLS + materialized views), Cheerio (scraping), Vitest (testing), GitHub Actions CI.

**Data model** (all in Supabase/PostgreSQL):
- `plant_entities` — Species (e.g., Corylus avellana = European Hazelnut)
- `cultivars` — Named varieties (e.g., Jefferson, Dorris, Yamhill)
- `aliases` — Alternate names for matching (Geneva → Gene)
- `nurseries` — Businesses that sell plants
- `inventory_offers` — Live listings linking cultivar + nursery + price
- `unmatched_names` — Products the resolver couldn't match (for review)
- `import_runs` — Pipeline execution history with diagnostics
- `raw_inventory_rows` — Every scraped product preserved for re-processing
- `material_search_index` — Materialized view powering full-text search

## What's Been Built

### Data Layer
| Table | Rows | Notes |
|-------|------|-------|
| `plant_entities` | 7 | 5 Corylus species + 2 others (Gevuina, hybrid group) |
| `cultivars` | 61 | Named hazelnut varieties with breeder, origin, patent status |
| `aliases` | 20 | Alternate name mappings |
| `nurseries` | 10 | Burnt Ridge, Grimo, Oikos, Badgersett, Nolin River, etc. |
| `inventory_offers` | 18 | Live offers from 1 nursery (Burnt Ridge) |
| `import_runs` | 2 | Pipeline run history |

### Pipeline (the engine)
- **Scraper** (`lib/scraper/burnt-ridge.ts`): Fetches nursery product pages using Cheerio. Rate-limited (2s between requests), retry with backoff, user-agent rotation.
- **Parser** (`lib/resolver/parser.ts`): Decomposes raw product names into: core name, botanical name, propagation method, sale form, organic status, patent info, trademark, age/size, marketing text, stripped tokens.
- **Resolver** (`lib/resolver/resolver.ts`): 12-method matching chain in priority order — direct match (0.95), strip/add "the" (0.95), botanical fallback (0.85), botanical match (0.85), raw match (0.75), species keyword (0.80), generic default (0.50), word match (0.60), bigram (0.80), trigram (0.80), unresolved (0.0).
- **Writer** (`lib/pipeline/supabase-pipeline.ts`): Idempotent select-then-insert/update to `inventory_offers` + `unmatched_names`. Builds alias index from live DB.
- **Observability** (`lib/pipeline/logger.ts`): Structured JSON logging, duration tracking, error samples (capped at 20), alert thresholds for low resolve rate (<50%) and high error rate (>20%).

**First run results**: 19 products scraped from Burnt Ridge, 18 resolved (94.7%), 1 unmatched, 0 write errors, 61 seconds.

### Frontend (7 pages)
- `/` — Home with search bar + "Browse by Species" grid
- `/plants/[speciesSlug]` — Species page with cultivar list
- `/plants/[speciesSlug]/[cultivarSlug]` — Cultivar detail with "Where to Buy" section showing nursery offers
- `/nurseries` — All 10 nurseries
- `/nurseries/[nurserySlug]` — Nursery detail with inventory
- `/search?q=` — Full-text search with offer counts
- SEO: JSON-LD structured data (Product, Offer, Organization, BreadcrumbList), sitemap.xml, robots.txt

### API (7 endpoints)
- `GET /api` — Discovery endpoint (lists all endpoints, data types)
- `GET /api/search?q=&limit=` — Full-text search via materialized view
- `GET /api/plants/[speciesSlug]` — Species + cultivar list
- `GET /api/plants/[speciesSlug]/[cultivarSlug]` — Cultivar + offers + aliases
- `GET /api/nurseries` — All nurseries
- `GET /api/nurseries/[nurserySlug]` — Nursery + inventory
- `GET /api/pipeline/scrape` — Trigger scraping (CRON_SECRET-protected)
- `GET /api/pipeline/status` — Import run history with diagnostics
- Standard envelope: `{ ok: true, data, meta, links }` / `{ ok: false, error: { code, message } }`
- AI-readable docs at `/llms.txt` and `/llms-full.txt`

### Tests & CI
- **65 tests across 5 suites**, all passing in <1 second:
  - Parser: 23 tests (104-case table-driven from real nursery data + edge cases)
  - Resolver: 15 tests (all 12 resolution methods + alias index building)
  - Pipeline contract: 7 tests (PipelineOutput field validation)
  - API envelope: 10 tests (success/error/404 shapes)
  - Scraper: 10 tests (HTML fixture with mocked fetch)
- **GitHub Actions CI**: typecheck (`tsc --noEmit`) + test on push/PR to master

### Codebase Stats
- **6,136 lines** of TypeScript/TSX/SQL across 61 source files
- **6 runtime dependencies** (Next.js, React, Supabase, Cheerio)
- **3 SQL migrations** applied

## What's Generic vs. Domain-Specific

We audited every file for hardcoded assumptions. Here's the breakdown:

### Already generic (works for any plant genus today)
- Entire database schema (tables, enums, indexes, RLS policies)
- TypeScript type system (`EntityType`, `MaterialType`, `ResolutionMethod`, etc.)
- Alias index building algorithm
- 10 of 12 resolver match strategies
- All Supabase integration code (writer, import runs, MV refresh)
- All UI pages (render dynamically from DB data)
- All API endpoints and query functions
- Search, sitemap, SEO structured data

### Hazelnut-specific (concentrated in 3 files)
- **`parser.ts`**: Noise terms (Hazelnut, Filbert, Hazel — 13 regexes), botanical extraction (only Corylus/Gevuina), "Hazel Layer" propagation term
- **`resolver.ts`**: `SPECIES_KEYWORDS` map (5 Corylus species), generic default → European Hazelnut
- **`scrape/route.ts`**: Hardcoded to BurntRidgeScraper (no registry)

### Plant-specific (wouldn't transfer to livestock/mushrooms without model changes)
- `PropagationMethod` enum (grafted, layered, tissue_cultured, seedling, seed, cutting)
- `SaleForm` enum (bare_root, potted, plug, tubeling, container, field_dug)
- "Nursery" as the supplier concept (embedded in URLs, DB, UI)

### What it would take to add a second genus (e.g., walnuts)
1. A genus config (noise terms + species keywords) — ~50 lines
2. Generalize 2 botanical regexes in parser.ts — ~20 minutes
3. Seed data for Juglans species + cultivars — data entry
4. Scrapers for walnut nurseries — real work, but each is independent

### What it would take for non-plant niches (mushrooms, livestock)
- **Mushrooms**: Mostly works. Species → strain/variety → supplier → offer. Would need new `PropagationMethod` values (spawn, liquid culture). "Nursery" → "Supplier" rename. The resolver pipeline transfers cleanly.
- **Livestock**: Bigger rework. Breed → bloodline loosely maps, but the offer model is fundamentally different (not "in stock at a URL"). ~40-50% architecture reuse, significant model changes.

## Current State & What's Next

### Completed (Waves 1-3)
- ✅ Data model + schema + seed data (61 cultivars, 10 nurseries)
- ✅ Frontend with species/cultivar/nursery pages + search
- ✅ REST API with standard envelope + AI-readable docs
- ✅ Pipeline E2E: scraper → parser → resolver → writer
- ✅ First live run: 18 real offers from Burnt Ridge
- ✅ Test suite (65 tests) + GitHub Actions CI
- ✅ Pipeline observability (structured logging, diagnostics, status endpoint)

### Not yet built
- ❌ Only 1 of 10 nurseries has live inventory (18 offers). The other 9 show empty.
- ❌ No scraper registry — adding nurseries requires code changes to the route
- ❌ Parser is hazelnut-only (noise terms, botanical patterns hardcoded)
- ❌ No admin UI for reviewing unmatched names or managing aliases
- ❌ No user accounts or saved searches
- ❌ No price tracking over time (only current snapshot)
- ❌ No email/notification when a cultivar becomes available
- ❌ No rate limiting on public API
- ❌ No Vercel cron schedule (pipeline is manual-trigger only)
- ❌ Single genus (hazelnuts). Architecture supports multi-genus but no second genus seeded.

### Recommended next priorities
1. **Scraper registry + 2-3 more nursery scrapers** — The platform needs comparison data to be useful. Grimo, One Green World, and Raintree are good candidates.
2. **Parser generalization** — Make noise terms and botanical patterns config-driven so adding genera doesn't mean editing regex.
3. **Vercel cron schedule** — Weekly automated scraping so data stays fresh.
4. **Admin review for unmatched names** — Turn resolver misses into new aliases, closing the feedback loop.

## Open Questions for Discussion

1. **Depth vs. breadth**: Should we go deep on hazelnuts first (more nurseries, better coverage, price history) or expand to a second genus (walnuts, chestnuts) to prove the multi-genus architecture?

2. **Monetization**: This solves a real problem for permaculture growers. Possible models: affiliate links to nurseries, premium features (price alerts, availability notifications), nursery subscriptions for enhanced listings, API access for other tools.

3. **Community features**: Should this stay a pure data platform, or add community elements (reviews, growing guides, cultivar ratings)? The data model could support it but it changes the product scope significantly.

4. **Data freshness**: Nursery inventory changes seasonally. How often should we scrape? Weekly during dormant season (when bare-root ships), daily during spring rush? How do we handle "sold out" gracefully?

5. **Scaling the resolver**: At 61 cultivars the alias index is small. When we hit 500+ cultivars across multiple genera, will the word/bigram matching produce false positives? The confidence scoring system is designed for this but hasn't been stress-tested.

6. **Non-plant expansion**: The architecture could extend to mushroom spawn suppliers, seed companies, or other niche agriculture marketplaces. Is that the long-term vision, or should it stay focused on perennial plants?

## Repository

- **GitHub**: github.com/paulnovak651-jpg/plantcommerce (private)
- **Branch**: master
- **Latest commit**: `1a46976` — Pipeline observability
- **Live dev**: localhost:3000 (Next.js + Turbopack)
- **Database**: Supabase project `bwfhdyjjuubpzwjngquo`

## Key Files for New Contributors

| Purpose | File |
|---------|------|
| Data model types | `lib/resolver/types.ts` |
| Parser (name decomposition) | `lib/resolver/parser.ts` |
| Resolver (12-method matching) | `lib/resolver/resolver.ts` |
| Pipeline orchestration | `lib/resolver/pipeline.ts` |
| DB integration (writer) | `lib/pipeline/supabase-pipeline.ts` |
| Scraper example | `lib/scraper/burnt-ridge.ts` |
| API helpers (envelope) | `lib/api-helpers.ts` |
| Full SQL schema | `sql/deploy_wave1_complete.sql` |
| Test data (104 real products) | `data/hazelnut_raw_offers_testset.json` |
| Canonical entities (seed data) | `data/hazelnut_canonical_entities_v1.json` |
| Pipeline entry point | `app/api/pipeline/scrape/route.ts` |
| Search endpoint | `app/api/search/route.ts` |
