# Bug Fix v2: Genus Hub Page — Plant List Scroll Cutoff (Still Broken)

*Updated 2026-03-12. The page-enter animation fix (Suspect A) was applied but did NOT fix the issue.*

---

## Problem

On genus hub pages with many cultivars, the plant card list gets cut off at the bottom. The user cannot scroll to see all items. The previous fix (removing `translateY` from the `page-enter` animation) did not resolve it.

---

## Root Cause (Most Likely)

**Tailwind CSS v4 preflight.** This project uses Tailwind v4.2.1 (`@import "tailwindcss"` in globals.css). Tailwind v4 changed its CSS reset significantly from v3. The v4 preflight applies `overflow: hidden` to `body` as part of its base layer. This clips any content that extends beyond the initial viewport height on long pages.

---

## Fix — Try These In Order

### Fix 1 (Most Likely): Override Tailwind v4's body overflow

Add this to `app/globals.css`, AFTER the `@import "tailwindcss"` line but inside or after the base styles section:

```css
html, body {
  overflow-x: hidden;
  overflow-y: visible;
}
```

Or more simply, just ensure the body can scroll:

```css
body {
  overflow-y: auto;
}
```

**Where to put it:** In the existing `body { ... }` rule block in `globals.css` (around line ~75), add `overflow-y: auto;` to the existing properties. This ensures the body scrolls naturally even if Tailwind v4's preflight set it to something restrictive.

**IMPORTANT:** In Tailwind v4, the `@import "tailwindcss"` directive injects preflight styles. Custom CSS rules defined AFTER that import will override them. The existing `body` block in globals.css is already after the import, so adding `overflow-y: auto` there should work.

### Fix 2: Check if Tailwind v4's `@layer base` is needed

If Fix 1 doesn't work because of CSS specificity, wrap the override in `@layer base`:

```css
@layer base {
  body {
    overflow-y: auto;
  }
}
```

### Fix 3: Nuclear option — inspect the compiled CSS

If neither fix works, the issue is something else entirely. Run these diagnostic steps:

1. Run `npm run dev`
2. Open browser DevTools on a genus page with many plants
3. Open the Elements panel, select the `<body>` element
4. In the Computed tab, search for `overflow`
5. Note the computed value — if it's `hidden` or `clip`, click through to see which CSS rule is setting it
6. Walk up to `<html>` and check the same
7. Then walk down through every ancestor of the plant grid: `<main>`, the outer `<div>`, the `<section>` — check each for computed `overflow`
8. Report back which element has the restrictive overflow and which CSS rule is causing it

### Fix 4: Check the `antialiased` class

In `layout.tsx`, the `<body>` has `className="bg-surface-ground text-text-primary antialiased"`. In Tailwind v4, the `antialiased` utility should only set font smoothing, but verify it's not also setting any layout properties by inspecting its compiled output.

---

## Files to Edit

| File | Change |
|------|--------|
| `app/globals.css` | Add `overflow-y: auto;` to the existing `body` rule |

That's it — this should be a one-line fix.

---

## Testing

After applying the fix:

- [ ] Navigate to a genus page with many plants (e.g., Hazelnuts or Apples)
- [ ] Scroll all the way to the bottom — ALL cards should be visible
- [ ] Click "Show more" — newly loaded cards should be scrollable
- [ ] Footer should be accessible below the plant list
- [ ] Related Categories section (if present) should appear below the list
- [ ] Test on mobile (375px) — same scroll behavior
- [ ] Verify the homepage still works (no broken horizontal scroll)
- [ ] Verify species pages and cultivar pages still scroll normally
- [ ] Verify there's no unwanted horizontal scrollbar on any page
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` — all tests still pass

---

## What NOT To Do

1. **Do NOT wrap the plant list in a scrollable container** (`overflow-y: auto` with a fixed height). The page itself should scroll.
2. **Do NOT add `h-screen` or `min-h-screen` to the main content area.** This is a body-level overflow issue.
3. **Do NOT remove `@import "tailwindcss"` or modify the Tailwind setup.** Just override the specific overflow property.
4. **Do NOT change the GenusPlantList component.** The component is fine — this is a CSS inheritance issue.
