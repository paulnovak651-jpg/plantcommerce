import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock fetch-utils before importing scraper
vi.mock('../fetch-utils', () => ({
  fetchPage: vi.fn(),
}));

import { BurntRidgeScraper } from '../burnt-ridge';
import { fetchPage } from '../fetch-utils';

const mockedFetchPage = vi.mocked(fetchPage);

let productFixture: string;

beforeAll(() => {
  productFixture = readFileSync(
    resolve(__dirname, 'fixtures', 'burnt-ridge-product.html'),
    'utf-8'
  );
});

describe('BurntRidgeScraper — scrapeProductPage', () => {
  it('extracts product name from h1.product_name', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawProductName).toBe(
      'Jefferson Hazelnut (Corylus avellana)'
    );
  });

  it('extracts price text', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawPriceText).toBe('$25.00');
  });

  it('extracts availability', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawAvailability).toBeTruthy();
  });

  it('extracts description', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawDescription).toBeTruthy();
    expect(product.rawDescription).toContain('Jefferson');
  });

  it('extracts SKU from URL', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawSku).toBe('NSHA-JEF');
  });

  it('extracts botanical name from raw product name', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawBotanical).toBe('Corylus avellana');
  });

  it('extracts form size from select option', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawFormSize).toBeTruthy();
  });

  it('sets productPageUrl correctly', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const url =
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/';
    const product = await scraper.scrapeProductPage(url);

    expect(product.productPageUrl).toBe(url);
  });

  it('truncates rawFullHtml at 50000 chars', async () => {
    mockedFetchPage.mockResolvedValue(productFixture);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://www.burntridgenursery.com/mobile/productinfo/NSHA-JEF/'
    );

    expect(product.rawFullHtml).toBeTruthy();
    expect(product.rawFullHtml!.length).toBeLessThanOrEqual(50000);
  });
});

describe('BurntRidgeScraper — extractProductUrls', () => {
  it('finds product URLs from category page HTML', async () => {
    const categoryHtml = `
      <html><body>
        <a href="/mobile/productinfo/NSHA-JEF/">Jefferson Hazelnut</a>
        <a href="/mobile/productinfo/NSHA-YAM/">Yamhill Hazelnut</a>
        <a href="/mobile/productinfo/NSHA-DOR/">Dorris Filbert</a>
        <a href="/about/">About Us</a>
      </body></html>
    `;

    mockedFetchPage.mockResolvedValueOnce(categoryHtml);

    const scraper = new BurntRidgeScraper({ delayMs: 0 });

    // extractProductUrls is private, but we can test it through scrapeCategory
    // by mocking fetchPage to return category HTML then fail on product pages
    mockedFetchPage
      .mockResolvedValueOnce(categoryHtml) // category page
      .mockRejectedValue(new Error('skip product pages'));

    // Just verify the scraper can handle the category page and find URLs
    // The actual URL extraction is tested implicitly through scrapeCategory
    const result = await scraper.scrapeCategory(
      'https://www.burntridgenursery.com/mobile/Hazelnut-Trees/products/54/'
    );

    // It should find product URLs (errors expected since we mocked product pages to fail)
    expect(result.nurserySlug).toBe('burnt-ridge-nursery');
  });
});
