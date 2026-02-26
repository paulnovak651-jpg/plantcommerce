import * as cheerio from 'cheerio';
import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

const BASE_URL = 'https://raintreenursery.com';
const DEFAULT_CATEGORY_URL = 'https://raintreenursery.com/collections/hazelnuts';

interface RaintreeVariant {
  title: string;
  available: boolean;
  sku: string | null;
  priceCents: number | null;
}

export class RaintreeScraper implements NurseryScraper {
  nurserySlug = 'raintree-nursery';
  nurseryName = 'Raintree Nursery';

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
      const productUrls = this.extractProductUrls(html, categoryUrl);

      for (const productUrl of productUrls) {
        try {
          const product = await this.scrapeProductPage(productUrl);
          result.products.push(product);
        } catch (err) {
          result.errors.push(`Failed to scrape ${productUrl}: ${String(err)}`);
        }
      }

      const nextPageUrl = this.extractNextPageUrl(html);
      if (nextPageUrl) {
        const nextResult = await this.scrapeCategory(nextPageUrl);
        result.products.push(...nextResult.products);
        result.errors.push(...nextResult.errors);
      }
    } catch (err) {
      result.errors.push(`Category scrape failed: ${String(err)}`);
    }

    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const html = await fetchPage(productUrl, { delayMs: this.delayMs });
    const $ = cheerio.load(html);
    const rawProductName =
      this.cleanText(
        $('h1.product-title, h1.product_name, h1, .productitem--title')
          .first()
          .text()
      ) ||
      this.cleanText($('title').first().text().split('|')[0]) ||
      'UNKNOWN';

    const rawDescription =
      this.cleanText(
        $('.product-details--description .rte, .product-description .rte, .rte')
          .first()
          .text()
      ) || null;

    const variants = this.extractVariants($);

    const rawPriceText = this.formatPriceText(variants);
    const rawAvailability = this.formatAvailabilityText(variants, $);
    const rawFormSize = this.selectFormSize(variants);
    const rawSku = this.selectSku(variants);

    return {
      rawProductName,
      rawDescription: rawDescription?.slice(0, 2000) ?? null,
      rawPriceText,
      rawAvailability,
      rawFormSize,
      rawSku,
      productPageUrl: productUrl,
      rawCategory: 'Hazelnuts',
      rawBotanical: this.extractBotanical(rawProductName, rawDescription),
      rawFullHtml: html.slice(0, 50000),
    };
  }

  private extractProductUrls(html: string, sourceUrl: string): string[] {
    const $ = cheerio.load(html);
    const urls = new Set<string>();

    $(
      '.productgrid--item a.productitem--image-link, .productgrid--item a[data-product-page-link]'
    ).each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const fullUrl = new URL(href, BASE_URL || sourceUrl).toString();
      if (fullUrl.includes('/products/')) {
        urls.add(fullUrl);
      }
    });

    return [...urls];
  }

  private extractNextPageUrl(html: string): string | null {
    const $ = cheerio.load(html);
    const nextHref =
      $('a[rel="next"]').attr('href') ||
      $('.pagination--next').attr('href') ||
      $('a:contains("Next")').attr('href');

    if (!nextHref) return null;
    return new URL(nextHref, BASE_URL).toString();
  }

  private extractVariants($: cheerio.CheerioAPI): RaintreeVariant[] {
    const scripts = $('script[type="application/json"]')
      .map((_, el) => $(el).html() ?? '')
      .get()
      .filter(Boolean);

    for (const scriptText of scripts) {
      const parsed = this.tryParseJson(scriptText);
      if (!parsed || typeof parsed !== 'object') continue;

      const variantsValue = this.extractVariantsValue(parsed);
      if (!variantsValue) continue;

      return variantsValue
        .map((value) => this.normalizeVariant(value))
        .filter((variant): variant is RaintreeVariant => variant !== null);
    }

    return [];
  }

  private extractVariantsValue(
    parsed: object
  ): unknown[] | null {
    const record = parsed as Record<string, unknown>;

    if (Array.isArray(record.variants)) {
      return record.variants;
    }

    const nestedProduct = record.product;
    if (
      nestedProduct &&
      typeof nestedProduct === 'object' &&
      Array.isArray((nestedProduct as Record<string, unknown>).variants)
    ) {
      return (nestedProduct as Record<string, unknown>).variants as unknown[];
    }

    return null;
  }

  private normalizeVariant(value: unknown): RaintreeVariant | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;

    const title = this.cleanText(String(record.title ?? ''));
    if (!title) return null;

    const available =
      typeof record.available === 'boolean' ? record.available : false;
    const sku = this.cleanText(String(record.sku ?? '')) || null;
    const priceCents = this.toNumber(record.price);

    return {
      title,
      available,
      sku,
      priceCents,
    };
  }

  private formatPriceText(variants: RaintreeVariant[]): string | null {
    const prices = variants
      .map((variant) => variant.priceCents)
      .filter((price): price is number => typeof price === 'number' && price > 0);

    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return this.toUsd(min);
    return `${this.toUsd(min)} - ${this.toUsd(max)}`;
  }

  private formatAvailabilityText(
    variants: RaintreeVariant[],
    $: cheerio.CheerioAPI
  ): string | null {
    if (variants.length === 0) {
      const text = this.cleanText($('body').text()).toLowerCase();
      if (text.includes('sold out')) return 'Sold Out';
      if (text.includes('add to cart')) return 'In Stock';
      return null;
    }

    const availableCount = variants.filter((variant) => variant.available).length;

    if (availableCount === 0) return 'Sold Out';
    if (availableCount === variants.length) return 'In Stock';
    return `Partially In Stock (${availableCount}/${variants.length} variants)`;
  }

  private selectFormSize(variants: RaintreeVariant[]): string | null {
    const firstAvailable = variants.find((variant) => variant.available);
    if (firstAvailable) return firstAvailable.title;
    return variants[0]?.title ?? null;
  }

  private selectSku(variants: RaintreeVariant[]): string | null {
    const firstAvailable = variants.find(
      (variant) => variant.available && variant.sku
    );
    if (firstAvailable?.sku) return firstAvailable.sku;
    return variants.find((variant) => variant.sku)?.sku ?? null;
  }

  private extractBotanical(
    rawProductName: string,
    rawDescription: string | null
  ): string | null {
    const fromName = rawProductName.match(
      /\(([A-Z][a-z]+(?:\s+[a-z][a-z-]+){1,2})\)/
    );
    if (fromName?.[1]) return fromName[1].trim();

    const source = rawDescription ?? '';
    const fromDescription = source.match(
      /\b([A-Z][a-z]+(?:\s+[a-z][a-z-]+){1,2})\b/
    );
    if (fromDescription?.[1]) return fromDescription[1].trim();

    return null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toUsd(priceCents: number): string {
    return `$${(priceCents / 100).toFixed(2)}`;
  }

  private tryParseJson(raw: string): unknown | null {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    };
  }

  private cleanText(text: string): string {
    return text.replace(/\0/g, '').replace(/\s+/g, ' ').trim();
  }
}
