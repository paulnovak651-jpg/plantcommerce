# PlantCommerce UX Restructure — Product Spec

## Design Principle

**Simple by default, deep on demand.**

Every page has two layers:
- **5-second layer**: What is this? Is it for me? Where do I get it? What do I do next?
- **2-minute layer**: Compatibility details, production traits, provenance, legal, deep comparisons.

The 5-second layer is visible by default. The 2-minute layer is one interaction away (accordion, tab, "show more") — never five clicks away.

---

## What's Already Strong (Don't Touch)

- Data model: 3-tier `plant_entities → cultivars → nursery_offers` with growing profiles, aliases, legal identifiers is exactly right
- Taxonomy explorer: The 3-column desktop drill-down with keyboard nav and hover-debounce is genuinely excellent UX
- Design system: CSS variables, semantic color tokens, Fraunces + Satoshi font pairing, Surface/Text/Tag primitives
- Visual data components: ZoneBar, HarvestCalendar, HeightSilhouette, PriceSparkline — no competitor has these
- Faceted search: Registry-driven facets with debounced API calls, URL state sync, recovery hints
- Infrastructure: Loading states, error boundaries, skeletons, JSON-LD, OpenGraph, sitemap, RSS

---

## Quality Guardrails

For every change:

1. **Does a new user understand what this page does in 5 seconds?** If not, simplify the above-fold content.
2. **Can an expert find deep data in 2 clicks from any page?** If not, the progressive disclosure is too aggressive.
3. **Is the buying path visible within the first screenful?** If not, prices and availability need to move up.
4. **Does removing this element make the page worse?** If not, remove it.
5. **Is this scalable to 10x the current nursery count?** If not, reconsider the approach.

---

## Implementation

See `SPRINT12_PROGRESSIVE_DISCLOSURE.md` for the full implementation plan with exact file paths, code shapes, and testing checklists.
