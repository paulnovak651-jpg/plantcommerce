# Nursery Scraper Playbook

This is the repeatable flow for adding new nurseries without degrading code quality.

## Goal

Use one consistent pipeline shape for every nursery:

1. Scraper implementation (`lib/scraper/<file>.ts`)
2. Fixture-backed extraction tests (`lib/scraper/__tests__/`)
3. Registry wiring (`lib/scraper/index.ts`)
4. Pipeline validation (`/api/pipeline/scrape?nursery=<slug>`)

## Scaffold a New Scraper

Run:

```bash
npm run scraper:new -- \
  --slug raintree-nursery \
  --class RaintreeScraper \
  --name "Raintree Nursery" \
  --category-url "https://raintreenursery.com/collections/hazelnuts"
```

Dry-run first if you want a preview:

```bash
npm run scraper:new -- --slug raintree-nursery --class RaintreeScraper --name "Raintree Nursery" --category-url "https://example.com" --dry-run
```

The scaffold command creates:

- `lib/scraper/<file>.ts`
- `lib/scraper/__tests__/<file>.test.ts`
- `lib/scraper/__tests__/fixtures/<file>-category.html`
- registry entries in `lib/scraper/index.ts`

## Implementation Checklist

1. Replace placeholder selectors in the scaffolded scraper.
2. Replace fixture HTML with real saved category markup from the target nursery.
3. Expand tests to assert extraction of:
   - `rawProductName`
   - `rawPriceText`
   - `rawAvailability`
   - `rawFormSize`
   - `productPageUrl`
4. Ensure scraper returns stable URLs and bounded `rawFullHtml` size.
5. Keep parse logic deterministic and avoid brittle text heuristics where possible.

## Validation Checklist

1. Run tests:

```bash
npm test
```

2. Trigger only the new nursery pipeline:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/pipeline/scrape?nursery=<slug>"
```

3. Verify pipeline summary:
   - `productsScraped > 0`
   - reasonable `resolved/unmatched` split
   - low `errored`

4. Check `import_runs` and `unmatched_names` for anomalies.

## Quality Bar

- Never bypass `NurseryScraper` interface.
- Keep parser/resolver ownership separate: scraper extracts raw data only.
- Add fixtures and tests before declaring a scraper done.
- Prefer robust selectors over page-position assumptions.
