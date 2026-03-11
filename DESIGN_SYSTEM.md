# Plant Commerce — Design System Specification

*Reference document for implementation. Created 2026-02-24.*

---

## Design Philosophy: "The Field Guide"

Plant Commerce should feel like a **modern digital field guide** — authoritative, warm, and deeply organized. Not a SaaS dashboard. Not a marketplace template. A place that *knows plants* and presents knowledge with quiet confidence.

**Guiding principles:**
1. **Search-first.** The homepage is a search bar and breathing room. Like Google, the interface trusts you to ask.
2. **Progressive disclosure.** Every page starts clean. Depth reveals on demand. Never overwhelm.
3. **Botanical precision meets human warmth.** Serif italic for Latin names. Warm neutrals for the canvas. Green only for actionable elements.
4. **Two audiences, one surface.** Humans see a clean page. AI agents see structured data (JSON-LD, llms.txt, typed API). Same data, different access patterns.

---

## Typography

### Font Stack

**Display & Headings:** `Fraunces` (variable, Google Fonts)
- Soft serif with optical sizing. Feels botanical without being stuffy.
- Use for: page titles, cultivar names, section headers.
- Weight range: 400 (body serif) to 700 (headings).
- Optical size: auto (lets the font optimize for each size).

**Body & Interface:** `Satoshi` (CDN or self-hosted from Fontshare)
- Geometric sans with warmth. More character than Inter, excellent legibility.
- Use for: body text, labels, buttons, navigation, form inputs, metadata.
- Weight range: 400 (body), 500 (medium/emphasis), 700 (bold/buttons).

**Botanical names:** `Fraunces` italic at the same size as surrounding text.
- *Corylus avellana* should always render in italic serif, even when surrounded by sans-serif body text.
- This is a `<em class="font-serif italic">` pattern, not a separate font.

**Monospace (for technical/API content):** `JetBrains Mono` or system monospace.

### Type Scale

Use a **minor third** ratio (1.2) from a 16px base:

| Token          | Size   | Weight | Font      | Use                                    |
|----------------|--------|--------|-----------|----------------------------------------|
| `text-display` | 2.4rem | 600    | Fraunces  | Homepage title only                    |
| `text-h1`      | 1.8rem | 600    | Fraunces  | Page titles (cultivar name, species)   |
| `text-h2`      | 1.25rem| 600    | Fraunces  | Section headers                        |
| `text-h3`      | 1.1rem | 500    | Satoshi   | Subsection headers, card titles        |
| `text-body`    | 1rem   | 400    | Satoshi   | Default body text                      |
| `text-sm`      | 0.875rem| 400   | Satoshi   | Secondary text, metadata               |
| `text-caption` | 0.75rem| 400    | Satoshi   | Labels, timestamps, fine print         |
| `text-price`   | 1.1rem | 600    | Satoshi   | Price display                          |

### Line Heights
- Headings: 1.2 (tight)
- Body: 1.6 (readable)
- Captions: 1.4

---

## Color System

### Philosophy
The canvas is warm. Green is an *accent* for interactive/actionable elements — not the background color of everything. A second accent (amber) distinguishes community/marketplace content from commercial nursery data.

### Palette

**Canvas & Surfaces**
```
--surface-ground:     #f5f3ef    // Page background (warm linen)
--surface-primary:    #faf9f7    // Card/section background
--surface-raised:     #ffffff    // Elevated cards, popovers, modals
--surface-inset:      #edeae4    // Inset areas, code blocks, input backgrounds
```

**Text**
```
--text-primary:       #1a1714    // Headings, primary content (warm near-black)
--text-secondary:     #5c554b    // Body text, descriptions
--text-tertiary:      #8a8279    // Metadata, timestamps, placeholders
--text-inverse:       #faf9f7    // Text on dark backgrounds
```

**Green Accent (interactive/availability)**
```
--accent-green:       #2d6a4f    // Primary buttons, links, "in stock" indicators
--accent-green-hover: #1b4332    // Hover state
--accent-green-light: #d8f3dc    // Light green background (available badge, success)
--accent-green-subtle:#edf7ef    // Very subtle green tint (hover rows)
```

