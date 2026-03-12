import type { BrowsePlant } from './browse';
import { CATEGORY_MAPPING } from '../browse-categories';

export interface GenusCount {
  cultivarCount: number;
  nurseryCount: number;
  speciesCount: number;
}

/**
 * Aggregate plants by genus slug, producing cultivar, nursery, and species
 * counts. Optionally filter to a single top-level browse category first.
 */
export function getGenusCounts(
  plants: BrowsePlant[],
  topCategorySlug?: string,
): Record<string, GenusCount> {
  let filtered = plants;

  if (topCategorySlug) {
    // Only include plants whose display_category maps to the requested
    // top-level browse category.
    filtered = plants.filter((p) => {
      if (!p.display_category) return false;
      return CATEGORY_MAPPING[p.display_category] === topCategorySlug;
    });
  }

  const result: Record<string, GenusCount> = {};

  for (const plant of filtered) {
    const slug = plant.genus_slug?.replace(/^genus-/, '');
    if (!slug) continue;

    let entry = result[slug];
    if (!entry) {
      entry = { cultivarCount: 0, nurseryCount: 0, speciesCount: 0 };
      result[slug] = entry;
    }

    entry.speciesCount += 1;
    entry.cultivarCount += plant.cultivar_count;
    entry.nurseryCount += plant.nursery_count;
  }

  return result;
}
