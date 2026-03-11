import { FACET_REGISTRY, type FacetDefinition } from './registry';

// ---------------------------------------------------------------------------
// Facet state types
// ---------------------------------------------------------------------------

/** Multi-select and boolean facets store string arrays or booleans.
 *  Range facets store min/max string values. Zone is a special range. */
export interface FacetState {
  /** Keyword search (not a facet, but travels with facet state) */
  q: string;
  /** Multi-select values keyed by facet key */
  multiSelect: Record<string, string[]>;
  /** Boolean values keyed by facet key */
  booleans: Record<string, boolean>;
  /** Range min values keyed by param name (e.g. "chillHoursMin") */
  rangeMin: Record<string, string>;
  /** Range max values keyed by param name (e.g. "chillHoursMax") */
  rangeMax: Record<string, string>;
  /** Sort key */
  sort: string;
  /** Current page */
  page: number;
  /** Group by mode */
  groupBy: 'species' | 'genus';
}

// ---------------------------------------------------------------------------
// URL param names — derived from registry
// ---------------------------------------------------------------------------

function getRangeMinParam(facet: FacetDefinition): string {
  return facet.rangeMinParam ?? `${facet.key}Min`;
}

function getRangeMaxParam(facet: FacetDefinition): string {
  return facet.rangeMaxParam ?? `${facet.key}Max`;
}

/** Multi-select facets use their key as the URL param, with comma-separated values. */
function getMultiSelectParam(facet: FacetDefinition): string {
  return facet.key;
}

// ---------------------------------------------------------------------------
// Parse URL → FacetState
// ---------------------------------------------------------------------------

export function parseFacetState(searchParams: URLSearchParams): FacetState {
  const multiSelect: Record<string, string[]> = {};
  const booleans: Record<string, boolean> = {};
  const rangeMin: Record<string, string> = {};
  const rangeMax: Record<string, string> = {};

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select': {
        const param = getMultiSelectParam(facet);
        const raw = searchParams.get(param);
        multiSelect[facet.key] = raw ? raw.split(',').filter(Boolean) : [];
        break;
      }
      case 'boolean': {
        booleans[facet.key] = searchParams.get(facet.key) === 'true';
        break;
      }
      case 'range':
      case 'zone-range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        rangeMin[minParam] = searchParams.get(minParam) ?? '';
        rangeMax[maxParam] = searchParams.get(maxParam) ?? '';
        break;
      }
    }
  }

  const groupByParam = searchParams.get('groupBy');

  return {
    q: searchParams.get('q') ?? '',
    multiSelect,
    booleans,
    rangeMin,
    rangeMax,
    sort: searchParams.get('sort') ?? 'name-asc',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    groupBy: groupByParam === 'genus' ? 'genus' : 'species',
  };
}

// ---------------------------------------------------------------------------
// Serialize FacetState → URL params string
// ---------------------------------------------------------------------------

export function serializeFacetState(state: FacetState): string {
  const params = new URLSearchParams();

  if (state.q.trim()) params.set('q', state.q.trim());

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select': {
        const values = state.multiSelect[facet.key];
        if (values && values.length > 0) {
          params.set(getMultiSelectParam(facet), values.join(','));
        }
        break;
      }
      case 'boolean': {
        if (state.booleans[facet.key]) {
          params.set(facet.key, 'true');
        }
        break;
      }
      case 'range':
      case 'zone-range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        if (state.rangeMin[minParam]) params.set(minParam, state.rangeMin[minParam]);
        if (state.rangeMax[maxParam]) params.set(maxParam, state.rangeMax[maxParam]);
        break;
      }
    }
  }

  if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.groupBy === 'genus') params.set('groupBy', 'genus');

  return params.toString();
}

// ---------------------------------------------------------------------------
// Active filter descriptions (for filter pills)
// ---------------------------------------------------------------------------

export interface ActiveFilter {
  /** Display label for the pill */
  label: string;
  /** Facet key this filter belongs to */
  facetKey: string;
  /** The specific value (for multi-select) or param name (for range) */
  value: string;
  /** How to remove: 'toggle' a value, 'clear-range-min', 'clear-range-max', 'clear-boolean' */
  removeAction:
    | { type: 'toggle'; facetKey: string; value: string }
    | { type: 'clear-range'; param: string }
    | { type: 'clear-boolean'; facetKey: string }
    | { type: 'clear-keyword' };
}

