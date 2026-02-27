# PlantCommerce Product Roadmap — Implementation Plan

> Generated 2026-02-27 by Claude Opus 4.6 product consultation.
> This document is the canonical reference for all agents implementing these changes.
> Each phase is self-contained. Complete phases in order. Each task includes exact files, queries, and specs.

---

## Phase 0: Foundation (Pre-requisite, 1 session)

These are small structural changes that make everything else easier.

### 0.1 — Create shared types barrel

**Why:** Types are scattered across query files. A single import point reduces agent token cost and developer confusion.

**Create:** `lib/types/index.ts`

```typescript
// Re-export all domain types from a single entry point.
// Agents: read THIS file first to understand the data model.

export type { SearchResult } from '@/lib/queries/search';

// Add these interfaces (currently inline or `any`-typed):
export interface PlantEntity {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string;
  family: string;
  genus: string;
  species: string | null;
  entity_type: 'species' | 'subspecies' | 'hybrid_species' | 'species_group';
  curation_status: 'draft' | 'reviewed' | 'published';
  description: string | null;
  taxonomy_node_id: string | null;
}

export interface Cultivar {
  id: string;
  slug: string;
  canonical_name: string;
  plant_entity_id: string;
  material_type: MaterialType;
  breeder: string | null;
  origin_location: string | null;
  year_released: number | null;
  patent_status: string | null;
  notes: string | null;
  curation_status: 'draft' | 'reviewed' | 'published';
}

export type MaterialType =
  | 'cultivar_clone'
  | 'named_seed_strain'
  | 'breeding_population'
  | 'geographic_population'
  | 'species_seedling'
  | 'unknown_named_line';

export interface GrowingProfile {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  chill_hours_min: number | null;
  chill_hours_max: number | null;
  soil_ph_min: number | null;
  soil_ph_max: number | null;
  soil_drainage: string | null;
  sun_requirement: string | null;
  growth_rate: string | null;
  mature_height_min_ft: number | null;
  mature_height_max_ft: number | null;
  mature_spread_min_ft: number | null;
  mature_spread_max_ft: number | null;
  years_to_bearing_min: number | null;
  years_to_bearing_max: number | null;
  harvest_season: string | null;
  native_range_description: string | null;
}

export interface InventoryOffer {
  id: string;
  nursery_id: string;
  cultivar_id: string;
  plant_entity_id: string | null;
  raw_product_name: string;
  offer_status: 'active' | 'stale' | 'sold_out' | 'discontinued';
  price_raw: string | null;
  price_cents: number | null;
  product_url: string | null;
  availability_raw: string | null;
}

export interface Nursery {
  id: string;
  slug: string;
  name: string;
  website_url: string;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface CommunityListing {
  id: string;
  listing_type: 'wts' | 'wtb';
  raw_cultivar_text: string;
  raw_species_text: string | null;
  material_type: string | null;
  quantity: string | null;
  price_cents: number | null;
  location_state: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
}
```

**Then:** Update imports in page files and query files to use `@/lib/types` instead of inline types. Remove `any` casts where possible.

### 0.2 — Extract page loaders

**Why:** Pages currently do inline Supabase queries. Extracting loaders enables testing, caching, and cleaner pages.

**Create:** `lib/queries/loaders.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies, getOfferStatsForSpecies } from './plants';
import { getTaxonomyPath } from './taxonomy';
import { getGrowingProfile } from './growing';
import { getApprovedListingsForSpecies } from './listings';

export async function loadSpeciesPage(speciesSlug: string) {
  const supabase = await createClient();
  const species = await getPlantEntityBySlug(supabase, speciesSlug);
  if (!species) return null;

  const cultivars = await getCultivarsForSpecies(supabase, species.id);
  const cultivarIds = cultivars.map((c: { id: string }) => c.id);

  const [taxonomyPath, growingProfile, offerStats, communityListings] = await Promise.all([
    getTaxonomyPath(supabase, species.id),
    getGrowingProfile(supabase, species.id),
    getOfferStatsForSpecies(supabase, cultivarIds),
    getApprovedListingsForSpecies(supabase, species.id),
  ]);

  return { species, cultivars, taxonomyPath, growingProfile, offerStats, communityListings };
}

// Similar for loadCultivarPage, loadHomePage, loadSearchPage...
```

