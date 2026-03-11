import { describe, it, expect } from 'vitest';
import {
  facetStateToBrowseFilters,
  filterWithFacets,
  type FacetCounts,
} from '../facet-query-builder';
import { createEmptyFacetState, type FacetState } from '@/lib/facets/state';
import type { BrowsePlant } from '../browse';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makePlant(overrides: Partial<BrowsePlant> = {}): BrowsePlant {
  return {
    id: 'p1',
    slug: 'test-plant',
    canonical_name: 'Test Plant',
    botanical_name: null,
    display_category: 'Nut Trees',
    nursery_count: 2,
    cultivar_count: 3,
    zone_min: 4,
    zone_max: 8,
    chill_hours_min: 600,
    chill_hours_max: 1200,
    years_to_bearing_min: 3,
    years_to_bearing_max: 7,
    mature_height_min_ft: 15,
    mature_height_max_ft: 30,
    mature_spread_min_ft: 10,
    mature_spread_max_ft: 20,
    soil_ph_min: 5.5,
    soil_ph_max: 7.0,
    sun_requirement: 'Full Sun',
    growth_rate: 'Moderate',
    genus_slug: 'genus-corylus',
    genus_name: 'Corylus',
    lowest_price_cents: 1999,
    best_nursery_name: 'Test Nursery',
    has_growing_profile: true,
    ...overrides,
  };
}

const PLANTS: BrowsePlant[] = [
  makePlant({ id: 'p1', slug: 'hazelnut', canonical_name: 'European Hazelnut', display_category: 'Nut Trees', sun_requirement: 'Full Sun', growth_rate: 'Moderate', nursery_count: 3, zone_min: 4, zone_max: 8 }),
  makePlant({ id: 'p2', slug: 'chestnut', canonical_name: 'American Chestnut', display_category: 'Nut Trees', sun_requirement: 'Full Sun', growth_rate: 'Slow', nursery_count: 1, zone_min: 5, zone_max: 9 }),
  makePlant({ id: 'p3', slug: 'blueberry', canonical_name: 'Highbush Blueberry', display_category: 'Berries', sun_requirement: 'Full Sun', growth_rate: 'Slow', nursery_count: 0, zone_min: 3, zone_max: 7 }),
  makePlant({ id: 'p4', slug: 'fig', canonical_name: 'Common Fig', display_category: 'Figs', sun_requirement: 'Full Sun', growth_rate: 'Fast', nursery_count: 2, zone_min: 7, zone_max: 11 }),
  makePlant({ id: 'p5', slug: 'apple', canonical_name: 'Apple', display_category: 'Apples & Crabapples', sun_requirement: null, growth_rate: null, nursery_count: 0, zone_min: null, zone_max: null }),
];

