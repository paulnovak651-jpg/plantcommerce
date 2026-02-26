import { describe, expect, it } from 'vitest';
import {
  evaluateScraperHealth,
  type ScraperHealthInput,
} from '@/lib/pipeline/health';

const NOW = new Date('2026-02-26T00:00:00.000Z');

describe('evaluateScraperHealth', () => {
  it('marks never-run scrapers and stale runs as unhealthy', () => {
    const inputs: ScraperHealthInput[] = [
      {
        nurserySlug: 'new-nursery',
        nurseryName: 'New Nursery',
        lastRunAt: null,
        lastRunStatus: null,
        lastRunRowsTotal: null,
        lastRunRowsResolved: null,
        lastRunRowsErrored: null,
        lastCompletedAt: null,
      },
      {
        nurserySlug: 'stale-nursery',
        nurseryName: 'Stale Nursery',
        lastRunAt: '2026-02-10T00:00:00.000Z',
        lastRunStatus: 'completed',
        lastRunRowsTotal: 12,
        lastRunRowsResolved: 12,
        lastRunRowsErrored: 0,
        lastCompletedAt: '2026-02-10T00:00:00.000Z',
      },
    ];

    const output = evaluateScraperHealth(inputs, NOW);

    expect(output.overall).toBe('unhealthy');
    expect(output.registeredButNeverRun).toEqual(['new-nursery']);
    expect(output.scrapers[0].alerts).toContain(
      'No import runs recorded for this nursery'
    );
    expect(output.scrapers[1].alerts).toContain(
      'Nursery has not been scraped in 16 days'
    );
  });

  it('marks low resolution/error cases as degraded', () => {
    const inputs: ScraperHealthInput[] = [
      {
        nurserySlug: 'low-res',
        nurseryName: 'Low Resolve Nursery',
        lastRunAt: '2026-02-25T00:00:00.000Z',
        lastRunStatus: 'completed',
        lastRunRowsTotal: 4,
        lastRunRowsResolved: 1,
        lastRunRowsErrored: 2,
        lastCompletedAt: '2026-02-25T00:00:00.000Z',
      },
    ];

    const output = evaluateScraperHealth(inputs, NOW);

    expect(output.overall).toBe('degraded');
    expect(output.scrapers[0].alerts).toContain(
      'Low resolution rate (25%) - parser may need updates'
    );
    expect(output.scrapers[0].alerts).toContain('Last run had 2 errors');
    expect(output.scrapers[0].lastRunResolveRate).toBe(0.25);
  });

  it('flags zero-product runs as unhealthy', () => {
    const inputs: ScraperHealthInput[] = [
      {
        nurserySlug: 'zero-products',
        nurseryName: 'Zero Products Nursery',
        lastRunAt: '2026-02-25T00:00:00.000Z',
        lastRunStatus: 'completed',
        lastRunRowsTotal: 0,
        lastRunRowsResolved: 0,
        lastRunRowsErrored: 0,
        lastCompletedAt: '2026-02-25T00:00:00.000Z',
      },
    ];

    const output = evaluateScraperHealth(inputs, NOW);

    expect(output.overall).toBe('unhealthy');
    expect(output.scrapers[0].alerts).toContain(
      'Last run returned zero products - scraper may be broken'
    );
  });
});
