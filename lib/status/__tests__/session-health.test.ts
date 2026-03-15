import { describe, expect, it } from 'vitest';

import {
  SESSION_STALE_AFTER_MS,
  getSessionLastSeenAt,
  isSessionDropped,
} from '@/lib/status/session-health';

describe('session health', () => {
  it('falls back to started_at when last_seen_at is missing', () => {
    expect(
      getSessionLastSeenAt({
        status: 'active',
        started_at: '2026-03-14T00:00:00.000Z',
        last_seen_at: null,
      })
    ).toBe('2026-03-14T00:00:00.000Z');
  });

  it('does not mark active sessions dropped before the stale threshold', () => {
    const now = Date.parse('2026-03-14T12:00:00.000Z');

    expect(
      isSessionDropped(
        {
          status: 'active',
          started_at: '2026-03-14T09:00:00.000Z',
          last_seen_at: '2026-03-14T11:50:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('marks active sessions dropped after the stale threshold', () => {
    const now = Date.parse('2026-03-14T12:00:00.000Z');
    const staleSeenAt = new Date(now - SESSION_STALE_AFTER_MS - 1).toISOString();

    expect(
      isSessionDropped(
        {
          status: 'active',
          started_at: '2026-03-14T09:00:00.000Z',
          last_seen_at: staleSeenAt,
        },
        now
      )
    ).toBe(true);
  });

  it('never marks completed sessions as dropped', () => {
    const now = Date.parse('2026-03-14T12:00:00.000Z');

    expect(
      isSessionDropped(
        {
          status: 'completed',
          started_at: '2026-03-14T09:00:00.000Z',
          last_seen_at: '2026-03-14T09:05:00.000Z',
        },
        now
      )
    ).toBe(false);
  });
});
