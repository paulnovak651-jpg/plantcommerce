# PlantCommerce

PlantCommerce is a plant information and sourcing platform for the permaculture community. The application combines structured plant data, nursery inventory aggregation, and a community marketplace in one Next.js + Supabase monolith.

## Working Rules

- GitHub `master` is the canonical shared state.
- Local clones are for execution, testing, and review.
- Do not let local drift become project truth.

## Standard Workflow

Use this order every time:

1. Pull latest shared state: `git pull --rebase origin master`
2. Inspect local status: `git status --short`
3. Read the current operating docs:
   - `AGENTS.md`
   - `CONTEXT.md`
   - `ROADMAP.md`
   - `docs/INDEX.md`
4. Run the app locally: `npm run dev`
5. Make changes locally
6. Test locally on `localhost`
7. Review the diff before commit
8. Commit only the intended files
9. Push the reviewed change to GitHub

## Local Development

Install dependencies:

```bash
npm ci
```

Run the app:

```bash
npm run dev
```

Validation:

```bash
npm test
npx tsc --noEmit
```

## Repo Map

- `app/` route layer
- `components/` UI components
- `lib/` data access, pipeline, resolver, search, and shared logic
- `sql/migrations/` schema and data migrations
- `scripts/` operational and scaffold scripts
- `docs/` architecture, operations, research, and archived sprint docs

## Key Documents

- `AGENTS.md`: agent operating rules
- `CONTEXT.md`: current technical state
- `ROADMAP.md`: current priorities
- `PROJECT_REORG_PLAN.md`: cleanup and architecture plan
- `docs/INDEX.md`: documentation entrypoint

## Non-Negotiables

- TypeScript strict mode stays clean
- Tests must stay passing
- No secrets in code
- No new scraper work without nursery consent
- No large UI redesigns without explicit direction
