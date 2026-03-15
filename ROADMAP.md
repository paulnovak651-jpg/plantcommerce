# PlantCommerce — Product Roadmap

> **Label:** Current priorities
> **Last updated:** 2026-03-14
> **Status:** Sprint 18 shipped. UI stable. Operational truth reset is in progress alongside product priorities.

---

## Completed Work

### Foundation

- Supabase schema and the scraper -> parser -> resolver -> writer pipeline
- 3 nurseries live
- 15+ genera seeded
- shared types, API envelope pattern, and migration history in place

### Product features

- Homepage taxonomy explorer
- Species pages, cultivar pages, compare flow, nursery maps, marketplace, stock alerts, and pollination checker
- Zone, stock type, and "for sale now" browse filtering on the homepage funnel

### Browse and page design

- The browse/page layout went through major iteration in Sprints 8–18
- The current UX is stable
- The homepage taxonomy explorer is the canonical browse entrypoint
- `/browse` now redirects to `/` while preserving params for old links

### Technical

- 230+ tests
- TypeScript strict
- CI green
- Config-driven scraper registry
- Secondary facet/query/API browse infrastructure still present in the repo

---

## Current Priorities

### 0. Operational Truth Reset
**Status:** In progress

- [ ] Keep root docs aligned on workflow, browse truth, and dashboard/session routes
- [ ] Keep Command Center scripts aligned with `/api/dashboard/*`
- [ ] Maintain task-routing guidance for common work types
- [ ] Keep historical docs labeled as historical reference only

### 1. Nursery Consent & Outreach
**Status:** Ready to execute

- [ ] Contact Burnt Ridge, Grimo, and Raintree for retroactive consent
- [ ] Update `consent_status` in the nurseries table based on responses
- [ ] Gate pipeline to only scrape `approved` nurseries

### 2. Data Quality & Enrichment
**Status:** Ongoing

- [ ] Populate missing cultivar attributes: height, pH, chill hours, pollination, and sun exposure
- [ ] Ensure every species has common alias names mapped
- [ ] Seed cultivar data for underrepresented genera
- [ ] Flag invasive species with a warning badge

### 3. Cultivar Empty-State CTAs
**Status:** Not started

- [ ] Add "Get notified when available" on zero-offer cultivar pages
- [ ] Add a "Know a nursery that carries this?" community link
- [ ] Add related-cultivar cross-links on sparse pages

### 4. Remaining Scrapers
**Status:** Blocked on consent

- [ ] Add One Green World and other audited nurseries after consent
- [ ] Use the existing generic scraper infrastructure after approval

### 5. Auth & Engagement
**Status:** Not started

- [ ] Supabase Auth integration
- [ ] User profiles with USDA zone
- [ ] Tie community listings to authenticated accounts
- [ ] Saved searches / wishlist
- [ ] Trust tier progression

### 6. SEO & Content
**Status:** Not started

- [ ] Build guide pages such as "Best [category] trees for Zone X"
- [ ] Improve structured data where useful
- [ ] Audit sitemap completeness

---

## What Not To Do

- No more wholesale UI redesigns
- No `features/` directory refactor as part of this cleanup
- No ElasticSearch, Redis, BullMQ, or microservice split
- No new scrapers without consent
- No auth-complexity work before consent outreach is handled

---

## Strategic Questions

1. What is the user-retention story beyond v1?
2. What is the first repeatable growth loop to 50 recurring users?
3. How should nursery partnership and affiliate positioning work?
4. When should SEO content become a major focus?

---

## Documentation

See `CONTEXT.md` for current technical state and `docs/sprints/` for historical sprint documents.
