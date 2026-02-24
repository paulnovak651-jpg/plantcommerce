# Plant Commerce — AI Review Context Document

**Generated:** 2026-02-24
**Repository:** https://github.com/paulnovak651-jpg/plantcommerce (private)
**Status:** Wave 2 complete, seeking architectural review + Wave 3 planning

---

## 1. Project Overview

**Plant Commerce** is a plant database and nursery inventory aggregator for the permaculture community. It scrapes nursery websites, parses product names through an intelligent resolver pipeline, and presents a unified catalog where users can search cultivars, compare availability across nurseries, and browse detailed plant profiles.

**Current scope:** Hazelnut (Corylus) cultivars as pilot genus — 44 cultivars across 7 species/hybrids from 10 nurseries.

**Target users:**
- Home growers and permaculture practitioners researching cultivars
- Nursery shoppers comparing availability and pricing
- AI agents and developers (JSON API + llms.txt + JSON-LD)

**Business entity:** Even Flow Nursery LLC

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript (strict) | 5.9.3 |
| Database | Supabase (PostgreSQL + RLS) | supabase-js 2.97 |
| Styling | Tailwind CSS | 4.2.1 |
| Scraping | Cheerio | 1.2.0 |
| Hosting | Vercel (planned) | — |
| Dev Server | Turbopack | built-in |

**No test framework installed yet.** No ORM — raw Supabase client queries.

---

## 3. Architecture

### Data Model

```
plant_entities (7 rows)          nurseries (10 rows)
  ├── cultivars (44 rows)          │
  │     ├── aliases (17 rows)      │
  │     └── legal_identifiers (4)  │
  └── plant_entity_parents         │
                                   │
       inventory_offers (0 rows) ──┘
         ├── linked to cultivar OR plant_entity (XOR constraint)
         └── import_runs → raw_inventory_rows → unmatched_names

material_search_index (materialized view, 60 rows)
  └── Denormalized search across cultivars + plant_entities
  └── Trigram index for fuzzy text search
  └── species_slug column for correct URL generation
```

### Pipeline Flow

```
Scraper (Burnt Ridge)
  → fetchPage() with rate limiting + retry
  → Cheerio DOM parsing
  → ScrapedProduct[]

Parser (parseProductName)
  → Extract: botanical, patent, propagation, sale form, organic, age/size
  → Strip noise: "Hazelnut Tree", "Filbert", marketing text
  → Output: ParsedProductName { coreName, strippedTokens, ... }

Resolver (resolveEntity)
  → Build alias index from Supabase (cultivars + aliases + entities)
  → Match coreName through 12-method priority chain
  → Output: ResolutionResult { method, confidence 0-1, entityId }

Writer (supabase-pipeline)
  → Always: create raw_inventory_row
  → If resolved: upsert inventory_offer (idempotent via source_offer_key)
  → If unresolved: create unmatched_name for review queue
  → Wrap in import_run for batch tracking
```

### API Design

All endpoints return a consistent envelope:

```typescript
{
  ok: boolean,
  data?: T,
  error?: { code: string, message: string },
  meta?: { total?: number, limit?: number, offset?: number },
  links?: Record<string, string>  // HATEOAS
}
```

**Endpoints:**
- `GET /api/plants/{speciesSlug}` — Species + cultivar list
- `GET /api/plants/{speciesSlug}/{cultivarSlug}` — Cultivar + offers + aliases + legal
- `GET /api/search?q=...&limit=20` — Full-text search
- `GET /api/nurseries` — All nurseries
- `GET /api/nurseries/{nurserySlug}` — Nursery + inventory
- `GET /api/pipeline/scrape` — Trigger pipeline (CRON_SECRET protected)
- `GET /api` — Discovery endpoint

---

## 4. File Map

