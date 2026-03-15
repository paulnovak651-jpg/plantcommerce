import { apiSuccess } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ready
 * Lightweight local readiness probe for repo scripts.
 */
export async function GET() {
  return apiSuccess(
    {
      app: 'plantcommerce',
      ready: true,
      time_utc: new Date().toISOString(),
    },
    undefined,
    { self: '/api/ready' }
  );
}

