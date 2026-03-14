# PlantCommerce Project Reorganization Plan

*Last updated: 2026-03-14*

## Purpose

This document is the working plan for making PlantCommerce easier to operate, easier to extend, and safer for both humans and agents to work in.

The goal is not to change the core product architecture. The product should remain a disciplined monolith. The goal is to eliminate drift, reduce duplicate sources of truth, clarify ownership, and make the repo reflect the system that actually exists.

---

## Executive Summary

PlantCommerce already has a strong product and technical base:

- Next.js app is live and healthy
- TypeScript is strict
- Vitest suite is passing
- Supabase-backed data model is substantial
- scraper, resolver, and browse systems are already valuable

The main problem is not raw code quality. The main problem is organizational drift:

- operations docs disagree with the implemented command-center APIs
- multiple docs claim to be the source of truth
- sprint state is stale in key agent-facing files
- browse architecture exists in both live and shadow forms
- system visualization and migration docs are outdated

This slows execution, increases agent error rate, and makes review harder than it should be.

The right target state is:

- one source of truth for operations
- one source of truth for current product priorities
- one canonical browse architecture
- one documented repo structure organized by feature ownership
- one lightweight decision process for structural changes

---

## Audit Summary

## What is strong

- `npm test` passes with 230 tests
- `npx tsc --noEmit` is clean
- core monolith architecture is still the right choice
- the data pipeline, browse model, and API layers are sufficiently mature to scale inside one repo

## What is weak

### 1. Command Center contract drift

Current operational surfaces disagree:

- `AGENTS.md` points to `http://localhost:3001/dashboard`
- `scripts/dashboard-snapshot.ps1` points to `http://localhost:3000/api/dashboard`
- session scripts post to `/api/sessions`
- app routes actually implement `/api/dashboard` and `/api/dashboard/sessions`

Result:

- agents cannot reliably register sessions
- humans cannot trust the docs without checking the code
- internal automation is fragile

### 2. Repo truth drift

Key planning and status docs are inconsistent:

- `AGENTS.md` still marks Sprint 12 active
- root docs include Sprint 13 and Sprint 14 work
- `app/system-map/page.tsx` contains stale counts and stale risk statements
- `sql/MIGRATION_GUIDE.md` is behind the actual migration sequence

Result:

- onboarding is slower
- review context is noisy
- agents spend time reconciling history instead of executing work

### 3. Shadow browse architecture

The app currently routes `/browse` and `/search` back to `/`, while older browse and facet surfaces still exist in the repo:

- live path: homepage + taxonomy explorer
- shadow path: facet-driven browse header/grid/sidebar/API stack

Result:

- unclear canonical UX
- unnecessary maintenance surface
- docs and code both overstate what is actually in use

### 4. Documentation sprawl

There are many root-level strategy and sprint docs plus a second `docs/` tree, but no explicit index, archive policy, or canonical reading order.

Result:

- too much context to load
- too many stale documents remain "active"
- human and agent context windows get wasted

### 5. Ownership boundaries are weak

The repo has good primitives, but live code ownership is still split across generic top-level folders with some old compatibility layers.

Result:

- feature work crosses too many unrelated files
- cleanup work is harder than it needs to be
- dead code can survive longer than it should

---

## Target System

## Core principle

PlantCommerce should remain a single product monolith with strong internal boundaries.

Do not split into microservices.
Do not add infrastructure for its own sake.
Do not create separate agent orchestration systems outside the repo.

## Target architecture

### 1. Product monolith

- Next.js App Router frontend
- internal API routes
- Supabase data and auth surfaces
- scraper/resolver/pipeline system
- internal admin and dashboard tools

### 2. Control plane

One internal contract for:

- task status
- agent sessions
- status/health endpoints
- command-center scripts
- auth secrets for internal ops

This must be versioned by code, not implied by old docs.

### 3. Knowledge plane

One documentation hierarchy:

- current state
- active roadmap
- architecture decisions
- playbooks
- archived sprints