function emptyState(): FacetState {
  return createEmptyFacetState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('facetStateToBrowseFilters', () => {
  it('returns empty filters for empty state', () => {
    const filters = facetStateToBrowseFilters(emptyState());
    expect(filters.categories).toBeUndefined();
    expect(filters.sun).toBeUndefined();
    expect(filters.availableOnly).toBeUndefined();
    expect(filters.sort).toBe('name-asc');
  });

  it('maps multi-select facets', () => {
    const state = emptyState();
    state.multiSelect['category'] = ['Nut Trees', 'Berries'];
    state.multiSelect['sun'] = ['Full Sun'];
    const filters = facetStateToBrowseFilters(state);
    expect(filters.categories).toEqual(['Nut Trees', 'Berries']);
    expect(filters.sun).toEqual(['Full Sun']);
  });

  it('maps boolean facets', () => {
    const state = emptyState();
    state.booleans['available'] = true;
    const filters = facetStateToBrowseFilters(state);
    expect(filters.availableOnly).toBe(true);
  });

  it('maps range facets', () => {
    const state = emptyState();
    state.rangeMin['zoneMin'] = '4';
    state.rangeMax['zoneMax'] = '8';
    state.rangeMin['chillHoursMin'] = '600';
    const filters = facetStateToBrowseFilters(state);
    expect(filters.zoneMin).toBe(4);
    expect(filters.zoneMax).toBe(8);
    expect(filters.chillHoursMin).toBe(600);
    expect(filters.chillHoursMax).toBeNull();
  });

  it('ignores non-numeric range values', () => {
    const state = emptyState();
    state.rangeMin['zoneMin'] = 'abc';
    const filters = facetStateToBrowseFilters(state);
    expect(filters.zoneMin).toBeNull();
  });
});

describe('filterWithFacets', () => {
  it('returns all plants with empty state', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    expect(result.total).toBe(5);
    expect(result.plants).toHaveLength(5);
  });

  it('filters by category multi-select', () => {
    const state = emptyState();
    state.multiSelect['category'] = ['Nut Trees'];
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(2);
    expect(result.plants.map((p) => p.slug)).toEqual(['chestnut', 'hazelnut']);
  });

  it('filters by multiple categories', () => {
    const state = emptyState();
    state.multiSelect['category'] = ['Nut Trees', 'Figs'];
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(3);
  });

  it('filters by boolean (available)', () => {
    const state = emptyState();
    state.booleans['available'] = true;
    const result = filterWithFacets(PLANTS, state);
    // Blueberry has 0 nurseries, Apple has 0 nurseries
    expect(result.total).toBe(3);
    expect(result.plants.every((p) => p.nursery_count > 0)).toBe(true);
  });

  it('filters by zone range', () => {
    const state = emptyState();
    state.rangeMin['zoneMin'] = '5';
    state.rangeMax['zoneMax'] = '5';
    const result = filterWithFacets(PLANTS, state);
    // Zone 5 compatible: hazelnut (4-8), chestnut (5-9), blueberry (3-7), apple (null)
    // Not compatible: fig (7-11)
    expect(result.total).toBe(4);
    expect(result.plants.map((p) => p.slug)).not.toContain('fig');
  });

  it('filters by sun requirement', () => {
    const state = emptyState();
    state.multiSelect['sun'] = ['Full Sun'];
    const result = filterWithFacets(PLANTS, state);
    // Apple has null sun_requirement, so excluded
    expect(result.total).toBe(4);
    expect(result.plants.map((p) => p.slug)).not.toContain('apple');
  });

  it('filters by keyword', () => {
    const state = emptyState();
    state.q = 'hazelnut';
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(1);
    expect(result.plants[0].slug).toBe('hazelnut');
  });

  it('combines multiple filters', () => {
    const state = emptyState();
    state.multiSelect['category'] = ['Nut Trees'];
    state.booleans['available'] = true;
    const result = filterWithFacets(PLANTS, state);
    // Both nut trees have nurseries
    expect(result.total).toBe(2);
  });

  it('sorts by name ascending by default', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    // American Chestnut, Apple, Common Fig, European Hazelnut, Highbush Blueberry
    expect(result.plants[0].slug).toBe('chestnut');
    expect(result.plants[4].slug).toBe('blueberry');
  });

  it('sorts by name descending', () => {
    const state = emptyState();
    state.sort = 'name-desc';
    const result = filterWithFacets(PLANTS, state);
    expect(result.plants[0].slug).toBe('blueberry');
    expect(result.plants[4].slug).toBe('chestnut');
  });

  it('sorts by availability', () => {
    const state = emptyState();
    state.sort = 'available';
    const result = filterWithFacets(PLANTS, state);
    expect(result.plants[0].slug).toBe('hazelnut'); // 3 nurseries
  });

  it('paginates correctly', () => {
    const state = emptyState();
    state.page = 1;
    const result = filterWithFacets(PLANTS, state, 2);
    expect(result.total).toBe(5);
    expect(result.plants).toHaveLength(2);

    state.page = 3;
    const page3 = filterWithFacets(PLANTS, state, 2);
    expect(page3.plants).toHaveLength(1);
  });
});

