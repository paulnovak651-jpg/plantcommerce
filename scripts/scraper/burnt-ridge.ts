// ============================================================================
// Burnt Ridge Nursery Scraper
// Target: https://www.burntridgenursery.com
// Platform: Custom e-commerce (Volusion-based)
// ============================================================================
//
// Site structure (from research):
//   Category page: /mobile/Hazelnut-Trees/products/54/
//   Product pages: /{PRODUCT-NAME}/productinfo/{SKU}/
//   SKU pattern:   NSHA + abbreviated variety (e.g., NSHAJEF = Jefferson)
//
// The category page lists products with links to individual product pages.
// Each product page has: name, description, price, availability, botanical info.
// ============================================================================

import * as cheerio from 'cheerio';
import { fetchPage } from './fetch-utils.js';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types.js';

const BASE_URL = 'https://www.burntridgenursery.com';
const HAZELNUT_CATEGORY_URL = `${BASE_URL}/mobile/Hazelnut-Trees/products/54/`;

export class BurntRidgeScraper implements NurseryScraper {
  nurserySlug = 'burnt-ridge-nursery';
  nurseryName = 'Burnt Ridge Nursery & Orchards';

  private delayMs: number;

  constructor(options: { delayMs?: number } = {}) {
    this.delayMs = options.delayMs ?? 2000; // 2 second default — be polite
  }

