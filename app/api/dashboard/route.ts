import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * Returns full Command Center state: tasks + sessions.
 * Requires admin auth.
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = createServiceClient();

    const [{ data: tasks, error: tasksError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .order('priority', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('agent_sessions')
          .select('id, agent, project, task_id, started_at, ended_at, status, summary, tasks(title)')
          .order('started_at', { ascending: false })
          .limit(30),
      ]);

    if (tasksError) return apiError('DB_ERROR', tasksError.message, 500);
    if (sessionsError) return apiError('DB_ERROR', sessionsError.message, 500);

    type SessionRow = { status: string; started_at: string; [key: string]: unknown };
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();
    const activeSessions = (sessions ?? []).filter((s: SessionRow) => s.status === 'active');
    const droppedSessions = activeSessions.filter(
      (s: SessionRow) => now - new Date(s.started_at).getTime() > ONE_HOUR_MS
    );

    return apiSuccess({
      tasks: tasks ?? [],
      activeSessions,
      droppedSessions,
      recentSessions: sessions ?? [],
    });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
