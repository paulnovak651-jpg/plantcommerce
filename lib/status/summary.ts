import { createServiceClient } from '@/lib/supabase/server';
import { isSessionDropped } from '@/lib/status/session-health';

interface ImportRunSummary {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  rows_total: number | null;
  rows_resolved: number | null;
  rows_unmatched: number | null;
}

interface SessionRow {
  status: string;
  started_at: string;
  last_seen_at: string | null;
}

interface TaskSummary {
  todo: number | null;
  in_progress: number | null;
  blocked: number | null;
  done: number | null;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function countRows(
  supabase: ServiceClient,
  table: string,
  filter?: { column: string; value: string | number | boolean }
): Promise<number | null> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.column, filter.value);

  const { count, error } = await query;
  if (error) return null;
  return count ?? 0;
}

async function getTaskSummary(supabase: ServiceClient): Promise<TaskSummary | null> {
  const [todo, inProgress, blocked, done] = await Promise.all([
    countRows(supabase, 'tasks', { column: 'status', value: 'todo' }),
    countRows(supabase, 'tasks', { column: 'status', value: 'in_progress' }),
    countRows(supabase, 'tasks', { column: 'status', value: 'blocked' }),
    countRows(supabase, 'tasks', { column: 'status', value: 'done' }),
  ]);

  if ([todo, inProgress, blocked, done].every((v) => v === null)) {
    return null;
  }

  return {
    todo,
    in_progress: inProgress,
    blocked,
    done,
  };
}

async function getSessionSummary(
  supabase: ServiceClient
): Promise<{ active: number; dropped: number } | null> {
  const { data, error } = await supabase
    .from('agent_sessions')
    .select('status, started_at, last_seen_at')
    .eq('status', 'active');

  if (error) return null;

  const sessions = (data ?? []) as SessionRow[];
  const dropped = sessions.filter((s) => isSessionDropped(s)).length;

  return {
    active: sessions.length,
    dropped,
  };
}

async function getLatestImportRun(
  supabase: ServiceClient
): Promise<ImportRunSummary | null> {
  const { data, error } = await supabase
    .from('import_runs')
    .select(
      'id, started_at, completed_at, status, rows_total, rows_resolved, rows_unmatched'
    )
    .order('started_at', { ascending: false })
    .limit(1);

  if (error) return null;
  return ((data ?? [])[0] as ImportRunSummary | undefined) ?? null;
}

export async function getStatusSummary() {
  const supabase = createServiceClient();

  const [
    inventoryOffers,
    nurseries,
    unmatchedPending,
    tasks,
    sessions,
    lastImportRun,
  ] = await Promise.all([
    countRows(supabase, 'inventory_offers'),
    countRows(supabase, 'nurseries'),
    countRows(supabase, 'unmatched_names', {
      column: 'review_status',
      value: 'pending',
    }),
    getTaskSummary(supabase),
    getSessionSummary(supabase),
    getLatestImportRun(supabase),
  ]);

  return {
    app: 'plantcommerce',
    env: process.env.VERCEL_ENV ?? (process.env.NODE_ENV || 'local'),
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    time_utc: new Date().toISOString(),
    counts: {
      inventory_offers: inventoryOffers,
      nurseries,
      unmatched_pending: unmatchedPending,
    },
    pipeline: {
      last_import_run: lastImportRun,
    },
    dashboard: {
      tasks,
      sessions,
    },
  };
}
