# PlantCommerce Product Roadmap

> **Last updated:** 2026-03-11
> **Status:** Post-Sprint 7. Core platform complete. Focus shifting to data quality, outreach, and engagement.

---

## Completed Milestones

### Foundation & Data (Sprints 1–3)
- ✅ Supabase schema: plant_entities, cultivars, aliases, nurseries, inventory_offers, taxonomy, growing profiles, pollination
- ✅ Pipeline: scrapers → parser → resolver (12-method chain) → writer
- ✅ 3 nurseries live (Burnt Ridge, Grimo, Raintree), consent-gated pipeline
- ✅ 15+ genera seeded across fruit, nut, berry, vine, and support species
- ✅ 49+ SQL migrations, shared types barrel, API envelope pattern

### UI/UX (Sprint 4 + UX Sprint)
- ✅ Homepage redesign: category cards, dynamic sections (Recently Restocked, Best Deals, New to Database), seasonal banner, zone recommendations
- ✅ Price comparison tables with trust badges, sparklines, best-price tags
- ✅ Progressive disclosure on species/cultivar pages (QuickFactsRibbon, collapsed TraitGrid)
- ✅ Community marketplace (WTS/WTB listings, admin moderation)
- ✅ Stock alerts, pollination checker, nursery maps (Leaflet)
- ✅ Toast system, scroll reveal, skeleton loaders, botanical sketch placeholders

### Discovery (Sprint 5–6)
- ✅ Genus hub pages with hierarchical browsing (Category → Genus → Species → Cultivar)
- ✅ Registry-driven faceted browse with 10 facets, cross-facet counts, recovery hints
- ✅ Alias-aware autocomplete with "also known as" display
- ✅ Zone persistence (localStorage + events + auto-prefill)
- ✅ Hybrid SSR seed + API-driven data flow with 300ms debounce
- ✅ Browse component decomposition (BrowseShell, BrowseHeader, BrowseGrid, etc.)

### Navigation & Consistency (Sprint 7)
- ✅ Unified browse surface — "Search" removed from nav, header search → /browse
- ✅ Browse hero replaced with compact header
- ✅ Category context bar (gradient, name, count, clear button)
- ✅ Quick-filter category chips on browse (no category selected)
- ✅ Typography audit — all page-level text uses `<Text>` component
- ✅ Category colors extracted to shared `lib/category-colors.ts`

---

## Current Priorities (Sprint 8+)

### 1. Nursery Consent & Outreach
**Status:** Ready to execute
**Why:** Consent-first policy adopted but no nurseries formally contacted yet.

- [ ] Draft outreach email template (value prop: we drive traffic TO nurseries)
- [ ] Contact Burnt Ridge, Grimo, Raintree for retroactive consent
- [ ] Update `consent_status` in nurseries table based on responses
- [ ] If approved, update pipeline to only scrape `approved` nurseries

### 2. Data Quality & Enrichment
**Status:** Ongoing — the deepest bottleneck for discovery features
**Why:** Empty filter options and sparse cultivar pages undermine trust.

- [ ] Populate missing cultivar attributes: mature height, soil pH, chill hours, pollination, self-fertility, sun exposure
- [ ] Ensure every species has common alias names mapped (powers autocomplete)
- [ ] Add missing genera: Ribes (currants), Rubus (brambles) — data exists but may need enrichment
- [ ] Flag invasive species (Pyrus calleryana) with warning badge
- [ ] Seed cultivar data for all Pyrus entries

### 3. Cultivar Empty-State CTAs
**Status:** Not started
**Why:** Zero-offer cultivar pages are dead ends — users have no next step.

- [ ] Add "Get notified when available" CTA (ties into existing stock alerts)
- [ ] Add "Know a nursery that carries this? Let us know" link
- [ ] Add "Browse related cultivars" links on sparse pages
- [ ] Sparse genus pages should link to populated related genera

### 4. Build Remaining Scrapers
**Status:** Blocked on consent (priority #1)
**Why:** Only 3 of 10 nurseries have live scrapers.

- [ ] One Green World (after consent)
- [ ] Additional nurseries from audit list
- [ ] Generic Shopify/WooCommerce scrapers already built — just need config entries

### 5. Auth & Engagement
**Status:** Not started
**Why:** Needed for trust tiers, saved searches, and tying listings to accounts.

- [ ] Supabase Auth integration
- [ ] User profiles with USDA zone
- [ ] Tie community listings to authenticated accounts
- [ ] Trust tier progression (new → verified → trusted)
- [ ] Saved searches / wishlist

### 6. Conversational Agent (Future)
**Status:** Prerequisites met (attribute data, alias mapping, zone persistence, browse API)
**Why:** "What should I grow?" is the ultimate discovery question.

- [ ] Prototype chat-based search ("fruit trees for zone 4, self-fertile")
- [ ] "What should I grow?" wizard (Zone → Goals → Space → Results)
- [ ] Requires complete attribute data (priority #2) to be useful

---

## Strategic Questions

1. What's the user retention story beyond v1? (Notifications? Seasonal emails? Grower reports?)
2. What is the first concrete growth loop to reach 50 recurring users?
3. How do we position this for nursery partnerships/affiliate model?
4. When should we invest in SEO content ("Best nut trees for Zone 4" guides)?

---

## What NOT to Do

- **No auth/accounts yet** — zone persistence via localStorage is sufficient for now
- **No ElasticSearch/Redis/BullMQ** — the current stack handles the data volume
- **No microservice split** — keep it monolithic until traffic demands otherwise
- **No full redesign** — the design system is good, focus on data quality and content
- **No premature infrastructure expansion** — prefer changes that improve discovery with least complexity

---

## Technical Guardrails

- All 230+ tests must pass after every change
- `npx tsc --noEmit` must be clean
- No `any` types, no `@ts-ignore`
- No raw Tailwind color classes — use design tokens
- No new scrapers without nursery consent
- URL state behavior must not break — all current browse URLs must continue working

---

## Files Reference

| Document | Purpose |
|----------|---------|
| `CONTEXT.md` | Current state snapshot, schema, pipeline details |
| `AGENTS.md` | Agent instructions, cold-start checklist, file locations |
| `DESIGN_SYSTEM.md` | "The Field Guide" — typography, colors, components |
| `VISION.md` | Product vision for sharing with collaborators |
| `SPRINT_UX.md` | UX improvement spec (23 tasks, all completed) |
| `SPRINT6_DISCOVERY.md` | Discovery UX sprint (12 deliverables, all completed) |
| `UI_POLISH.md` | Tactical polish tasks (completed) |
| `KNOWLEDGE_GRAPH_SCHEMA.md` | Migration specs for taxonomy, growing profiles, pollination |