### 4. Feature boundaries

The repo should make ownership obvious:

- browse
- plants
- nurseries
- pipeline
- marketplace
- dashboard
- shared UI/contracts/utils

---

## Proposed Repository Shape

This is the target organization, not an all-at-once move:

```text
app/                      routes only
features/
  browse/
    components/
    queries/
    state/
    api/
  dashboard/
    components/
    scripts-contract/
    status/
  marketplace/
  nurseries/
  pipeline/
    scrapers/
    resolver/
    health/
  plants/
shared/
  ui/
  lib/
  contracts/
  types/
docs/
  index.md
  current/
  playbooks/
  adr/
  archive/
sql/
  migrations/
  guides/
scripts/
  ops/
  quality/
  scaffolds/
```

## Directory rules

- `app/` owns routes, metadata, and route composition only
- `features/` owns domain logic and feature UI
- `shared/` owns cross-feature primitives only
- `docs/current/` contains only active reference docs
- `docs/archive/` contains completed sprint docs and superseded plans
- `scripts/ops/` contains runtime-operational scripts
- `scripts/quality/` contains linters, checks, and validation tools
- `scripts/scaffolds/` contains generators and scaffolds

---

## Operating Model For Humans And Agents

## Single Source of Truth Rules

### Current execution truth

The following should exist and remain current:

- `README.md` for how to start and navigate the repo
- `AGENTS.md` for agent operating rules only
- `CONTEXT.md` for current state snapshot only
- `ROADMAP.md` for active priorities only
- `docs/index.md` for the doc map

Anything not current belongs in archive.

### Decision truth

Major structural decisions should be written as short ADRs in `docs/adr/`.

Use ADRs for:

- route model changes
- feature ownership changes
- command-center contract changes
- browse architecture changes
- data model governance decisions

### Operational truth

One command-center contract must define:

- base URL and port
- route names
- auth secrets
- session lifecycle
- dropped-session rules
- task lifecycle

That contract should be represented in:

- code
- scripts
- docs
- tests

not separately invented in each place.

---

## Phased Execution Plan

## Phase 0: Truth Reset

### Goal

Stop the drift before any deeper refactor.

### Changes

- create `README.md` with canonical startup and repo map
- update `AGENTS.md` to match the implemented system
- update `CONTEXT.md` and `ROADMAP.md` to current reality
- remove stale "active sprint" references
- decide whether `system-map` remains a maintained tool

### Acceptance criteria

- a new contributor can determine the current state from three files max
- no root-level planning doc contradicts `AGENTS.md`, `CONTEXT.md`, or `ROADMAP.md`
- one current milestone is clearly named

### Cleanup targets

- stale sprint markers in `AGENTS.md`
- stale counts in `app/system-map/page.tsx`
- stale migration guidance in `sql/MIGRATION_GUIDE.md`

## Phase 1: Command Center Stabilization

### Goal

Make human/agent collaboration reliable.

### Changes

- standardize one local ops port
- standardize one route namespace for dashboard APIs
- align PowerShell and bash scripts with actual route implementations
- align auth naming around one internal secret model
- add a health-check step for local dashboard availability
- add a heartbeat/update mechanism for active sessions

### Acceptance criteria

- session start works from both PowerShell and bash
- session end works from both PowerShell and bash
- dashboard snapshot uses the same API contract as the app
- dropped sessions reflect actual stale sessions, not guessed failures

### Recommended decisions

- keep dashboard routes under `/api/dashboard/*`
- avoid a second "legacy" `/api/sessions` contract
- make local development default to the same app port used by Next unless there is a strong reason not to

## Phase 2: Documentation Architecture

### Goal

Reduce context load and make documentation maintainable.

### Changes

- create `docs/index.md`
- move active docs into `docs/current/`
- move procedural docs into `docs/playbooks/`
- move completed sprint docs into `docs/archive/`
- keep only a minimal set of root-level docs

