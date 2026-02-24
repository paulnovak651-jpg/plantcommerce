// ============================================================================
// Supabase Pipeline Integration
// Loads alias index from Supabase, writes pipeline results back.
// Uses service_role key (bypasses RLS for pipeline tables).
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AliasEntry, PipelineOutput } from '@/lib/resolver/types';
import { normalize, parseProductName } from '@/lib/resolver/parser';

/**
 * Create a pipeline-specific Supabase client using env vars.
 * Uses service role key to bypass RLS for pipeline tables.
 */
export function createPipelineClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Build the alias index from Supabase data.
 * Queries cultivars, aliases, and plant_entities to build an in-memory lookup map.
 */
export async function buildAliasIndexFromSupabase(
  supabase: SupabaseClient
): Promise<Map<string, AliasEntry>> {
  const index = new Map<string, AliasEntry>();

  function addEntry(normKey: string, entry: AliasEntry) {
    if (normKey && !index.has(normKey)) {
      index.set(normKey, entry);
    }
  }

  // ── Load all published cultivars ──
  const { data: cultivars, error: cvErr } = await supabase
    .from('cultivars')
    .select('id, canonical_name, material_type, slug')
    .eq('curation_status', 'published');

  if (cvErr) throw new Error(`Failed to load cultivars: ${cvErr.message}`);

  for (const cv of cultivars ?? []) {
    const entityType = materialTypeToEntityType(cv.material_type);
    const norm = normalize(cv.canonical_name);
    addEntry(norm, {
      entityType,
      entityId: cv.id,
      canonicalName: cv.canonical_name,
      matchSource: 'canonical_name',
    });

    // Also index parsed version of canonical name
    const parsed = parseProductName(cv.canonical_name);
    const normParsed = normalize(parsed.coreName);
    if (normParsed && normParsed !== norm) {
      addEntry(normParsed, {
        entityType,
        entityId: cv.id,
        canonicalName: cv.canonical_name,
        matchSource: `parsed_canonical: ${cv.canonical_name}`,
      });
    }
  }

  // ── Load all aliases ──
  const { data: aliases, error: aliasErr } = await supabase
    .from('aliases')
    .select('normalized_text, alias_text, target_type, target_id');

  if (aliasErr) throw new Error(`Failed to load aliases: ${aliasErr.message}`);

  const cultivarMap = new Map<string, { name: string; materialType: string }>();
  for (const cv of cultivars ?? []) {
    cultivarMap.set(cv.id, {
      name: cv.canonical_name,
      materialType: cv.material_type,
    });
  }

  // Load plant entities
  const { data: plantEntities, error: peErr } = await supabase
    .from('plant_entities')
    .select('id, canonical_name, botanical_name')
    .eq('curation_status', 'published');

  if (peErr)
    throw new Error(`Failed to load plant_entities: ${peErr.message}`);

  const peMap = new Map<
    string,
    { name: string; botanicalName: string | null }
  >();
  for (const pe of plantEntities ?? []) {
    peMap.set(pe.id, {
      name: pe.canonical_name,
      botanicalName: pe.botanical_name,
    });

    const norm = normalize(pe.canonical_name);
    addEntry(norm, {
      entityType: 'plant_entity',
      entityId: pe.id,
      canonicalName: pe.canonical_name,
      matchSource: 'canonical_name',
    });

    if (pe.botanical_name) {
      const normBot = normalize(pe.botanical_name);
      addEntry(normBot, {
        entityType: 'plant_entity',
        entityId: pe.id,
        canonicalName: pe.canonical_name,
        matchSource: `botanical: ${pe.botanical_name}`,
      });
    }
  }

  // Index all aliases
  for (const alias of aliases ?? []) {
    let entityType: AliasEntry['entityType'];
    let canonicalName: string;

    if (alias.target_type === 'cultivar') {
      const cv = cultivarMap.get(alias.target_id);
      if (!cv) continue;
      entityType = materialTypeToEntityType(cv.materialType);
      canonicalName = cv.name;
    } else {
      const pe = peMap.get(alias.target_id);
      if (!pe) continue;
      entityType = 'plant_entity';
      canonicalName = pe.name;
    }

    addEntry(alias.normalized_text, {
      entityType,
      entityId: alias.target_id,
      canonicalName,
      matchSource: `alias: ${alias.alias_text}`,
    });

    // Index parsed version of alias
    const parsed = parseProductName(alias.alias_text);
    const normParsed = normalize(parsed.coreName);
    if (normParsed) {
      addEntry(normParsed, {
        entityType,
        entityId: alias.target_id,
        canonicalName,
        matchSource: `parsed_alias: ${alias.alias_text}`,
      });
    }
  }

  return index;
}

/**
 * Write a resolved pipeline result to Supabase.
 * Creates an inventory_offer (or unmatched_name) and raw_inventory_row.
 * Uses upsert on source_offer_key for idempotency (safe for cron reruns).
 */
