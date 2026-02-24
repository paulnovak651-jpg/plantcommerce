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
import { pipelineLog, capErrorSamples, SCRAPER_VERSION } from '@/lib/pipeline/logger';

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
    pipelineLog('info', 'alias_index_start', {});
    const aliasIndex = await buildAliasIndexFromSupabase(supabase);
    pipelineLog('info', 'alias_index_ready', { entries: aliasIndex.size });

    // 2. Scrape Burnt Ridge
    pipelineLog('info', 'scrape_start', {
      nursery: 'burnt-ridge-nursery',
      scraperVersion: SCRAPER_VERSION,
    });
    const scraper = new BurntRidgeScraper({ delayMs: 2000 });
    const scrapeResult = await scraper.scrapeCategory();
    const scrapeMs = Date.now() - startTime;
    pipelineLog('info', 'scrape_complete', {
      nursery: 'burnt-ridge-nursery',
      products: scrapeResult.products.length,
      scrapeErrors: scrapeResult.errors.length,
      durationMs: scrapeMs,
    });

    // Alert: zero products scraped
    if (scrapeResult.products.length === 0) {
      pipelineLog('error', 'zero_products_scraped', {
        nursery: 'burnt-ridge-nursery',
        sourceUrl: scrapeResult.sourceUrl,
        errors: scrapeResult.errors,
      });
    }

    // 3. Look up nursery ID
    const { data: nursery } = await supabase
      .from('nurseries')
      .select('id')
      .eq('slug', 'burnt-ridge-nursery')
      .single();

    if (!nursery) {
      pipelineLog('error', 'nursery_not_found', {
        slug: 'burnt-ridge-nursery',
      });
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
    pipelineLog('info', 'import_run_created', { importRunId });

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
    let errored = 0;
    const errorSamples: Array<{ product: string; error: string }> = [];

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
        errored++;
        const errMsg = String(err);
        errorSamples.push({
          product: product.rawProductName,
          error: errMsg,
        });
        pipelineLog('error', 'write_error', {
          product: product.rawProductName,
          error: errMsg,
        });
      }
    }

    // 6. Complete import run with diagnostics
    const durationMs = Date.now() - startTime;
    await completeImportRun(supabase, importRunId, {
      rowsTotal: scrapeResult.products.length,
      rowsResolved: resolved,
      rowsUnmatched: unmatched,
      rowsErrored: errored,
      durationMs,
      errorSamples: capErrorSamples(errorSamples),
      scraperVersion: SCRAPER_VERSION,
    });

    // 7. Refresh materialized view
    pipelineLog('info', 'mv_refresh_start', {});
    const { error: rpcError } = await supabase.rpc('refresh_search_index');
    if (rpcError) {
      pipelineLog('error', 'mv_refresh_failed', {
        error: rpcError.message,
      });
    } else {
      pipelineLog('info', 'mv_refresh_complete', {});
    }

    // 8. Post-run alerts
    const totalProducts = scrapeResult.products.length;
    if (totalProducts > 0) {
      const resolveRate = resolved / totalProducts;
      const errorRate = errored / totalProducts;

      if (resolveRate < 0.5) {
        pipelineLog('warn', 'low_resolve_rate', {
          rate: resolveRate,
          threshold: 0.5,
          resolved,
          total: totalProducts,
        });
      }

      if (errorRate > 0.2) {
        pipelineLog('warn', 'high_error_rate', {
          rate: errorRate,
          threshold: 0.2,
          errored,
          total: totalProducts,
        });
      }
    }

    pipelineLog('info', 'pipeline_complete', {
      nursery: 'burnt-ridge-nursery',
      importRunId,
      productsScraped: totalProducts,
      resolved,
      unmatched,
      errored,
      durationMs,
      scraperVersion: SCRAPER_VERSION,
    });

    return apiSuccess({
      importRunId,
      productsScraped: totalProducts,
      resolved,
      unmatched,
      errored,
      scrapeErrors: scrapeResult.errors,
      writeErrors: errorSamples.map((e) => `${e.product}: ${e.error}`),
      durationMs,
      scraperVersion: SCRAPER_VERSION,
    });
  } catch (err) {
    pipelineLog('error', 'pipeline_fatal', {
      error: String(err),
      durationMs: Date.now() - startTime,
    });
    return apiError('PIPELINE_ERROR', String(err), 500);
  }
}