describe('facet counts', () => {
  it('computes category counts against all plants', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    const categoryCounts = result.facetCounts['category'];
    expect(categoryCounts['Nut Trees']).toBe(2);
    expect(categoryCounts['Berries']).toBe(1);
    expect(categoryCounts['Figs']).toBe(1);
    expect(categoryCounts['Apples & Crabapples']).toBe(1);
  });

  it('computes counts excluding own facet (cross-facet)', () => {
    const state = emptyState();
    state.multiSelect['category'] = ['Nut Trees'];
    const result = filterWithFacets(PLANTS, state);

    // Category counts should show ALL options (not filtered by category itself)
    const categoryCounts = result.facetCounts['category'];
    expect(categoryCounts['Nut Trees']).toBe(2);
    expect(categoryCounts['Berries']).toBe(1);
    expect(categoryCounts['Figs']).toBe(1);

    // But availability count SHOULD be filtered by category = Nut Trees
    const availCount = result.facetCounts['available'];
    expect(availCount['true']).toBe(2); // Both nut trees have nurseries
  });

  it('computes availability count', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    expect(result.facetCounts['available']['true']).toBe(3);
  });

  it('computes sun counts', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    expect(result.facetCounts['sun']['Full Sun']).toBe(4);
  });

  it('computes growth rate counts', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    const growthCounts = result.facetCounts['growthRate'];
    expect(growthCounts['Slow']).toBe(2);
    expect(growthCounts['Moderate']).toBe(1);
    expect(growthCounts['Fast']).toBe(1);
  });
});

describe('recovery hints', () => {
  it('returns empty hints when results exist', () => {
    const result = filterWithFacets(PLANTS, emptyState());
    expect(result.recoveryHints).toEqual([]);
  });

  it('returns hints when no results match', () => {
    const state = emptyState();
    // Combine filters that produce zero results: Quinces + available
    state.multiSelect['category'] = ['Quinces'];
    state.booleans['available'] = true;
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(0);
    expect(result.recoveryHints.length).toBeGreaterThan(0);
  });

  it('hints show which filter to remove for most results', () => {
    const state = emptyState();
    // Quinces has 0 plants, available filters further
    state.multiSelect['category'] = ['Quinces'];
    state.booleans['available'] = true;
    const result = filterWithFacets(PLANTS, state);

    // Removing category (Quinces) while keeping available should show 3 results
    const categoryHint = result.recoveryHints.find((h) => h.facetKey === 'category');
    expect(categoryHint).toBeDefined();
    expect(categoryHint!.resultCount).toBe(3); // 3 plants have nurseries

    // Removing available while keeping Quinces should show 0 (no quinces)
    const availHint = result.recoveryHints.find((h) => h.facetKey === 'available');
    expect(availHint).toBeUndefined(); // 0 results so no hint
  });

  it('sorts hints by most results first', () => {
    const state = emptyState();
    state.q = 'nonexistent';
    state.multiSelect['category'] = ['Nut Trees'];
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(0);

    if (result.recoveryHints.length >= 2) {
      // Sorted descending by resultCount
      for (let i = 1; i < result.recoveryHints.length; i++) {
        expect(result.recoveryHints[i - 1].resultCount)
          .toBeGreaterThanOrEqual(result.recoveryHints[i].resultCount);
      }
    }
  });

  it('includes keyword removal hint', () => {
    const state = emptyState();
    state.q = 'xyznonexistent';
    const result = filterWithFacets(PLANTS, state);
    expect(result.total).toBe(0);

    const keywordHint = result.recoveryHints.find((h) => h.facetKey === 'q');
    expect(keywordHint).toBeDefined();
    expect(keywordHint!.resultCount).toBe(5); // all plants without keyword
  });
});
