import { apiError } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Rate-limit wrapper for API route handlers.
 * Returns a 429 response if the limit is exceeded, otherwise calls the handler.
 * Works with both Request and NextRequest handlers.
 */
export function withRateLimit<T extends Request>(
  handler: (request: T, ...args: any[]) => Promise<Response>,
  options: { max?: number; windowMs?: number } = {}
) {
  return async (request: T, ...args: any[]): Promise<Response> => {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const result = checkRateLimit(ip, options);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      const response = apiError(
        'RATE_LIMITED',
        'Too many requests. Please try again later.',
        429
      );
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('Retry-After', String(Math.max(retryAfter, 1)));
      return response;
    }

    const response = await handler(request, ...args);

    if (response.headers) {
      response.headers.set(
        'X-RateLimit-Remaining',
        String(result.remaining)
      );
    }

    return response;
  };
}
