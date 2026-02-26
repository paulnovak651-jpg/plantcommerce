import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';
import { createPipelineClient } from '@/lib/pipeline/supabase-pipeline';
import { createRegisteredScrapers } from '@/lib/scraper';
import {
  evaluateScraperHealth,
  type ScraperHealthInput,
} from '@/lib/pipeline/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NurseryRow {
  id: string;
  slug: string;
  name: string;
}

interface ImportRunRow {
  nursery_id: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  rows_total: number | null;
  rows_resolved: number | null;
  rows_errored: number | null;
}

/**
 * GET /api/pipeline/health
 * Protected scraper health summary for admin automation.
 * Auth: Bearer ADMIN_STATUS_SECRET (fallback: CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const registered = createRegisteredScrapers().map((scraper) => ({
      nurserySlug: scraper.nurserySlug,
      nurseryName: scraper.nurseryName,
    }));
    const registeredSlugs = registered.map((entry) => entry.nurserySlug);

    const supabase = createPipelineClient();

    const { data: nurseries, error: nurseryError } = await supabase
      .from('nurseries')
      .select('id, slug, name')
      .in('slug', registeredSlugs);

    if (nurseryError) {
      return apiError(
        'DB_ERROR',
        `Failed to fetch nurseries for health check: ${nurseryError.message}`,
        500
      );
    }

    const nurseryRows = (nurseries ?? []) as NurseryRow[];
    const nurseryBySlug = new Map(
      nurseryRows.map((row) => [row.slug, row] as const)
    );
    const nurseryIds = nurseryRows.map((row) => row.id);

    let latestRuns: ImportRunRow[] = [];
    if (nurseryIds.length > 0) {
      const { data: runs, error: runError } = await supabase
        .from('import_runs')
        .select(
          'nursery_id, status, started_at, completed_at, rows_total, rows_resolved, rows_errored'
        )
        .in('nursery_id', nurseryIds)
        .order('started_at', { ascending: false });

      if (runError) {
        return apiError(
          'DB_ERROR',
          `Failed to fetch import runs for health check: ${runError.message}`,
          500
        );
      }

      latestRuns = (runs ?? []) as ImportRunRow[];
    }

    const latestRunByNurseryId = new Map<string, ImportRunRow>();
    const latestCompletedAtByNurseryId = new Map<string, string>();

    for (const run of latestRuns) {
      if (!latestRunByNurseryId.has(run.nursery_id)) {
        latestRunByNurseryId.set(run.nursery_id, run);
      }

      if (
        run.status === 'completed' &&
        run.completed_at &&
        !latestCompletedAtByNurseryId.has(run.nursery_id)
      ) {
        latestCompletedAtByNurseryId.set(run.nursery_id, run.completed_at);
      }
    }

    const healthInputs: ScraperHealthInput[] = registered.map((entry) => {
      const nursery = nurseryBySlug.get(entry.nurserySlug);
      const latestRun = nursery
        ? latestRunByNurseryId.get(nursery.id) ?? null
        : null;

      return {
        nurserySlug: entry.nurserySlug,
        nurseryName: nursery?.name ?? entry.nurseryName,
        lastRunAt: latestRun?.started_at ?? latestRun?.completed_at ?? null,
        lastRunStatus: latestRun?.status ?? null,
        lastRunRowsTotal: latestRun?.rows_total ?? null,
        lastRunRowsResolved: latestRun?.rows_resolved ?? null,
        lastRunRowsErrored: latestRun?.rows_errored ?? null,
        lastCompletedAt: nursery
          ? latestCompletedAtByNurseryId.get(nursery.id) ?? null
          : null,
      };
    });

    const health = evaluateScraperHealth(healthInputs);
    return apiSuccess(health, { total: health.scrapers.length }, {
      self: '/api/pipeline/health',
    });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
