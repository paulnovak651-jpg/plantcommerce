// ============================================================================
// Scrape → Resolve Orchestrator
// End-to-end: fetch products → parse names → resolve entities → report
//
// Usage:
//   # Dry run (no Supabase — uses JSON canonical data, prints report):
//   node --import tsx/esm src/scraper/run-scrape.ts --dry-run
//
//   # Live run (writes to Supabase):
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx \
//     node --import tsx/esm src/scraper/run-scrape.ts
// ============================================================================

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { BurntRidgeScraper } from './burnt-ridge.js';
import { buildAliasIndex } from '../resolver.js';
import { processProductName } from '../pipeline.js';
import type { CanonicalData, AliasEntry, PipelineOutput } from '../types.js';
import type { ScrapedProduct, ScrapeResult } from './types.js';

// Optional Supabase imports (only used in live mode)
let createSupabaseClient: typeof import('../supabase.js').createSupabaseClient | undefined;
let buildAliasIndexFromSupabase: typeof import('../supabase.js').buildAliasIndexFromSupabase | undefined;
let writePipelineResult: typeof import('../supabase.js').writePipelineResult | undefined;
let createImportRun: typeof import('../supabase.js').createImportRun | undefined;
let completeImportRun: typeof import('../supabase.js').completeImportRun | undefined;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──

const isDryRun = process.argv.includes('--dry-run');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ── Main ──

