export interface GenusEntry {
  genusSlug: string;
  commonName: string;
  botanicalName: string;
}

export interface TopCategory {
  slug: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  genera: GenusEntry[];
}

/**
 * Maps old display_category values (from the DB) to the new top-level
 * browse category slugs. The underlying DB values stay unchanged.
 */
export const CATEGORY_MAPPING: Record<string, string> = {
  'Nut Trees': 'nut-trees',
  'Apples & Crabapples': 'tree-fruit',
  Berries: 'berries',
  'Cherries & Plums': 'tree-fruit',
  Figs: 'tree-fruit',
  Grapes: 'berries',
  Mulberries: 'berries',
  Pears: 'tree-fruit',
  Persimmons: 'tree-fruit',
  Quinces: 'tree-fruit',
  Other: 'support-species',
};

export const TOP_CATEGORIES: TopCategory[] = [
  {
    slug: 'nut-trees',
    label: 'Nut Trees',
    icon: '🌰',
    color: '#5C4033',
    description: 'Pecans, hazelnuts, chestnuts, walnuts and more',
    genera: [
      { genusSlug: 'corylus', commonName: 'Hazelnuts', botanicalName: 'Corylus' },
      { genusSlug: 'castanea', commonName: 'Chestnuts', botanicalName: 'Castanea' },
      { genusSlug: 'juglans', commonName: 'Walnuts', botanicalName: 'Juglans' },
      { genusSlug: 'carya', commonName: 'Hickories & Pecans', botanicalName: 'Carya' },
      { genusSlug: 'quercus', commonName: 'Oaks', botanicalName: 'Quercus' },
      { genusSlug: 'gevuina', commonName: 'Chilean Hazelnut', botanicalName: 'Gevuina' },
    ],
  },
  {
    slug: 'berries',
    label: 'Berries',
    icon: '🫐',
    color: '#7B1FA2',
    description: 'Blueberries, elderberries, brambles, goumi and more',
    genera: [
      { genusSlug: 'vaccinium', commonName: 'Blueberries', botanicalName: 'Vaccinium' },
      { genusSlug: 'sambucus', commonName: 'Elderberries', botanicalName: 'Sambucus' },
      { genusSlug: 'rubus', commonName: 'Brambles', botanicalName: 'Rubus' },
      { genusSlug: 'vitis', commonName: 'Grapes', botanicalName: 'Vitis' },
      { genusSlug: 'morus', commonName: 'Mulberries', botanicalName: 'Morus' },
      { genusSlug: 'elaeagnus', commonName: 'Goumi', botanicalName: 'Elaeagnus' },
      { genusSlug: 'hippophae', commonName: 'Sea Buckthorn', botanicalName: 'Hippophae' },
    ],
  },
  {
    slug: 'tree-fruit',
    label: 'Tree Fruit',
    icon: '🍎',
    color: '#558B2F',
    description: 'Apples, pears, persimmons, pawpaws and more',
    genera: [
      { genusSlug: 'malus', commonName: 'Apples', botanicalName: 'Malus' },
      { genusSlug: 'pyrus', commonName: 'Pears', botanicalName: 'Pyrus' },
      { genusSlug: 'diospyros', commonName: 'Persimmons', botanicalName: 'Diospyros' },
      { genusSlug: 'asimina', commonName: 'Pawpaws', botanicalName: 'Asimina' },
      { genusSlug: 'prunus', commonName: 'Cherries & Plums', botanicalName: 'Prunus' },
      { genusSlug: 'ficus', commonName: 'Figs', botanicalName: 'Ficus' },
      { genusSlug: 'actinidia', commonName: 'Kiwifruit', botanicalName: 'Actinidia' },
    ],
  },
  {
    slug: 'support-species',
    label: 'Support Species',
    icon: '🌿',
    color: '#2d6a4f',
    description: 'Nitrogen fixers, wildlife corridor, and system plants',
    genera: [
      { genusSlug: 'elaeagnus', commonName: 'Autumn Olive & Silverberry', botanicalName: 'Elaeagnus' },
      { genusSlug: 'hippophae', commonName: 'Sea Buckthorn', botanicalName: 'Hippophae' },
      { genusSlug: 'alnus', commonName: 'Alders', botanicalName: 'Alnus' },
      { genusSlug: 'celtis', commonName: 'Hackberries', botanicalName: 'Celtis' },
    ],
  },
];

/** Lookup a top category by slug. */
export function getTopCategory(slug: string): TopCategory | undefined {
  return TOP_CATEGORIES.find((c) => c.slug === slug);
}

/** Find all top categories containing a given genus. */
export function getCategoriesForGenus(genusSlug: string): TopCategory[] {
  return TOP_CATEGORIES.filter((c) =>
    c.genera.some((g) => g.genusSlug === genusSlug),
  );
}

/**
 * Resolve a DB display_category value to the new top-level browse
 * category slug. Returns undefined for unmapped values.
 */
export function mapDisplayCategory(displayCategory: string): string | undefined {
  return CATEGORY_MAPPING[displayCategory];
}
