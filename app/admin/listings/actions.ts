'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export async function updateListingStatusAction(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const token = formData.get('token') as string;
  const modReason = (formData.get('mod_reason') as string | null) || null;

  const secret = process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;
  if (!secret || token !== secret) return;

  const validStatuses = new Set(['pending', 'approved', 'rejected', 'expired']);
  if (!validStatuses.has(status)) return;

  const supabase = createServiceClient();
  await supabase
    .from('community_listings')
    .update({ status, mod_reason: modReason })
    .eq('id', id);

  revalidatePath('/admin/listings');
}
