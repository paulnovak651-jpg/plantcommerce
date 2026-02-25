import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import {
  createPipelineClient,
  buildAliasIndexFromSupabase,
  writePipelineResult,
  createImportRun,
  completeImportRun,
} from '@/lib/pipeline/supabase-pipeline';
import {
  createRegisteredScrapers,
  createScraperForNursery,
  listRegisteredScraperSlugs,
  type NurseryScraper,
} from '@/lib/scraper';
import { processProductName } from '@/lib/resolver/pipeline';
import type { CanonicalData } from '@/lib/resolver/types';
import { pipelineLog, capErrorSamples, SCRAPER_VERSION } from '@/lib/pipeline/logger';
import { requireCronAuth } from '@/lib/pipeline/auth';

export const maxDuration = 300; // 5 min (Vercel Pro)
export const dynamic = 'force-dynamic';

interface NurseryRunSummary {
  nurserySlug: string;
  nurseryName: string;
  importRunId: string | null;
  productsScraped: number;
  resolved: number;
  unmatched: number;
  errored: number;
  scrapeErrors: string[];
  writeErrors: string[];
  durationMs: number;
  error: string | null;
}

/**
 * GET /api/pipeline/scrape
 * Triggers scraping pipeline for one nursery (?nursery=slug) or all registered scrapers.
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  const auth = requireCronAuth(request);
  if (!auth.ok) {
    pipelineLog('error', 'pipeline_auth_failed', {
      reason: 'missing_or_invalid_cron_secret',
    });
    return auth.response;
  }

  const startTime = Date.now();

  try {
    const nurseryFilter = request.nextUrl.searchParams.get('nursery');
    const scrapers = selectScrapers(nurseryFilter);

    if (scrapers.length === 0) {
      const valid = listRegisteredScraperSlugs().join(', ');
      return apiError(
        'NOT_FOUND',
        `Unknown nursery '${nurseryFilter}'. Registered: ${valid}`,
        404
      );
    }

    const supabase = createPipelineClient();

    pipelineLog('info', 'alias_index_start', {});
    const aliasIndex = await buildAliasIndexFromSupabase(supabase);
    pipelineLog('info', 'alias_index_ready', { entries: aliasIndex.size });

    const canonical: CanonicalData = {
      plant_entities: [],
      cultivars: [],
      named_materials: [],
      populations: [],
    };

    const results: NurseryRunSummary[] = [];
    let anyImportsCompleted = false;

    for (const scraper of scrapers) {
      results.push(
        await runNurseryPipeline(scraper, supabase, aliasIndex, canonical)
      );
      if (results[results.length - 1].importRunId) {
        anyImportsCompleted = true;
      }
    }

    if (anyImportsCompleted) {
      pipelineLog('info', 'mv_refresh_start', {});
      const { error: rpcError } = await supabase.rpc('refresh_search_index');
      if (rpcError) {
        pipelineLog('error', 'mv_refresh_failed', {
          error: rpcError.message,
        });
      } else {
        pipelineLog('info', 'mv_refresh_complete', {});
      }
    }

    const totals = results.reduce(
      (acc, r) => {
        acc.productsScraped += r.productsScraped;
        acc.resolved += r.resolved;
        acc.unmatched += r.unmatched;
        acc.errored += r.errored;
        if (r.error) acc.failedNurseries += 1;
        else acc.successfulNurseries += 1;
        return acc;
      },
      {
        nurseries: results.length,
        successfulNurseries: 0,
        failedNurseries: 0,
        productsScraped: 0,
        resolved: 0,
        unmatched: 0,
        errored: 0,
      }
    );

    const durationMs = Date.now() - startTime;
    pipelineLog('info', 'pipeline_complete', {
      nurseries: totals.nurseries,
      successfulNurseries: totals.successfulNurseries,
      failedNurseries: totals.failedNurseries,
      productsScraped: totals.productsScraped,
      resolved: totals.resolved,
      unmatched: totals.unmatched,
      errored: totals.errored,
      durationMs,
      scraperVersion: SCRAPER_VERSION,
    });

    return apiSuccess({
      nurseryFilter,
      nurseries: results,
      totals,
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

function selectScrapers(nurseryFilter: string | null): NurseryScraper[] {
  if (!nurseryFilter) return createRegisteredScrapers();
  const scraper = createScraperForNursery(nurseryFilter);
  return scraper ? [scraper] : [];
}

async function runNurseryPipeline(
  scraper: NurseryScraper,
  supabase: ReturnType<typeof createPipelineClient>,
  aliasIndex: Awaited<ReturnType<typeof buildAliasIndexFromSupabase>>,
  canonical: CanonicalData
): Promise<NurseryRunSummary> {
  const nurseryStart = Date.now();
  let importRunId: string | null = null;

  try {
    pipelineLog('info', 'scrape_start', {
      nursery: scraper.nurserySlug,
      scraperVersion: SCRAPER_VERSION,
    });
    const scrapeResult = await scraper.scrapeCategory();
    const scrapeDuration = Date.now() - nurseryStart;
    pipelineLog('info', 'scrape_complete', {
      nursery: scraper.nurserySlug,
      products: scrapeResult.products.length,
      scrapeErrors: scrapeResult.errors.length,
      durationMs: scrapeDuration,
    });

    if (scrapeResult.products.length === 0) {
      pipelineLog('error', 'zero_products_scraped', {
        nursery: scraper.nurserySlug,
        sourceUrl: scrapeResult.sourceUrl,
        errors: scrapeResult.errors,
      });
    }

    const { data: nursery } = await supabase
      .from('nurseries')
      .select('id')
      .eq('slug', scraper.nurserySlug)
      .single();

    if (!nursery) {
      const errorMsg = `Nursery '${scraper.nurserySlug}' not found in database`;
      pipelineLog('error', 'nursery_not_found', {
        slug: scraper.nurserySlug,
      });
      return {
        nurserySlug: scraper.nurserySlug,
        nurseryName: scraper.nurseryName,
        importRunId: null,
        productsScraped: scrapeResult.products.length,
        resolved: 0,
        unmatched: 0,
        errored: 0,
        scrapeErrors: scrapeResult.errors,
        writeErrors: [],
        durationMs: Date.now() - nurseryStart,
        error: errorMsg,
      };
    }

    importRunId = await createImportRun(
      supabase,
      nursery.id,
      'web_scrape',
      scrapeResult.sourceUrl
    );
    pipelineLog('info', 'import_run_created', {
      nursery: scraper.nurserySlug,
      importRunId,
    });

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

        if (output.resolvedEntityType !== 'unresolved') resolved++;
        else unmatched++;
      } catch (err) {
        errored++;
        const errMsg = String(err);
        errorSamples.push({ product: product.rawProductName, error: errMsg });
        pipelineLog('error', 'write_error', {
          nursery: scraper.nurserySlug,
          product: product.rawProductName,
          error: errMsg,
        });
      }
    }

    const totalProducts = scrapeResult.products.length;
    const durationMs = Date.now() - nurseryStart;

    await completeImportRun(supabase, importRunId, {
      rowsTotal: totalProducts,
      rowsResolved: resolved,
      rowsUnmatched: unmatched,
      rowsErrored: errored,
      durationMs,
      errorSamples: capErrorSamples(errorSamples),
      scraperVersion: SCRAPER_VERSION,
    });

    if (totalProducts > 0) {
      const resolveRate = resolved / totalProducts;
      const errorRate = errored / totalProducts;

      if (resolveRate < 0.5) {
        pipelineLog('warn', 'low_resolve_rate', {
          nursery: scraper.nurserySlug,
          rate: resolveRate,
          threshold: 0.5,
          resolved,
          total: totalProducts,
        });
      }

      if (errorRate > 0.2) {
        pipelineLog('warn', 'high_error_rate', {
          nursery: scraper.nurserySlug,
          rate: errorRate,
          threshold: 0.2,
          errored,
          total: totalProducts,
        });
      }
    }

    return {
      nurserySlug: scraper.nurserySlug,
      nurseryName: scraper.nurseryName,
      importRunId,
      productsScraped: totalProducts,
      resolved,
      unmatched,
      errored,
      scrapeErrors: scrapeResult.errors,
      writeErrors: errorSamples.map((e) => `${e.product}: ${e.error}`),
      durationMs,
      error: null,
    };
  } catch (err) {
    pipelineLog('error', 'nursery_pipeline_fatal', {
      nursery: scraper.nurserySlug,
      error: String(err),
      durationMs: Date.now() - nurseryStart,
    });

    if (importRunId) {
      try {
        await completeImportRun(supabase, importRunId, {
          rowsTotal: 0,
          rowsResolved: 0,
          rowsUnmatched: 0,
          rowsErrored: 1,
          durationMs: Date.now() - nurseryStart,
          errorSamples: [{ product: '__pipeline__', error: String(err) }],
          scraperVersion: SCRAPER_VERSION,
        });
      } catch {
        // Best effort only
      }
    }

    return {
      nurserySlug: scraper.nurserySlug,
      nurseryName: scraper.nurseryName,
      importRunId,
      productsScraped: 0,
      resolved: 0,
      unmatched: 0,
      errored: 1,
      scrapeErrors: [],
      writeErrors: [],
      durationMs: Date.now() - nurseryStart,
      error: String(err),
    };
  }
}