async function main() {
  console.log('='.repeat(80));
  console.log(`SCRAPE → RESOLVE PIPELINE ${isDryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('='.repeat(80));
  console.log();

  // Step 1: Build alias index
  let aliasIndex: Map<string, AliasEntry>;
  let canonical: CanonicalData;

  if (isDryRun || !SUPABASE_URL) {
    // Load from JSON files
    const dataDir = resolve(__dirname, '..', '..', 'data');
    canonical = JSON.parse(readFileSync(resolve(dataDir, 'hazelnut_canonical_entities_v1.json'), 'utf-8'));
    aliasIndex = buildAliasIndex(canonical);
    console.log(`Loaded alias index from JSON: ${aliasIndex.size} entries`);
  } else {
    // Load from Supabase
    const supabaseMod = await import('../supabase.js');
    createSupabaseClient = supabaseMod.createSupabaseClient;
    buildAliasIndexFromSupabase = supabaseMod.buildAliasIndexFromSupabase;
    writePipelineResult = supabaseMod.writePipelineResult;
    createImportRun = supabaseMod.createImportRun;
    completeImportRun = supabaseMod.completeImportRun;

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);
    aliasIndex = await buildAliasIndexFromSupabase(supabase);
    canonical = { plant_entities: [], cultivars: [], named_materials: [], populations: [] };
    console.log(`Loaded alias index from Supabase: ${aliasIndex.size} entries`);
  }
  console.log();

  // Step 2: Scrape
  const scraper = new BurntRidgeScraper({ delayMs: isDryRun ? 0 : 2000 });

  let scrapeResult: ScrapeResult;
  if (isDryRun) {
    // In dry run mode, use the test data as simulated scrape results
    scrapeResult = simulateScrapeFromTestData();
    console.log(`Simulated scrape: ${scrapeResult.products.length} products`);
  } else {
    scrapeResult = await scraper.scrapeCategory();
  }
  console.log();

  // Step 3: Resolve each product
  const resolved: { product: ScrapedProduct; output: PipelineOutput }[] = [];
  const unresolved: { product: ScrapedProduct; output: PipelineOutput }[] = [];

  for (const product of scrapeResult.products) {
    const output = processProductName(product.rawProductName, aliasIndex, canonical);

    if (output.resolvedEntityType === 'unresolved') {
      unresolved.push({ product, output });
    } else {
      resolved.push({ product, output });
    }
  }

  // Step 4: Report
  console.log('='.repeat(80));
  console.log('RESOLUTION REPORT');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total products:  ${scrapeResult.products.length}`);
  console.log(`Resolved:        ${resolved.length}`);
  console.log(`Unresolved:      ${unresolved.length}`);
  console.log(`Scrape errors:   ${scrapeResult.errors.length}`);
  console.log();

  // Resolved items
  if (resolved.length > 0) {
    console.log('-'.repeat(80));
    console.log('RESOLVED:');
    console.log('-'.repeat(80));
    for (const { product, output } of resolved) {
      const conf = (output.resolutionConfidence * 100).toFixed(0);
      console.log(
        `  ✅ ${product.rawProductName.slice(0, 50).padEnd(50)} → ${output.resolvedCanonicalName} (${output.resolutionMethod}, ${conf}%)`
      );
    }
    console.log();
  }

  // Unresolved items
  if (unresolved.length > 0) {
    console.log('-'.repeat(80));
    console.log('UNRESOLVED (needs review):');
    console.log('-'.repeat(80));
    for (const { product, output } of unresolved) {
      console.log(
        `  ❌ ${product.rawProductName.slice(0, 50).padEnd(50)} → core: "${output.parsedCoreName}"`
      );
    }
    console.log();
  }

  // Method distribution
  const methods: Record<string, number> = {};
  for (const { output } of resolved) {
    methods[output.resolutionMethod] = (methods[output.resolutionMethod] ?? 0) + 1;
  }
  console.log('Resolution methods:');
  for (const [method, count] of Object.entries(methods).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${method}: ${count}`);
  }
  console.log();

  // Step 5: Write to Supabase (live mode only)
  if (!isDryRun && SUPABASE_URL && createImportRun && writePipelineResult && completeImportRun) {
    const supabase = createSupabaseClient!(SUPABASE_URL, SUPABASE_SERVICE_KEY!);

    // Look up nursery ID
    const { data: nursery } = await supabase
      .from('nurseries')
      .select('id')
      .eq('slug', 'burnt-ridge-nursery')
      .single();

    if (!nursery) {
      console.error('ERROR: Burnt Ridge nursery not found in database');
      process.exit(1);
    }

    const importRunId = await createImportRun(
      supabase,
      nursery.id,
      'web_scrape',
      scrapeResult.sourceUrl
    );

    let rowsResolved = 0;
    let rowsUnmatched = 0;

    for (const { product, output } of [...resolved, ...unresolved]) {
      await writePipelineResult(supabase, output, nursery.id, importRunId, {
        rawDescription: product.rawDescription ?? undefined,
        rawPriceText: product.rawPriceText ?? undefined,
        rawAvailability: product.rawAvailability ?? undefined,
        rawFormSize: product.rawFormSize ?? undefined,
        rawSku: product.rawSku ?? undefined,
        productPageUrl: product.productPageUrl,
      });

      if (output.resolvedEntityType !== 'unresolved') {
        rowsResolved++;
      } else {
        rowsUnmatched++;
      }
    }

    await completeImportRun(supabase, importRunId, {
      rowsTotal: scrapeResult.products.length,
      rowsResolved,
      rowsUnmatched,
    });

    console.log(`✅ Written to Supabase: import_run=${importRunId}`);
  }

  // Exit
  if (unresolved.length > 0) {
    console.log(`\n⚠️  ${unresolved.length} items need manual review in the queue.`);
  }
  console.log('\nDone.');
}

/**
 * Simulate a scrape using the Burnt Ridge test cases.
 * Useful for dry-run testing without hitting the real site.
 */
function simulateScrapeFromTestData(): ScrapeResult {
  const dataDir = resolve(__dirname, '..', '..', 'data');
  const testCases = JSON.parse(
    readFileSync(resolve(dataDir, 'hazelnut_raw_offers_testset.json'), 'utf-8')
  );

  // Filter to Burnt Ridge only
  const burntRidgeCases = testCases.filter(
    (tc: any) => tc.nursery === 'Burnt Ridge Nursery'
  );

  const products: ScrapedProduct[] = burntRidgeCases.map((tc: any) => ({
    rawProductName: tc.raw_product_name,
    rawDescription: null,
    rawPriceText: null,
    rawAvailability: 'In Stock',
    rawFormSize: null,
    rawSku: null,
    productPageUrl: `https://www.burntridgenursery.com/simulated/${encodeURIComponent(tc.raw_product_name)}`,
    rawCategory: 'Hazelnuts/Filberts',
    rawBotanical: null,
    rawFullHtml: null,
  }));

  return {
    nurserySlug: 'burnt-ridge-nursery',
    sourceUrl: 'https://www.burntridgenursery.com/mobile/Hazelnut-Trees/products/54/',
    scrapedAt: new Date().toISOString(),
    products,
    errors: [],
  };
}

// Run
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
