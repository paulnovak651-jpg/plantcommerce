# UX Foundation Spec (v1 -> v2)

Status: foundational contract (high-confidence scope, safe to build against now)

## Purpose

Lock behavior and data contracts before visual polish so backend, UI, and agents stay aligned.

## Core Flows

1. Search -> Results -> Plant Detail Compare
2. Nursery -> Nursery Inventory
3. Listing (v2) -> Listing Detail (WTS/WTB)
4. Admin -> Unmatched + Moderation Queue

## Flow Contracts

### 1) Search -> Results -> Plant Detail Compare

Primary question: "What is this plant, and where can I get it?"

Results card must include:

- canonical name
- botanical name (if available)
- material type
- species common name (if cultivar)
- active offer count
- canonical destination URL

States:

- empty query: search UI only
- no results: empty state with browse fallback
- results: deterministic ordering and stable URLs

### 2) Nursery -> Nursery Inventory

Primary question: "What does this nursery currently offer?"

Inventory row must include:

- canonical plant label (or raw name fallback)
- raw scraped product name
- price text (if any)
- availability state
- product URL

States:

- no inventory: clear "not scraped yet" message
- has inventory: show sortable list in later phase

### 3) Listing (v2) -> Listing Detail

Primary question: "Is this listing trustworthy and relevant to me?"

Listing card must include:

- listing type (WTS/WTB)
- canonical name (or unresolved text)
- material type
- quantity
- location state
- price (if WTS)
- moderation status
- resolver confidence
- trust tier

States:

- pending: visible only to owner/admin
- approved: public
- rejected: owner sees reason

### 4) Admin -> Unmatched + Moderation Queue

Primary question: "What needs human judgment right now?"

Queue row must include:

- submitted timestamp
- user id
- trust tier
- listing type
- canonical or raw text
- resolver status (resolved/partial/unresolved)
- confidence
- reason/context

Actions:

- approve
- reject (required reason)
- edit + approve
- escalate

## URL State Contract (Search)

Supported query params:

- `q`
- `page`
- `limit`
- `materialType`
- `availability`
- `sort`

Defaults:

- `page=1`
- `limit=20`
- `availability=any`
- `sort=relevance`

Rules:

- clamp `limit` to `1..100`
- unknown enum values fall back to defaults
- omit defaults when serializing URLs

## Interaction Rules

1. Always show source/provenance when data is marketplace-originated (v2+).
2. Never hide unresolved state; surface it as explicit status.
3. Empty/error states must include next action, not dead-end text.
4. Preserve shareable URL state for search/filter pages.

## Code References

Implemented contracts live in:

- `lib/contracts/ux.ts`
- `lib/contracts/__tests__/ux.test.ts`

Search flow now uses these contracts in:

- `app/search/page.tsx`
- `app/api/search/route.ts`