**Amber Accent (community/marketplace)**
```
--accent-amber:       #b45309    // Community listing indicators, trade badges
--accent-amber-hover: #92400e    // Hover
--accent-amber-light: #fef3c7    // Light amber background (community badge)
--accent-amber-subtle:#fffbeb    // Very subtle amber tint
```

**Blue Accent (informational/knowledge)**
```
--accent-blue:        #1e6091    // Zone indicators, pollination groups, info badges
--accent-blue-light:  #dbeafe    // Light blue background
```

**Status**
```
--status-active:      #2d6a4f    // In stock, active listing
--status-limited:     #b45309    // Low stock, expiring soon
--status-unavailable: #8a8279    // Out of stock, expired
--status-error:       #b91c1c    // Error states
```

**Borders**
```
--border-default:     #e2ded6    // Card borders, dividers
--border-subtle:      #ece9e3    // Very subtle separation
--border-focus:       #2d6a4f    // Focus rings (green)
```

### Dark Mode (Future)
Not for MVP. But all colors are defined as CSS custom properties, making dark mode a single theme swap later.

---

## Spacing System

Three tiers of whitespace create visual rhythm:

| Tier     | Use                                | Values        |
|----------|------------------------------------|---------------|
| Tight    | Within a component (label → value) | 4px, 8px      |
| Medium   | Between peer elements              | 16px, 24px    |
| Generous | Between page sections              | 48px, 64px    |

The cultivar page example:
- `48px` between major zones (hero → offers → knowledge → community)
- `24px` between sections within a zone (pollination → rootstock → growing)
- `8px` between label and value within a card

---

## Core Components

### 1. `<Surface>`
The universal container primitive. Every visible section sits on a Surface.

```tsx
interface SurfaceProps {
  elevation?: 'flat' | 'raised' | 'elevated';  // flat = no border, raised = border, elevated = shadow
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  className?: string;
  children: React.ReactNode;
}
```

Flat = background only, no border (for page sections).
Raised = border + white background (for cards, offers).
Elevated = shadow + white background (for popovers, modals).

### 2. `<Text>`
Enforces the type scale. No more ad-hoc Tailwind font classes.

```tsx
interface TextProps {
  variant: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'sm' | 'caption' | 'price';
  as?: keyof JSX.IntrinsicElements;  // semantic HTML tag override
  botanical?: boolean;  // renders in italic serif
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent';
  className?: string;
  children: React.ReactNode;
}
```

Usage:
```tsx
<Text variant="h1">Jefferson</Text>
<Text variant="body" botanical>Corylus avellana</Text>
<Text variant="caption" color="tertiary">Oregon State University · 1997</Text>
```

### 3. `<Tag>`
Replaces Badge. Color driven by semantic type, not manual variant prop.

```tsx
interface TagProps {
  type: 'availability' | 'community' | 'info' | 'pollination' | 'rootstock' | 'zone' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}
```

Color mapping:
- `availability` → green
- `community` → amber
- `info` / `pollination` / `zone` → blue
- `rootstock` → subtle blue-gray
- `neutral` → warm gray

### 4. `<Disclosure>`
The progressive disclosure building block. Expandable section with smooth animation.

```tsx
interface DisclosureProps {
  title: string | React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;  // e.g., count badge
  children: React.ReactNode;
}
```

Features:
- Smooth height animation via CSS `grid-template-rows: 0fr → 1fr` trick (no JS measurement)
- Rotate chevron icon on toggle
- Optional count badge next to title (e.g., "Pollination Partners (3)")
- Accessible: aria-expanded, button role

