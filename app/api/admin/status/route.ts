import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';
import { getStatusSummary } from '@/lib/status/summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/status
 * Protected status summary for admin/automation tooling.
 * Auth: Bearer ADMIN_STATUS_SECRET (fallback: CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return apiError('SERVER_MISCONFIG', 'Missing Supabase environment', 503);
    }

    const summary = await getStatusSummary();
    return apiSuccess(summary, undefined, { self: '/api/admin/status' });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}