**Then:** Refactor `app/plants/[speciesSlug]/page.tsx` to call `loadSpeciesPage()` instead of inline queries. The page becomes pure rendering.

### 0.3 — Add `/api/schema` endpoint

**Why:** Lets AI agents understand the entire data model in one request (~200 tokens).

**Create:** `app/api/schema/route.ts`

Return a static JSON object describing tables, relationships, and enums. No DB query needed — this is metadata.

---

## Phase 1: Homepage Redesign (1-2 sessions)

### Current problem
The homepage shows 80+ species pills in a flat alphabetical list. New users have no guidance on what's popular, what's available, or where to start. On mobile it's especially overwhelming.

### 1.1 — Add category groupings to plant_entities

**Migration:** `032_plant_categories.sql`

```sql
BEGIN;

-- Add a display_category column for homepage grouping
-- Values are curated, not a separate table (simple is better)
ALTER TABLE plant_entities
  ADD COLUMN IF NOT EXISTS display_category TEXT;

-- Assign categories based on genus
UPDATE plant_entities SET display_category = 'Nut Trees' WHERE genus IN ('Castanea', 'Juglans', 'Carya', 'Corylus');
UPDATE plant_entities SET display_category = 'Apples & Crabapples' WHERE genus = 'Malus';
UPDATE plant_entities SET display_category = 'Stone Fruit' WHERE genus = 'Prunus';
UPDATE plant_entities SET display_category = 'Pears' WHERE genus = 'Pyrus';
UPDATE plant_entities SET display_category = 'Berries' WHERE genus = 'Vaccinium';
UPDATE plant_entities SET display_category = 'Grapes' WHERE genus = 'Vitis';
UPDATE plant_entities SET display_category = 'Persimmons' WHERE genus = 'Diospyros';
UPDATE plant_entities SET display_category = 'Mulberries' WHERE genus = 'Morus';
UPDATE plant_entities SET display_category = 'Elderberries' WHERE genus = 'Sambucus';
UPDATE plant_entities SET display_category = 'Other' WHERE display_category IS NULL;

-- Pawpaw gets its own because it's a flagship
UPDATE plant_entities SET display_category = 'Pawpaw' WHERE genus = 'Asimina';
UPDATE plant_entities SET display_category = 'Oaks' WHERE genus = 'Quercus';
UPDATE plant_entities SET display_category = 'Figs' WHERE genus = 'Ficus';

COMMIT;
```

### 1.2 — New homepage query

**Add to:** `lib/queries/plants.ts`

```typescript
export interface CategoryGroup {
  category: string;
  species_count: number;
  cultivar_count: number;
  nursery_count: number;
  top_species: Array<{ slug: string; canonical_name: string }>;
}

export async function getHomepageCategories(supabase: SupabaseClient): Promise<CategoryGroup[]> {
  // Query plant_entities grouped by display_category
  // Include counts of cultivars and active offers per category
  // Return top 3 species per category (by cultivar count or nursery count)
  // Order categories by total cultivar count descending
}
```

### 1.3 — Redesign homepage component

**Modify:** `app/page.tsx`

Replace the pill wall with:

