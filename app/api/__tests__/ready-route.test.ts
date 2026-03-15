import { describe, expect, it } from 'vitest';

import { GET as readyGET } from '@/app/api/ready/route';

describe('/api/ready', () => {
  it('returns a lightweight readiness payload', async () => {
    const response = await readyGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.app).toBe('plantcommerce');
    expect(body.data.ready).toBe(true);
    expect(body.links.self).toBe('/api/ready');
  });
});

