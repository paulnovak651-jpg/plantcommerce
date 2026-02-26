#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface CliArgs {
  slug: string;
  className: string;
  nurseryName: string;
  categoryUrl: string;
  baseUrl: string;
  fileStem: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const kv = new Map<string, string>();
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    if (token === '--dry-run') {
      dryRun = true;
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    kv.set(key, value);
    i++;
  }

  const slug = kv.get('slug') ?? '';
  const className = kv.get('class') ?? '';
  const nurseryName = kv.get('name') ?? '';
  const categoryUrl = kv.get('category-url') ?? '';
  const baseUrl =
    kv.get('base-url') ?? (categoryUrl ? new URL(categoryUrl).origin : '');

  if (!slug || !className || !nurseryName || !categoryUrl) {
    throw new Error(
      'Usage: npm run scraper:new -- --slug <slug> --class <ClassName> --name "<Nursery Name>" --category-url <url> [--base-url <url>] [--dry-run]'
    );
  }

  const fileStem = kv.get('file') ?? slug;

  return {
    slug,
    className,
    nurseryName,
    categoryUrl,
    baseUrl,
    fileStem,
    dryRun,
  };
}

function escapeTsTemplate(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

function buildScraperFile(args: CliArgs): string {
  const slug = escapeTsTemplate(args.slug);
  const className = escapeTsTemplate(args.className);
  const nurseryName = escapeTsTemplate(args.nurseryName);
  const baseUrl = escapeTsTemplate(args.baseUrl);
  const categoryUrl = escapeTsTemplate(args.categoryUrl);

  return `import * as cheerio from 'cheerio';
import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

const BASE_URL = '${baseUrl}';
const DEFAULT_CATEGORY_URL = '${categoryUrl}';

/**
 * ${className}
 * TODO:
 * 1) Replace CSS selectors in extractProductCards.
 * 2) Populate all ScrapedProduct fields in parseProductCard.
 * 3) Add pagination handling if nursery category has multiple pages.
 */
export class ${className} implements NurseryScraper {
  nurserySlug = '${slug}';
  nurseryName = '${nurseryName}';

  private delayMs: number;

  constructor(options: { delayMs?: number } = {}) {
    this.delayMs = options.delayMs ?? 2000;
  }

  async scrapeCategory(categoryUrl: string = DEFAULT_CATEGORY_URL): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl: categoryUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };

    try {
      const html = await fetchPage(categoryUrl, { delayMs: 0 });
      const $ = cheerio.load(html);
      const cards = this.extractProductCards($);

      result.products = cards.map((card, idx) => this.parseProductCard(card, categoryUrl, idx));
    } catch (err) {
      result.errors.push(\`Category scrape failed: \${String(err)}\`);
    }

    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const html = await fetchPage(productUrl, { delayMs: this.delayMs });
    const $ = cheerio.load(html);
    const cards = this.extractProductCards($);

    if (cards.length === 0) {
      throw new Error(\`No product cards found at \${productUrl}\`);
    }

    return this.parseProductCard(cards[0], productUrl, 0);
  }

  private extractProductCards($: cheerio.CheerioAPI): string[] {
    // Replace selector with nursery-specific product card/container selector.
    return $('.product, .product-item, .product-card')
      .map((_, el) => $.html(el))
      .get()
      .filter(Boolean);
  }

  private parseProductCard(
    productHtml: string,
    sourceUrl: string,
    index: number
  ): ScrapedProduct {
    const $ = cheerio.load(productHtml);

    // TODO: tune selectors for the target nursery HTML.
    const rawProductName =
      this.cleanText($('h1, h2, h3, .product-name, [itemprop="name"]').first().text()) ||
      \`UNKNOWN-\${index + 1}\`;

    const href = $('a[href]').first().attr('href') ?? '';
    const productPageUrl = href
      ? new URL(href, BASE_URL || sourceUrl).toString()
      : \`\${sourceUrl}#\${encodeURIComponent(rawProductName)}\`;

    const rawDescription =
      this.cleanText($('.description, .product-description, [itemprop="description"]').first().text()) ||
      null;

    const rawPriceText =
      this.cleanText($('.price, [itemprop="price"]').first().text()) ||
      null;

    const rawAvailability =
      this.cleanText($('.availability, .stock, [itemprop="availability"]').first().text()) ||
      null;

    const rawFormSize = this.cleanText($('.size, .form, .variant').first().text()) || null;

    return {
      rawProductName,
      rawDescription: rawDescription?.slice(0, 2000) ?? null,
      rawPriceText,
      rawAvailability,
      rawFormSize,
      rawSku: null,
      productPageUrl,
      rawCategory: null,
      rawBotanical: this.extractBotanical(rawProductName),
      rawFullHtml: productHtml.slice(0, 50000),
    };
  }

  private extractBotanical(name: string): string | null {
    const match = name.match(/\\(([A-Z][a-z]+\\s+[a-z][a-z-]+(?:\\s+[a-z][a-z-]+)?)\\)/);
    return match?.[1]?.trim() ?? null;
  }

  private cleanText(text: string): string {
    return text.replace(/\\0/g, '').replace(/\\s+/g, ' ').trim();
  }
}
`;
}

function buildTestFile(args: CliArgs): string {
  const className = escapeTsTemplate(args.className);
  const fileStem = escapeTsTemplate(args.fileStem);
  const slug = escapeTsTemplate(args.slug);

  return `import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../fetch-utils', () => ({
  fetchPage: vi.fn(),
}));

import { ${className} } from '../${fileStem}';
import { fetchPage } from '../fetch-utils';

const mockedFetchPage = vi.mocked(fetchPage);

let categoryFixture: string;

beforeAll(() => {
  categoryFixture = readFileSync(
    resolve(__dirname, 'fixtures', '${fileStem}-category.html'),
    'utf-8'
  );
});

describe('${className}', () => {
  it('returns a scrape result envelope', async () => {
    mockedFetchPage.mockResolvedValue(categoryFixture);

    const scraper = new ${className}({ delayMs: 0 });
    const result = await scraper.scrapeCategory();

    expect(result.nurserySlug).toBe('${slug}');
    expect(Array.isArray(result.products)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
`;
}

function buildFixtureFile(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Replace With Real Fixture</title>
  </head>
  <body>
    <div class="product-card">
      <h3 class="product-name">Example Plant Name (Corylus avellana)</h3>
      <p class="description">Replace fixture with a real saved category page snippet.</p>
      <span class="price">$19.00</span>
      <span class="availability">In Stock</span>
      <a href="/products/example">View</a>
    </div>
  </body>
</html>
`;
}

function updateScraperIndex(indexSource: string, args: CliArgs): string {
  const exportLine = `export { ${args.className} } from './${args.fileStem}';`;
  const importLine = `import { ${args.className} } from './${args.fileStem}';`;
  const registryLine = `  '${args.slug}': () => new ${args.className}({ delayMs: 2000 }),`;

  let next = indexSource;

  if (!next.includes(exportLine)) {
    const marker = "export type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';";
    if (!next.includes(marker)) {
      throw new Error('Could not find export marker in lib/scraper/index.ts');
    }
    next = next.replace(marker, `${exportLine}\n${marker}`);
  }

  if (!next.includes(importLine)) {
    const marker = "import type { NurseryScraper } from './types';";
    if (!next.includes(marker)) {
      throw new Error('Could not find import marker in lib/scraper/index.ts');
    }
    next = next.replace(marker, `${importLine}\n${marker}`);
  }

  if (!next.includes(registryLine)) {
    const registryStart = "const SCRAPER_REGISTRY: Record<string, ScraperFactory> = {";
    const startIdx = next.indexOf(registryStart);
    if (startIdx === -1) {
      throw new Error('Could not find SCRAPER_REGISTRY in lib/scraper/index.ts');
    }

    const closeIdx = next.indexOf('};', startIdx);
    if (closeIdx === -1) {
      throw new Error('Could not find SCRAPER_REGISTRY end in lib/scraper/index.ts');
    }

    next = `${next.slice(0, closeIdx)}${registryLine}\n${next.slice(closeIdx)}`;
  }

  return next;
}

async function assertDoesNotExist(filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${filePath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();

  const scraperPath = path.join(root, 'lib', 'scraper', `${args.fileStem}.ts`);
  const testPath = path.join(
    root,
    'lib',
    'scraper',
    '__tests__',
    `${args.fileStem}.test.ts`
  );
  const fixturePath = path.join(
    root,
    'lib',
    'scraper',
    '__tests__',
    'fixtures',
    `${args.fileStem}-category.html`
  );
  const indexPath = path.join(root, 'lib', 'scraper', 'index.ts');

  await assertDoesNotExist(scraperPath);
  await assertDoesNotExist(testPath);
  await assertDoesNotExist(fixturePath);

  const indexSource = await readFile(indexPath, 'utf8');
  const nextIndex = updateScraperIndex(indexSource, args);

  if (args.dryRun) {
    console.log('[dry-run] Would create:');
    console.log(`  ${scraperPath}`);
    console.log(`  ${testPath}`);
    console.log(`  ${fixturePath}`);
    console.log('[dry-run] Would update:');
    console.log(`  ${indexPath}`);
    return;
  }

  await mkdir(path.dirname(scraperPath), { recursive: true });
  await mkdir(path.dirname(testPath), { recursive: true });
  await mkdir(path.dirname(fixturePath), { recursive: true });

  await writeFile(scraperPath, buildScraperFile(args), 'utf8');
  await writeFile(testPath, buildTestFile(args), 'utf8');
  await writeFile(fixturePath, buildFixtureFile(), 'utf8');
  await writeFile(indexPath, nextIndex, 'utf8');

  console.log('Created new scraper scaffold:');
  console.log(`  ${scraperPath}`);
  console.log(`  ${testPath}`);
  console.log(`  ${fixturePath}`);
  console.log(`Updated registry: ${indexPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('1) Replace selectors and parsing logic in scraper file.');
  console.log('2) Replace fixture with real saved HTML from target category.');
  console.log('3) Expand tests to assert field extraction.');
  console.log('4) Run: npm test');
  console.log(
    `5) Validate pipeline route: /api/pipeline/scrape?nursery=${args.slug}`
  );
}

main().catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(1);
});
