import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCronAuth } from '@/lib/pipeline/auth';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/dashboard/tasks/[id]
 * Update a task's status, assigned agent, or notes.
 * Protected by CRON_SECRET bearer token.
 *
 * Body: { status?, assigned_agent?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireCronAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: 'todo' | 'in_progress' | 'done' | 'blocked';
      assigned_agent?: string | null;
      notes?: string | null;
    };

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...(body.status && { status: body.status }),
        ...(body.assigned_agent !== undefined && { assigned_agent: body.assigned_agent }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status === 'done' && { completed_at: new Date().toISOString() }),
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
