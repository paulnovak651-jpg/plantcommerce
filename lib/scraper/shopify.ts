import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

interface ShopifyVariant {
  title?: string | null;
  price?: string | number | null;
  available?: boolean | null;
  sku?: string | null;
}

interface ShopifyProduct {
  handle?: string | null;
  title?: string | null;
  body_html?: string | null;
  variants?: ShopifyVariant[] | null;
  price?: string | number | null;
  price_min?: string | number | null;
  available?: boolean | null;
}

interface ShopifyCollectionResponse {
  products?: ShopifyProduct[] | null;
  collection?: {
    title?: string | null;
  } | null;
  collection_title?: string | null;
}

interface ShopifyProductResponse {
  product?: ShopifyProduct | null;
}

interface ShopifyScraperOptions {
  nurserySlug: string;
  nurseryName: string;
  domain: string;
  collections: string[];
  delayMs?: number;
}

interface NormalizedVariant {
  title: string;
  price: string | number | null;
  available: boolean;
  sku: string | null;
}

export class ShopifyScraper implements NurseryScraper {
  nurserySlug: string;
  nurseryName: string;

  private domain: string;
  private baseUrl: string;
  private collections: string[];
  private delayMs: number;

  constructor(options: ShopifyScraperOptions) {
    this.nurserySlug = options.nurserySlug;
    this.nurseryName = options.nurseryName;
    this.delayMs = options.delayMs ?? 2000;

    this.domain = options.domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/g, '');
    this.baseUrl = `https://${this.domain}`;

    this.collections = options.collections
      .map((collection) => collection.trim())
      .filter(Boolean);
  }

  async scrapeCategory(categoryUrl?: string): Promise<ScrapeResult> {
    const sourceUrl = categoryUrl
      ? this.toCollectionUrl(categoryUrl)
      : this.collections[0]
        ? this.toCollectionUrl(this.collections[0])
        : this.baseUrl;

    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };

    const targetCollections = categoryUrl
      ? [this.toCollectionUrl(categoryUrl)]
      : this.collections.map((collection) => this.toCollectionUrl(collection));

    if (targetCollections.length === 0) {
      result.errors.push('No Shopify collections configured.');
      return result;
    }

    const seenHandles = new Set<string>();

    for (const collection of targetCollections) {
      try {
        const MAX_PAGES = 50; // 50 × 250 = 12,500 products max
        let page = 1;
        while (true) {
          if (page > MAX_PAGES) {
            console.warn(`[Shopify] Hit max page limit (${MAX_PAGES}) for collection: ${collection}`);
            break;
          }
          const endpoint = this.toCollectionProductsJsonUrl(collection, page);
          const payload = await this.fetchJson<ShopifyCollectionResponse>(endpoint);
          const products = payload.products ?? [];
          if (products.length === 0) break;

          const categoryTitle = this.getCollectionTitle(payload);
          for (const product of products) {
            const handle = this.cleanText(product.handle ?? '');
            if (!handle) continue;
            if (seenHandles.has(handle)) continue;
            seenHandles.add(handle);

            result.products.push(
              ...this.toScrapedProducts(product, categoryTitle)
            );
          }

          page += 1;
        }
      } catch (err) {
        result.errors.push(`Failed to scrape ${collection}: ${String(err)}`);
      }
    }

    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const normalizedProductUrl = this.toProductUrl(productUrl);
    const productJsonUrl = this.toProductJsonUrl(normalizedProductUrl);
    const payload = await this.fetchJson<ShopifyProductResponse>(productJsonUrl);
    const product = payload.product;

    if (!product) {
      throw new Error(`No product payload returned for ${productUrl}`);
    }

    const variants = this.toScrapedProducts(product, null);
    if (variants.length === 0) {
      throw new Error(`No variants found for ${productUrl}`);
    }

    return variants[0];
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const raw = await fetchPage(url, { delayMs: this.delayMs });
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      throw new Error(`Invalid JSON from ${url}: ${String(err)}`);
    }
  }

  private toCollectionProductsJsonUrl(collectionUrl: string, page: number): string {
    const trimmed = collectionUrl.replace(/\/+$/g, '');
    return `${trimmed}/products.json?limit=250&page=${page}`;
  }

  private toProductJsonUrl(productUrl: string): string {
    const url = new URL(productUrl);
    if (!url.pathname.endsWith('.json')) {
      url.pathname = `${url.pathname.replace(/\/+$/g, '')}.json`;
    }
    return url.toString();
  }

  private toCollectionUrl(input: string): string {
    if (/^https?:\/\//i.test(input)) {
      return input.replace(/\/+$/g, '');
    }

    const path = input.startsWith('/') ? input : `/${input}`;
    return `${this.baseUrl}${path}`.replace(/\/+$/g, '');
  }

  private toProductUrl(input: string): string {
    if (/^https?:\/\//i.test(input)) {
      return input;
    }

    const path = input.startsWith('/') ? input : `/${input}`;
    return `${this.baseUrl}${path}`;
  }

  private getCollectionTitle(payload: ShopifyCollectionResponse): string | null {
    const fromCollection = this.cleanText(payload.collection?.title ?? '');
    if (fromCollection) return fromCollection;

    const fromLegacy = this.cleanText(payload.collection_title ?? '');
    if (fromLegacy) return fromLegacy;

    return null;
  }

  private toScrapedProducts(
    product: ShopifyProduct,
    categoryTitle: string | null
  ): ScrapedProduct[] {
    const handle = this.cleanText(product.handle ?? '');
    if (!handle) return [];

    const productTitle = this.cleanText(product.title ?? '') || 'UNKNOWN';
    const rawDescription = this.stripHtml(product.body_html ?? '').slice(0, 2000) || null;
    const productPageUrl = `https://${this.domain}/products/${handle}`;

    const variants = this.normalizeVariants(product);
    const hasSingleVariant = variants.length === 1;

    return variants.map((variant) => {
      const variantTitle = this.cleanText(variant.title);
      const isDefaultTitle = variantTitle === 'Default Title';
      const rawProductName =
        hasSingleVariant || isDefaultTitle
          ? productTitle
          : `${productTitle} - ${variantTitle}`;

      return {
        rawProductName,
        rawDescription,
        rawPriceText: this.toPriceText(variant.price),
        rawAvailability: variant.available ? 'In Stock' : 'Sold Out',
        rawFormSize: isDefaultTitle ? null : variantTitle,
        rawSku: this.cleanText(variant.sku ?? '') || null,
        productPageUrl,
        rawCategory: categoryTitle,
        rawBotanical: null,
        rawFullHtml: null,
      };
    });
  }

  private normalizeVariants(product: ShopifyProduct): NormalizedVariant[] {
    const rawVariants = product.variants ?? [];
    if (rawVariants.length > 0) {
      return rawVariants.map((variant) => ({
        title: this.cleanText(variant.title ?? '') || 'Default Title',
        price: variant.price ?? null,
        available: variant.available === true,
        sku: variant.sku ?? null,
      }));
    }

    return [
      {
        title: 'Default Title',
        price: product.price ?? product.price_min ?? null,
        available: product.available === true,
        sku: null,
      },
    ];
  }

  private toPriceText(price: string | number | null): string | null {
    if (price == null) return null;

    const parsed = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(parsed)) return null;

    return `$${parsed.toFixed(2)}`;
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanText(value: string): string {
    return value
      .replace(/\0/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
