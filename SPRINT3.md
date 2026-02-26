# Sprint 3 — "Depth Before Breadth"

> **Created:** 2026-02-26
> **Goal:** Make PlantCommerce credible enough to send nursery outreach emails.
> **Timeline:** This sprint. No open-ended timeline.
> **Agents:** Claude Code (Track A), Codex (Track C). Paul handles Track B (human outreach).

---

## Why This Sprint

The site is live with 3 nurseries and 61 hazelnut cultivars. That's not enough data density to retain users OR convince nurseries to opt in. But we already have detailed knowledge graph migrations written and ready to deploy (taxonomy, growing profiles). Deploying that data transforms every existing page from "bare product listing" into "authoritative plant reference." That's the difference between a nursery owner thinking "another scraper" vs "this person knows plants."

The sprint has three parallel tracks. **Track A and Track C can run simultaneously** — they touch different files and tables.

---

## Track A — Knowledge Graph Deploy

**Agent:** Claude Code
**Goal:** Deploy taxonomy + growing profile data to Supabase, wire it into existing pages.

### A1. Apply Taxonomy Migration

**What:** Run `sql/migrations/002_taxonomy.sql` against Supabase.

**Steps:**
1. Read `sql/migrations/002_taxonomy.sql` to confirm it matches `KNOWLEDGE_GRAPH_SCHEMA.md` migration 002.
2. Run it against the `plantfinder` Supabase project using the Supabase MCP or dashboard SQL editor.
3. Verify: `SELECT count(*) FROM taxonomy_nodes;` should return seed data rows (kingdom through genera).
4. Verify: `SELECT taxonomy_node_id FROM plant_entities WHERE genus = 'Corylus' LIMIT 1;` should be non-null.
5. Verify: Gevuina avellana points to the `gevuina` taxonomy node, NOT `corylus`.

**Acceptance:** `taxonomy_nodes` table exists, populated, and `plant_entities.taxonomy_node_id` is linked for all existing Corylus + Gevuina entities.

---

### A2. Apply Growing Profiles Migration

**What:** Run `sql/migrations/003_growing_profiles.sql` against Supabase.

**Steps:**
1. Read `sql/migrations/003_growing_profiles.sql` to confirm it matches `KNOWLEDGE_GRAPH_SCHEMA.md` migration 003.
2. Run it against Supabase.
3. Verify: `SELECT plant_entity_id, usda_zone_min, usda_zone_max FROM species_growing_profiles;` returns rows for European Hazelnut, American Hazelnut, Beaked Hazelnut, and Turkish Tree Hazel.

**Acceptance:** `species_growing_profiles` table exists with seed data for all 4 Corylus species.

---

### A3. Create Taxonomy Query Function

**What:** New file `lib/queries/taxonomy.ts`

**Implementation:**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TaxonomyNode {
  id: string;
  rank: string;
  name: string;
  botanical_name: string | null;
  slug: string;
  parent_id: string | null;
  description: string | null;
}

/**
 * Get the full lineage from a plant entity up to kingdom.
 * Returns array ordered from kingdom (top) to genus (bottom).
 */
export async function getTaxonomyPath(
  supabase: SupabaseClient,
  plantEntityId: string
): Promise<TaxonomyNode[]> {
  const { data: entity } = await supabase
    .from('plant_entities')
    .select('taxonomy_node_id')
    .eq('id', plantEntityId)
    .single();

  if (!entity?.taxonomy_node_id) return [];

  const path: TaxonomyNode[] = [];
  let currentId: string | null = entity.taxonomy_node_id;

  while (currentId) {
    const { data: node } = await supabase
      .from('taxonomy_nodes')
      .select('id, rank, name, botanical_name, slug, parent_id, description')
      .eq('id', currentId)
      .single();

    if (!node) break;
    path.unshift(node);
    currentId = node.parent_id;
  }

  return path;
}
```

**Acceptance:** Calling `getTaxonomyPath(supabase, europeanHazelnutId)` returns `[Plantae, Magnoliophyta, Magnoliopsida, Fagales, Betulaceae, Corylus]`.

---

### A4. Create Growing Profile Query Function

**What:** New file `lib/queries/growing.ts`

**Implementation:**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getGrowingProfile(
  supabase: SupabaseClient,
  plantEntityId: string
) {
  const { data, error } = await supabase
    .from('species_growing_profiles')
    .select('*')
    .eq('plant_entity_id', plantEntityId)
    .maybeSingle();

  if (error) {
    console.error('getGrowingProfile error:', error);
    return null;
  }
  return data;
}
```

**Acceptance:** Returns the full growing profile for a plant entity, or null if none exists.

---

### A5. Wire Growing Profile into Species Page

**What:** Update `app/plants/[speciesSlug]/page.tsx` to show growing data.

**Where:** After the species description, before the cultivar sections.

