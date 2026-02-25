import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('../fetch-utils', () => ({
  fetchPage: vi.fn(),
}));

import { GrimoScraper } from '../grimo';
import { fetchPage } from '../fetch-utils';

const mockedFetchPage = vi.mocked(fetchPage);

let categoryFixture: string;

beforeAll(() => {
  categoryFixture = readFileSync(
    resolve(__dirname, 'fixtures', 'grimo-hazelnut-category.html'),
    'utf-8'
  );
});

describe('GrimoScraper', () => {
  it('extracts per-size offers from category content', async () => {
    mockedFetchPage.mockResolvedValue(categoryFixture);

    const scraper = new GrimoScraper({ delayMs: 0 });
    const result = await scraper.scrapeCategory(
      'https://www.grimonut.com/index.php?category=Hazelnut&p=Products'
    );

    expect(result.nurserySlug).toBe('grimo-nut-nursery');
    expect(result.products).toHaveLength(4);

    const first = result.products[0];
    expect(first.rawProductName).toBe("'Gene' Hazel Layer");
    expect(first.rawPriceText).toBe('$20.50');
    expect(first.rawAvailability).toBe('In Stock');
    expect(first.rawFormSize).toBe(`45-100 cm (18"-3')`);
  });

  it('marks sold-out lines as Sold Out and keeps null price when absent', async () => {
    mockedFetchPage.mockResolvedValue(categoryFixture);

    const scraper = new GrimoScraper({ delayMs: 0 });
    const result = await scraper.scrapeCategory(
      'https://www.grimonut.com/index.php?category=Hazelnut&p=Products'
    );

    const soldOut = result.products.find((p) =>
      p.rawFormSize?.includes(`150-240 cm (5-8')`)
    );

    expect(soldOut).toBeTruthy();
    expect(soldOut?.rawAvailability).toBe('Sold Out');
    expect(soldOut?.rawPriceText).toBeNull();
  });

  it('creates stable per-offer fragment URLs', async () => {
    mockedFetchPage.mockResolvedValue(categoryFixture);

    const scraper = new GrimoScraper({ delayMs: 0 });
    const result = await scraper.scrapeCategory(
      'https://www.grimonut.com/index.php?category=Hazelnut&p=Products'
    );

    expect(result.products.every((p) => p.productPageUrl.includes('#'))).toBe(
      true
    );
  });
});
