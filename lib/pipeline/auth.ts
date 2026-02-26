import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/api-helpers';

export function requireCronAuth(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return {
      ok: false as const,
      response: apiError(
        'SERVER_MISCONFIG',
        'CRON_SECRET is not configured',
        503
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false as const,
      response: apiError('UNAUTHORIZED', 'Invalid authorization', 401),
    };
  }

  return { ok: true as const };
}

/**
 * Admin status auth:
 * - primary secret: ADMIN_STATUS_SECRET
 * - fallback secret: CRON_SECRET
 */
export function requireAdminStatusAuth(request: NextRequest) {
  const adminSecret =
    process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;

  if (!adminSecret) {
    return {
      ok: false as const,
      response: apiError(
        'SERVER_MISCONFIG',
        'ADMIN_STATUS_SECRET or CRON_SECRET is not configured',
        503
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return {
      ok: false as const,
      response: apiError('UNAUTHORIZED', 'Invalid authorization', 401),
    };
  }

  return { ok: true as const };
}
