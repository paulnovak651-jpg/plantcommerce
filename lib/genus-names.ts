/** Human-friendly common names for genus-level pages, keyed by botanical name (lowercase). */
export const GENUS_COMMON_NAMES: Record<string, string> = {
  corylus: 'Hazelnuts',
  castanea: 'Chestnuts',
  juglans: 'Walnuts',
  carya: 'Hickories & Pecans',
  diospyros: 'Persimmons',
  sambucus: 'Elderberries',
  malus: 'Apples',
  prunus: 'Stone Fruits',
  gevuina: 'Chilean Hazelnut',
};

/**
 * Look up the common name for a genus, handling both plain botanical names
 * ("diospyros") and prefixed DB slugs ("genus-diospyros").
 */
export function genusCommonName(slug: string): string | undefined {
  const key = slug.replace(/^genus-/, '');
  return GENUS_COMMON_NAMES[key];
}
