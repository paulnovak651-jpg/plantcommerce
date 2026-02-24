// ============================================================================
// Scraper Types
// ============================================================================

export interface ScrapedProduct {
  /** Raw product name as it appears on the nursery website */
  rawProductName: string;
  /** Product description text */
  rawDescription: string | null;
  /** Price as displayed (e.g., "$24.50", "Starting at $18.00") */
  rawPriceText: string | null;
  /** Availability text (e.g., "In Stock", "Sold Out", "Ships Fall 2026") */
  rawAvailability: string | null;
  /** Size/form info (e.g., "Bare Root, 3-4 ft", "2 Quart Pot") */
  rawFormSize: string | null;
  /** Product SKU/code */
  rawSku: string | null;
  /** Full URL to the product page */
  productPageUrl: string;
  /** Category from the nursery site */
  rawCategory: string | null;
  /** Botanical name if separately listed on the page */
  rawBotanical: string | null;
  /** Full HTML of the product block (for re-parsing later) */
  rawFullHtml: string | null;
}

export interface ScrapeResult {
  nurserySlug: string;
  sourceUrl: string;
  scrapedAt: string;
  products: ScrapedProduct[];
  errors: string[];
}

export interface NurseryScraper {
  nurserySlug: string;
  nurseryName: string;
  /** Scrape the hazelnut category and return all products found */
  scrapeCategory(categoryUrl: string): Promise<ScrapeResult>;
  /** Scrape a single product page for detailed info */
  scrapeProductPage(productUrl: string): Promise<ScrapedProduct>;
}