```
plantcommerce/
├── app/
│   ├── layout.tsx              # Root layout: dynamic nav dropdown, SkipNav, footer
│   ├── page.tsx                # Homepage: SearchForm, species grid, WebSite JSON-LD
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # Custom 404 with search form
│   ├── robots.ts               # robots.txt generation
│   ├── sitemap.ts              # Dynamic sitemap from Supabase
│   ├── globals.css             # Tailwind base styles
│   │
│   ├── plants/
│   │   ├── [speciesSlug]/
│   │   │   ├── page.tsx        # Species page: cultivar list, Breadcrumbs, ItemList JSON-LD
│   │   │   └── [cultivarSlug]/
│   │   │       └── page.tsx    # Cultivar page: offers, aliases, Product JSON-LD
│   │
│   ├── nurseries/
│   │   ├── page.tsx            # Nursery index: ItemList JSON-LD
│   │   └── [nurserySlug]/
│   │       └── page.tsx        # Nursery detail: inventory, Organization JSON-LD
│   │
│   ├── search/
│   │   └── page.tsx            # Search results: noindex, Badge, SearchForm
│   │
│   └── api/
│       ├── route.ts            # API discovery endpoint
│       ├── plants/
│       │   └── [...slug]/
│       │       └── route.ts    # Species + cultivar API (HATEOAS links)
│       ├── search/
│       │   └── route.ts        # Search API
│       ├── nurseries/
│       │   ├── route.ts        # Nurseries list API
│       │   └── [nurserySlug]/
│       │       └── route.ts    # Nursery detail API
│       └── pipeline/
│           └── scrape/
│               └── route.ts    # Pipeline trigger (cron-protected)
│
├── components/
│   ├── Badge.tsx               # Status pill (green/amber/gray variants)
│   ├── Breadcrumbs.tsx         # Nav breadcrumbs + BreadcrumbList JSON-LD
│   ├── InfoCard.tsx            # Label/value display card
│   ├── JsonLd.tsx              # Structured data injector
│   ├── SearchForm.tsx          # Reusable search (lg/md sizes)
│   └── SkipNav.tsx             # Accessibility skip link
│
├── lib/
│   ├── api-helpers.ts          # apiSuccess/apiError/apiNotFound envelope helpers
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server client + createAnonClient + createServiceClient
│   ├── queries/
│   │   ├── plants.ts           # getPlantEntityBySlug, listPlantEntities, getCultivarsForSpecies
│   │   ├── cultivars.ts        # getCultivarBySlug, getOffersForCultivar, getAliases, getLegal
│   │   ├── nurseries.ts        # getNurseryBySlug, listNurseries, getInventoryForNursery
│   │   └── search.ts           # searchPlants (trigram + ilike fallback)
│   ├── resolver/
│   │   ├── types.ts            # All enums + ParsedProductName + ResolutionResult + PipelineOutput
│   │   ├── parser.ts           # Product name decomposition (botanical, patent, propagation, etc.)
│   │   ├── resolver.ts         # Alias index builder + 12-method resolution chain
│   │   └── pipeline.ts         # processProductName + processBatch orchestrator
│   ├── scraper/
│   │   ├── types.ts            # ScrapedProduct, ScrapeResult, NurseryScraper interface
│   │   ├── fetch-utils.ts      # fetchPage: rate limiting, UA rotation, retry, timeout
│   │   ├── burnt-ridge.ts      # Burnt Ridge Nursery scraper (Volusion e-commerce)
│   │   └── index.ts            # Scraper registry
│   └── pipeline/
│       └── supabase-pipeline.ts # DB integration: alias index from Supabase, offer writer, import runs
│
├── sql/
│   └── deploy_wave1_complete.sql  # Full schema + seed data (3500+ lines)
│
├── data/
│   ├── hazelnut_canonical_entities_v1.json  # Canonical entity seed data
│   └── hazelnut_raw_offers_testset.json     # 104 raw product names for resolver testing
│
├── scripts/
│   └── scraper/                # CLI scraper scripts (parallel to lib/scraper)
│
├── public/                     # Static assets
├── .claude/launch.json         # Dev server config
├── next.config.ts              # Next.js config (defaults)
├── tsconfig.json               # TypeScript strict mode, @/* path alias
├── postcss.config.mjs          # Tailwind PostCSS integration
├── vercel.json                 # Vercel deployment config
├── package.json                # Dependencies and scripts
└── .gitignore                  # Excludes .env*.local, node_modules, .next
```

---

## 5. What's Built (Waves 1-2)

### Wave 1 — Data Foundation
- Full PostgreSQL schema with 15+ tables, 10 enum types, RLS policies
- Seed data: 7 plant entities, 44 cultivars, 10 nurseries, 17 aliases, 4 legal identifiers
- Resolver pipeline: parser (extracts 8+ fields from raw product names) + resolver (12-method matching chain with confidence scores)
- Burnt Ridge Nursery scraper with rate limiting, UA rotation, retry logic
- Pipeline integration: alias index from DB, idempotent offer writer, import run tracking, unmatched name queue