```
┌──────────────────────────────────────────────────┐
│              Plant Commerce                       │
│  Search once, compare nursery stock across NA.    │
│  ┌────────────────────────────────────────────┐   │
│  │ 🔍 Search 'zone 4 chestnuts'...           │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Browse by Category                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Nut Trees   │ │ Apples      │ │ Stone Fruit │ │
│  │ 20 species  │ │ 8 species   │ │ 7 species   │ │
│  │ 3 nurseries │ │ 2 nurseries │ │ 2 nurseries │ │
│  │             │ │             │ │             │ │
│  │ · Chestnut  │ │ · Common    │ │ · Peach     │ │
│  │ · Hazelnut  │ │ · Crabapple │ │ · Cherry    │ │
│  │ · Walnut    │ │ · Wild      │ │ · Plum      │ │
│  │ Browse →    │ │ Browse →    │ │ Browse →    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
│  ... (responsive grid, 2 cols mobile, 3 desktop)  │
│                                                    │
│  ── Quick Stats ──────────────────────────────── │
│  Tracking 3 nurseries · 80+ species · 61 cultivars│
│  All purchases happen directly on nursery sites.  │
└──────────────────────────────────────────────────┘
```

**New component:** `components/CategoryCard.tsx`

```typescript
interface CategoryCardProps {
  category: string;
  speciesCount: number;
  cultivarCount: number;
  nurseryCount: number;
  topSpecies: Array<{ slug: string; canonical_name: string }>;
}
```

Card shows category name, counts, top 3 species as links, and a "Browse all →" link to `/browse?category=nut-trees`.

### 1.4 — Add "How It Works" section below categories

Three simple steps, no images needed:

```
How It Works
1. Search for a plant cultivar by name or growing zone.
2. Compare prices and availability across nurseries.
3. Buy directly from the nursery — we never handle transactions.
```

**Implementation:** Static JSX in `app/page.tsx`, no new component needed. Use existing `Text` and `Surface` components.

---

## Phase 2: Search & Filtering (2-3 sessions)

This is the highest-impact feature work. Users need to filter by zone and availability.

### 2.1 — Add zone data to the search index

**Migration:** `033_search_index_zone.sql`

```sql
BEGIN;

-- Drop and recreate material_search_index with zone columns
DROP MATERIALIZED VIEW IF EXISTS material_search_index;

CREATE MATERIALIZED VIEW material_search_index AS
SELECT
  -- existing columns
  pe.id AS entity_id,
  COALESCE(c.canonical_name, pe.canonical_name) AS canonical_name,
  pe.botanical_name,
  pe.canonical_name AS species_common_name,
  pe.genus,
  pe.family,
  COALESCE(c.slug, pe.slug) AS slug,
  pe.slug AS species_slug,
  COALESCE(c.material_type::text, pe.entity_type::text) AS material_type,
  CASE WHEN c.id IS NOT NULL THEN 'cultivar' ELSE 'plant_entity' END AS index_source,
  -- search text
  lower(
    COALESCE(c.canonical_name, '') || ' ' ||
    COALESCE(pe.canonical_name, '') || ' ' ||
    COALESCE(pe.botanical_name, '') || ' ' ||
    COALESCE(pe.genus, '') || ' ' ||
    COALESCE(a.alias_list, '')
  ) AS search_text,
  -- NEW: zone data from growing profiles
  gp.usda_zone_min,
  gp.usda_zone_max,
  -- NEW: active offer count
  COALESCE(oc.active_count, 0)::int AS active_offer_count,
  -- NEW: category for filtering
  pe.display_category
FROM plant_entities pe
LEFT JOIN cultivars c ON c.plant_entity_id = pe.id AND c.curation_status = 'published'
LEFT JOIN species_growing_profiles gp ON gp.plant_entity_id = pe.id
LEFT JOIN LATERAL (
  SELECT string_agg(al.normalized_text, ' ') AS alias_list
  FROM aliases al
  WHERE (al.target_type = 'cultivar' AND al.target_id = c.id)
     OR (al.target_type = 'plant_entity' AND al.target_id = pe.id)
) a ON true
LEFT JOIN LATERAL (
  SELECT count(*)::int AS active_count
  FROM inventory_offers io
  WHERE io.offer_status = 'active'
    AND (io.cultivar_id = c.id OR (c.id IS NULL AND io.plant_entity_id = pe.id))
) oc ON true
WHERE pe.curation_status = 'published';

-- Recreate indexes
CREATE UNIQUE INDEX idx_material_search_entity
  ON material_search_index (entity_id, index_source);

CREATE INDEX idx_material_search_trgm
  ON material_search_index USING gin (search_text gin_trgm_ops);

CREATE INDEX idx_material_search_zone
  ON material_search_index (usda_zone_min, usda_zone_max)
  WHERE usda_zone_min IS NOT NULL;

CREATE INDEX idx_material_search_available
  ON material_search_index (active_offer_count)
  WHERE active_offer_count > 0;

CREATE INDEX idx_material_search_category
  ON material_search_index (display_category);

COMMIT;
```

