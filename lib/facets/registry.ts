import type { BrowsePlant } from '@/lib/queries/browse';

// ---------------------------------------------------------------------------
// Facet type system
// ---------------------------------------------------------------------------

export type FacetType = 'multi-select' | 'boolean' | 'range' | 'zone-range';

export interface FacetOption {
  value: string;
  label: string;
}

export interface FacetGroup {
  key: string;
  label: string;
  /** Lower number = higher in sidebar */
  order: number;
}

/**
 * A single facet definition. The registry is the single source of truth for
 * browse filter keys, labels, types, grouping, display options, and data mapping.
 */
export interface FacetDefinition {
  /** Unique key — matches the URL param name(s) and filter state key */
  key: string;
  /** Human-readable label for sidebar heading */
  label: string;
  /** Control type */
  type: FacetType;
  /** Grouping for sidebar sections */
  group: string;
  /** Sort order within group (lower = higher) */
  order: number;
  /** Default open in sidebar disclosure */
  defaultOpen: boolean;

  // -- Multi-select specifics --
  /** Static options for multi-select facets */
  options?: readonly FacetOption[];

  // -- Range specifics --
  /** URL param suffix for range min (appended to key), default "Min" */
  rangeMinParam?: string;
  /** URL param suffix for range max (appended to key), default "Max" */
  rangeMaxParam?: string;
  /** Input step for range facets (e.g. "0.1" for pH) */
  step?: string;
  /** Placeholder for min input */
  minPlaceholder?: string;
  /** Placeholder for max input */
  maxPlaceholder?: string;
  /** Unit label (e.g. "ft", "hrs") */
  unit?: string;

  // -- Conditional visibility --
  /** Only show when one of these categories is the sole selected category */
  visibleForCategories?: string[];
  /** Show for any single selected category (not just specific ones) */
  visibleForAnyCategory?: boolean;

  // -- Facet count / disable behavior --
  /** Whether facet counts should be computed for this facet */
  countable: boolean;
  /** Whether to disable options with count === 0 */
  disableEmpty: boolean;

  // -- Data mapping --
  /** BrowsePlant field(s) this facet reads from */
  dataFields: (keyof BrowsePlant)[];
}

// ---------------------------------------------------------------------------
// Facet groups
// ---------------------------------------------------------------------------

export const FACET_GROUPS: FacetGroup[] = [
  { key: 'discovery', label: 'Discovery', order: 0 },
  { key: 'growing', label: 'Growing Conditions', order: 1 },
  { key: 'pollination', label: 'Pollination', order: 2 },
  { key: 'contextual', label: 'Detailed Filters', order: 3 },
];

// ---------------------------------------------------------------------------
// Option sets
// ---------------------------------------------------------------------------

export const CATEGORY_OPTIONS: readonly FacetOption[] = [
  { value: 'Nut Trees', label: 'Nut Trees' },
  { value: 'Apples & Crabapples', label: 'Apples & Crabapples' },
  { value: 'Berries', label: 'Berries' },
  { value: 'Cherries & Plums', label: 'Cherries & Plums' },
  { value: 'Figs', label: 'Figs' },
  { value: 'Grapes', label: 'Grapes' },
  { value: 'Mulberries', label: 'Mulberries' },
  { value: 'Pears', label: 'Pears' },
  { value: 'Persimmons', label: 'Persimmons' },
  { value: 'Quinces', label: 'Quinces' },
  { value: 'Other', label: 'Other' },
];

export const SUN_OPTIONS: readonly FacetOption[] = [
  { value: 'Full Sun', label: 'Full Sun' },
  { value: 'Full Sun to Partial Shade', label: 'Full Sun to Partial Shade' },
  { value: 'Partial Shade', label: 'Partial Shade' },
  { value: 'Full Shade', label: 'Full Shade' },
];

