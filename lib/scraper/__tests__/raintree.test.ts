import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../fetch-utils', () => ({
  fetchPage: vi.fn(),
}));

import { RaintreeScraper } from '../raintree';
import { fetchPage } from '../fetch-utils';

const mockedFetchPage = vi.mocked(fetchPage);

let categoryFixture: string;
let productFixture: string;
let soldOutFixture: string;

beforeAll(() => {
  categoryFixture = readFileSync(
    resolve(__dirname, 'fixtures', 'raintree-category.html'),
    'utf-8'
  );
  productFixture = readFileSync(
    resolve(__dirname, 'fixtures', 'raintree-product.html'),
    'utf-8'
  );
  soldOutFixture = readFileSync(
    resolve(__dirname, 'fixtures', 'raintree-product-sold-out.html'),
    'utf-8'
  );
});

describe('RaintreeScraper', () => {
  it('scrapes category products and enriches from product pages', async () => {
    mockedFetchPage
      .mockResolvedValueOnce(categoryFixture)
      .mockResolvedValueOnce(productFixture);

    const scraper = new RaintreeScraper({ delayMs: 0 });
    const result = await scraper.scrapeCategory();

    expect(result.nurserySlug).toBe('raintree-nursery');
    expect(result.errors).toHaveLength(0);
    expect(result.products).toHaveLength(1);

    const first = result.products[0];
    expect(first.rawProductName).toBe('Polly O Filbert');
    expect(first.productPageUrl).toBe(
      'https://raintreenursery.com/collections/hazelnuts/products/polly-o-filbert'
    );
    expect(first.rawPriceText).toBe('$36.99 - $39.99');
    expect(first.rawAvailability).toBe('Partially In Stock (1/2 variants)');
    expect(first.rawFormSize).toBe('2 Quart Pot');
    expect(first.rawSku).toBe('K020');
    expect(first.rawBotanical).toBe('Corylus avellana');
  });

  it('marks sold-out products when all variants are unavailable', async () => {
    mockedFetchPage.mockResolvedValue(soldOutFixture);

    const scraper = new RaintreeScraper({ delayMs: 0 });
    const product = await scraper.scrapeProductPage(
      'https://raintreenursery.com/collections/hazelnuts/products/sold-out-sample'
    );

    expect(product.rawAvailability).toBe('Sold Out');
    expect(product.rawFormSize).toBe('1 Gallon Pot');
    expect(product.rawSku).toBe('K099');
    expect(product.rawPriceText).toBe('$42.00');
  });
});
