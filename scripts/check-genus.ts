import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface PlantEntity {
  id: string;
  slug: string;
  canonical_name: string;
  curation_status: string;
}

interface GrowingProfile {
  plant_entity_id: string;
  sun_requirement: string | null;
  growth_rate: string | null;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  data_sources: string[] | null;
}

interface PollinationProfile {
  plant_entity_id: string;
}

interface IndexLookupResult {
  indexEntityIds: Set<string>;
  idColumn: string;
}

interface EntityReadiness {
  slug: string;
  published: boolean;
  hasGrowing: boolean;
  hasPollination: boolean;
  growingComplete: boolean;
  inIndex: boolean;
  ready: boolean;
  issues: string[];
}

async function loadDotEnvLocal(): Promise<void> {
  const envPath = path.resolve(process.cwd(), '.env.local');
  let content: string;
  try {
    content = await readFile(envPath, 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function createPipelineStyleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set env vars or add them to .env.local.'
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function fetchIndexEntityIds(
  supabase: SupabaseClient,
  entityIds: string[]
): Promise<IndexLookupResult> {
  const candidates = ['entity_id', 'plant_entity_id', 'id'];
  const errors: string[] = [];

  for (const idColumn of candidates) {
    const query = supabase
      .from('material_search_index')
      .select(idColumn)
      .in(idColumn, entityIds);
    const { data, error } = await query;

    if (error) {
      errors.push(`${idColumn}: ${error.message}`);
      continue;
    }

    const indexEntityIds = new Set<string>();
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const value = row[idColumn];
      if (typeof value === 'string') {
        indexEntityIds.add(value);
      }
    }

    return { indexEntityIds, idColumn };
  }

  throw new Error(
    `Unable to query material_search_index with known id columns. ${errors.join(' | ')}`
  );
}

function titleCase(input: string): string {
  return input.length === 0
    ? input
    : `${input.charAt(0).toUpperCase()}${input.slice(1).toLowerCase()}`;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, ' ');
}

function yesNo(value: boolean): string {
  return value ? 'YES' : 'NO';
}

async function run(): Promise<void> {
  const genusArg = process.argv[2]?.trim();
  if (!genusArg) {
    console.error('Usage: npx tsx scripts/check-genus.ts <genus>');
    process.exit(1);
  }

  await loadDotEnvLocal();
  const supabase = createPipelineStyleClient();
  const genusName = titleCase(genusArg);

  const { data: entitiesData, error: entitiesError } = await supabase
    .from('plant_entities')
    .select('id, slug, canonical_name, curation_status')
    .ilike('genus', genusName)
    .order('slug', { ascending: true });

  if (entitiesError) throw new Error(`Failed to query plant_entities: ${entitiesError.message}`);

  const entities = (entitiesData ?? []) as PlantEntity[];
  if (entities.length === 0) {
    console.log(`Genus Readiness: ${genusName} (0 entities)`);
    console.log('Result: FAIL (no entities found)');
    process.exit(1);
  }

  const entityIds = entities.map((entity) => entity.id);

  const { data: growingData, error: growingError } = await supabase
    .from('species_growing_profiles')
    .select('plant_entity_id, sun_requirement, growth_rate, usda_zone_min, usda_zone_max, data_sources')
    .in('plant_entity_id', entityIds);
  if (growingError) {
    throw new Error(`Failed to query species_growing_profiles: ${growingError.message}`);
  }

  const { data: pollinationData, error: pollinationError } = await supabase
    .from('species_pollination_profiles')
    .select('plant_entity_id')
    .in('plant_entity_id', entityIds);
  if (pollinationError) {
    throw new Error(`Failed to query species_pollination_profiles: ${pollinationError.message}`);
  }

  const { indexEntityIds, idColumn } = await fetchIndexEntityIds(supabase, entityIds);

  const growingMap = new Map<string, GrowingProfile>();
  for (const row of (growingData ?? []) as GrowingProfile[]) {
    growingMap.set(row.plant_entity_id, row);
  }

  const pollinationSet = new Set<string>();
  for (const row of (pollinationData ?? []) as PollinationProfile[]) {
    pollinationSet.add(row.plant_entity_id);
  }

  const rows: EntityReadiness[] = entities.map((entity) => {
    const growing = growingMap.get(entity.id);
    const published = entity.curation_status === 'published';
    const hasGrowing = Boolean(growing);
    const hasPollination = pollinationSet.has(entity.id);
    const growingComplete = Boolean(
      growing &&
        growing.sun_requirement &&
        growing.growth_rate &&
        growing.usda_zone_min !== null &&
        growing.usda_zone_max !== null &&
        Array.isArray(growing.data_sources) &&
        growing.data_sources.length > 0
    );
    const inIndex = indexEntityIds.has(entity.id);

    const issues: string[] = [];
    if (!published) issues.push(`curation_status=${entity.curation_status}`);
    if (!hasGrowing) issues.push('missing species_growing_profiles');
    if (!hasPollination) issues.push('missing species_pollination_profiles');
    if (hasGrowing && !growingComplete) {
      issues.push('incomplete growing profile (sun/growth/zone/data_sources)');
    }
    if (published && !inIndex) issues.push('missing from material_search_index');

    return {
      slug: entity.slug,
      published,
      hasGrowing,
      hasPollination,
      growingComplete,
      inIndex,
      ready: issues.length === 0,
      issues,
    };
  });

  const readyCount = rows.filter((row) => row.ready).length;
  const total = rows.length;

  console.log(`Genus Readiness: ${genusName} (${total} entities)`);
  console.log();
  console.log(
    `  ${pad('Slug', 24)} ${pad('Published', 10)} ${pad('Growing', 8)} ${pad(
      'Pollination',
      12
    )} ${pad('Growing OK', 10)} ${pad('In Index', 8)}`
  );

  for (const row of rows) {
    console.log(
      `  ${pad(row.slug, 24)} ${pad(yesNo(row.published), 10)} ${pad(
        yesNo(row.hasGrowing),
        8
      )} ${pad(yesNo(row.hasPollination), 12)} ${pad(yesNo(row.growingComplete), 10)} ${pad(
        yesNo(row.inIndex),
        8
      )}`
    );
  }

  if (readyCount !== total) {
    console.log();
    console.log('Issues:');
    for (const row of rows) {
      if (row.issues.length === 0) continue;
      console.log(`  - ${row.slug}: ${row.issues.join('; ')}`);
    }
  }

  console.log();
  console.log(
    `Result: ${readyCount === total ? 'PASS' : 'FAIL'} (${readyCount}/${total} entities ready) [index key: ${idColumn}]`
  );

  process.exit(readyCount === total ? 0 : 1);
}

run().catch((error: unknown) => {
  console.error(`Genus readiness check failed: ${String(error)}`);
  process.exit(1);
});