export const GROWTH_RATE_OPTIONS: readonly FacetOption[] = [
  { value: 'Slow', label: 'Slow' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Fast', label: 'Fast' },
];

export const DROUGHT_TOLERANCE_OPTIONS: readonly FacetOption[] = [
  { value: '1', label: 'Very Low (1)' },
  { value: '2', label: 'Low (2)' },
  { value: '3', label: 'Moderate (3)' },
  { value: '4', label: 'High (4)' },
  { value: '5', label: 'Very High (5)' },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const FACET_REGISTRY: readonly FacetDefinition[] = [
  // -- Discovery group --
  {
    key: 'category',
    label: 'Plant Type',
    type: 'multi-select',
    group: 'discovery',
    order: 0,
    defaultOpen: true,
    options: CATEGORY_OPTIONS,
    countable: true,
    disableEmpty: true,
    dataFields: ['display_category'],
  },
  {
    key: 'zone',
    label: 'USDA Zone',
    type: 'zone-range',
    group: 'discovery',
    order: 1,
    defaultOpen: true,
    rangeMinParam: 'zoneMin',
    rangeMaxParam: 'zoneMax',
    countable: false,
    disableEmpty: false,
    dataFields: ['zone_min', 'zone_max'],
  },
  {
    key: 'available',
    label: 'Availability',
    type: 'boolean',
    group: 'discovery',
    order: 2,
    defaultOpen: true,
    countable: true,
    disableEmpty: true,
    dataFields: ['nursery_count'],
  },

  // -- Growing conditions group --
  {
    key: 'sun',
    label: 'Sun Requirement',
    type: 'multi-select',
    group: 'growing',
    order: 0,
    defaultOpen: false,
    options: SUN_OPTIONS,
    countable: true,
    disableEmpty: true,
    dataFields: ['sun_requirement'],
  },
  {
    key: 'growthRate',
    label: 'Growth Rate',
    type: 'multi-select',
    group: 'growing',
    order: 1,
    defaultOpen: false,
    options: GROWTH_RATE_OPTIONS,
    countable: true,
    disableEmpty: true,
    dataFields: ['growth_rate'],
  },

  // -- Contextual group (conditional visibility) --
  {
    key: 'chillHours',
    label: 'Chill Hours',
    type: 'range',
    group: 'contextual',
    order: 0,
    defaultOpen: false,
    rangeMinParam: 'chillHoursMin',
    rangeMaxParam: 'chillHoursMax',
    minPlaceholder: 'e.g. 600',
    maxPlaceholder: 'e.g. 1200',
    unit: 'hrs',
    visibleForCategories: ['Nut Trees'],
    countable: false,
    disableEmpty: false,
    dataFields: ['chill_hours_min', 'chill_hours_max'],
  },
  {
    key: 'bearingAge',
    label: 'Bearing Age (Years)',
    type: 'range',
    group: 'contextual',
    order: 1,
    defaultOpen: false,
    rangeMinParam: 'bearingAgeMin',
    rangeMaxParam: 'bearingAgeMax',
    minPlaceholder: 'e.g. 3',
    maxPlaceholder: 'e.g. 7',
    unit: 'yrs',
    visibleForCategories: ['Nut Trees'],
    countable: false,
    disableEmpty: false,
    dataFields: ['years_to_bearing_min', 'years_to_bearing_max'],
  },
  {
    key: 'height',
    label: 'Mature Height (ft)',
    type: 'range',
    group: 'contextual',
    order: 2,
    defaultOpen: false,
    rangeMinParam: 'heightMin',
    rangeMaxParam: 'heightMax',
    minPlaceholder: 'e.g. 6',
    maxPlaceholder: 'e.g. 20',
    unit: 'ft',
    visibleForAnyCategory: true,
    countable: false,
    disableEmpty: false,
    dataFields: ['mature_height_min_ft', 'mature_height_max_ft'],
  },
  {
    key: 'spread',
    label: 'Mature Spread (ft)',
    type: 'range',
    group: 'contextual',
    order: 3,
    defaultOpen: false,
    rangeMinParam: 'spreadMin',
    rangeMaxParam: 'spreadMax',
    minPlaceholder: 'e.g. 4',
    maxPlaceholder: 'e.g. 16',
    unit: 'ft',
    visibleForAnyCategory: true,
    countable: false,
    disableEmpty: false,
    dataFields: ['mature_spread_min_ft', 'mature_spread_max_ft'],
  },
  {
    key: 'soilPh',
    label: 'Soil pH',
    type: 'range',
    group: 'contextual',
    order: 4,
    defaultOpen: false,
    rangeMinParam: 'soilPhMin',
    rangeMaxParam: 'soilPhMax',
    step: '0.1',
    minPlaceholder: 'e.g. 5.5',
    maxPlaceholder: 'e.g. 7.0',
    visibleForCategories: ['Berries'],
    countable: false,
    disableEmpty: false,
    dataFields: ['soil_ph_min', 'soil_ph_max'],
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get all facets visible for the current filter state. */
export function getVisibleFacets(selectedCategories: string[]): FacetDefinition[] {
  const singleCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;

  return FACET_REGISTRY.filter((facet) => {
    // Facets without visibility constraints are always visible
    if (!facet.visibleForCategories && !facet.visibleForAnyCategory) return true;

    // visibleForAnyCategory: show when any single category is selected
    if (facet.visibleForAnyCategory) return singleCategory !== null;

    // visibleForCategories: show when that specific category is selected
    if (facet.visibleForCategories && singleCategory) {
      return facet.visibleForCategories.includes(singleCategory);
    }

    return false;
  });
}

/** Get facets grouped and sorted for sidebar rendering. */
export function getFacetsByGroup(
  selectedCategories: string[]
): { group: FacetGroup; facets: FacetDefinition[] }[] {
  const visible = getVisibleFacets(selectedCategories);
  const grouped = new Map<string, FacetDefinition[]>();

  for (const facet of visible) {
    const list = grouped.get(facet.group) ?? [];
    list.push(facet);
    grouped.set(facet.group, list);
  }

  return FACET_GROUPS
    .filter((g) => grouped.has(g.key))
    .map((g) => ({
      group: g,
      facets: (grouped.get(g.key) ?? []).sort((a, b) => a.order - b.order),
    }));
}

/** Lookup a facet by key. */
export function getFacet(key: string): FacetDefinition | undefined {
  return FACET_REGISTRY.find((f) => f.key === key);
}

/** Extract raw option values from a multi-select facet. */
export function getOptionValues(facet: FacetDefinition): string[] {
  return (facet.options ?? []).map((o) => o.value);
}
