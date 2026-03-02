export { BurntRidgeScraper } from './burnt-ridge';
export { GrimoScraper } from './grimo';
export { RaintreeScraper } from './raintree';
export { ShopifyScraper } from './shopify';
export { WooCommerceScraper } from './woocommerce';
export type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';
export { fetchPage } from './fetch-utils';

import { BurntRidgeScraper } from './burnt-ridge';
import { GrimoScraper } from './grimo';
import { RaintreeScraper } from './raintree';
import { ShopifyScraper } from './shopify';
import { WooCommerceScraper } from './woocommerce';
import type { NurseryScraper } from './types';

type ScraperFactory = () => NurseryScraper;

const CUSTOM_SCRAPERS: Record<string, ScraperFactory> = {
  'burnt-ridge-nursery': () => new BurntRidgeScraper({ delayMs: 2000 }),
  'grimo-nut-nursery': () => new GrimoScraper({ delayMs: 2000 }),
  'raintree-nursery': () => new RaintreeScraper({ delayMs: 2000 }),
};

export function listRegisteredScraperSlugs(): string[] {
  return Object.keys(CUSTOM_SCRAPERS);
}

export function createRegisteredScrapers(): NurseryScraper[] {
  return Object.values(CUSTOM_SCRAPERS).map((factory) => factory());
}

export function createScraperForNursery(slug: string): NurseryScraper | null {
  const factory = CUSTOM_SCRAPERS[slug];
  return factory ? factory() : null;
}

export function createScraperFromConfig(nursery: {
  slug: string;
  name: string;
  scraper_type: string | null;
  scraper_config: Record<string, any> | null;
}): NurseryScraper | null {
  if (nursery.scraper_type === 'shopify') {
    const domain = nursery.scraper_config?.domain;
    const collections = nursery.scraper_config?.collections;
    if (typeof domain !== 'string' || !Array.isArray(collections)) return null;
    const validCollections = collections.filter(
      (collection: unknown): collection is string => typeof collection === 'string' && collection.trim().length > 0
    );
    if (validCollections.length === 0) return null;
    return new ShopifyScraper({ nurserySlug: nursery.slug, nurseryName: nursery.name, domain, collections: validCollections, delayMs: 2000 });
  }
  if (nursery.scraper_type === 'custom') return createScraperForNursery(nursery.slug);
  if (nursery.scraper_type === 'woocommerce') {
    const domain = nursery.scraper_config?.domain;
    const categoryPaths = nursery.scraper_config?.categoryPaths;
    if (typeof domain !== 'string' || !Array.isArray(categoryPaths)) return null;
    const validPaths = categoryPaths.filter(
      (p: unknown): p is string => typeof p === 'string' && p.trim().length > 0
    );
    if (validPaths.length === 0) return null;
    return new WooCommerceScraper({
      nurserySlug: nursery.slug,
      nurseryName: nursery.name,
      domain,
      categoryPaths: validPaths,
      delayMs: 2000,
    });
  }
  return null;
}
