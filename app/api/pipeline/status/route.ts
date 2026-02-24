import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createPipelineClient } from '@/lib/pipeline/supabase-pipeline';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pipeline/status
 * Returns the latest 10 import runs with diagnostic data.
 * Read-only, no auth required (no secrets exposed).
 */
export async function GET() {
  try {
    const supabase = createPipelineClient();

    const { data: runs, error } = await supabase
      .from('import_runs')
      .select(
        'id, nursery_id, status, source_type, source_url, started_at, completed_at, duration_ms, rows_total, rows_resolved, rows_unmatched, rows_errored, scraper_version'
      )
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      return apiError(
        'DB_ERROR',
        `Failed to fetch import runs: ${error.message}`,
        500
      );
    }

    return apiSuccess(runs, { total: runs?.length ?? 0 });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
