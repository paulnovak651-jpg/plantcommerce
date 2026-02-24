import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNurseryBySlug,
  getInventoryForNursery,
} from '@/lib/queries/nurseries';
import { apiSuccess, apiNotFound } from '@/lib/api-helpers';

/**
 * GET /api/nurseries/:nurserySlug
 * Nursery detail with current inventory offers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nurserySlug: string }> }
) {
  const { nurserySlug } = await params;
  const supabase = await createClient();
  const nursery = await getNurseryBySlug(supabase, nurserySlug);

  if (!nursery) return apiNotFound('Nursery');

  const inventory = await getInventoryForNursery(supabase, nursery.id);

  return apiSuccess(
    { ...nursery, inventory },
    { total: inventory.length },
    {
      self: `/api/nurseries/${nurserySlug}`,
      list: '/api/nurseries',
    }
  );
}
