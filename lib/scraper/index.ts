export { BurntRidgeScraper } from './burnt-ridge';
export { GrimoScraper } from './grimo';
export { RaintreeScraper } from './raintree';
export type { NurseryScraper, ScrapedProduct, ScrapeResult } from './types';
export { fetchPage } from './fetch-utils';

import { BurntRidgeScraper } from './burnt-ridge';
import { GrimoScraper } from './grimo';
import { RaintreeScraper } from './raintree';
import type { NurseryScraper } from './types';

type ScraperFactory = () => NurseryScraper;

const SCRAPER_REGISTRY: Record<string, ScraperFactory> = {
  'burnt-ridge-nursery': () => new BurntRidgeScraper({ delayMs: 2000 }),
  'grimo-nut-nursery': () => new GrimoScraper({ delayMs: 2000 }),
  'raintree-nursery': () => new RaintreeScraper({ delayMs: 2000 }),
};

export function listRegisteredScraperSlugs(): string[] {
  return Object.keys(SCRAPER_REGISTRY);
}

export function createRegisteredScrapers(): NurseryScraper[] {
  return Object.values(SCRAPER_REGISTRY).map((factory) => factory());
}

export function createScraperForNursery(slug: string): NurseryScraper | null {
  const factory = SCRAPER_REGISTRY[slug];
  return factory ? factory() : null;
}
