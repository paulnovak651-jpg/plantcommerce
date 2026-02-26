'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import {
  normalizeReviewerNotes,
  parseResolvedType,
  parseReviewStatus,
} from '@/lib/unmatched/admin';

function requireAdminToken(token: string): void {
  const secret = process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('Admin secret is not configured');
  }
  if (token !== secret) {
    throw new Error('Unauthorized admin token');
  }
}

export async function updateUnmatchedAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  requireAdminToken(token);

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing unmatched id');

  const reviewStatus = parseReviewStatus(
    String(formData.get('review_status') ?? '')
  );
  if (!reviewStatus) throw new Error('Invalid review status');

  const reviewerNotes = normalizeReviewerNotes(formData.get('reviewer_notes'));
  const resolvedToType = parseResolvedType(
    String(formData.get('resolved_to_type') ?? '')
  );
  const resolvedToId = String(formData.get('resolved_to_id') ?? '').trim() || null;

  if (reviewStatus === 'resolved' && (!resolvedToType || !resolvedToId)) {
    throw new Error('Resolved entries require resolved type and id');
  }

  const patch: Record<string, unknown> = {
    review_status: reviewStatus,
    reviewer_notes: reviewerNotes,
  };

  if (reviewStatus === 'pending') {
    patch.reviewed_at = null;
    patch.resolved_to_type = null;
    patch.resolved_to_id = null;
  } else {
    patch.reviewed_at = new Date().toISOString();
    patch.resolved_to_type = reviewStatus === 'resolved' ? resolvedToType : null;
    patch.resolved_to_id = reviewStatus === 'resolved' ? resolvedToId : null;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('unmatched_names').update(patch).eq('id', id);
  if (error) {
    throw new Error(`Update failed: ${error.message}`);
  }

  revalidatePath('/admin/unmatched');
}
