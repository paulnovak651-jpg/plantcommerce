// ============================================================================
// Pipeline Structured Logger
// Outputs JSON log lines for Vercel's native structured log ingestion.
// ============================================================================

type LogLevel = 'info' | 'warn' | 'error';

interface PipelineLogEntry {
  level: LogLevel;
  event: string;
  ts: string;
  [key: string]: unknown;
}

/**
 * Emit a structured JSON log line for pipeline events.
 * Vercel captures structured JSON logs natively — no external service needed.
 *
 * @param level - Log severity
 * @param event - Machine-readable event name (e.g., 'scrape_start', 'resolve_complete')
 * @param data - Arbitrary structured data to include
 */
export function pipelineLog(
  level: LogLevel,
  event: string,
  data: Record<string, unknown> = {}
): void {
  const entry: PipelineLogEntry = {
    level,
    event,
    ts: new Date().toISOString(),
    ...data,
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(entry));
      break;
    case 'warn':
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

/**
 * Cap an array of error samples to a maximum count.
 * Keeps first N errors to avoid bloating the import_runs row.
 */
export function capErrorSamples(
  errors: Array<{ product: string; error: string }>,
  max: number = 20
): Array<{ product: string; error: string }> {
  return errors.slice(0, max);
}

/** Current scraper version tag */
export const SCRAPER_VERSION = '0.1.0';