### Wave 2 — Dual-Audience Platform
- **SEO layer:** generateMetadata on all pages, JSON-LD (WebSite, Product, Organization, ItemList, BreadcrumbList), robots.txt, dynamic sitemap
- **Shared components:** Badge, Breadcrumbs, InfoCard, JsonLd, SearchForm, SkipNav
- **API standardization:** Consistent envelope (ok/data/error/meta/links), HATEOAS links, API discovery endpoint
- **AI agent layer:** llms.txt, llms-full.txt (API guide), JSON-LD structured data throughout
- **Search:** Materialized view with trigram index, species_slug for correct URLs, LATERAL joins to prevent cross-product inflation
- **Accessibility:** Skip nav, ARIA labels, semantic HTML, keyboard-navigable dropdown

---

## 6. Current State

### What Works
- All pages render correctly with real data from Supabase
- Search returns results with correct cultivar links (species/cultivar URL pattern)
- API endpoints return consistent envelopes with HATEOAS links
- Nav dropdown dynamically lists published species
- JSON-LD validates on all page types
- Pipeline code is complete and ready to run

### What's Empty
- `inventory_offers` table: **0 rows** — pipeline has not been run against live nursery data yet
- No test suite exists
- No CI/CD pipeline
- No error monitoring

### Known Limitations
- Parser is hazelnut-specific (hardcoded "Hazelnut Tree", "Filbert" noise terms, Corylus botanical patterns)
- Only one scraper implemented (Burnt Ridge)
- No retry logic for individual product writes in pipeline
- `unstable_cache` is not yet stable in Next.js — may change API
- No rate limiting on public API endpoints
- No `.env.example` for contributor onboarding

---

## 7. Key Code Decisions & Rationale

### `unstable_cache` for Layout Nav
**Decision:** Cache the species list query in the root layout using `unstable_cache` with a 1-hour revalidation.
**Why:** Without this, the species dropdown query would make the entire app dynamically rendered (no SSG/ISR). The species catalog changes rarely, so hourly revalidation is fine.
**Tradeoff:** Required creating `createAnonClient()` — a cookie-free Supabase client — because `cookies()` cannot be called inside `unstable_cache`.

### LATERAL Joins for Materialized View
**Decision:** Use `LATERAL` subqueries to aggregate aliases and offer counts in the search index.
**Why:** A naive `LEFT JOIN` across aliases and offers creates a cross-product (N aliases x M offers), inflating counts. LATERAL joins compute each aggregation independently.

### Upsert with source_offer_key for Idempotency
**Decision:** Generate a deterministic key from `(nurseryId, productUrl, sku, formSize)` and upsert on conflict.
**Why:** The pipeline runs on a cron schedule. Without idempotency, each run would duplicate offers. The source_offer_key ensures safe reruns.

### XOR Constraint on inventory_offers
**Decision:** Each offer links to EITHER a cultivar OR a plant_entity, never both.
**Why:** Some products resolve to a specific cultivar ("Jefferson Hazelnut"), others resolve only to a species ("Hazelnut Seedling"). The XOR constraint enforces this cleanly and prevents ambiguous resolution.

### GET for Cron Pipeline Trigger
**Decision:** The pipeline endpoint is `GET /api/pipeline/scrape` protected by a bearer token.
**Why:** Vercel Cron only supports GET requests. The CRON_SECRET bearer token prevents unauthorized triggering.

### 12-Method Resolution Chain with Confidence Scores
**Decision:** Try 12 matching strategies in priority order, each with a confidence score (0.95 for direct match, down to 0.50 for generic default).
**Why:** Nursery product names are wildly inconsistent. A multi-strategy approach maximizes resolution rate while the confidence score enables filtering and prioritizing review.

### Raw Data Preservation
**Decision:** Always store the verbatim scraped data in `raw_inventory_rows`, regardless of resolution outcome.
**Why:** The raw data is the ground truth. If the parser or resolver improves, we can re-process from raw data without re-scraping.

### No ORM
**Decision:** Use Supabase client directly with typed queries in `lib/queries/`.
**Why:** Supabase's query builder is already typed and ergonomic. An ORM would add complexity without meaningful benefit at this scale. The query files provide a clean abstraction layer.

### Service Role for Pipeline Only
**Decision:** Pipeline operations (writes to import_runs, raw_inventory_rows, inventory_offers, unmatched_names) use SUPABASE_SERVICE_ROLE_KEY. All public reads use the anon key with RLS.
**Why:** Pipeline tables should never be publicly writable. RLS policies enforce read-only public access on knowledge/commerce tables.

---

## 8. Wave 3 Proposal

### 3A. Run Pipeline End-to-End (Immediate Priority)
- Hit `/api/pipeline/scrape` locally or via Vercel deploy
- Verify Burnt Ridge inventory populates `inventory_offers`
- Validate that offers appear on cultivar pages
- Confirm search index refresh shows accurate offer counts
- **Risk:** Burnt Ridge may have changed their HTML structure since scraper was written

