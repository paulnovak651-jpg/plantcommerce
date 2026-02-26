import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';
import { createServiceClient } from '@/lib/supabase/server';
import {
  normalizeReviewerNotes,
  parseResolvedType,
  parseReviewStatus,
} from '@/lib/unmatched/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/unmatched/[id]
 * Protected update endpoint for unmatched review outcomes.
 * Body: { review_status?, reviewer_notes?, resolved_to_type?, resolved_to_id? }
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
      review_status?: string;
      reviewer_notes?: string | null;
      resolved_to_type?: string | null;
      resolved_to_id?: string | null;
    };

    const reviewStatus = parseReviewStatus(body.review_status ?? null);
    if (!reviewStatus) {
      return apiError(
        'BAD_REQUEST',
        'review_status must be one of: pending, resolved, ignored',
        400
      );
    }

    const resolvedToType = parseResolvedType(body.resolved_to_type ?? null);
    const resolvedToId =
      typeof body.resolved_to_id === 'string' && body.resolved_to_id.trim()
        ? body.resolved_to_id.trim()
        : null;
    const reviewerNotes = normalizeReviewerNotes(body.reviewer_notes);

    if (reviewStatus === 'resolved' && (!resolvedToType || !resolvedToId)) {
      return apiError(
        'BAD_REQUEST',
        'resolved status requires resolved_to_type and resolved_to_id',
        400
      );
    }

    const supabase = createServiceClient();
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

    const { data, error } = await supabase
      .from('unmatched_names')
      .update(patch)
      .eq('id', id)
      .select(
        'id, raw_product_name, parsed_core_name, review_status, resolved_to_type, resolved_to_id, reviewed_at, reviewer_notes'
      )
      .single();

    if (error) return apiError('DB_ERROR', error.message, 500);
    return apiSuccess(data, undefined, { self: `/api/admin/unmatched/${id}` });
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
