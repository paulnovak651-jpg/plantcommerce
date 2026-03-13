# Homepage Declutter — Remove Redundant UI Elements

**Type:** Feature spec (UI cleanup)  
**Priority:** High  
**Scope:** Homepage only (`app/page.tsx` and related components)  
**Risk:** Low — removing elements, no new features

---

## Problem

The homepage has four redundant or cluttering UI elements:

1. **"What's your USDA growing zone?" bar** under the header — duplicates the zone filter already in the browse section
2. **Quick-filter chips** ("Fruit trees", "Nut trees", "Nitrogen fixers", "In stock now") below the hero search bar
3. **"Browse All Plants" search bar** with its own text input and Explore button
4. The **Explore button** itself (redundant with the hero search and the category/genus sidebar)

The hero search bar + the Browse section's category sidebar + the browse section's zone filter already provide all the functionality these elements offer. They add visual noise and split the user's attention without adding value.

---

## Changes Required

### 1. Remove the "What's your USDA growing zone?" bar under the header

**What:** The full-width bar below the nav that says "What's your USDA growing zone?" with a zone dropdown, "Set Zone" button, and "Not sure? Find your zone" link. This is redundant — the Browse section already has its own USDA Zone min/max filter.

**Where to look:** This is likely a standalone component rendered in the header area or at the top of `app/page.tsx` / a layout file. Look for a `ZoneBanner`, `ZoneSelector`, `GrowingZoneBar`, or similar component.

**Action:** Remove the entire bar from the homepage. If zone selection state is shared with other parts of the app, make sure the browse section's zone filter still works independently. Do NOT remove the zone filter (Min/Max dropdowns) inside the browse section — that one stays.

### 2. Remove quick-filter chips below hero search bar

**What:** The row of chip/tag buttons ("Fruit trees", "Nut trees", "Nitrogen fixers", "In stock now") that sits between the hero search bar and the "Browse All Plants" section.

**Where to look:** These are likely rendered in the homepage hero section — check `app/page.tsx`, or a hero component imported there. They may also be defined as an array of objects with `label`/`href` pairs.

**Action:** Delete the chip/tag row entirely. Do not replace with anything. The space between the hero search and the browse section should just be clean whitespace.

### 3. Remove "Browse All Plants" secondary search bar and Explore button

**What:** The search input field with placeholder text `Search 'disease resistant'...` and the green "Explore" button next to it. This sits at the top of the browse section, above the USDA Zone filter and the category/genus/plant columns.

**Where to look:** This is likely in `BrowseContent.tsx` or a similar browse section component rendered on the homepage. It's the secondary search input — distinct from the hero search bar at the top of the page.

**Action:** Remove the search input and the Explore button. Keep everything below it intact — the USDA Zone filter row, the CATEGORIES / GENERA / PLANTS & CULTIVARS column layout should remain exactly as-is.

### 4. Verify "Browse All Plants" heading still works

After removing the search bar, the "Browse All Plants" heading should still be present and the section should flow naturally: heading → USDA Zone filter → category/genus/plant columns.

---

## What NOT to Change

- **Hero search bar** at the top of the page — keep as-is
- **USDA Zone filter inside the browse section** (the "Min to Max" dropdowns) — keep as-is
- **Category/Genera/Plants column layout** — keep as-is
- **Navigation** (Browse, Compare, Nurseries, Marketplace tabs) — keep as-is

---

## Verification

After changes, the homepage should flow as:

```
Header / Nav
  ↓
Hero: "Search once, compare nurseries." + search bar
  ↓
(clean whitespace — no chips, no zone bar)
  ↓
"Browse All Plants" heading
  ↓
USDA Zone filter (Min/Max dropdowns)
  ↓
Categories | Genera | Plants & Cultivars columns
```

Test on both desktop and mobile. Confirm no layout shift or orphaned spacing where removed elements used to be.

---

## Files Likely Affected

- `app/page.tsx` (or wherever the homepage hero section renders)
- `components/BrowseContent.tsx` (or wherever the browse section search bar lives)
- A layout file or header component that renders the USDA zone bar (e.g., `ZoneBanner`, `ZoneSelector`, or similar)
- Possibly a `QuickFilters`, `CategoryChips`, or `HeroTags` component if the chips were extracted

Estimated scope: ~4 files, deletions only, no new code.
