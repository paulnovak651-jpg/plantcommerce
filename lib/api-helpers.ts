import { NextResponse } from 'next/server';

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
  links?: Record<string, string>;
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiEnvelope<T>['meta'],
  links?: Record<string, string>
) {
  return NextResponse.json({
    ok: true,
    data,
    meta,
    links,
  } satisfies ApiEnvelope<T>);
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code, message } } satisfies ApiEnvelope<never>,
    { status }
  );
}

export function apiNotFound(entity: string) {
  return apiError('NOT_FOUND', `${entity} not found`, 404);
}
