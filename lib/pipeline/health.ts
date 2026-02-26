export interface ScraperHealth {
  nurserySlug: string;
  nurseryName: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunResolveRate: number | null;
  daysSinceLastRun: number | null;
  alerts: string[];
}

export interface HealthResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  scrapers: ScraperHealth[];
  registeredButNeverRun: string[];
}

export interface ScraperHealthInput {
  nurserySlug: string;
  nurseryName: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunRowsTotal: number | null;
  lastRunRowsResolved: number | null;
  lastRunRowsErrored: number | null;
  lastCompletedAt: string | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALE_DAYS_THRESHOLD = 10;
const LOW_RESOLVE_THRESHOLD = 0.5;

function toDaysSince(iso: string, now: Date): number | null {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.floor((now.getTime() - time) / MS_PER_DAY);
}

function formatResolveRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function isCriticalAlert(alert: string): boolean {
  return (
    alert.includes('not been scraped') ||
    alert.includes('zero products') ||
    alert.includes('No import runs recorded')
  );
}

function buildScraperHealth(
  input: ScraperHealthInput,
  now: Date
): ScraperHealth {
  const alerts: string[] = [];

  const daysSinceLastRun = input.lastCompletedAt
    ? toDaysSince(input.lastCompletedAt, now)
    : null;

  if (!input.lastRunAt) {
    alerts.push('No import runs recorded for this nursery');
  }

  if (daysSinceLastRun !== null && daysSinceLastRun >= STALE_DAYS_THRESHOLD) {
    alerts.push(`Nursery has not been scraped in ${daysSinceLastRun} days`);
  }

  const rowsTotal = input.lastRunRowsTotal;
  const rowsResolved = input.lastRunRowsResolved;
  const rowsErrored = input.lastRunRowsErrored ?? 0;

  let lastRunResolveRate: number | null = null;
  if (rowsTotal !== null && rowsResolved !== null && rowsTotal > 0) {
    lastRunResolveRate = rowsResolved / rowsTotal;
  }

  if (rowsTotal === 0) {
    alerts.push('Last run returned zero products - scraper may be broken');
  }

  if (
    lastRunResolveRate !== null &&
    lastRunResolveRate < LOW_RESOLVE_THRESHOLD
  ) {
    alerts.push(
      `Low resolution rate (${formatResolveRate(lastRunResolveRate)}) - parser may need updates`
    );
  }

  if (rowsErrored > 0) {
    alerts.push(`Last run had ${rowsErrored} errors`);
  }

  return {
    nurserySlug: input.nurserySlug,
    nurseryName: input.nurseryName,
    lastRunAt: input.lastRunAt,
    lastRunStatus: input.lastRunStatus,
    lastRunResolveRate,
    daysSinceLastRun,
    alerts,
  };
}

export function evaluateScraperHealth(
  inputs: ScraperHealthInput[],
  now: Date = new Date()
): HealthResponse {
  const scrapers = inputs.map((input) => buildScraperHealth(input, now));
  const registeredButNeverRun = scrapers
    .filter((scraper) => scraper.lastRunAt === null)
    .map((scraper) => scraper.nurserySlug);

  const hasAnyAlerts = scrapers.some((scraper) => scraper.alerts.length > 0);
  const hasCritical = scrapers.some((scraper) =>
    scraper.alerts.some((alert) => isCriticalAlert(alert))
  );

  const overall: HealthResponse['overall'] = hasCritical
    ? 'unhealthy'
    : hasAnyAlerts
      ? 'degraded'
      : 'healthy';

  return {
    overall,
    scrapers,
    registeredButNeverRun,
  };
}
