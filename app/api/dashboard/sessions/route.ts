import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/dashboard/sessions
 * Register an agent session start. Returns the session id for use in PATCH.
 * Protected by ADMIN_STATUS_SECRET bearer token (fallback: CRON_SECRET).
 *
 * Body: { agent, project?, project_slug?, task_id?, summary?, context_snapshot? }
 */
export async function POST(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      agent: string;
      project?: string;
      project_slug?: string;
      task_id?: string;
      summary?: string;
      context_snapshot?: Record<string, unknown>;
    };

    if (!body.agent?.trim()) {
      return apiError('VALIDATION_ERROR', 'agent is required', 400);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('agent_sessions')
      .insert({
        agent: body.agent,
        project: body.project ?? body.project_slug ?? 'plantcommerce',
        task_id: body.task_id ?? null,
        summary: body.summary ?? null,
        context_snapshot: body.context_snapshot ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) return apiError('DB_ERROR', error.message, 500);
    return apiSuccess(data);
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
