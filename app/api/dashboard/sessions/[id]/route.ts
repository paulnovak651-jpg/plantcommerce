import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/dashboard/sessions/[id]
 * End or update a session. Call this when work is complete or on graceful exit.
 * Protected by ADMIN_STATUS_SECRET bearer token (fallback: CRON_SECRET).
 *
 * Body: { status?, summary?, task_id? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: 'active' | 'completed' | 'dropped';
      summary?: string;
      task_id?: string | null;
    };

    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('agent_sessions')
      .update({
        ...(body.status && { status: body.status }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.task_id !== undefined && { task_id: body.task_id }),
        last_seen_at: now,
        ...(body.status && body.status !== 'active' && {
          ended_at: now,
        }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return apiError('DB_ERROR', error.message, 500);
    return apiSuccess(data);
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
