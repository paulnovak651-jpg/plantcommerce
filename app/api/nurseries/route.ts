import { createClient } from '@/lib/supabase/server';
import { listNurseries } from '@/lib/queries/nurseries';
import { apiSuccess } from '@/lib/api-helpers';

/**
 * GET /api/nurseries
 * List all active, published nurseries.
 */
export async function GET() {
  const supabase = await createClient();
  const nurseries = await listNurseries(supabase);

  return apiSuccess(nurseries, { total: nurseries.length }, {
    self: '/api/nurseries',
  });
}