  /**
   * Scrape the hazelnut category page to discover all product URLs,
   * then visit each product page for full details.
   */
  async scrapeCategory(categoryUrl: string = HAZELNUT_CATEGORY_URL): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl: categoryUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };

    try {
      // Step 1: Fetch category page
      console.log(`[Burnt Ridge] Fetching category: ${categoryUrl}`);
      const categoryHtml = await fetchPage(categoryUrl, { delayMs: 0 });
      const productUrls = this.extractProductUrls(categoryHtml, categoryUrl);

      console.log(`[Burnt Ridge] Found ${productUrls.length} product URLs`);

      // Step 2: Visit each product page
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

      // Step 3: Check for pagination
      const nextPageUrl = this.extractNextPageUrl(categoryHtml, categoryUrl);
      if (nextPageUrl) {
        console.log(`[Burnt Ridge] Following pagination: ${nextPageUrl}`);
        const nextResult = await this.scrapeCategory(nextPageUrl);
        result.products.push(...nextResult.products);
        result.errors.push(...nextResult.errors);
      }
    } catch (err) {
      result.errors.push(`Category scrape failed: ${err}`);
    }

    console.log(
      `[Burnt Ridge] Done: ${result.products.length} products, ${result.errors.length} errors`
    );
    return result;
  }

  /**
   * Scrape a single Burnt Ridge product page.
   *
   * Burnt Ridge product pages typically have:
   * - Product name in <h1> or .product_name
   * - Description in .product_description or similar
   * - Price in .product_price or <span class="price">
   * - SKU in the URL pattern: /productinfo/{SKU}/
   * - Availability as in-stock/out-of-stock indicators
   * - Botanical name often in parentheses within the product name
   *
   * NOTE: The exact selectors may need adjustment after first live run.
   * The scraper uses multiple fallback strategies for resilience.
   */
  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const html = await fetchPage(productUrl, { delayMs: this.delayMs });
    const $ = cheerio.load(html);

    // ── Extract product name ──
    // Try multiple selectors in priority order
    const rawProductName =
      this.cleanText($('h1.product_name').text()) ||
      this.cleanText($('h1').first().text()) ||
      this.cleanText($('.product-name').text()) ||
      this.cleanText($('[itemprop="name"]').text()) ||
      this.cleanText($('title').text().split('|')[0].split('-Burnt')[0]) ||
      'UNKNOWN';

    // ── Extract description ──
    const rawDescription =
      this.cleanText($('.product_description').text()) ||
      this.cleanText($('[itemprop="description"]').text()) ||
      this.cleanText($('.product-description').text()) ||
      this.cleanText($('#product_description').text()) ||
      null;

    // ── Extract price ──
    const rawPriceText =
      this.cleanText($('.product_productprice').text()) ||
      this.cleanText($('[itemprop="price"]').attr('content') ?? '') ||
      this.cleanText($('.price').first().text()) ||
      this.cleanText($('.product-price').text()) ||
      this.extractPriceFromText(html) ||
      null;

    // ── Extract availability ──
    const rawAvailability =
      this.cleanText($('[itemprop="availability"]').attr('content') ?? '') ||
      this.cleanText($('.availability').text()) ||
      this.cleanText($('.stock-status').text()) ||
      this.inferAvailability($, html) ||
      null;

    // ── Extract form/size (from variant selectors or description) ──
    const rawFormSize =
      this.cleanText($('.product_options select option:selected').text()) ||
      this.extractFormFromDescription(rawDescription) ||
      null;

    // ── Extract SKU from URL ──
    const skuMatch = productUrl.match(/\/productinfo\/([^/]+)\/?/);
    const rawSku = skuMatch ? skuMatch[1] : null;

    // ── Extract botanical name if in structured data ──
    const rawBotanical = this.extractBotanicalFromName(rawProductName);

    return {
      rawProductName,
      rawDescription: rawDescription?.slice(0, 2000) ?? null, // Cap description length
      rawPriceText,
      rawAvailability,
      rawFormSize,
      rawSku,
      productPageUrl: productUrl,
      rawCategory: 'Hazelnuts/Filberts',
      rawBotanical,
      rawFullHtml: html.slice(0, 50000), // Store first 50k chars for re-parsing
    };
  }

  // ── Private helpers ──

  /**
   * Extract product URLs from the category listing page.
   */
  private extractProductUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const urls = new Set<string>();

    // Strategy 1: Links containing /productinfo/
    $('a[href*="/productinfo/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).toString();
        // Filter to only hazelnut products (NSHA SKU prefix or hazelnut in URL)
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

    // Strategy 2: Product listing items with links
    $('a.product_link, .product-item a, .product_name a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).toString();
        urls.add(fullUrl);
      }
    });

    // Strategy 3: Any link with hazelnut-relevant text
    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') ?? '';
      if (
        (text.includes('hazelnut') || text.includes('filbert') || text.includes('hazel')) &&
        href.includes('/productinfo/')
      ) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).toString();
        urls.add(fullUrl);
      }
    });

    return [...urls];
  }

  /**
   * Check for pagination (next page link).
   */
  private extractNextPageUrl(html: string, currentUrl: string): string | null {
    const $ = cheerio.load(html);
    const nextLink =
      $('a.next').attr('href') ||
      $('a[rel="next"]').attr('href') ||
      $('a:contains("Next")').attr('href');

    if (nextLink) {
      return nextLink.startsWith('http') ? nextLink : new URL(nextLink, BASE_URL).toString();
    }
    return null;
  }

  /**
   * Extract botanical name from product name (e.g., "(Corylus avellana)" in the name)
   */
  private extractBotanicalFromName(name: string): string | null {
    const match = name.match(/\(([Cc]orylus\s+[\w\s×x]+?)\)/);
    if (match) return match[1].trim();
    const gevuina = name.match(/\(Gevuina\s+avellana\)/);
    if (gevuina) return gevuina[0].replace(/[()]/g, '');
    return null;
  }

  /**
   * Try to extract price from raw HTML text (fallback)
   */
  private extractPriceFromText(html: string): string | null {
    const match = html.match(/\$\d+\.\d{2}/);
    return match ? match[0] : null;
  }

  /**
   * Infer availability from page content
   */
  private inferAvailability($: cheerio.CheerioAPI, html: string): string | null {
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('sold out') || bodyText.includes('out of stock')) return 'Sold Out';
    if (bodyText.includes('add to cart') || bodyText.includes('add to bag')) return 'In Stock';
    if (bodyText.includes('pre-order')) return 'Pre-Order';
    return null;
  }

  /**
   * Try to extract form/size from description text
   */
  private extractFormFromDescription(description: string | null): string | null {
    if (!description) return null;
    const bareRoot = description.match(/bare[\s-]?root/i);
    if (bareRoot) return 'Bare Root';
    const potted = description.match(/\d+\s*(?:quart|gallon|gal)\s*pot/i);
    if (potted) return potted[0];
    return null;
  }

  /**
   * Clean extracted text: trim, collapse whitespace, remove null chars
   */
  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\0/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
