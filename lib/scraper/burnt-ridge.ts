// ============================================================================
// Burnt Ridge Nursery Scraper
// Target: https://www.burntridgenursery.com
// Platform: Custom e-commerce (Volusion-based)
// ============================================================================

import * as cheerio from 'cheerio';
import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

const BASE_URL = 'https://www.burntridgenursery.com';
const HAZELNUT_CATEGORY_URL = `${BASE_URL}/mobile/Hazelnut-Trees/products/54/`;

export class BurntRidgeScraper implements NurseryScraper {
  nurserySlug = 'burnt-ridge-nursery';
  nurseryName = 'Burnt Ridge Nursery & Orchards';

  private delayMs: number;

  constructor(options: { delayMs?: number } = {}) {
    this.delayMs = options.delayMs ?? 2000;
  }

  async scrapeCategory(
    categoryUrl: string = HAZELNUT_CATEGORY_URL,
    depth: number = 0
  ): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl: categoryUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };

    try {
      console.log(`[Burnt Ridge] Fetching category: ${categoryUrl}`);
      const categoryHtml = await fetchPage(categoryUrl, { delayMs: 0 });
      const productUrls = this.extractProductUrls(categoryHtml, categoryUrl);

      console.log(`[Burnt Ridge] Found ${productUrls.length} product URLs`);

      for (const url of productUrls) {
        try {
          console.log(`[Burnt Ridge] Scraping: ${url}`);
          const product = await this.scrapeProductPage(url);
          result.products.push(product);
        } catch (err) {
          const msg = `Failed to scrape ${url}: ${err}`;
          console.error(`[Burnt Ridge] ${msg}`);
          result.errors.push(msg);
        }
      }

      const nextPageUrl = this.extractNextPageUrl(categoryHtml, categoryUrl);
      if (nextPageUrl) {
        if (depth >= 10) {
          console.warn(`[Burnt Ridge] Hit max recursion depth (10) at ${nextPageUrl}`);
        } else {
          console.log(`[Burnt Ridge] Following pagination: ${nextPageUrl}`);
          const nextResult = await this.scrapeCategory(nextPageUrl, depth + 1);
          result.products.push(...nextResult.products);
          result.errors.push(...nextResult.errors);
        }
      }
    } catch (err) {
      result.errors.push(`Category scrape failed: ${err}`);
    }

    console.log(
      `[Burnt Ridge] Done: ${result.products.length} products, ${result.errors.length} errors`
    );
    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const html = await fetchPage(productUrl, { delayMs: this.delayMs });
    const $ = cheerio.load(html);

    const rawProductName =
      this.cleanText($('h1.product_name').text()) ||
      this.cleanText($('h1').first().text()) ||
      this.cleanText($('.product-name').text()) ||
      this.cleanText($('[itemprop="name"]').text()) ||
      this.cleanText($('title').text().split('|')[0].split('-Burnt')[0]) ||
      'UNKNOWN';

    const rawDescription =
      this.cleanText($('.product_description').text()) ||
      this.cleanText($('[itemprop="description"]').text()) ||
      this.cleanText($('.product-description').text()) ||
      this.cleanText($('#product_description').text()) ||
      null;

    const rawPriceText =
      this.cleanText($('.product_productprice').text()) ||
      this.cleanText($('[itemprop="price"]').attr('content') ?? '') ||
      this.cleanText($('.price').first().text()) ||
      this.cleanText($('.product-price').text()) ||
      this.extractPriceFromText(html) ||
      null;

    const rawAvailability =
      this.cleanText(
        $('[itemprop="availability"]').attr('content') ?? ''
      ) ||
      this.cleanText($('.availability').text()) ||
      this.cleanText($('.stock-status').text()) ||
      this.inferAvailability($, html) ||
      null;

    const rawFormSize =
      this.cleanText(
        $('.product_options select option:selected').text()
      ) ||
      this.extractFormFromDescription(rawDescription) ||
      null;

    const skuMatch = productUrl.match(/\/productinfo\/([^/]+)\/?/);
    const rawSku = skuMatch ? skuMatch[1] : null;

    const rawBotanical = this.extractBotanicalFromName(rawProductName);

    return {
      rawProductName,
      rawDescription: rawDescription?.slice(0, 2000) ?? null,
      rawPriceText,
      rawAvailability,
      rawFormSize,
      rawSku,
      productPageUrl: productUrl,
      rawCategory: 'Hazelnuts/Filberts',
      rawBotanical,
      rawFullHtml: html.slice(0, 50000),
    };
  }

  // ── Private helpers ──

  private extractProductUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const urls = new Set<string>();

    $('a[href*="/productinfo/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, BASE_URL).toString();
        if (
          fullUrl.includes('NSHA') ||
          fullUrl.toLowerCase().includes('hazelnut') ||
          fullUrl.toLowerCase().includes('hazel') ||
          fullUrl.toLowerCase().includes('filbert')
        ) {
          urls.add(fullUrl);
        }
      }
    });

    $('a.product_link, .product-item a, .product_name a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, BASE_URL).toString();
        urls.add(fullUrl);
      }
    });

    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') ?? '';
      if (
        (text.includes('hazelnut') ||
          text.includes('filbert') ||
          text.includes('hazel')) &&
        href.includes('/productinfo/')
      ) {
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, BASE_URL).toString();
        urls.add(fullUrl);
      }
    });

    return [...urls];
  }

  private extractNextPageUrl(
    html: string,
    currentUrl: string
  ): string | null {
    const $ = cheerio.load(html);
    const nextLink =
      $('a.next').attr('href') ||
      $('a[rel="next"]').attr('href') ||
      $('a:contains("Next")').attr('href');

    if (nextLink) {
      return nextLink.startsWith('http')
        ? nextLink
        : new URL(nextLink, BASE_URL).toString();
    }
    return null;
  }

  private extractBotanicalFromName(name: string): string | null {
    const match = name.match(/\(([Cc]orylus\s+[\w\s×x]+?)\)/);
    if (match) return match[1].trim();
    const gevuina = name.match(/\(Gevuina\s+avellana\)/);
    if (gevuina) return gevuina[0].replace(/[()]/g, '');
    return null;
  }

  private extractPriceFromText(html: string): string | null {
    const match = html.match(/\$\d+\.\d{2}/);
    return match ? match[0] : null;
  }

  private inferAvailability(
    $: cheerio.CheerioAPI,
    html: string
  ): string | null {
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('sold out') || bodyText.includes('out of stock'))
      return 'Sold Out';
    if (bodyText.includes('add to cart') || bodyText.includes('add to bag'))
      return 'In Stock';
    if (bodyText.includes('pre-order')) return 'Pre-Order';
    return null;
  }

  private extractFormFromDescription(description: string | null): string | null {
    if (!description) return null;
    const bareRoot = description.match(/bare[\s-]?root/i);
    if (bareRoot) return 'Bare Root';
    const potted = description.match(/\d+\s*(?:quart|gallon|gal)\s*pot/i);
    if (potted) return potted[0];
    return null;
  }

  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\0/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
