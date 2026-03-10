import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/status/summary', () => ({
  getStatusSummary: vi.fn(),
}));

import { getStatusSummary } from '@/lib/status/summary';
import { GET as publicStatusGET } from '@/app/api/status/route';
import { GET as adminStatusGET } from '@/app/api/admin/status/route';

function mockRequest(url = 'http://localhost/api/status'): Request {
  return new Request(url, { headers: { 'x-forwarded-for': '127.0.0.1' } });
}

const mockedGetStatusSummary = vi.mocked(getStatusSummary);

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_STATUS_SECRET',
  'CRON_SECRET',
] as const;

type EnvKey = (typeof ENV_KEYS)[number];
let envBackup: Partial<Record<EnvKey, string | undefined>> = {};

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = envBackup[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

beforeEach(() => {
  envBackup = {};
  for (const key of ENV_KEYS) {
    envBackup[key] = process.env[key];
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.ADMIN_STATUS_SECRET = 'admin-secret';
  process.env.CRON_SECRET = 'cron-secret';
  mockedGetStatusSummary.mockReset();
});

afterEach(() => {
  restoreEnv();
});

describe('/api/status', () => {
  it('returns 503 when required Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const response = await publicStatusGET(mockRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('SERVER_MISCONFIG');
  });

  it('returns public status summary when configured', async () => {
    mockedGetStatusSummary.mockResolvedValue({
      app: 'plantcommerce',
      env: 'test',
      git_sha: null,
      time_utc: '2026-01-01T00:00:00.000Z',
      counts: {
        inventory_offers: 18,
        nurseries: 10,
        unmatched_pending: 1,
      },
      pipeline: {
        last_import_run: null,
      },
      dashboard: {
        tasks: null,
        sessions: null,
      },
    });

    const response = await publicStatusGET(mockRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.app).toBe('plantcommerce');
    expect(body.links.self).toBe('/api/status');
    expect(mockedGetStatusSummary).toHaveBeenCalledTimes(1);
  });
});

describe('/api/admin/status', () => {
  it('returns 401 when bearer token is missing', async () => {
    const request = new Request('http://localhost:3000/api/admin/status');
    const response = await adminStatusGET(request as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with valid ADMIN_STATUS_SECRET bearer token', async () => {
    mockedGetStatusSummary.mockResolvedValue({
      app: 'plantcommerce',
      env: 'test',
      git_sha: 'abc',
      time_utc: '2026-01-01T00:00:00.000Z',
      counts: {
        inventory_offers: 18,
        nurseries: 10,
        unmatched_pending: 1,
      },
      pipeline: {
        last_import_run: null,
      },
      dashboard: {
        tasks: null,
        sessions: null,
      },
    });

    const request = new Request('http://localhost:3000/api/admin/status', {
      headers: { Authorization: 'Bearer admin-secret' },
    });
    const response = await adminStatusGET(request as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.links.self).toBe('/api/admin/status');
    expect(mockedGetStatusSummary).toHaveBeenCalledTimes(1);
  });

  it('falls back to CRON_SECRET when ADMIN_STATUS_SECRET is unset', async () => {
    delete process.env.ADMIN_STATUS_SECRET;
    mockedGetStatusSummary.mockResolvedValue({
      app: 'plantcommerce',
      env: 'test',
      git_sha: null,
      time_utc: '2026-01-01T00:00:00.000Z',
      counts: {
        inventory_offers: 0,
        nurseries: 0,
        unmatched_pending: 0,
      },
      pipeline: {
        last_import_run: null,
      },
      dashboard: {
        tasks: null,
        sessions: null,
      },
    });

    const request = new Request('http://localhost:3000/api/admin/status', {
      headers: { Authorization: 'Bearer cron-secret' },
    });
    const response = await adminStatusGET(request as unknown as NextRequest);

    expect(response.status).toBe(200);
  });
});

