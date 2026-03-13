# UI Polish Pass — "Clean Like Claude and Google"

*Instruction document for Claude Code. Created 2026-02-24.*

---

## The Problem

The design tokens and components are solid, but the pages don't consistently use them. There are raw Tailwind class strings duplicating what `<Text>` does, the old Breadcrumbs component still uses pre-design-system colors (`gray-500`, `green-700`), and several small details break the "calm authority" feel. This pass fixes all of it.

**The standard we're aiming for:** Google Search and Claude.ai. These interfaces share three qualities:
1. **Extreme restraint.** Almost nothing on screen that isn't directly useful.
2. **Consistent typographic rhythm.** Every piece of text has an obvious place in the hierarchy.
3. **Whitespace does the work.** Sections are separated by breathing room, not borders and boxes.

---

## Task 1: Use `<Text>` Everywhere

Every heading, body paragraph, and caption across all pages should use the `<Text>` component instead of raw Tailwind classes. This is the single highest-impact cleanup.

**The pattern to find and replace:**

```tsx
// BEFORE (raw classes — scattered across every page)
<h1 className="font-serif text-[1.8rem] font-semibold leading-[1.2] text-text-primary">
  {cultivar.canonical_name}
</h1>

// AFTER
<Text variant="h1">{cultivar.canonical_name}</Text>
```

```tsx
// BEFORE
<h2 className="mb-4 font-serif text-[1.25rem] font-semibold text-text-primary">

// AFTER
<Text variant="h2" className="mb-4">
```

```tsx
// BEFORE
<p className="mt-1 text-sm text-text-tertiary">

// AFTER
<Text variant="sm" color="tertiary" className="mt-1">
```

```tsx
// BEFORE
<p className="text-xs text-text-tertiary">Label</p>
<p className="font-medium text-text-primary">Value</p>

// AFTER
<Text variant="caption" color="tertiary">Label</Text>
<Text variant="body" className="font-medium">Value</Text>
```

```tsx
// BEFORE (homepage display title)
<h1 className="mb-2 font-serif text-[2.4rem] font-semibold leading-[1.2] text-text-primary">

// AFTER
<Text variant="display" className="mb-2">
```

**Apply to every page:**
- `app/page.tsx` (homepage)
- `app/plants/[speciesSlug]/page.tsx` (species)
- `app/plants/[speciesSlug]/[cultivarSlug]/page.tsx` (cultivar)
- `app/nurseries/page.tsx` (nursery index)
- `app/nurseries/[nurserySlug]/page.tsx` (nursery detail)
- `app/search/page.tsx` (search results)
- `app/not-found.tsx`
- `app/error.tsx`

Every page must import `Text` from `@/components/ui/Text`.

---

## Task 2: Use `<BotanicalName>` Everywhere

Every botanical/Latin name should use the component, not inline italic classes.

```tsx
// BEFORE
<p className="mt-1 font-serif text-base italic text-text-secondary">
  {species.botanical_name}
</p>

// AFTER
<Text variant="body" color="secondary" className="mt-1">
  <BotanicalName>{species.botanical_name}</BotanicalName>
</Text>
```

The species page has a double-wrap issue where `<BotanicalName>` is inside an already-italic `<p>`. Fix it — `<BotanicalName>` should be the only thing applying the italic serif style.

---

## Task 3: Fix `<BotanicalName>` Component

The current implementation has invalid CSS:

```tsx
// CURRENT (broken)
<em className={`font-serif italic text-inherit not-italic-[&>*] ${className}`} style={{ fontStyle: 'italic' }}>

// FIXED
<em className={`font-serif italic ${className}`}>
```

Remove the redundant `style` prop and the invalid `not-italic-[&>*]` class.

---

## Task 4: Fix `<Breadcrumbs>` to Use Design Tokens

The Breadcrumbs component still uses old Tailwind colors:

```tsx
// CURRENT
<nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
  ...
  <Link href={crumb.href} className="hover:text-green-700">

// FIXED
<nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-tertiary">
  ...
  <Link href={crumb.href} className="hover:text-accent">
```

