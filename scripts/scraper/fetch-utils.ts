// ============================================================================
// Fetch utilities for scraping
// Handles rate limiting, retries, and user-agent rotation
// ============================================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

/**
 * Fetch a URL with polite scraping behavior:
 * - Randomized user-agent
 * - Configurable delay between requests
 * - Retry with exponential backoff
 * - Timeout protection
 */
export async function fetchPage(
  url: string,
  options: {
    delayMs?: number;
    maxRetries?: number;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const { delayMs = 1500, maxRetries = 3, timeoutMs = 15000 } = options;

  // Polite delay
  if (delayMs > 0) {
    await sleep(delayMs + Math.random() * 500);
  }

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts: ${err}`);
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  throw new Error('Unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