### 5. `<EmptyState>`
For sections with no data yet. Inviting, not broken.

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}
```

Example: "No offers yet — be the first to list this cultivar."

### 6. `<SearchBar>` (evolved SearchForm)
The hero interaction. Centered, prominent, with type-ahead hints.

Changes from current:
- Centered on homepage (not left-aligned)
- Larger (48px input height on desktop, 44px mobile)
- Subtle shadow instead of border (elevated feel)
- Placeholder text rotates: "Search 'Jefferson Hazelnut'..." → "Search 'zone 4 chestnuts'..." → "Search 'scion wood near me'..."
- No separate button — Enter to search, or a subtle search icon inside the input
- Below the input: quick-access chips for popular searches or genera

### 7. `<BotanicalName>`
A tiny but important component. Ensures botanical names always render correctly.

```tsx
// Always italic serif
<BotanicalName>Corylus avellana</BotanicalName>
// Renders: <em class="font-serif italic text-inherit">Corylus avellana</em>
```

### 8. `<TaxonomyPath>` (new)
The subtle "where does this sit in the plant kingdom" visual.

```tsx
interface TaxonomyPathProps {
  path: Array<{ rank: string; name: string; slug?: string }>;
  current: string;  // highlight the current level
}
```

Renders as a compact vertical breadcrumb in a sidebar:
```
Betulaceae (family)
  └ Corylus (genus)
      └ C. avellana ← you are here
```

Clickable where links exist. Collapsed to genus + species on mobile.

---

## Page Layouts

### Homepage
```
┌──────────────────────────────────────────┐
│  Nav: Logo · Search · Plants↓ · Nurseries │
├──────────────────────────────────────────┤
│                                          │
│          [warm linen background]         │
│                                          │
│     Plant Commerce                       │
│     Find plants. Compare nurseries.      │
│                                          │
│     ┌────────────────────────────┐       │
│     │  🔍 Search 'Jefferson...'  │       │
│     └────────────────────────────┘       │
│                                          │
│     [Hazelnuts] [Chestnuts] [Persimmon]  │
│     ← quick-access genus chips →         │
│                                          │
├──────────────────────────────────────────┤
│  Browse by Species (card grid, 3 col)    │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │European│ │American│ │Beaked  │       │
│  │Hazelnut│ │Hazelnut│ │Hazelnut│       │
│  └────────┘ └────────┘ └────────┘       │
├──────────────────────────────────────────┤
│  Footer                                  │
└──────────────────────────────────────────┘
```

### Cultivar Detail Page (progressive disclosure zones)
```
┌──────────────────────────────────────────┐
│  Breadcrumb: Home > European Hazelnut    │
├──────────────────────────────────────────┤
│                                          │
│  ZONE 1: THE ANSWER CARD                 │
│  ┌──────────────────────────┬──────────┐ │
│  │ Jefferson                │ Taxonomy │ │
│  │ Corylus avellana         │ sidebar  │ │
│  │ [cultivar_clone] [zone4-9]│ (small) │ │
│  │                          │          │ │
│  │ OSU · Oregon · 1997      │ Betulace │ │
│  │ EFB immune. Heavy yield. │  └Corylus│ │
│  │                          │   └avell │ │
│  └──────────────────────────┴──────────┘ │
│                                          │
│  ZONE 2: WHERE TO GET IT (always visible)│
│  ┌──────────────────────────────────────┐ │
│  │ Nursery Offers (2)                   │ │
│  │ ┌ Burnt Ridge · $24 · bare root ──┐ │ │
│  │ └────────────────────────────────  ┘ │ │
│  │ ┌ Raintree · $28 · potted ────────┐ │ │
│  │ └────────────────────────────────  ┘ │ │
│  │                                      │ │
│  │ Community Listings (1)     [amber]   │ │
│  │ ┌ Scion wood · Portland, OR · $5 ─┐ │ │
│  │ └────────────────────────────────  ┘ │ │
│  └──────────────────────────────────────┘ │
│                                          │
│  ZONE 3: KNOWLEDGE (disclosure sections) │
│  ▸ Growing Requirements ──────────────── │
│  ▸ Pollination Partners (3) ──────────── │
│  ▸ Rootstock Compatibility ───────────── │
│  ▸ Also Known As (4) ────────────────── │
│  ▸ Legal Identifiers ────────────────── │
│                                          │
│  ZONE 4: MAP (lazy-loaded)               │
│  ┌──────────────────────────────────────┐ │
│  │     [Where it grows / where to buy]  │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## Animation & Motion

Minimal and purposeful. No gratuitous animation.

- **Disclosure expand/collapse:** `grid-template-rows` transition, 200ms ease-out
- **Page transitions:** None (let Next.js handle navigation)
- **Hover states:** 150ms color/background transitions on interactive elements
- **Focus rings:** 2px offset ring in `--border-focus` color, 150ms transition
- **Map:** Standard Leaflet/Mapbox zoom/pan (no custom animation)
- **Rotating placeholder:** Fade transition between search placeholder suggestions, 4s interval

