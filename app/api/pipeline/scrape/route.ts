import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import {
  createPipelineClient,
  buildAliasIndexFromSupabase,
  writePipelineResult,
  createImportRun,
  completeImportRun,
  markNurseryScraped,
  markStaleOffers,
} from '@/lib/pipeline/supabase-pipeline';
import {
  createScraperFromConfig,
  type NurseryScraper,
} from '@/lib/scraper';
import { processProductName } from '@/lib/resolver/pipeline';
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
  staleMarked: number;
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

  // Seasonal frequency: daily during spring bare-root season (Feb-Apr),
  // weekly (Monday only) the rest of the year.
  // Manual runs via ?nursery=slug bypass this check.
  const nurseryFilter = request.nextUrl.searchParams.get('nursery');
  if (!nurseryFilter) {
    const now = new Date();
    const month = now.getUTCMonth(); // 0-indexed: Jan=0, Feb=1, Mar=2, Apr=3
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
    const isSpring = month >= 1 && month <= 3; // Feb, Mar, Apr
    const isMonday = dayOfWeek === 1;

    if (!isSpring && !isMonday) {
      pipelineLog('info', 'pipeline_skipped_off_season', {
        month: month + 1,
        dayOfWeek,
        reason: 'Non-spring, non-Monday — skipping until next Monday',
      });
      return apiSuccess({
        skipped: true,
        reason: 'Off-season: scrapes run weekly (Mondays) outside Feb-Apr',
      });
    }
  }

  try {
    const supabase = createPipelineClient();
    const scrapers = await selectScrapers(supabase, nurseryFilter);

    if (scrapers.length === 0) {
      return apiError(
        'NOT_FOUND',
        `No scrapable nurseries found${nurseryFilter ? ` for slug '${nurseryFilter}'` : ''}. Ensure nurseries have scraper_type set and is_active = true.`,
        404
      );
    }

    pipelineLog('info', 'alias_index_start', {});
    const aliasIndex = await buildAliasIndexFromSupabase(supabase);
    pipelineLog('info', 'alias_index_ready', { entries: aliasIndex.size });

    // TODO: When multi-genus is active, detect genus from scraper metadata
    // and load the appropriate GenusConfig from lib/resolver/genus-config.ts.
    // For now, all products use the default hazelnut config (Corylus).
    // The getGenusConfig('corylus') pattern is ready to use when needed.

    const results: NurseryRunSummary[] = [];
    let anyImportsCompleted = false;

    for (const scraper of scrapers) {
      results.push(
        await runNurseryPipeline(scraper, supabase, aliasIndex)
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

async function selectScrapers(
  supabase: ReturnType<typeof createPipelineClient>,
  nurseryFilter: string | null
): Promise<NurseryScraper[]> {
  let query = supabase
    .from('nurseries')
    .select('slug, name, scraper_type, scraper_config')
    .eq('is_active', true)
    .not('scraper_type', 'is', null);

  if (nurseryFilter) {
    query = query.eq('slug', nurseryFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<{
    slug: string;
    name: string;
    scraper_type: string | null;
    scraper_config: Record<string, any> | null;
  }>)
    .map((nursery) => createScraperFromConfig(nursery))
    .filter((scraper): scraper is NurseryScraper => scraper !== null);
}

async function runNurseryPipeline(
  scraper: NurseryScraper,
  supabase: ReturnType<typeof createPipelineClient>,
  aliasIndex: Awaited<ReturnType<typeof buildAliasIndexFromSupabase>>
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
      .select('id, consent_status')
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
        staleMarked: 0,
        scrapeErrors: scrapeResult.errors,
        writeErrors: [],
        durationMs: Date.now() - nurseryStart,
        error: errorMsg,
      };
    }

    // Consent gate: skip nurseries that have explicitly declined.
    // Nurseries with 'pending' status still run — all 3 existing nurseries are pending
    // until outreach emails are sent and responses come in.
    // TODO: Once outreach is complete and responses are recorded, tighten this to:
    //   if (nursery.consent_status !== 'approved') { ... skip ... }
    if (nursery.consent_status === 'declined') {
      pipelineLog('warn', 'nursery_skipped_consent_declined', {
        nursery: scraper.nurserySlug,
        consent_status: nursery.consent_status,
      });
      return {
        nurserySlug: scraper.nurserySlug,
        nurseryName: scraper.nurseryName,
        importRunId: null,
        productsScraped: 0,
        resolved: 0,
        unmatched: 0,
        errored: 0,
        staleMarked: 0,
        scrapeErrors: [],
        writeErrors: [],
        durationMs: Date.now() - nurseryStart,
        error: null,
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
          aliasIndex
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

    await markNurseryScraped(supabase, nursery.id, {
      rowsResolved: resolved,
      scrapedAt: scrapeResult.scrapedAt,
    });

    // Mark offers not seen in this scrape as stale
    const importRunStartedAt = scrapeResult.scrapedAt ?? new Date().toISOString();
    const staleCount = await markStaleOffers(supabase, nursery.id, importRunStartedAt);
    if (staleCount > 0) {
      pipelineLog('info', 'stale_offers_marked', {
        nursery: scraper.nurserySlug,
        staleCount,
      });
    }

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
      staleMarked: staleCount,
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
      staleMarked: 0,
      scrapeErrors: [],
      writeErrors: [],
      durationMs: Date.now() - nurseryStart,
      error: String(err),
    };
  }
}
