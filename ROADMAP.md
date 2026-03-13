# PlantCommerce — Product Roadmap

> **Last updated:** 2026-03-13
> **Status:** Sprint 15 complete. UI stable. Focus shifting to data quality, outreach, and engagement.

---

## Completed Work

### Foundation (Sprints 1–3)
- Supabase schema, pipeline (scraper → parser → resolver → writer), 3 nurseries live
- 15+ genera seeded, 49+ SQL migrations, shared types, API envelope pattern

### Features (Sprints 4–7)
- Homepage, price comparison, maps, community marketplace, stock alerts, pollination checker
- Genus hub pages, faceted browse (10 facets, cross-facet counts, recovery hints)
- Alias-aware autocomplete, zone persistence, nav cleanup, typography audit

### Browse & Page Design (Sprints 8–15)
- **Note:** Sprints 8–15 involved significant iteration on browse layout and page structure. The browse surface went through 5 redesigns before settling on the current three-column taxonomy explorer. Cultivar pages were decomposed then restored with tabs. This rework is now complete — the UI is stable.
- Three-column taxonomy explorer (Category → Genus → Species/Cultivar) as homepage
- Species pages: dark green hero, growing guide, cultivar cards
- Cultivar pages: tabbed layout (Overview / Growing / Fruit & Nut / Buy)
- Compare flow with tray + comparison table

### Technical
- 230+ tests (Vitest), TypeScript strict, CI green
- Config-driven scraper registry (Shopify + WooCommerce generic scrapers)
- Registry-driven facet system (single source of truth for sidebar, URL state, queries, counts)

---

## Current Priorities

### 1. Nursery Consent & Outreach
**Status:** Ready to execute — outreach template written (`docs/operations/nursery-outreach-template.md`)

- [ ] Contact Burnt Ridge, Grimo, Raintree for retroactive consent
- [ ] Update `consent_status` in nurseries table based on responses
- [ ] Gate pipeline to only scrape `approved` nurseries

### 2. Data Quality & Enrichment
**Status:** Ongoing — the biggest bottleneck for useful discovery

- [ ] Populate missing cultivar attributes: height, pH, chill hours, pollination, sun exposure
- [ ] Ensure every species has common alias names mapped
- [ ] Seed cultivar data for underrepresented genera (Pyrus, Ribes, Rubus)
- [ ] Flag invasive species with warning badge

### 3. Cultivar Empty-State CTAs
**Status:** Not started

- [ ] "Get notified when available" CTA on zero-offer cultivar pages
- [ ] "Know a nursery that carries this?" community link
- [ ] "Browse related cultivars" cross-links on sparse pages

### 4. Build Remaining Scrapers
**Status:** Blocked on consent (#1)

- [ ] One Green World + additional nurseries from audit list
- [ ] Generic scrapers ready — just need config entries after consent

### 5. Auth & Engagement
**Status:** Not started

- [ ] Supabase Auth integration
- [ ] User profiles with USDA zone
- [ ] Tie community listings to authenticated accounts
- [ ] Saved searches / wishlist
- [ ] Trust tier progression (new → verified → trusted)

### 6. SEO & Content
**Status:** Not started

- [ ] "Best [category] trees for Zone X" guide pages
- [ ] Structured data improvements (JSON-LD already in place)
- [ ] Sitemap completeness audit

---

## What NOT to Do

- **No more wholesale UI redesigns** — the browse/page layout is settled after 6 sprints of iteration
- **No ElasticSearch/Redis/BullMQ** — current stack handles the volume
- **No microservice split** — monolith until traffic demands otherwise
- **No new scrapers without consent**
- **No auth complexity until consent outreach is done** — it's the higher-leverage task

---

## Strategic Questions

1. What's the user retention story beyond v1? (Notifications? Seasonal emails?)
2. First concrete growth loop to reach 50 recurring users?
3. Nursery partnership/affiliate model positioning?
4. When to invest in SEO content?

---

## Documentation

All sprint specs archived in `docs/sprints/`. See `CONTEXT.md` for current technical state.