export function describeActiveFilters(state: FacetState): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  // Keyword
  if (state.q.trim()) {
    filters.push({
      label: `Keyword: ${state.q.trim()}`,
      facetKey: 'q',
      value: state.q.trim(),
      removeAction: { type: 'clear-keyword' },
    });
  }

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select': {
        const values = state.multiSelect[facet.key] ?? [];
        for (const value of values) {
          const option = facet.options?.find((o) => o.value === value);
          filters.push({
            label: option?.label ?? value,
            facetKey: facet.key,
            value,
            removeAction: { type: 'toggle', facetKey: facet.key, value },
          });
        }
        break;
      }
      case 'boolean': {
        if (state.booleans[facet.key]) {
          filters.push({
            label: 'In stock',
            facetKey: facet.key,
            value: 'true',
            removeAction: { type: 'clear-boolean', facetKey: facet.key },
          });
        }
        break;
      }
      case 'zone-range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        const minVal = state.rangeMin[minParam] ?? '';
        const maxVal = state.rangeMax[maxParam] ?? '';

        if (minVal && maxVal && minVal === maxVal) {
          // Combined zone badge
          filters.push({
            label: `Showing plants for Zone ${minVal}`,
            facetKey: facet.key,
            value: `${minVal}-${maxVal}`,
            removeAction: { type: 'clear-range', param: minParam },
          });
        } else {
          if (minVal) {
            filters.push({
              label: `Zone min: ${minVal}`,
              facetKey: facet.key,
              value: minVal,
              removeAction: { type: 'clear-range', param: minParam },
            });
          }
          if (maxVal) {
            filters.push({
              label: `Zone max: ${maxVal}`,
              facetKey: facet.key,
              value: maxVal,
              removeAction: { type: 'clear-range', param: maxParam },
            });
          }
        }
        break;
      }
      case 'range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        const minVal = state.rangeMin[minParam] ?? '';
        const maxVal = state.rangeMax[maxParam] ?? '';
        const unit = facet.unit ? facet.unit : '';

        if (minVal) {
          filters.push({
            label: `${facet.label} min: ${minVal}${unit}`,
            facetKey: facet.key,
            value: minVal,
            removeAction: { type: 'clear-range', param: minParam },
          });
        }
        if (maxVal) {
          filters.push({
            label: `${facet.label} max: ${maxVal}${unit}`,
            facetKey: facet.key,
            value: maxVal,
            removeAction: { type: 'clear-range', param: maxParam },
          });
        }
        break;
      }
    }
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Empty state factory
// ---------------------------------------------------------------------------

export function createEmptyFacetState(): FacetState {
  const multiSelect: Record<string, string[]> = {};
  const booleans: Record<string, boolean> = {};
  const rangeMin: Record<string, string> = {};
  const rangeMax: Record<string, string> = {};

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select':
        multiSelect[facet.key] = [];
        break;
      case 'boolean':
        booleans[facet.key] = false;
        break;
      case 'range':
      case 'zone-range':
        rangeMin[getRangeMinParam(facet)] = '';
        rangeMax[getRangeMaxParam(facet)] = '';
        break;
    }
  }

  return {
    q: '',
    multiSelect,
    booleans,
    rangeMin,
    rangeMax,
    sort: 'name-asc',
    page: 1,
    groupBy: 'species',
  };
}

// ---------------------------------------------------------------------------
// Count active filters
// ---------------------------------------------------------------------------

export function countActiveFilters(state: FacetState): number {
  let count = 0;

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select':
        count += (state.multiSelect[facet.key] ?? []).length;
        break;
      case 'boolean':
        if (state.booleans[facet.key]) count += 1;
        break;
      case 'zone-range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        const minVal = state.rangeMin[minParam] ?? '';
        const maxVal = state.rangeMax[maxParam] ?? '';
        // Zone min+max same value counts as 1
        if (minVal && maxVal && minVal === maxVal) {
          count += 1;
        } else {
          if (minVal) count += 1;
          if (maxVal) count += 1;
        }
        break;
      }
      case 'range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        if (state.rangeMin[minParam]) count += 1;
        if (state.rangeMax[maxParam]) count += 1;
        break;
      }
    }
  }

  return count;
}
