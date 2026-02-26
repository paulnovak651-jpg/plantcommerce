import { apiError, apiSuccess } from '@/lib/api-helpers';
import { getStatusSummary } from '@/lib/status/summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/status
 * Public, read-only status summary for integrations (ChatGPT, monitoring, etc.).
 */
export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return apiError('SERVER_MISCONFIG', 'Missing Supabase environment', 503);
    }

    const summary = await getStatusSummary();
    return apiSuccess(summary, undefined, { self: '/api/status' });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}

