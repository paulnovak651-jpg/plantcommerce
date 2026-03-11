/** Human-friendly common names for genus-level pages, keyed by botanical name (lowercase). */
export const GENUS_COMMON_NAMES: Record<string, string> = {
  actinidia: 'Kiwifruit',
  alnus: 'Alders',
  asimina: 'Pawpaws',
  carya: 'Hickories & Pecans',
  castanea: 'Chestnuts',
  celtis: 'Hackberries',
  corylus: 'Hazelnuts',
  diospyros: 'Persimmons',
  elaeagnus: 'Silverberries',
  ficus: 'Figs',
  gevuina: 'Chilean Hazelnut',
  hippophae: 'Sea Buckthorns',
  juglans: 'Walnuts',
  malus: 'Apples',
  morus: 'Mulberries',
  prunus: 'Stone Fruits',
  pyrus: 'Pears',
  quercus: 'Oaks',
  rubus: 'Brambles',
  sambucus: 'Elderberries',
  vaccinium: 'Blueberries',
  vitis: 'Grapes',
};

/**
 * Look up the common name for a genus, handling both plain botanical names
 * ("diospyros") and prefixed DB slugs ("genus-diospyros").
 */
export function genusCommonName(slug: string): string | undefined {
  const key = slug.replace(/^genus-/, '');
  return GENUS_COMMON_NAMES[key];
}