### 2.2 — Update search query to support filters

**Modify:** `lib/queries/search.ts`

```typescript
export interface SearchFilters {
  q: string;
  zone?: number;        // e.g., 5 — matches if zone_min <= 5 AND zone_max >= 5
  category?: string;    // e.g., "Nut Trees"
  inStock?: boolean;    // only show results with active_offer_count > 0
  limit?: number;
}

export async function searchPlants(
  supabase: SupabaseClient,
  filters: SearchFilters
): Promise<SearchResult[]> {
  let query = supabase
    .from('material_search_index')
    .select('*');

  // Text search
  if (filters.q.trim()) {
    query = query.textSearch('search_text', filters.q.toLowerCase(), { type: 'plain' });
  }

  // Zone filter
  if (filters.zone) {
    query = query.lte('usda_zone_min', filters.zone).gte('usda_zone_max', filters.zone);
  }

  // Category filter
  if (filters.category) {
    query = query.eq('display_category', filters.category);
  }

  // In-stock filter
  if (filters.inStock) {
    query = query.gt('active_offer_count', 0);
  }

  const { data, error } = await query.limit(filters.limit ?? 20);

  // Fallback to ilike if text search returned nothing
  if (filters.q.trim() && (error || !data || data.length === 0)) {
    let fallback = supabase
      .from('material_search_index')
      .select('*')
      .ilike('search_text', `%${filters.q.toLowerCase()}%`);

    if (filters.zone) fallback = fallback.lte('usda_zone_min', filters.zone).gte('usda_zone_max', filters.zone);
    if (filters.category) fallback = fallback.eq('display_category', filters.category);
    if (filters.inStock) fallback = fallback.gt('active_offer_count', 0);

    const { data: fb } = await fallback.limit(filters.limit ?? 20);
    return (fb ?? []) as SearchResult[];
  }

  return (data ?? []) as SearchResult[];
}
```

### 2.3 — Update SearchResult type

**Modify:** `lib/queries/search.ts` — add to SearchResult:

```typescript
export interface SearchResult {
  // ... existing fields ...
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  display_category: string | null;
}
```

### 2.4 — Build search filter UI

**Modify:** `app/search/page.tsx`

Add a filter bar above results:

```
┌─────────────────────────────────────────────────┐
│  [Search bar..................................]  │
│                                                   │
│  Filters: [Zone ▾] [Category ▾] [☑ In Stock]    │
│                                                   │
│  12 results for "hazelnut"                       │
│                                                   │
│  ┌─ cultivar clone ─ Jefferson ─ 1 nursery ────┐ │
│  │  Corylus avellana  ·  Zone 4-8              │ │
│  └─────────────────────────────────────────────┘ │
```

**New component:** `components/SearchFilters.tsx` (client component)

```typescript
'use client';

interface SearchFiltersProps {
  currentZone?: number;
  currentCategory?: string;
  currentInStock?: boolean;
  categories: string[];  // distinct categories from DB
}
```

Uses URL search params (`?q=hazelnut&zone=5&inStock=true`). On change, updates URL via `router.push()` — server component re-renders with new data.

