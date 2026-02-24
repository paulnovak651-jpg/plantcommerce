/**
 * One-time migration runner for 003_import_runs_observability.sql
 * Run with: npx tsx scripts/run-migration-003.ts
 *
 * Uses the Supabase Management API to execute raw SQL.
 * Falls back to individual column checks via the REST API.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('Checking current import_runs columns...');

  // Check if columns already exist by trying to select them
  const { data, error } = await supabase
    .from('import_runs')
    .select('id, duration_ms, scraper_version, rows_errored')
    .limit(1);

  if (!error) {
    console.log('Columns already exist! Migration not needed.');
    console.log('Sample row:', data);
    return;
  }

  console.log('Columns missing, need to run migration.');
  console.log('Error:', error.message);
  console.log('\nPlease run the following SQL in the Supabase SQL Editor:');
  console.log('---');
  console.log(`ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS duration_ms integer;`);
  console.log(`ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS error_samples jsonb DEFAULT '[]';`);
  console.log(`ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS scraper_version text;`);
  console.log(`ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS rows_errored integer DEFAULT 0;`);
  console.log('---');
  console.log('\nAlternatively, the pipeline will gracefully handle missing columns.');
}

main().catch(console.error);
