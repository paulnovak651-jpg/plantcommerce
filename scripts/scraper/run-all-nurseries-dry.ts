// ============================================================================
// Dry-run all 10 nurseries through the resolver pipeline
// Simulates scraping by feeding test data through processProductName
// ============================================================================

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildAliasIndex } from '../resolver.js';
import { processProductName } from '../pipeline.js';
import type { CanonicalData } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', '..', 'data');

const canonical: CanonicalData = JSON.parse(
  readFileSync(resolve(dataDir, 'hazelnut_canonical_entities_v1.json'), 'utf-8')
);
const testCases = JSON.parse(
  readFileSync(resolve(dataDir, 'hazelnut_raw_offers_testset.json'), 'utf-8')
);

const aliasIndex = buildAliasIndex(canonical);

// Group by nursery
const byNursery = new Map<string, any[]>();
for (const tc of testCases) {
  if (!byNursery.has(tc.nursery)) byNursery.set(tc.nursery, []);
  byNursery.get(tc.nursery)!.push(tc);
}

console.log('='.repeat(90));
console.log('ALL-NURSERY PIPELINE DRY RUN — 104 products from 10 nurseries');
console.log('='.repeat(90));
console.log();

let totalCorrect = 0;
let totalProducts = 0;

for (const [nursery, cases] of byNursery) {
  let correct = 0;
  for (const tc of cases) {
    const output = processProductName(tc.raw_product_name, aliasIndex, canonical);
    const typeMatch = output.resolvedEntityType === tc.expected_entity_type;
    const idMatch = output.resolvedEntityId === tc.expected_entity_id;
    if (typeMatch && idMatch) correct++;
    else {
      console.log(`  ❌ [${nursery}] "${tc.raw_product_name}"`);
      console.log(`     Expected: ${tc.expected_entity_type}:${tc.expected_entity_id}`);
      console.log(`     Got:      ${output.resolvedEntityType}:${output.resolvedEntityId}`);
    }
  }
  const pct = ((correct / cases.length) * 100).toFixed(0);
  const icon = correct === cases.length ? '✅' : '⚠️';
  console.log(`${icon} ${nursery.padEnd(35)} ${correct}/${cases.length} (${pct}%)`);
  totalCorrect += correct;
  totalProducts += cases.length;
}

console.log();
console.log('='.repeat(90));
console.log(`TOTAL: ${totalCorrect}/${totalProducts} (${((totalCorrect / totalProducts) * 100).toFixed(1)}%)`);
console.log('='.repeat(90));

process.exit(totalCorrect === totalProducts ? 0 : 1);