### 2.5 — Add zone badge to search results

**Modify:** `app/search/page.tsx`

Each search result row now shows:

```tsx
{r.usda_zone_min && r.usda_zone_max && (
  <Tag type="neutral">Zone {r.usda_zone_min}-{r.usda_zone_max}</Tag>
)}
```

### 2.6 — Update URL contract

**Modify:** `lib/contracts/ux.ts`

Add zone, category, inStock to the search URL state parser:

```typescript
export interface SearchUrlState {
  q: string;
  page: number;
  limit: number;
  zone?: number;
  category?: string;
  inStock?: boolean;
}
```

---

## Phase 3: Cultivar Page — Price Comparison (1-2 sessions)

### Current problem
When multiple nurseries carry the same cultivar, offers are listed vertically with no side-by-side comparison. The whole point of the site is comparison.

### 3.1 — Build price comparison table

**New component:** `components/PriceComparisonTable.tsx`

```
┌────────────────────────────────────────────────────────┐
│  Compare Prices for Jefferson Hazelnut                  │
│                                                          │
│  Nursery          Price    Availability   Form    Link  │
│  ─────────────────────────────────────────────────────  │
│  Burnt Ridge      $18.00   In Stock       bareroot  →  │
│  Raintree         $22.95   Pre-Order      bareroot  →  │
│  Grimo Nut        $24.00   In Stock       potted    →  │
│                                                          │
│  Lowest price: $18.00 at Burnt Ridge                    │
└────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface PriceComparisonTableProps {
  offers: Array<{
    nurseryName: string;
    nurserySlug: string;
    price: string | null;
    priceCents: number | null;
    availability: string | null;
    propagationMethod: string | null;
    saleForm: string | null;
    productUrl: string | null;
    location: string;
  }>;
}
```

Sort by price_cents ascending (cheapest first). Highlight lowest price row. Show "Contact nursery" if price is null.

### 3.2 — Replace offer cards with comparison table

**Modify:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

When `offers.length >= 2`, render `<PriceComparisonTable>` instead of the current stacked cards. When `offers.length === 1`, keep the single card layout. When `offers.length === 0`, keep the EmptyState.

### 3.3 — Add "Related Species" sidebar

**Modify:** `app/plants/[speciesSlug]/page.tsx`

After the cultivar sections, add a "Related Species" section showing other species in the same genus.

**New query in** `lib/queries/plants.ts`:

```typescript
export async function getRelatedSpecies(supabase: SupabaseClient, genus: string, excludeSlug: string) {
  const { data } = await supabase
    .from('plant_entities')
    .select('slug, canonical_name, botanical_name')
    .eq('genus', genus)
    .eq('curation_status', 'published')
    .neq('slug', excludeSlug)
    .order('canonical_name')
    .limit(10);
  return data ?? [];
}
```

Render as a simple link list: "Other Corylus species: American Hazelnut, Beaked Hazelnut, Turkish Tree Hazel..."

---

## Phase 4: Data Freshness & Pipeline (2-3 sessions)

### 4.1 — Add last_scraped_at tracking

**Migration:** `034_scrape_timestamps.sql`

```sql
BEGIN;

-- Track when each nursery was last successfully scraped
ALTER TABLE nurseries
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_scrape_offer_count INT DEFAULT 0;

-- Track price changes
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES inventory_offers(id),
  price_cents_old INT,
  price_cents_new INT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_offer ON price_history(offer_id);
CREATE INDEX idx_price_history_detected ON price_history(detected_at);

COMMIT;
```

### 4.2 — Update pipeline writer to detect price changes

**Modify:** `lib/pipeline/supabase-pipeline.ts`

Before updating an offer's price, compare old vs new. If different, INSERT into price_history. Update `nurseries.last_scraped_at` after successful scrape.

### 4.3 — Show data freshness on UI

