import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-helpers';

describe('API envelope — apiSuccess', () => {
  it('returns ok: true with data', async () => {
    const response = apiSuccess({ name: 'Jefferson' });
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ name: 'Jefferson' });
  });

  it('includes meta when provided', async () => {
    const response = apiSuccess([1, 2, 3], { total: 100, limit: 10, offset: 0 });
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.meta).toEqual({ total: 100, limit: 10, offset: 0 });
  });

  it('includes links when provided', async () => {
    const response = apiSuccess(
      { id: '1' },
      undefined,
      { self: '/api/cultivars/1', collection: '/api/cultivars' }
    );
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.links).toEqual({
      self: '/api/cultivars/1',
      collection: '/api/cultivars',
    });
  });

  it('omits meta and links when not provided', async () => {
    const response = apiSuccess('hello');
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data).toBe('hello');
    // meta and links should be undefined (not present or null)
    expect(body.meta).toBeUndefined();
    expect(body.links).toBeUndefined();
  });

  it('returns HTTP 200', () => {
    const response = apiSuccess({ ok: true });
    expect(response.status).toBe(200);
  });
});

describe('API envelope — apiError', () => {
  it('returns ok: false with error details', async () => {
    const response = apiError('VALIDATION_ERROR', 'Name is required', 400);
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Name is required',
    });
  });

  it('sets correct HTTP status', () => {
    expect(apiError('BAD_REQUEST', 'bad', 400).status).toBe(400);
    expect(apiError('UNAUTHORIZED', 'nope', 401).status).toBe(401);
    expect(apiError('SERVER_ERROR', 'oops', 500).status).toBe(500);
  });

  it('does not include data field', async () => {
    const response = apiError('FAIL', 'failed', 500);
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.data).toBeUndefined();
  });
});

describe('API envelope — apiNotFound', () => {
  it('returns 404 with entity-specific message', async () => {
    const response = apiNotFound('Cultivar');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Cultivar not found');
  });

  it('works for different entity names', async () => {
    const r1 = apiNotFound('Plant Entity');
    const b1 = await r1.json();
    expect(b1.error.message).toBe('Plant Entity not found');

    const r2 = apiNotFound('Nursery');
    const b2 = await r2.json();
    expect(b2.error.message).toBe('Nursery not found');
  });
});