### 3B. Add More Scrapers (2-3 nurseries)
- Grimo Nut Nursery (Canada, custom site)
- Oikos Tree Crops (Michigan, WooCommerce)
- Raintree Nursery (Washington, Shopify)
- Each scraper implements `NurseryScraper` interface
- Refactor pipeline to loop over registered nurseries
- **Goal:** Demonstrate multi-nursery aggregation, surface real price comparisons

### 3C. Test Suite
- Parser unit tests (leverage existing 104-case test set in `data/hazelnut_raw_offers_testset.json`)
- Resolver unit tests (mock alias index, test all 12 methods)
- API endpoint integration tests
- Scraper tests with mocked HTML fixtures
- **Framework:** Vitest (good Next.js integration) or Jest

### 3D. Production Hardening
- Error monitoring (Sentry or similar)
- `.env.example` for contributor onboarding
- Rate limiting on API endpoints (middleware or Vercel Edge)
- Pipeline retry logic for individual product writes
- Health check endpoint
- Structured logging for pipeline runs

### 3E. Parser Generalization
- Remove hardcoded hazelnut-specific terms ("Filbert", "Hazel", Corylus patterns)
- Make botanical extraction pattern-based (configurable per genus)
- Create a noise term registry per plant family
- Prepare for expansion beyond Corylus (next genus candidates: Juglans, Castanea, Prunus)

### 3F. Admin / Observability
- Import run history dashboard (data already in `import_runs` table)
- Unmatched products view with resolution workflow
- Basic analytics on search queries
- Resolution confidence distribution chart (how well is the pipeline doing?)

### Suggested Priority Order
1. **3A** — Run pipeline (validate everything works end-to-end)
2. **3C** — Test suite (lock in current behavior before changes)
3. **3D** — Production hardening (prepare for real traffic)
4. **3B** — More scrapers (real value for users)
5. **3E** — Parser generalization (enable growth)
6. **3F** — Admin tools (nice-to-have, not blocking)

---

## 9. Review Prompt

Please review Plant Commerce with the following questions in mind:

### Code Architecture
- Are there any anti-patterns, security concerns, or structural issues in the codebase?
- Is the separation between knowledge layer, commerce layer, and pipeline layer clean?
- Are the Supabase client patterns (anon, server, service) correct and secure?
- Is the query layer (`lib/queries/`) a good abstraction, or would something else be better?

### Data Model
- Does the schema design (entities → cultivars → offers → nurseries) make sense for the domain?
- Is the XOR constraint on `inventory_offers` the right approach?
- Are there missing indexes or potential performance issues as data grows?
- Is the materialized view approach for search sustainable?

### Pipeline
- Is the parser → resolver → writer pipeline well-structured?
- Are the confidence scores and resolution methods reasonable?
- Is the idempotency approach (source_offer_key upsert) robust?
- What failure modes should we handle better?

### Wave 3 Proposal
- Are the priorities right? What's missing? What should be reordered?
- Is running the pipeline (3A) truly the right first step?
- What's the minimum viable test suite (3C)?
- Are there production readiness gaps not listed?

### Scalability
- Will this architecture hold as we add more plant families (50+ species, 500+ cultivars)?
- Will the materialized view approach work at scale, or do we need real-time indexing?
- Can the resolver handle 100+ nurseries with different naming conventions?
- Is Supabase the right long-term database choice?

### AI Agent Accessibility
- Is the llms.txt / API / JSON-LD setup sufficient for AI agents to discover and use this data?
- Are the API contracts clear enough for programmatic consumption?
- What would make this more useful for agent-based workflows?

### SEO & Web Standards
- Is the JSON-LD structured data correct and complete?
- Are there SEO opportunities being missed?
- Is the metadata strategy (generateMetadata + template) optimal?

---

## 10. How to Explore

**Browse the code:** https://github.com/paulnovak651-jpg/plantcommerce

**Key entry points:**
- Schema + seed data: `sql/deploy_wave1_complete.sql`
- Pipeline flow: `app/api/pipeline/scrape/route.ts` → `lib/pipeline/supabase-pipeline.ts` → `lib/resolver/pipeline.ts`
- Parser logic: `lib/resolver/parser.ts`
- Resolver logic: `lib/resolver/resolver.ts`
- Type contracts: `lib/resolver/types.ts`
- Page rendering: `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`
- API response format: `lib/api-helpers.ts`
- Scraper pattern: `lib/scraper/burnt-ridge.ts`

**Test data:** `data/hazelnut_raw_offers_testset.json` — 104 real product names from nursery websites, useful for understanding what the parser handles.