**Modify:** `app/nurseries/[nurserySlug]/page.tsx` and cultivar pages.

Add a subtle line: "Prices last checked: Feb 27, 2026" using `last_scraped_at`.

**Modify:** nursery query to include `last_scraped_at`.

### 4.4 — Activate Grimo and Raintree scrapers

**Current state:** Scrapers exist at `lib/scraper/grimo.ts` and `lib/scraper/raintree.ts` but aren't wired into the pipeline.

**Modify:** `lib/scraper/index.ts` — register grimo and raintree in the scraper registry.

**Modify:** `app/api/pipeline/scrape/route.ts` — ensure all registered scrapers run (or accept a `nursery` param to run one at a time).

**Test:** Run each scraper individually, verify resolver matches, check unmatched_names for new failures.

### 4.5 — Add "Price Dropped" badge (optional, after price history has data)

**New component logic in** `PriceComparisonTable.tsx`:

If `price_history` shows a decrease in last 30 days, show a green "Price dropped" badge next to the price.

---

## Phase 5: Discoverability & SEO (1 session)

### 5.1 — Add OpenGraph images

**Create:** `app/plants/[speciesSlug]/opengraph-image.tsx`

Use Next.js OG image generation to create a dynamic image:
- Species name + botanical name
- Zone range badge
- Cultivar count
- PlantCommerce branding

### 5.2 — Enhance sitemap with lastmod and priority

**Modify:** `app/sitemap.ts`

```typescript
// Species pages: priority 0.8, lastmod from latest migration
// Cultivar pages: priority 0.6
// Nursery pages: priority 0.7, lastmod from last_scraped_at
// Marketplace: priority 0.5
// Static pages: priority 1.0 (home), 0.9 (search, browse)
```

### 5.3 — Add RSS feed for new additions

**Create:** `app/feed.xml/route.ts`

RSS feed with entries for:
- New species added (from plant_entities.created_at if column exists)
- New cultivars
- New nurseries

### 5.4 — Verify JSON-LD on all page types

Audit all pages to ensure:
- Home: WebSite + SearchAction (already done)
- Species: ItemList of cultivars (already done)
- Cultivar: Product + Offer[] (already done)
- Nursery: LocalBusiness schema (ADD THIS)
- Marketplace: missing — not needed

---

## Phase 6: User Engagement (2-3 sessions, can run in parallel with Phase 4)

### 6.1 — Email stock alerts

**Migration:** `035_stock_alerts.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cultivar_id UUID REFERENCES cultivars(id),
  plant_entity_id UUID REFERENCES plant_entities(id),
  usda_zone INT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'triggered', 'unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  triggered_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid()
);

-- RLS: anon can INSERT (create alert) and SELECT own (via unsubscribe_token)
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_alerts" ON stock_alerts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_own_alerts" ON stock_alerts
  FOR SELECT TO anon USING (true);

CREATE INDEX idx_stock_alerts_cultivar ON stock_alerts(cultivar_id) WHERE status = 'active';
CREATE INDEX idx_stock_alerts_entity ON stock_alerts(plant_entity_id) WHERE status = 'active';

COMMIT;
```

### 6.2 — Alert signup UI

**Modify:** `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`

Add below the offers section (especially when offers.length === 0):

```
┌─────────────────────────────────────────────┐
│  Get notified when this cultivar is in stock │
│  [email@example.com........] [Notify Me]    │
│  We'll email you once. No spam.             │
└─────────────────────────────────────────────┘
```

**Create:** `app/api/alerts/route.ts` — POST to create alert, GET to check status.

### 6.3 — Alert checker (runs during pipeline scrape)

**Modify:** `lib/pipeline/supabase-pipeline.ts`

After processing offers, check: did any cultivar go from 0 active offers to 1+? If yes, query stock_alerts for that cultivar, send emails via Supabase Edge Function or simple SMTP.

### 6.4 — Pollination compatibility tool