**Display these fields** (only if data exists — skip nulls gracefully):
- USDA Zones: `{zone_min}–{zone_max}` (with zone_notes if present)
- Chill Hours: `{chill_hours_min}–{chill_hours_max}`
- Mature Height: `{height_min}–{height_max} ft`
- Mature Spread: `{spread_min}–{spread_max} ft`
- Sun: `{sun_requirement}` (format: replace underscores with spaces, title case)
- Water: `{water_needs}`
- Soil pH: `{ph_min}–{ph_max}`
- Years to Bearing: `{years_min}–{years_max}`
- Growth Rate: `{growth_rate}`
- Native Range: `{native_range}`

**UI pattern:** Use a simple 2-column or 3-column grid of label/value pairs inside a `Surface elevation="raised"`. Keep it compact — this is reference data, not a hero section. Use `<Text variant="caption" color="tertiary">` for labels and `<Text variant="body">` for values.

**Do not:**
- Add new components for this — reuse `Surface`, `Text`, `Tag`
- Show empty fields — only render rows where data is non-null
- Break the existing page layout — this section goes between species description and cultivar list

**Acceptance:** Species pages for European Hazelnut, American Hazelnut, Beaked Hazelnut, and Turkish Tree Hazel show growing profile data. Species without profiles show nothing (no empty state for this section).

---

### A6. Wire Taxonomy Path into Species Page

**What:** Add a compact taxonomy breadcrumb to the species page.

**Where:** Below the botanical name, above the description.

**Display:** Inline text, not a sidebar. Example:
```
Betulaceae › Corylus
```

Link each to `/browse` if you want, or render as plain text for now. Keep it subtle — `<Text variant="caption" color="tertiary">`. This replaces the current `{species.genus} · {species.family}` line with something more structured.

**Acceptance:** Species pages show taxonomy lineage from family down. Reads naturally inline.

---

### A7. Wire Growing Data into Cultivar Page

**What:** On the cultivar detail page, show the species-level growing data in a disclosure section.

**Where:** Add a new `<Disclosure>` in Zone 3 (knowledge section), titled "Growing Requirements".

**Data source:** Fetch the growing profile using the cultivar's `plant_entity_id` (available via the `plant_entities` join that already happens on this page).

**Display:** Same compact label/value grid as the species page. Wrap it in a Disclosure so it doesn't overwhelm the offer cards above it.

**Acceptance:** Cultivar pages for hazelnut cultivars show "Growing Requirements" disclosure with species-level data. Cultivars whose species has no growing profile don't show the section.

---

### A8. Update Search Index for Zone Queries

**What:** The current `material_search_index` materialized view doesn't include zone data. Update it so users can search "zone 4 hazelnuts."

**Steps:**
1. Check if `species_growing_profiles` data is accessible from the current MV query.
2. If the MV is defined inline (not in a migration), update the `CREATE MATERIALIZED VIEW` to join `species_growing_profiles` and include `usda_zone_min`, `usda_zone_max` in the `search_text` blob.
3. Refresh the MV: `SELECT refresh_search_index();`
4. Test: search for "zone 4" should return results.

**Note:** The updated MV definition from `KNOWLEDGE_GRAPH_SCHEMA.md` migration 008 shows the target schema. You may need to adapt it since community_listings don't exist yet — just skip that column.

**Acceptance:** Searching "zone 4" or "zone 3 hazelnut" returns relevant results.

---

### A9. Gate Pipeline on Consent Status

**What:** One-line change in `app/api/pipeline/scrape/route.ts`. There's already a TODO comment for this.

**Implementation:** In `runNurseryPipeline` or `selectScrapers`, after looking up the nursery from Supabase, check `consent_status`. If it's not `approved`, skip that nursery and log a warning.

**However:** Since all 3 existing nurseries are currently `pending` and we need them to keep working until Paul sends outreach emails, do this:
- Add the consent check
- But make it skip only `declined` nurseries for now
- Add a config flag or comment that once outreach is sent and responses come in, tighten it to require `approved`

This way the pipeline doesn't break, but the mechanism is in place.

**Acceptance:** Pipeline skips nurseries with `consent_status = 'declined'`. Log message when a nursery is skipped. All 3 existing nurseries (currently `pending`) still run.

---

## Track B — Nursery Outreach Prep (Paul — Human Work)

**Agent:** None (Paul does this manually)
**Depends on:** Track A (A5, A6, A7) and Track C being mostly complete — the site needs to look good.

### B1. Draft Outreach Email Template

Write a short, warm email to send to Burnt Ridge, Grimo, and Raintree. Key points:
- We built a free plant comparison tool for the permaculture community
- Their inventory is currently listed (link to their nursery page on the site)
- All traffic and purchases go directly to their website
- We'd like their blessing to continue — happy to remove them if they prefer
- Ask if they have a product feed (Shopify JSON, CSV export) as alternative to HTML scraping
- Offer: "If you spot anything wrong with your listings, let us know and we'll fix it immediately"

**Acceptance:** Email sent to all 3 nurseries.

### B2. Update Nursery Consent Status

After responses come in, update `consent_status` in Supabase for each nursery.

---

## Track C — UI Credibility Pass

**Agent:** Codex
**Goal:** Ensure the site looks professional enough to send to nursery owners.

### C1. Audit Sprint 2 UI Polish Completion

**What:** Verify which items from `UI_POLISH.md` were actually completed and deployed.

