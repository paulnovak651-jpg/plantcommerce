import { describe, it, expect } from 'vitest';
import {
  parseFacetState,
  serializeFacetState,
  describeActiveFilters,
  createEmptyFacetState,
  countActiveFilters,
} from '../state';
import {
  FACET_REGISTRY,
  getVisibleFacets,
  getFacetsByGroup,
} from '../registry';

describe('facet state parse/serialize round-trip', () => {
  it('round-trips an empty state', () => {
    const empty = createEmptyFacetState();
    const serialized = serializeFacetState(empty);
    expect(serialized).toBe('');

    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.q).toBe('');
    expect(parsed.multiSelect.category).toEqual([]);
    expect(parsed.booleans.available).toBe(false);
    expect(parsed.rangeMin.zoneMin).toBe('');
    expect(parsed.sort).toBe('name-asc');
    expect(parsed.page).toBe(1);
    expect(parsed.groupBy).toBe('species');
  });

  it('round-trips multi-select facets', () => {
    const state = createEmptyFacetState();
    state.multiSelect.category = ['Nut Trees', 'Berries'];
    state.multiSelect.sun = ['Full Sun'];

    const serialized = serializeFacetState(state);
    expect(serialized).toContain('category=Nut+Trees%2CBerries');
    expect(serialized).toContain('sun=Full+Sun');

    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.multiSelect.category).toEqual(['Nut Trees', 'Berries']);
    expect(parsed.multiSelect.sun).toEqual(['Full Sun']);
  });

  it('round-trips boolean facets', () => {
    const state = createEmptyFacetState();
    state.booleans.available = true;

    const serialized = serializeFacetState(state);
    expect(serialized).toContain('available=true');

    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.booleans.available).toBe(true);
  });

  it('round-trips zone range', () => {
    const state = createEmptyFacetState();
    state.rangeMin.zoneMin = '5';
    state.rangeMax.zoneMax = '7';

    const serialized = serializeFacetState(state);
    expect(serialized).toContain('zoneMin=5');
    expect(serialized).toContain('zoneMax=7');

    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.rangeMin.zoneMin).toBe('5');
    expect(parsed.rangeMax.zoneMax).toBe('7');
  });

  it('round-trips numeric range facets', () => {
    const state = createEmptyFacetState();
    state.rangeMin.chillHoursMin = '600';
    state.rangeMax.chillHoursMax = '1200';
    state.rangeMin.heightMin = '10';

    const serialized = serializeFacetState(state);
    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.rangeMin.chillHoursMin).toBe('600');
    expect(parsed.rangeMax.chillHoursMax).toBe('1200');
    expect(parsed.rangeMin.heightMin).toBe('10');
  });

  it('round-trips sort, page, and groupBy', () => {
    const state = createEmptyFacetState();
    state.sort = 'available';
    state.page = 3;
    state.groupBy = 'genus';

    const serialized = serializeFacetState(state);
    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.sort).toBe('available');
    expect(parsed.page).toBe(3);
    expect(parsed.groupBy).toBe('genus');
  });

  it('omits default sort and page=1 from URL', () => {
    const state = createEmptyFacetState();
    state.sort = 'name-asc';
    state.page = 1;

    const serialized = serializeFacetState(state);
    expect(serialized).not.toContain('sort=');
    expect(serialized).not.toContain('page=');
  });

  it('round-trips keyword query', () => {
    const state = createEmptyFacetState();
    state.q = 'hazelnut';

    const serialized = serializeFacetState(state);
    expect(serialized).toContain('q=hazelnut');

    const parsed = parseFacetState(new URLSearchParams(serialized));
    expect(parsed.q).toBe('hazelnut');
  });
});

