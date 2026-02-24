import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import {
  createPipelineClient,
  buildAliasIndexFromSupabase,
  writePipelineResult,
  createImportRun,
  completeImportRun,
} from '@/lib/pipeline/supabase-pipeline';
import { BurntRidgeScraper } from '@/lib/scraper/burnt-ridge';
import { processProductName } from '@/lib/resolver/pipeline';

export const maxDuration = 300; // 5 min (Vercel Pro)
export const dynamic = 'force-dynamic';

/**
 * GET /api/pipeline/scrape
 * Triggers the Burnt Ridge scraping pipeline.
 * Protected by CRON_SECRET bearer token.
 * Called by Vercel Cron (weekly) or manually for testing.
 */
export async function GET(request: NextRequest) {
  // Auth check — Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError('UNAUTHORIZED', 'Invalid authorization', 401);
    }
  }

  const startTime = Date.now();

  try {
    const supabase = createPipelineClient();

    // 1. Build alias index from live DB
    console.log('[Pipeline] Building alias index...');
    const aliasIndex = await buildAliasIndexFromSupabase(supabase);
    console.log(`[Pipeline] Alias index: ${aliasIndex.size} entries`);

    // 2. Scrape Burnt Ridge
    console.log('[Pipeline] Starting Burnt Ridge scrape...');
    const scraper = new BurntRidgeScraper({ delayMs: 2000 });
    const scrapeResult = await scraper.scrapeCategory();
    console.log(
      `[Pipeline] Scraped ${scrapeResult.products.length} products, ${scrapeResult.errors.length} errors`
    );

    // 3. Look up nursery ID
    const { data: nursery } = await supabase
      .from('nurseries')
      .select('id')
      .eq('slug', 'burnt-ridge-nursery')
      .single();

    if (!nursery) {
      return apiError(
        'NOT_FOUND',
        'Burnt Ridge nursery not found in database',
        404
      );
    }

    // 4. Create import run
    const importRunId = await createImportRun(
      supabase,
      nursery.id,
      'web_scrape',
      scrapeResult.sourceUrl
    );
    console.log(`[Pipeline] Import run: ${importRunId}`);

    // 5. Resolve and write each product
    // canonical data structure needed by processProductName (empty — we use aliasIndex from DB)
    const canonical = {
      plant_entities: [],
      cultivars: [],
      named_materials: [],
      populations: [],
    };

    let resolved = 0;
    let unmatched = 0;
    const writeErrors: string[] = [];

    for (const product of scrapeResult.products) {
      try {
        const output = processProductName(
          product.rawProductName,
          aliasIndex,
          canonical
        );

        await writePipelineResult(supabase, output, nursery.id, importRunId, {
          rawDescription: product.rawDescription ?? undefined,
          rawPriceText: product.rawPriceText ?? undefined,
          rawAvailability: product.rawAvailability ?? undefined,
          rawFormSize: product.rawFormSize ?? undefined,
          rawSku: product.rawSku ?? undefined,
          productPageUrl: product.productPageUrl,
        });

        if (output.resolvedEntityType !== 'unresolved') {
          resolved++;
        } else {
          unmatched++;
        }
      } catch (err) {
        const msg = `Write error for "${product.rawProductName}": ${err}`;
        console.error(`[Pipeline] ${msg}`);
        writeErrors.push(msg);
      }
    }

    // 6. Complete import run
    await completeImportRun(supabase, importRunId, {
      rowsTotal: scrapeResult.products.length,
      rowsResolved: resolved,
      rowsUnmatched: unmatched,
    });

    // 7. Refresh materialized view
    console.log('[Pipeline] Refreshing search index...');
    const { error: rpcError } = await supabase.rpc('refresh_search_index');
    if (rpcError) {
      console.error(
        '[Pipeline] Failed to refresh search index:',
        rpcError.message
      );
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Pipeline] Complete in ${durationMs}ms`);

    return apiSuccess({
      importRunId,
      productsScraped: scrapeResult.products.length,
      resolved,
      unmatched,
      scrapeErrors: scrapeResult.errors,
      writeErrors,
      durationMs,
    });
  } catch (err) {
    console.error('[Pipeline] Fatal error:', err);
    return apiError('PIPELINE_ERROR', String(err), 500);
  }
}