**Check each:**
- [ ] Task 1: `<Text>` used everywhere (no raw font-serif classes)
- [ ] Task 2: `<BotanicalName>` used everywhere
- [ ] Task 3: `<BotanicalName>` component fixed (no invalid CSS)
- [ ] Task 4: `<Breadcrumbs>` uses design tokens (no gray-500/green-700)
- [ ] Task 5: Lighter card grids (hover-only, no box by default for browse items)
- [ ] Task 6: Homepage hero spacing (divider between hero and browse)
- [ ] Task 7: Search results layout (borderless, bottom divider instead of boxed cards)
- [ ] Task 8: Price display uses `<Text variant="price">`
- [ ] Task 9: Deprecated components deleted (Badge.tsx, SearchForm.tsx, InfoCard.tsx)
- [ ] Task 10: Empty state copy polished

**For any incomplete items:** complete them. Reference `UI_POLISH.md` for exact specifications.

**Acceptance:** All 10 tasks from UI_POLISH.md verified complete. No raw Tailwind color classes (`gray-*`, `green-*`) anywhere in page components.

---

### C2. Mobile Responsiveness Check

**What:** Ensure all pages render well on mobile viewport (375px).

**Pages to check:**
- Homepage
- Species page (e.g., `/plants/corylus-avellana`)
- Cultivar page (e.g., `/plants/corylus-avellana/jefferson`)
- Nursery index (`/nurseries`)
- Nursery detail (e.g., `/nurseries/burnt-ridge-nursery`)
- Search results (`/search?q=hazelnut`)

**Acceptance:** All pages render cleanly at 375px viewport. No horizontal scroll. No text truncation that loses meaning.

---

### C3. Nursery Detail Page Polish

**What:** This is the page nursery owners will see when they get Paul's email. It needs to look great.

**Check `/nurseries/[nurserySlug]`:**
- Nursery name, location, website link prominently displayed
- Inventory list is clean and scannable
- Each offer links back to the nursery's own product page
- Empty nurseries show a clear, non-embarrassing empty state
- Contact/website link is prominent

**Acceptance:** Nursery detail page for Burnt Ridge looks professional and clearly communicates "we're helping people find your products."

---

### C4. Footer and Meta Polish

**What:** Small details that signal professionalism.

**Check:**
- Footer says "Even Flow Nursery LLC" — correct
- Contact email is present and clickable
- `llms.txt` and API discovery links work
- Sitemap generates without errors
- Meta descriptions present on all page types
- OpenGraph tags present

**Acceptance:** All meta tags present. Footer clean. No broken links in footer.

---

## Coordination Rules

1. **Track A and Track C can run in parallel.** Track A touches `sql/`, `lib/queries/`, and adds content to existing pages. Track C touches page styling and layout. Minimal conflict.
2. **Track A should land A1-A4 before A5-A7.** A5-A7 depend on the data and query functions existing.
3. **Track C should do C1 first** to understand what's already done before doing more work.
4. **Track B waits for A5-A7 and C3.** Paul shouldn't send emails until the species pages show growing data and the nursery pages look polished.
5. **Both agents:** run `npm test` and `npx tsc --noEmit` before declaring any task complete.
6. **Both agents:** register and close sessions on the Command Center dashboard.
7. **Deploy after each track completes** — don't batch. `vercel --prod` from the plantcommerce directory.

---

## Definition of Done (Sprint 3)

- [ ] Taxonomy nodes in Supabase with seed data
- [ ] Growing profiles in Supabase with seed data for 4 Corylus species
- [ ] Species pages show growing profile data (zones, height, soil, bearing age)
- [ ] Species pages show taxonomy lineage
- [ ] Cultivar pages show growing requirements in a disclosure section
- [ ] "zone 4" search returns results
- [ ] Pipeline skips `declined` nurseries
- [ ] All UI_POLISH.md items verified complete
- [ ] Mobile renders cleanly at 375px
- [ ] Nursery detail pages look great (outreach-ready)
- [ ] All tests pass, TypeScript clean, deployed to Vercel

---

## Files This Sprint Will Touch

### Track A (Claude Code)
```
sql/migrations/002_taxonomy.sql          — apply to Supabase
sql/migrations/003_growing_profiles.sql  — apply to Supabase
lib/queries/taxonomy.ts                  — NEW
lib/queries/growing.ts                   — NEW
app/plants/[speciesSlug]/page.tsx        — add growing profile + taxonomy
app/plants/[speciesSlug]/[cultivarSlug]/page.tsx — add growing disclosure
app/api/pipeline/scrape/route.ts         — consent gate
```

### Track C (Codex)
```
app/page.tsx                             — verify polish
app/plants/[speciesSlug]/page.tsx        — verify polish (coordinate with Track A)
app/plants/[speciesSlug]/[cultivarSlug]/page.tsx — verify polish (coordinate with Track A)
app/nurseries/page.tsx                   — verify polish
app/nurseries/[nurserySlug]/page.tsx     — nursery detail polish
app/search/page.tsx                      — verify polish
app/layout.tsx                           — footer polish
components/ui/BotanicalName.tsx          — fix component
components/ui/Breadcrumbs.tsx            — design token fix
```
