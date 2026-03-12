# Bug Fix: Genus Hub Page — Plant List Cutoff / Cannot Scroll Full List

*Created 2026-03-12. Priority: HIGH — blocks usability of Sprint 11 deliverable.*

---

## Problem

On the genus hub page (`/plants/genus/[genusSlug]`), when a genus has many cultivars/plants, the list gets cut off at the bottom and the user cannot scroll to see all items. The "Show more" button or remaining cards are not accessible.

---

## Diagnosis Steps (Do These First)

The root cause is almost certainly an `overflow: hidden` or a constrained height somewhere in the DOM ancestry between the plant card grid and the `<body>`. Do the following to identify the exact culprit:

### Step 1: Check the live page in dev tools

1. Run `npm run dev` and navigate to a genus page with many plants (e.g., one with 20+ cultivars)
2. Open browser DevTools → Elements panel
3. Starting from the card grid (`div.grid.gap-4.sm\:grid-cols-2`), walk UP the DOM tree inspecting each parent element
4. For each ancestor, check the Computed styles for:
   - `overflow` — if it's `hidden` on any non-scrollable container, that's your culprit
   - `max-height` or `height` — if there's a fixed height that's shorter than the content
5. The element causing the cutoff will have `overflow: hidden` combined with a constrained height (either explicit or inherited)

### Step 2: Check these specific suspects

Based on the codebase review, these are the most likely culprits (check in this order):

**Suspect A — The `page-enter` animation on `<main>`**

In `app/layout.tsx`, the `<main>` tag has `className="page-enter"`. In `globals.css`, the `.page-enter` class applies:
```css
.page-enter {
  animation: page-fade-in 300ms ease-out;
}
```
The animation itself is benign, but some browsers can create a stacking/overflow context during animation. Check if `<main>` has an implicit `overflow: hidden` from the animation.

**Test:** Temporarily remove the `page-enter` class from `<main>` in `app/layout.tsx` and see if the cutoff goes away. If it does, this is the cause.

**Suspect B — The outer `<div>` in the genus hub page**

In `app/plants/genus/[genusSlug]/page.tsx`, the outermost wrapper is:
```tsx
<div className="mx-auto max-w-5xl px-4 py-8">
  <div className="space-y-[var(--spacing-zone)]">
```

The `space-y-[var(--spacing-zone)]` class should not cause overflow issues, but verify that neither of these `div` elements has an unexpected computed height or overflow.

**Suspect C — The `<section>` wrapping GenusPlantList**

The `GenusPlantList` component is wrapped in:
```tsx
<section>
  <GenusPlantList ... />
</section>
```

Check if this `<section>` has any inherited overflow constraint.

**Suspect D — Tailwind's `overflow-hidden` on a parent**

Search the full rendered DOM for any ancestor with `overflow: hidden` that shouldn't have it. Common Tailwind culprits: `overflow-hidden`, `overflow-x-hidden` applied to wrapper elements for other purposes (like preventing horizontal scroll) that accidentally clip vertical content.

**Suspect E — `html` or `body` height constraint**

Check if `<html>` or `<body>` has `height: 100vh` or `max-height: 100vh` or `overflow: hidden` set somewhere. This can happen from Tailwind presets or layout utilities.

---

## Fix

Once you've identified the culprit from the diagnosis above, apply the appropriate fix:

### If Suspect A (page-enter animation):
Remove or rework the animation so it doesn't create an overflow constraint. Options:
1. Remove `page-enter` from `<main>` entirely (simplest)
2. Add `overflow: visible` explicitly to `.page-enter` in `globals.css`
3. Change the animation to use `opacity` only (no `transform`) — transforms can create new stacking contexts

### If Suspect B/C (container overflow):
Add `overflow-visible` to the offending container, or remove any `overflow-hidden` that's been accidentally applied.

### If Suspect D (inherited overflow-hidden):
Find the ancestor with `overflow-hidden` and determine why it was added. If it was for horizontal scroll prevention, change it to `overflow-x-hidden` (which clips horizontal only) instead of `overflow-hidden` (which clips both axes).

### If Suspect E (html/body height):
Remove any `h-screen`, `max-h-screen`, or `overflow-hidden` from `<html>` or `<body>`. The body should be able to scroll naturally with its content.

### If none of the above — check for a viewport-height CSS calc:
Search `globals.css` and any component CSS for patterns like `calc(100vh - ...)` or `h-screen` that could be constraining the page height.

---

## Files Likely Involved

| File | What to check |
|------|---------------|
| `app/layout.tsx` | The `page-enter` class on `<main>`, any overflow classes on wrapper elements |
| `app/globals.css` | The `.page-enter` animation, any `body`/`html` overflow rules |
| `app/plants/genus/[genusSlug]/page.tsx` | The outer wrapper divs and section elements |
| `components/genus/GenusPlantList.tsx` | Unlikely to be the cause (no height constraints), but verify |

---

## Testing

After applying the fix:

- [ ] Navigate to a genus page with many plants (e.g., Hazelnuts, Apples — anything with 15+ items)
- [ ] Verify you can scroll all the way to the bottom of the page
- [ ] Verify the "Show more" button is visible and clickable when there are 24+ items
- [ ] After clicking "Show more", verify the newly loaded items are visible and scrollable
- [ ] Verify the footer is accessible below the plant list
- [ ] Verify the "Related Categories" section (if present) appears below the plant list
- [ ] Test on mobile (375px) — same scroll behavior should work
- [ ] Verify the fix doesn't break scrolling on OTHER pages (homepage browse, species pages, cultivar pages)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` — all tests still pass

---

## What NOT To Do

1. **Do NOT add a scrollable container with a fixed height around the plant list.** The plant list should be part of the normal page flow — the user scrolls the PAGE, not a nested scroll container. Nested scroll containers are an anti-pattern for this type of content.
2. **Do NOT add `overflow-y: auto` or `overflow-y: scroll` to the GenusPlantList component.** Same reason — the cards should live in the natural page flow.
3. **Do NOT change the GenusPlantList component's pagination logic.** The "Show more" pattern is correct. The issue is CSS, not the component.
4. **Do NOT add `min-height` or `height` to the plant list container as a workaround.** Fix the actual overflow constraint instead.
