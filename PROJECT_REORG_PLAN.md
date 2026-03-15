# PlantCommerce Lean Reorganization Plan

> **Label:** Current repo hygiene plan
> **Last updated:** 2026-03-14

## Purpose

This plan makes PlantCommerce faster for humans and agents to enter, safer for parallel work, and clearer about what is current without large folder moves or platform churn.

The project remains a disciplined monolith. GitHub `master` remains the shared source of truth. Local clones remain execution, testing, and review environments.

## What This Plan Optimizes For

- one trustworthy startup path
- one local-first workflow
- one internal Command Center contract
- one clear distinction between current docs and historical docs
- one explicit statement of the live browse architecture

## What This Plan Does Not Do

- no `features/` directory migration
- no ADR system
- no broad "docs contradict implementation" CI policy
- no new orchestration layer outside the repo

## Current Drift To Fix

### 1. Command Center contract drift

- scripts were still pointing at `http://localhost:3001/api/sessions`
- the app actually implements `/api/dashboard/*`
- dashboard/session auth expectations were not described consistently

### 2. Current-doc drift

- root docs were not clearly labeled as current startup truth
- historical sprint docs still looked active in places
- workflow guidance was present, but not consistently treated as the required operating contract

### 3. Browse-truth drift

- the homepage taxonomy explorer is the canonical browse entrypoint
- `/browse` and `/search` redirect back to `/` while preserving params
- older facet/query/API surfaces still exist, but they are not the primary user entrypoint

## Lean Phases

## Phase 0: Truth Reset

### Goal

Make the repo truthful before changing anything structural.

### Changes

- keep root startup truth in `README.md`, `AGENTS.md`, `CONTEXT.md`, and `ROADMAP.md`
- label current docs, operational docs, and historical docs explicitly
- update current docs so they agree on workflow, browse truth, and Command Center routes
- keep key structural decisions in current docs instead of introducing ADRs

### Acceptance Criteria

- a new agent can determine current state from the root docs without scanning sprint files
- root docs do not contradict one another on workflow, priorities, or browse truth
- historical docs are clearly labeled as historical reference only

## Phase 1: Local Workflow and Command Center Stabilization

### Goal

Make human and agent collaboration reliable on the existing app contract.

### Canonical Workflow

1. `git pull --rebase origin master`
2. `git status --short`
3. read the current root docs only
4. run the app locally on `http://localhost:3000`
5. make changes locally
6. test locally before wrapping up
7. review the diff
8. commit only intended files
9. push to GitHub
10. deploy separately when appropriate

Do not use production to discover whether a change works.

### Canonical Command Center Contract

- base URL: `http://localhost:3000`
- dashboard API namespace: `/api/dashboard/*`
- session routes:
  - `GET /api/dashboard`
  - `POST /api/dashboard/sessions`
  - `PATCH /api/dashboard/sessions/[id]`
- task routes stay under `/api/dashboard/*`
- auth: `ADMIN_STATUS_SECRET` primary, `CRON_SECRET` fallback

### Changes

- align bash and PowerShell scripts to the canonical dashboard routes
- add a lightweight readiness check before session registration
- keep session lifecycle simple: start, update/end, dropped if stale
- keep the Command Center small and repo-local

### Acceptance Criteria

- session start works from bash and PowerShell
- session end works from bash and PowerShell
- dashboard snapshot uses the same auth and route contract as the app
- no current script or doc points to `/api/sessions` or port `3001`

## Phase 2: Documentation as Agent Navigation

### Goal

Reduce search time and clarify what to ignore.

### Rules

- root docs are the only startup truth
- operational playbooks live under `docs/operations/`
- architecture references live under `docs/architecture/`
- research stays under `docs/research/`
- sprint docs are historical reference only

### Required Routing Coverage

- homepage and taxonomy work
- species and cultivar page work
- browse/filter/query/API work
- scraper/resolver/pipeline work
- dashboard/session/status work
- schema/data/migration work

### Handoff Contract

When work is unfinished, record:

- touched surfaces
- current state
- next step

### Acceptance Criteria

- an agent can identify the right starting files for a common task in under five minutes
- an agent can tell which docs are safe to ignore for normal execution
- the docs index points operators toward current truth first and historical material last

## Phase 3: Browse Architecture Truth

### Goal

Document the live browse model without redesigning it.

### Current Truth

- the homepage taxonomy explorer is the canonical browse entrypoint
- `/browse` redirects to `/` and preserves query params for old links
- facet/query/API surfaces still exist as secondary/internal browse infrastructure
- no current doc should describe `/browse` as the primary user entrypoint

### Acceptance Criteria

- current docs describe the same browse entrypoint users actually hit
- secondary browse surfaces are documented as secondary, redirected, or future-facing
- no code move is required to clarify the architecture

## Phase 4: Lightweight Guardrails

### Goal

Reduce drift without building brittle process overhead.

### Changes

- add a short PR/review checklist
- add one or two cheap smoke checks for route/doc contract drift
- make doc index maintenance explicit

### Non-Goals

- no broad semantic "docs match code" enforcement
- no large governance framework
- no folder reorganization campaign

## Definition of Done

This effort is complete when:

- humans and agents use one trustworthy workflow
- the Command Center uses one trustworthy route and auth contract
- current docs are easy to identify and fast to read
- historical docs are clearly labeled and easy to ignore
- the homepage taxonomy explorer is explicitly documented as the live browse entrypoint
- agents can work in parallel with low risk of walking into the wrong surfaces
