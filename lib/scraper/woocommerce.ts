import { fetchPage } from './fetch-utils';
import type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';

interface WooCommerceScraperOptions { nurserySlug: string; nurseryName: string; domain: string; categoryPaths: string[]; delayMs?: number; }
interface WcProduct {
  id?: number; name?: string; slug?: string; permalink?: string; description?: string; short_description?: string; sku?: string;
  is_in_stock?: boolean; is_on_backorder?: boolean; prices?: { price?: string; currency_minor_unit?: number };
  categories?: Array<{ id?: number; name?: string; slug?: string }>;
}

async function fetchJson(url: string, delayMs: number): Promise<{ data: unknown; totalPages: number }> {
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs + Math.random() * 500));
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; PlantCommerce/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
  return { data: await response.json(), totalPages: Number.isFinite(totalPages) ? totalPages : 1 };
}

export class WooCommerceScraper implements NurseryScraper {
  nurserySlug: string;
  nurseryName: string;
  private baseUrl: string;
  private categoryPaths: string[];
  private delayMs: number;

  constructor(options: WooCommerceScraperOptions) {
    this.nurserySlug = options.nurserySlug;
    this.nurseryName = options.nurseryName;
    this.delayMs = options.delayMs ?? 2000;
    this.baseUrl = `https://${options.domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '')}`;
    this.categoryPaths = options.categoryPaths.map((path) => path.trim()).filter(Boolean);
  }

  async scrapeCategory(categoryUrl?: string): Promise<ScrapeResult> {
    const targetPaths = categoryUrl ? [categoryUrl] : this.categoryPaths;
    const result: ScrapeResult = {
      nurserySlug: this.nurserySlug,
      sourceUrl: targetPaths[0] ? this.toAbsoluteUrl(targetPaths[0]) : this.baseUrl,
      scrapedAt: new Date().toISOString(),
      products: [],
      errors: [],
    };
    const seen = new Set<number>();
    for (const path of targetPaths) {
      const absoluteCategoryUrl = this.toAbsoluteUrl(path);
      try {
        const categoryId = await this.resolveCategoryId(absoluteCategoryUrl);
        if (categoryId) await this.fetchStoreProductsByCategory(categoryId, seen, result.products);
        else {
          console.warn(`[WooCommerce] Category ID lookup failed for ${absoluteCategoryUrl}; falling back to wp/v2/product.`);
          await this.fetchStoreProductsFromWpFallback(seen, result.products);
        }
      } catch (err) {
        result.errors.push(`Failed to scrape ${absoluteCategoryUrl}: ${String(err)}`);
      }
    }
    return result;
  }

  async scrapeProductPage(productUrl: string): Promise<ScrapedProduct> {
    const slug = this.extractSlug(productUrl);
    if (!slug) throw new Error(`Unable to determine product slug from ${productUrl}`);
    const endpoint = `${this.baseUrl}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}&per_page=1`;
    const { data } = await fetchJson(endpoint, this.delayMs);
    const products = Array.isArray(data) ? (data as WcProduct[]) : [];
    if (products.length === 0) throw new Error(`No product returned for slug '${slug}'`);
    return this.toScrapedProduct(products[0]);
  }

  private async resolveCategoryId(categoryUrl: string): Promise<number | null> {
    const html = await fetchPage(categoryUrl, { delayMs: this.delayMs });
    const fromClass = html.match(/\bterm-(\d+)\b/i)?.[1] ?? html.match(/data-term-id=["']?(\d+)["']?/i)?.[1];
    if (fromClass) return Number(fromClass);
    const slug = this.extractSlug(categoryUrl);
    if (!slug) return null;
    const endpoint = `${this.baseUrl}/wp-json/wp/v2/product_cat?slug=${encodeURIComponent(slug)}&per_page=1`;
    const { data } = await fetchJson(endpoint, this.delayMs);
    const categories = Array.isArray(data) ? (data as Array<{ id?: number }>) : [];
    return categories[0]?.id ?? null;
  }

  private async fetchStoreProductsByCategory(categoryId: number, seen: Set<number>, out: ScrapedProduct[]): Promise<void> {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const endpoint = `${this.baseUrl}/wp-json/wc/store/v1/products?category=${categoryId}&per_page=100&page=${page}`;
      const response = await fetchJson(endpoint, this.delayMs);
      totalPages = response.totalPages;
      const products = Array.isArray(response.data) ? (response.data as WcProduct[]) : [];
      for (const product of products) {
        if (!product.id || seen.has(product.id)) continue;
        seen.add(product.id);
        out.push(this.toScrapedProduct(product));
      }
      page += 1;
    }
  }

  private async fetchStoreProductsFromWpFallback(seen: Set<number>, out: ScrapedProduct[]): Promise<void> {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const endpoint = `${this.baseUrl}/wp-json/wp/v2/product?per_page=100&page=${page}&_fields=slug`;
      const response = await fetchJson(endpoint, this.delayMs);
      totalPages = response.totalPages;
      const entries = Array.isArray(response.data) ? (response.data as Array<{ slug?: string }>) : [];
      for (const entry of entries) {
        if (!entry.slug) continue;
        const storeEndpoint = `${this.baseUrl}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(entry.slug)}&per_page=1`;
        const storeResponse = await fetchJson(storeEndpoint, this.delayMs);
        const products = Array.isArray(storeResponse.data) ? (storeResponse.data as WcProduct[]) : [];
        const product = products[0];
        if (!product?.id || seen.has(product.id)) continue;
        seen.add(product.id);
        out.push(this.toScrapedProduct(product));
      }
      page += 1;
    }
  }

  private toScrapedProduct(product: WcProduct): ScrapedProduct {
    const description = this.cleanText(this.stripHtml(product.short_description || product.description || '')).slice(0, 2000);
    return {
      rawProductName: this.decodeHtmlEntities(product.name || '').trim() || 'UNKNOWN',
      rawDescription: description || null,
      rawPriceText: this.toPriceText(product.prices?.price, product.prices?.currency_minor_unit),
      rawAvailability: product.is_in_stock ? 'In Stock' : product.is_on_backorder ? 'On Backorder' : 'Sold Out',
      rawFormSize: null,
      rawSku: product.sku || null,
      productPageUrl: product.permalink || `${this.baseUrl}/product/${product.slug || ''}`,
      rawCategory: product.categories?.[0]?.name || null,
      rawBotanical: null,
      rawFullHtml: null,
    };
  }

  private toPriceText(priceMinor?: string, currencyMinorUnit?: number): string | null {
    if (!priceMinor) return null;
    const minor = Number.isFinite(currencyMinorUnit) ? Number(currencyMinorUnit) : 2;
    const amount = Number(priceMinor) / Math.pow(10, minor);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : null;
  }

  private stripHtml(html: string): string { return html.replace(/<[^>]+>/g, ' '); }
  private cleanText(text: string): string { return text.replace(/\0/g, '').replace(/\s+/g, ' ').trim(); }

  private decodeHtmlEntities(text: string): string {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '--' };
    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, entity: string) => {
      if (entity.startsWith('#x') || entity.startsWith('#X')) return String.fromCharCode(parseInt(entity.slice(2), 16));
      if (entity.startsWith('#')) return String.fromCharCode(parseInt(entity.slice(1), 10));
      return named[entity] ?? full;
    });
  }

  private toAbsoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${this.baseUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
  }

  private extractSlug(pathOrUrl: string): string | null {
    const segments = new URL(this.toAbsoluteUrl(pathOrUrl)).pathname.split('/').filter(Boolean);
    return segments.length ? segments[segments.length - 1] : null;
  }
}