---

## Responsive Breakpoints

Standard Tailwind breakpoints, but with specific layout shifts:

- **Mobile (< 640px):** Single column. Taxonomy path collapses to inline text. Map full-width. Disclosure sections start collapsed.
- **Tablet (640-1024px):** Two-column grid for offers. Taxonomy path as inline breadcrumb.
- **Desktop (> 1024px):** Full layout with sidebar taxonomy. Three-column species grid.

Max content width: `max-w-5xl` (1024px) — slightly narrower than current `max-w-6xl` for better line lengths.

---

## Implementation Priority

1. **`globals.css`** — Font imports, CSS custom properties, Tailwind @theme
2. **`components/ui/`** — Surface, Text, Tag, BotanicalName, Disclosure, EmptyState, SearchBar
3. **`app/layout.tsx`** — Restyle nav and footer with new design tokens
4. **`app/page.tsx`** — Redesigned homepage (search-first, warm canvas)
5. **`app/plants/[speciesSlug]/[cultivarSlug]/page.tsx`** — Cultivar page with progressive disclosure zones

All other pages (species listing, nursery pages, search results) inherit the foundation and can be updated incrementally.

---

## File Structure for Design System

```
components/
  ui/                    ← NEW: design system primitives
    Surface.tsx
    Text.tsx
    Tag.tsx
    BotanicalName.tsx
    Disclosure.tsx
    EmptyState.tsx
    SearchBar.tsx
    TaxonomyPath.tsx     ← added when taxonomy data exists
  Badge.tsx              ← DEPRECATED by Tag
  Breadcrumbs.tsx        ← keep, restyle with new tokens
  InfoCard.tsx           ← keep, restyle with Surface + Text
  JsonLd.tsx             ← keep as-is
  SearchForm.tsx         ← DEPRECATED by SearchBar
  SkipNav.tsx            ← keep as-is
```

---

## Font Loading Strategy

Use `next/font` for optimal loading:

```tsx
// app/layout.tsx
import { Fraunces } from 'next/font/google';
import localFont from 'next/font/local';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

// Satoshi from local files (Fontshare doesn't have a Google Fonts CDN)
const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400' },
    { path: '../public/fonts/Satoshi-Medium.woff2', weight: '500' },
    { path: '../public/fonts/Satoshi-Bold.woff2', weight: '700' },
  ],
  variable: '--font-sans',
  display: 'swap',
});
```

Apply both font variables to `<html>` className.

---

### 9. `<CategoryContext>` (browse surface)
Compact gradient bar showing the active category on the browse page.

```tsx
interface CategoryContextProps {
  category: string;
  total: number;
  onClear: () => void;
}
```

Uses shared `lib/category-colors.ts` for gradient backgrounds — same colors as homepage `CategoryCard` components. Provides visual continuity between homepage category selection and browse filtering.

### Shared Color Constants

Category colors are defined in `lib/category-colors.ts` and imported by both `CategoryCard` (homepage) and `CategoryContext` (browse). Do not define category colors inline — always import from the shared module.

---

## Notes for the Builder

- **Don't break existing functionality.** All existing pages, API routes, and tests must continue working. This is a visual reskin, not a rewrite.
- **Keep server components.** Page-level components stay as server components. Only new interactive components (Disclosure, SearchBar, TaxonomyPath) need `'use client'`.
- **Satoshi font files** need to be downloaded from https://www.fontshare.com/fonts/satoshi and placed in `public/fonts/`. Get the WOFF2 files for Regular (400), Medium (500), and Bold (700).
- **Use `<Text>` for all page-level typography.** As of Sprint 7, all homepage and browse page text uses the `<Text>` component. Do not introduce raw Tailwind font/text classes for headings, body, captions, or prices — use `<Text variant="...">` instead. Exceptions: white text on dynamic gradient backgrounds (CategoryCard interiors), SVG labels, and layout utility classes.
- **Progressive approach:** Implement the design tokens and components first, then restyle pages one at a time starting with the homepage and cultivar page.
