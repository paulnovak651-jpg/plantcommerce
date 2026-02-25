import * as cheerio from 'cheerio';
import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

const BASE_URL = 'https://www.grimonut.com';
const HAZELNUT_CATEGORY_URL = `${BASE_URL}/index.php?category=Hazelnut&p=Products`;

interface ParsedSizeLine {
  formSize: string | null;
  priceText: string | null;
  availability: string | null;
}

export class GrimoScraper implements NurseryScraper {
  nurserySlug = 'grimo-nut-nursery';
  nurseryName = 'Grimo Nut Nursery';

  private delayMs: number;

  constructor(options: { delayMs?: number } = {}) {
    this.delayMs = options.delayMs ?? 2000;
  }

  async scrapeCategory(categoryUrl: string = HAZELNUT_CATEGORY_URL): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl: categoryUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };

    try {
      const html = await fetchPage(categoryUrl, { delayMs: 0 });
      result.products = this.extractProductsFromCategoryHtml(html, categoryUrl);
    } catch (err) {
      result.errors.push(`Category scrape failed: ${err}`);
    }

    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const html = await fetchPage(productUrl, { delayMs: this.delayMs });
    const products = this.extractProductsFromCategoryHtml(html, productUrl);

    if (products.length === 0) {
      throw new Error(`No products found at ${productUrl}`);
    }

    return products[0];
  }

  private extractProductsFromCategoryHtml(
    html: string,
    sourceUrl: string
  ): ScrapedProduct[] {
    const $ = cheerio.load(html);
    const lines = $('body')
      .text()
      .split(/\r?\n/)
      .map((line) => this.cleanText(line))
      .filter(Boolean);

    const products: ScrapedProduct[] = [];
    let i = 0;

    while (i < lines.length) {
      const heading = lines[i];
      if (!this.isProductHeading(heading)) {
        i++;
        continue;
      }

      const rawProductName = heading;
      i++;

      const descriptionLines: string[] = [];
      while (
        i < lines.length &&
        !/^select a size:?$/i.test(lines[i]) &&
        !this.isProductHeading(lines[i])
      ) {
        descriptionLines.push(lines[i]);
        i++;
      }

      if (i < lines.length && /^select a size:?$/i.test(lines[i])) {
        i++;
      }

      const sizeLines: string[] = [];
      while (i < lines.length && !this.isProductHeading(lines[i])) {
        const line = lines[i];
        if (this.looksLikeSizeLine(line)) {
          sizeLines.push(line);
        }
        if (this.looksLikeSectionBoundary(line)) {
          break;
        }
        i++;
      }

      const rawDescription = descriptionLines.join(' ').slice(0, 2000) || null;
      const rawBotanical = this.extractBotanicalFromName(rawProductName);

      if (sizeLines.length === 0) {
        products.push({
          rawProductName,
          rawDescription,
          rawPriceText: null,
          rawAvailability: null,
          rawFormSize: null,
          rawSku: null,
          productPageUrl: `${sourceUrl}#${encodeURIComponent(rawProductName)}`,
          rawCategory: 'Hazelnut',
          rawBotanical,
          rawFullHtml: null,
        });
        continue;
      }

      for (const sizeLine of sizeLines) {
        const parsed = this.parseSizeLine(sizeLine);
        const key = `${rawProductName}|${parsed.formSize ?? 'unknown'}`;
        products.push({
          rawProductName,
          rawDescription,
          rawPriceText: parsed.priceText,
          rawAvailability: parsed.availability,
          rawFormSize: parsed.formSize,
          rawSku: null,
          productPageUrl: `${sourceUrl}#${encodeURIComponent(key)}`,
          rawCategory: 'Hazelnut',
          rawBotanical,
          rawFullHtml: null,
        });
      }
    }

    return products;
  }

  private isProductHeading(line: string): boolean {
    return /\bhazel\s+(layer|seedling)\b$/i.test(line);
  }

  private looksLikeSizeLine(line: string): boolean {
    return /\$[\d,.]+/.test(line) || /sold out/i.test(line);
  }

  private looksLikeSectionBoundary(line: string): boolean {
    return /^grimo nut nursery$/i.test(line) || /^featured$/i.test(line);
  }

  private parseSizeLine(line: string): ParsedSizeLine {
    const priceMatch = line.match(/\$[\d,.]+(?:\.\d{2})?/);
    const soldOut = /sold out/i.test(line);
    const pickupOnly = /pick-up only/i.test(line);

    const formSize = this.cleanText(
      line
        .replace(/\$[\d,.]+(?:\.\d{2})?/g, '')
        .replace(/\bsold out\b/gi, '')
        .replace(/\bpick-up only\b/gi, '')
        .replace(/\bsave\b/gi, '')
    );

    return {
      formSize: formSize || null,
      priceText: priceMatch?.[0] ?? null,
      availability: soldOut
        ? 'Sold Out'
        : pickupOnly
          ? 'Pickup Only'
          : 'In Stock',
    };
  }

  private extractBotanicalFromName(name: string): string | null {
    const match = name.match(/\(([Cc]orylus\s+[\w\sx]+?)\)/);
    return match?.[1]?.trim() ?? null;
  }

  private cleanText(text: string): string {
    return text.replace(/\0/g, '').replace(/\s+/g, ' ').trim();
  }
}