### Root-level docs that should remain

- `README.md`
- `AGENTS.md`
- `CONTEXT.md`
- `ROADMAP.md`
- `VISION.md`
- `PROJECT_REORG_PLAN.md`

### Acceptance criteria

- no one needs to scan the root directory to understand project state
- completed sprint docs are archived, not mixed with current strategy
- every active doc has an explicit owner and update purpose

## Phase 3: Browse Architecture Decision

### Goal

Choose one canonical browse system and remove the shadow path.

### Decision required

Pick one of these as the primary PlantCommerce browse architecture:

1. homepage-first taxonomy explorer model
2. facet-driven browse model
3. hybrid model, but with one clearly owned orchestration layer

### Recommended choice

Use the hybrid model only if the homepage explorer and facet browse share one real state/query layer. Otherwise, choose one canonical model and archive the other.

### Changes

- document the chosen browse architecture in one ADR
- remove or archive unused browse components
- either wire `/api/browse` into the live UX or formally downgrade it to future work
- eliminate compatibility comments that preserve dead surfaces without ownership

### Acceptance criteria

- one browse entrypoint is canonical
- one set of browse components is live and maintained
- docs do not describe unused browse orchestration as current architecture

## Phase 4: Feature Boundary Refactor

### Goal

Make the repo map match the product domains.

### Changes

- move route-adjacent feature code out of generic top-level folders into `features/`
- keep shared primitives separate from domain-specific logic
- collapse backwards-compatibility exports where they no longer add value

### Initial move candidates

- `components/browse/*` -> `features/browse/components/*`
- `lib/facets/*` -> `features/browse/state/*`
- `lib/queries/browse.ts` and related browse query code -> `features/browse/queries/*`
- `lib/scraper/*`, `lib/resolver/*`, `lib/pipeline/*` -> `features/pipeline/*`
- dashboard-related status code -> `features/dashboard/*`

### Acceptance criteria

- a change to one feature rarely requires touching unrelated top-level areas
- unused compatibility wrappers are removed
- feature ownership is obvious from paths alone

## Phase 5: Governance Automation

### Goal

Prevent drift from coming back.

### Changes

- add repo checks for stale sprint references
- add repo checks for command-center route drift
- add repo checks for migration numbering mistakes
- add doc index validation so archived docs are not linked as active
- add lightweight architecture review checklist to PR process

### Acceptance criteria

- CI fails when docs contradict implementation on core operational contracts
- migration guide cannot silently fall behind sequence reality
- agent startup docs cannot drift without detection

---

## Specific Cleanup Backlog

## Immediate

- fix command-center scripts and docs
- update `AGENTS.md`
- update `sql/MIGRATION_GUIDE.md`
- decide fate of `app/system-map/page.tsx`
- create `README.md`
- create `docs/index.md`

## Short-term

- archive completed sprint docs
- decide canonical browse architecture
- remove unused browse surfaces
- normalize internal ops secret names and port assumptions

## Medium-term

- feature-boundary refactor
- ADR system adoption
- governance automation in CI

## After reorganization

- parser generalization
- consent workflow tightening
- data quality completion
- admin tooling expansion

---

## Definition of Done

This reorganization is complete when:

- humans and agents use one trustworthy operational contract
- the repo has one clear entrypoint and one clear doc map
- current priorities are visible without archaeology
- live architecture and described architecture match
- dead or shadow systems are removed or explicitly archived
- future drift is prevented by automation, not memory

---

## Recommended Execution Order

1. Truth reset
2. command-center stabilization
3. documentation architecture
4. browse architecture decision
5. feature boundary refactor
6. governance automation

Do not start with large folder moves.
Start by making the repo truthful.

---

## Notes

This plan is intentionally conservative.

PlantCommerce does not need more infrastructure.
It needs tighter internal contracts, less duplicated truth, and cleaner ownership boundaries.

The project is already strong enough that these changes should increase execution speed without introducing platform risk.