Also update the separator from plain `/` to a more subtle chevron or middot:
```tsx
{i > 0 && <span aria-hidden="true" className="text-border">&rsaquo;</span>}
```

---

## Task 5: Reduce Visual Density on Card Grids

The current species and nursery grids use `Surface elevation="raised"` for every card. This creates a grid of white bordered boxes on a warm background — too many competing containers. Google and Claude never have grids of bordered boxes.

**For species cards (homepage + species page cultivar grid):**
Replace `Surface elevation="raised"` with a simpler hover-only treatment:

```tsx
// BEFORE
<Surface elevation="raised" padding="compact" className="h-full hover:border-accent">
  <h3 className="font-medium text-accent">{cv.canonical_name}</h3>
  ...
</Surface>

// AFTER — no box by default, subtle highlight on hover
<div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
  <Text variant="h3" color="accent">{cv.canonical_name}</Text>
  ...
</div>
```

This makes the grid feel lighter and more like a clean list. The hover state reveals the card boundary — progressive disclosure at the micro level.

**Keep `Surface elevation="raised"` for:** offer cards (nursery offers, search results with offer counts), metadata cards on the cultivar page, and the nursery detail inventory list. These are *data cards* with multiple fields and benefit from the container.

---

## Task 6: Improve the Homepage Hero Spacing

The homepage hero currently uses `py-16`. That's generous but the transition to the "Browse by Species" section feels abrupt. Add a subtle visual bridge:

```tsx
// After the SearchBar + genus chips section, before "Browse by Species":
<div className="mx-auto my-12 h-px w-16 bg-border" />
```

A tiny centered line that breaks the page into two clear zones without a full-width divider.

---

## Task 7: Search Results Layout

The current search results show each result as a full-width `Surface` card. With many results, this creates a wall of boxes. Switch to a lighter treatment:

```tsx
// BEFORE — boxed cards
<Surface elevation="raised" padding="default" className="hover:border-accent">

// AFTER — borderless, with a bottom divider
<div className="border-b border-border-subtle py-4 transition-colors hover:bg-surface-primary">
```

This matches Google's search result pattern — clean text with subtle separation, not individual cards.

---

## Task 8: Price Display Consistency

Use `<Text variant="price">` for all price displays across the site. Currently prices are styled with raw `text-[1.1rem] font-semibold text-text-primary`.

```tsx
// BEFORE
<p className="text-[1.1rem] font-semibold text-text-primary">{offer.raw_price_text}</p>

// AFTER
<Text variant="price">{offer.raw_price_text}</Text>
```

---

## Task 9: Delete Deprecated Components

Now that all pages use the new `ui/` components, remove:
- `components/Badge.tsx`
- `components/SearchForm.tsx`
- `components/InfoCard.tsx`

Verify no imports reference them first. Keep `Breadcrumbs.tsx`, `JsonLd.tsx`, and `SkipNav.tsx`.

---

## Task 10: Empty State Copy Polish

Update EmptyState text to be warmer and more action-oriented:

| Page | Current | Updated |
|------|---------|---------|
| Cultivar offers | "We haven't found this cultivar at any nurseries. Check back as we add more sources." | "No nursery offers yet. We're adding new sources regularly." |
| Nursery inventory | "We haven't found active offers from this nursery. Check back as we add more sources." | "No active inventory scraped yet. Run the pipeline to populate offers." |
| Search no results | `We couldn't find anything matching "${q}". Try a different search term.` | `No matches for "${q}". Try a broader term or browse by species.` |
| Species no cultivars | "We haven't loaded cultivar data for this species. Check back as we add more sources." | "No cultivar data for this species yet." |

---

## Rules

- Every page must use `<Text>` for all text rendering — no raw `font-serif text-[1.8rem]` classes
- Every botanical name must use `<BotanicalName>`
- Every price must use `<Text variant="price">`
- No references to `gray-*` or `green-*` Tailwind defaults — only design token colors
- Don't modify API routes, test files, or the pipeline code
- Run `npm run test` after to confirm all 65 tests still pass
- Run `npx tsc --noEmit` to confirm TypeScript is clean
- Commit with message: "Polish: consistent Text/BotanicalName usage, lighter card grids, breadcrumb tokens"