describe('describeActiveFilters', () => {
  it('returns empty for empty state', () => {
    const filters = describeActiveFilters(createEmptyFacetState());
    expect(filters).toEqual([]);
  });

  it('describes keyword filter', () => {
    const state = createEmptyFacetState();
    state.q = 'hazelnut';
    const filters = describeActiveFilters(state);
    expect(filters).toHaveLength(1);
    expect(filters[0].label).toBe('Keyword: hazelnut');
    expect(filters[0].removeAction.type).toBe('clear-keyword');
  });

  it('describes multi-select filters', () => {
    const state = createEmptyFacetState();
    state.multiSelect.category = ['Nut Trees', 'Berries'];
    const filters = describeActiveFilters(state);
    expect(filters).toHaveLength(2);
    expect(filters[0].label).toBe('Nut Trees');
    expect(filters[1].label).toBe('Berries');
    expect(filters[0].removeAction).toEqual({ type: 'toggle', facetKey: 'category', value: 'Nut Trees' });
  });

  it('describes boolean filter', () => {
    const state = createEmptyFacetState();
    state.booleans.available = true;
    const filters = describeActiveFilters(state);
    expect(filters).toHaveLength(1);
    expect(filters[0].label).toBe('In stock');
  });

  it('describes combined zone (min=max) as single pill', () => {
    const state = createEmptyFacetState();
    state.rangeMin.zoneMin = '5';
    state.rangeMax.zoneMax = '5';
    const filters = describeActiveFilters(state);
    expect(filters).toHaveLength(1);
    expect(filters[0].label).toBe('Showing plants for Zone 5');
  });

  it('describes separate zone min/max as two pills', () => {
    const state = createEmptyFacetState();
    state.rangeMin.zoneMin = '3';
    state.rangeMax.zoneMax = '7';
    const filters = describeActiveFilters(state);
    expect(filters).toHaveLength(2);
    expect(filters[0].label).toBe('Zone min: 3');
    expect(filters[1].label).toBe('Zone max: 7');
  });

  it('describes range facets with units', () => {
    const state = createEmptyFacetState();
    state.rangeMin.chillHoursMin = '600';
    state.rangeMax.heightMax = '20';
    const filters = describeActiveFilters(state);
    expect(filters.find((f) => f.label === 'Chill Hours min: 600hrs')).toBeTruthy();
    expect(filters.find((f) => f.label === 'Mature Height (ft) max: 20ft')).toBeTruthy();
  });
});

describe('countActiveFilters', () => {
  it('returns 0 for empty state', () => {
    expect(countActiveFilters(createEmptyFacetState())).toBe(0);
  });

  it('counts multi-select values individually', () => {
    const state = createEmptyFacetState();
    state.multiSelect.category = ['Nut Trees', 'Berries'];
    state.multiSelect.sun = ['Full Sun'];
    expect(countActiveFilters(state)).toBe(3);
  });

  it('counts combined zone as 1', () => {
    const state = createEmptyFacetState();
    state.rangeMin.zoneMin = '5';
    state.rangeMax.zoneMax = '5';
    expect(countActiveFilters(state)).toBe(1);
  });

  it('counts boolean as 1', () => {
    const state = createEmptyFacetState();
    state.booleans.available = true;
    expect(countActiveFilters(state)).toBe(1);
  });
});

describe('registry helpers', () => {
  it('FACET_REGISTRY has all expected facets', () => {
    const keys = FACET_REGISTRY.map((f) => f.key);
    expect(keys).toContain('category');
    expect(keys).toContain('zone');
    expect(keys).toContain('available');
    expect(keys).toContain('sun');
    expect(keys).toContain('growthRate');
    expect(keys).toContain('chillHours');
    expect(keys).toContain('height');
    expect(keys).toContain('soilPh');
  });

  it('getVisibleFacets shows unconditional facets with no category selected', () => {
    const visible = getVisibleFacets([]);
    const keys = visible.map((f) => f.key);
    expect(keys).toContain('category');
    expect(keys).toContain('zone');
    expect(keys).toContain('available');
    expect(keys).toContain('sun');
    expect(keys).toContain('growthRate');
    // Contextual facets should be hidden
    expect(keys).not.toContain('chillHours');
    expect(keys).not.toContain('height');
    expect(keys).not.toContain('soilPh');
  });

  it('getVisibleFacets shows nut tree facets when Nut Trees selected', () => {
    const visible = getVisibleFacets(['Nut Trees']);
    const keys = visible.map((f) => f.key);
    expect(keys).toContain('chillHours');
    expect(keys).toContain('bearingAge');
    expect(keys).toContain('height');
    expect(keys).toContain('spread');
    expect(keys).not.toContain('soilPh');
  });

  it('getVisibleFacets shows berry facets when Berries selected', () => {
    const visible = getVisibleFacets(['Berries']);
    const keys = visible.map((f) => f.key);
    expect(keys).toContain('soilPh');
    expect(keys).toContain('height');
    expect(keys).not.toContain('chillHours');
  });

  it('getVisibleFacets hides contextual facets when multiple categories selected', () => {
    const visible = getVisibleFacets(['Nut Trees', 'Berries']);
    const keys = visible.map((f) => f.key);
    expect(keys).not.toContain('chillHours');
    expect(keys).not.toContain('soilPh');
    expect(keys).not.toContain('height');
  });

  it('getFacetsByGroup returns sorted groups', () => {
    const groups = getFacetsByGroup([]);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups[0].group.key).toBe('discovery');
    expect(groups[1].group.key).toBe('growing');
  });
});