**Create:** `app/pollination/page.tsx`

```
┌─────────────────────────────────────────────────┐
│  Pollination Checker                             │
│                                                   │
│  I have: [Jefferson Hazelnut    ▾]               │
│                                                   │
│  Compatible pollinizers:                         │
│  ✓ Theta (EFB immune, OSU)         2 nurseries  │
│  ✓ Eta (EFB immune, compact)       1 nursery    │
│  ✓ York (universal pollinator)     0 nurseries   │
│  ✓ Gamma (medium round nuts)       1 nursery    │
│                                                   │
│  Based on pollination profile data.              │
│  Self-fertile: No — requires cross-pollination.  │
└─────────────────────────────────────────────────┘
```

**Data source:** `species_pollination_profiles` table.

**Note:** This requires cultivar-level pollination data which doesn't exist yet. For now, show species-level info: "European Hazelnut requires cross-pollination. Plant at least 2 different cultivars within 50 feet."

**Query:** `lib/queries/pollination.ts` — fetch pollination profile for a species, then list other species in the same genus that could serve as pollinizers.

---

## Phase 7: Agent & API Enhancements (1 session)

### 7.1 — Add sparse fieldsets to API

**Modify:** `app/api/plants/[speciesSlug]/route.ts` (and cultivar route)

Accept `?fields=canonical_name,cultivars.canonical_name` query param. Only return requested fields. Reduces payload from ~2KB to ~200B for agents that just need names.

### 7.2 — Add pagination to API routes

**Modify:** all GET list endpoints.

Support `?offset=0&limit=20` with proper `meta.total` counts and `links.next` / `links.prev`.

### 7.3 — Update llms.txt and llms-full.txt

After all changes, regenerate these files to reflect new endpoints, filters, and features.

---

## Implementation Notes for Agents

### Migration numbering
- Next migration: **032** (032_plant_categories.sql)
- Subsequent: 033, 034, 035...
- Always end genus-seeding migrations with `REFRESH MATERIALIZED VIEW material_search_index;`
- After Phase 2, the materialized view definition changes — all future refreshes use the new definition

### Testing requirements
- All existing 99 tests must continue passing
- Add tests for new queries: zone filtering, category grouping, price comparison sorting
- Add tests for new API params: ?fields=, ?zone=, ?inStock=
- `npm test` + `npx tsc --noEmit` must both pass before commit

### Design system rules
- Use existing components (Text, Surface, Tag, SearchBar, etc.) — don't create new primitives
- New composite components are fine (CategoryCard, PriceComparisonTable, SearchFilters)
- No raw Tailwind gray-*/green-* classes — use design tokens only
- Fraunces for headings, Satoshi for body/UI

### Deployment sequence
After each phase:
1. `npm test` — all tests pass
2. `npx tsc --noEmit` — TypeScript clean
3. `git commit` + `git push`
4. `vercel deploy --prod` (or via Vercel CLI)
5. Verify live site
6. Update CONTEXT.md

### Phase dependencies
```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
                                  ↘
Phase 4 (can run in parallel with Phase 2/3)
Phase 5 (can run after Phase 2)
Phase 6 (can run after Phase 3)
Phase 7 (run last, after all features stable)
```

### Parallel work opportunities
- **Claude Code:** Phases 0, 1, 2, 3 (sequential, needs careful testing)
- **Codex:** Phase 4 (pipeline work), Phase 5 (SEO), Phase 7 (API enhancements) — can run independently
- **Either agent:** Phase 6 (user engagement)

---

## Success Metrics

After all phases:
- Homepage bounce rate should decrease (measurable via Vercel Analytics)
- Search-to-cultivar-page conversion should increase
- At least 3 nurseries actively scraped with fresh data
- Zone filter used in >30% of searches
- API serves agents in <500 tokens per request with sparse fieldsets
- All 99+ tests passing, TypeScript strict, zero `any` casts in new code
