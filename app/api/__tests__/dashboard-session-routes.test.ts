import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

vi.mock('@/lib/pipeline/auth', () => ({
  requireAdminStatusAuth: vi.fn(() => ({ ok: true })),
}));

import { POST as createSession } from '@/app/api/dashboard/sessions/route';
import { PATCH as updateSession } from '@/app/api/dashboard/sessions/[id]/route';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';

const mockedRequireAdminStatusAuth = vi.mocked(requireAdminStatusAuth);

describe('/api/dashboard/sessions routes', () => {
  beforeEach(() => {
    fromMock.mockReset();
    mockedRequireAdminStatusAuth.mockReturnValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('writes last_seen_at when creating a session', async () => {
    let insertPayload: Record<string, unknown> | undefined;

    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'session-1' },
      error: null,
    });
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const insertMock = vi.fn((payload: Record<string, unknown>) => {
      insertPayload = payload;
      return { select: selectMock };
    });

    fromMock.mockReturnValue({ insert: insertMock });

    const request = new Request('http://localhost:3000/api/dashboard/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'codex', summary: 'Testing' }),
    });

    const response = await createSession(request as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(insertPayload?.status).toBe('active');
    expect(insertPayload?.last_seen_at).toEqual(expect.any(String));
  });

  it('refreshes last_seen_at without ending the session on active heartbeat PATCH', async () => {
    let updatePayload: Record<string, unknown> | undefined;

    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'session-1' },
      error: null,
    });
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqMock = vi.fn(() => ({ select: selectMock }));
    const updateMock = vi.fn((payload: Record<string, unknown>) => {
      updatePayload = payload;
      return { eq: eqMock };
    });

    fromMock.mockReturnValue({ update: updateMock });

    const request = new Request('http://localhost:3000/api/dashboard/sessions/session-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });

    const response = await updateSession(
      request as unknown as NextRequest,
      { params: Promise.resolve({ id: 'session-1' }) }
    );

    expect(response.status).toBe(200);
    expect(updatePayload?.status).toBe('active');
    expect(updatePayload?.last_seen_at).toEqual(expect.any(String));
    expect(updatePayload?.ended_at).toBeUndefined();
  });

  it('sets ended_at when completing a session', async () => {
    let updatePayload: Record<string, unknown> | undefined;

    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'session-1' },
      error: null,
    });
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqMock = vi.fn(() => ({ select: selectMock }));
    const updateMock = vi.fn((payload: Record<string, unknown>) => {
      updatePayload = payload;
      return { eq: eqMock };
    });

    fromMock.mockReturnValue({ update: updateMock });

    const request = new Request('http://localhost:3000/api/dashboard/sessions/session-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', summary: 'Done' }),
    });

    const response = await updateSession(
      request as unknown as NextRequest,
      { params: Promise.resolve({ id: 'session-1' }) }
    );

    expect(response.status).toBe(200);
    expect(updatePayload?.status).toBe('completed');
    expect(updatePayload?.last_seen_at).toEqual(expect.any(String));
    expect(updatePayload?.ended_at).toEqual(expect.any(String));
  });
});