export async function writePipelineResult(
  supabase: SupabaseClient,
  result: PipelineOutput,
  nurseryId: string,
  importRunId: string,
  rawData: {
    rawDescription?: string;
    rawPriceText?: string;
    rawAvailability?: string;
    rawFormSize?: string;
    rawSku?: string;
    productPageUrl?: string;
  } = {}
): Promise<{ offerId?: string; unmatchedId?: string; rawRowId: string }> {
  // 1. Create raw_inventory_row
  const { data: rawRow, error: rawErr } = await supabase
    .from('raw_inventory_rows')
    .insert({
      import_run_id: importRunId,
      nursery_id: nurseryId,
      raw_product_name: result.rawProductName,
      raw_description: rawData.rawDescription,
      raw_price_text: rawData.rawPriceText,
      raw_availability: rawData.rawAvailability,
      raw_form_size: rawData.rawFormSize,
      raw_sku: rawData.rawSku,
      raw_url: rawData.productPageUrl,
      parsed_core_name: result.parsedCoreName,
      parsed_botanical: result.parsedBotanical,
      parsed_propagation: result.parsedPropagation,
      parsed_organic:
        result.parsedOrganic === 'organic'
          ? true
          : result.parsedOrganic === 'conventional'
            ? false
            : null,
      parsed_patent_info: result.parsedPatentInfo,
      stripped_tokens: result.strippedTokens,
      resolution_status: result.resolutionStatus,
      resolution_confidence: result.resolutionConfidence,
    })
    .select('id')
    .single();

  if (rawErr)
    throw new Error(`Failed to write raw_inventory_row: ${rawErr.message}`);

  // 2. If resolved → upsert inventory_offer (idempotent via source_offer_key)
  if (result.resolvedEntityType !== 'unresolved') {
    const isPlantEntity =
      result.resolutionStatus === 'resolved_plant_entity';
    const sourceOfferKey = generateSourceOfferKey(
      nurseryId,
      rawData.productPageUrl,
      rawData.rawSku,
      rawData.rawFormSize
    );

    const offerData = {
      nursery_id: nurseryId,
      cultivar_id: isPlantEntity ? null : result.resolvedEntityId,
      plant_entity_id: isPlantEntity ? result.resolvedEntityId : null,
      resolution_status: result.resolutionStatus,
      resolution_confidence: result.resolutionConfidence,
      resolution_method: result.resolutionMethod,
      raw_product_name: result.rawProductName,
      raw_description: rawData.rawDescription,
      raw_price_text: rawData.rawPriceText,
      raw_availability: rawData.rawAvailability,
      raw_form_size: rawData.rawFormSize,
      raw_sku: rawData.rawSku,
      product_page_url: rawData.productPageUrl,
      propagation_method: result.parsedPropagation ?? 'unknown',
      sale_form: result.parsedSaleForm ?? 'unknown',
      organic_status:
        result.parsedOrganic === 'organic'
          ? true
          : result.parsedOrganic === 'conventional'
            ? false
            : null,
      import_run_id: importRunId,
      source_offer_key: sourceOfferKey,
      last_seen_at: new Date().toISOString(),
    };

    const { data: offer, error: offerErr } = await supabase
      .from('inventory_offers')
      .upsert(offerData, {
        onConflict: 'nursery_id,source_offer_key',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (offerErr)
      throw new Error(`Failed to write inventory_offer: ${offerErr.message}`);

    // Link raw row to offer
    await supabase
      .from('raw_inventory_rows')
      .update({ offer_id: offer!.id })
      .eq('id', rawRow!.id);

    return { offerId: offer!.id, rawRowId: rawRow!.id };
  }

  // 3. If unresolved → create unmatched_name
  const { data: unmatched, error: unmatchedErr } = await supabase
    .from('unmatched_names')
    .upsert(
      {
        raw_product_name: result.rawProductName,
        parsed_core_name: result.parsedCoreName,
        nursery_id: nurseryId,
        import_run_id: importRunId,
        raw_row_id: rawRow!.id,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'parsed_core_name,nursery_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (unmatchedErr)
    throw new Error(`Failed to write unmatched_name: ${unmatchedErr.message}`);

  return { unmatchedId: unmatched!.id, rawRowId: rawRow!.id };
}

/**
 * Create an import run tracking record.
 */
export async function createImportRun(
  supabase: SupabaseClient,
  nurseryId: string,
  sourceType: string,
  sourceUrl?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('import_runs')
    .insert({
      nursery_id: nurseryId,
      source_type: sourceType,
      source_url: sourceUrl,
      status: 'running',
    })
    .select('id')
    .single();

  if (error)
    throw new Error(`Failed to create import_run: ${error.message}`);
  return data!.id;
}

/**
 * Complete an import run with final stats.
 */
export async function completeImportRun(
  supabase: SupabaseClient,
  importRunId: string,
  stats: { rowsTotal: number; rowsResolved: number; rowsUnmatched: number }
): Promise<void> {
  const { error } = await supabase
    .from('import_runs')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed',
      rows_total: stats.rowsTotal,
      rows_resolved: stats.rowsResolved,
      rows_unmatched: stats.rowsUnmatched,
    })
    .eq('id', importRunId);

  if (error)
    throw new Error(`Failed to complete import_run: ${error.message}`);
}

// ── Helpers ──

function materialTypeToEntityType(
  materialType: string
): AliasEntry['entityType'] {
  switch (materialType) {
    case 'cultivar_clone':
      return 'cultivar';
    case 'named_seed_strain':
      return 'named_material';
    case 'breeding_population':
    case 'geographic_population':
      return 'population';
    case 'species_seedling':
      return 'plant_entity';
    default:
      return 'cultivar';
  }
}

function generateSourceOfferKey(
  nurseryId: string,
  productUrl?: string,
  sku?: string,
  formSize?: string
): string {
  const parts = [nurseryId, productUrl ?? '', sku ?? '', formSize ?? ''];
  return parts.join('|');
}
