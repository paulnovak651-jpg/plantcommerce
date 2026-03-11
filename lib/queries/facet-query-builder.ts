import type { SupabaseClient } from '@supabase/supabase-js';
import type { FacetState } from '@/lib/facets/state';
import { FACET_REGISTRY, type FacetDefinition } from '@/lib/facets/registry';
import { getAllBrowsePlants, type BrowsePlant, type BrowseFilters } from './browse';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Facet counts: for each countable facet key, a record of option → count. */
export type FacetCounts = Record<string, Record<string, number>>;

/** Recovery hint for zero-result states: removing this facet yields N results. */
export interface RecoveryHint {
  facetKey: string;
  label: string;
  resultCount: number;
}

export interface FacetQueryResult {
  plants: BrowsePlant[];
  total: number;
  facetCounts: FacetCounts;
  /** Present when total === 0, suggests which filters to remove. */
  recoveryHints: RecoveryHint[];
}

// ---------------------------------------------------------------------------
// FacetState → BrowseFilters bridge
// ---------------------------------------------------------------------------

/**
 * Convert normalized FacetState (URL-shaped, registry-keyed) into the
 * BrowseFilters shape that the existing data layer understands.
 */
export function facetStateToBrowseFilters(state: FacetState): BrowseFilters {
  const filters: BrowseFilters = {};

  filters.q = state.q.trim() || undefined;
  filters.sort = state.sort;
  filters.page = state.page;

  // Multi-selects
  const categories = state.multiSelect['category'] ?? [];
  if (categories.length > 0) filters.categories = categories;

  const sun = state.multiSelect['sun'] ?? [];
  if (sun.length > 0) filters.sun = sun;

  const growthRate = state.multiSelect['growthRate'] ?? [];
  if (growthRate.length > 0) filters.growthRate = growthRate;

  // Booleans
  if (state.booleans['available']) filters.availableOnly = true;

  // Ranges
  filters.zoneMin = parseRangeValue(state.rangeMin['zoneMin']);
  filters.zoneMax = parseRangeValue(state.rangeMax['zoneMax']);
  filters.chillHoursMin = parseRangeValue(state.rangeMin['chillHoursMin']);
  filters.chillHoursMax = parseRangeValue(state.rangeMax['chillHoursMax']);
  filters.bearingAgeMin = parseRangeValue(state.rangeMin['bearingAgeMin']);
  filters.bearingAgeMax = parseRangeValue(state.rangeMax['bearingAgeMax']);
  filters.heightMin = parseRangeValue(state.rangeMin['heightMin']);
  filters.heightMax = parseRangeValue(state.rangeMax['heightMax']);
  filters.spreadMin = parseRangeValue(state.rangeMin['spreadMin']);
  filters.spreadMax = parseRangeValue(state.rangeMax['spreadMax']);
  filters.soilPhMin = parseRangeValue(state.rangeMin['soilPhMin']);
  filters.soilPhMax = parseRangeValue(state.rangeMax['soilPhMax']);

  return filters;
}

function parseRangeValue(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Composable filter predicates — registry-driven
// ---------------------------------------------------------------------------

type PlantPredicate = (plant: BrowsePlant) => boolean;

/**
 * Build a filter predicate for a single facet based on the current FacetState.
 * Returns null if the facet has no active constraint.
 */
function buildFacetPredicate(
  facet: FacetDefinition,
  state: FacetState
): PlantPredicate | null {
  switch (facet.type) {
    case 'multi-select':
      return buildMultiSelectPredicate(facet, state);
    case 'boolean':
      return buildBooleanPredicate(facet, state);
    case 'zone-range':
      return buildZoneRangePredicate(facet, state);
    case 'range':
      return buildRangePredicate(facet, state);
    default:
      return null;
  }
}

function buildMultiSelectPredicate(
  facet: FacetDefinition,
  state: FacetState
): PlantPredicate | null {
  const values = state.multiSelect[facet.key] ?? [];
  if (values.length === 0) return null;

  const field = facet.dataFields[0] as keyof BrowsePlant;
  const valuesSet = new Set(values);

  return (plant: BrowsePlant) => {
    const v = plant[field];
    return v != null && valuesSet.has(String(v));
  };
}

function buildBooleanPredicate(
  facet: FacetDefinition,
  state: FacetState
): PlantPredicate | null {
  if (!state.booleans[facet.key]) return null;

  const field = facet.dataFields[0] as keyof BrowsePlant;

  // Boolean facets check for truthy/positive values
  return (plant: BrowsePlant) => {
    const v = plant[field];
    if (typeof v === 'number') return v > 0;
    return Boolean(v);
  };
}

function buildZoneRangePredicate(
  facet: FacetDefinition,
  state: FacetState
): PlantPredicate | null {
  const minParam = facet.rangeMinParam ?? `${facet.key}Min`;
  const maxParam = facet.rangeMaxParam ?? `${facet.key}Max`;
  const minVal = parseRangeValue(state.rangeMin[minParam]);
  const maxVal = parseRangeValue(state.rangeMax[maxParam]);

  if (minVal == null && maxVal == null) return null;

  // Zone fields: plant.zone_min / plant.zone_max
  // A plant is compatible if its zone range overlaps with the user's zone range
  return (plant: BrowsePlant) => {
    if (minVal != null) {
      // User's min zone → plant's max zone must be >= this
      if (plant.zone_max != null && plant.zone_max < minVal) return false;
    }
    if (maxVal != null) {
      // User's max zone → plant's min zone must be <= this
      if (plant.zone_min != null && plant.zone_min > maxVal) return false;
    }
    return true;
  };
}

function buildRangePredicate(
  facet: FacetDefinition,
  state: FacetState
): PlantPredicate | null {
  const minParam = facet.rangeMinParam ?? `${facet.key}Min`;
  const maxParam = facet.rangeMaxParam ?? `${facet.key}Max`;
  const minVal = parseRangeValue(state.rangeMin[minParam]);
  const maxVal = parseRangeValue(state.rangeMax[maxParam]);

  if (minVal == null && maxVal == null) return null;

  // Range facets have two data fields: [minField, maxField]
  const minField = facet.dataFields[0] as keyof BrowsePlant;
  const maxField = facet.dataFields[1] as keyof BrowsePlant;

  return (plant: BrowsePlant) => {
    if (minVal != null) {
      const plantMax = plant[maxField];
      if (plantMax != null && (plantMax as number) < minVal) return false;
    }
    if (maxVal != null) {
      const plantMin = plant[minField];
      if (plantMin != null && (plantMin as number) > maxVal) return false;
    }
    return true;
  };
}

// ---------------------------------------------------------------------------
// Keyword filter
// ---------------------------------------------------------------------------

function matchesKeyword(plant: BrowsePlant, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    plant.canonical_name,
    plant.botanical_name,
    plant.display_category,
    plant.genus_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes(q)) return true;

  const terms = q.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

type SortFn = (a: BrowsePlant, b: BrowsePlant) => number;

const SORT_FUNCTIONS: Record<string, SortFn> = {
  'name-asc': (a, b) => a.canonical_name.localeCompare(b.canonical_name),
  'name-desc': (a, b) => b.canonical_name.localeCompare(a.canonical_name),
  'available': (a, b) => {
    if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
    return a.canonical_name.localeCompare(b.canonical_name);
  },
};

function getSortFn(sort: string): SortFn {
  return SORT_FUNCTIONS[sort] ?? SORT_FUNCTIONS['name-asc'];
}

// ---------------------------------------------------------------------------
// Facet count computation
// ---------------------------------------------------------------------------

/**
 * Compute facet counts for all countable facets.
 * For each facet, counts are computed against the result set filtered by
 * all OTHER active facets (excluding the current facet). This gives accurate
 * counts that reflect how many results each option would yield if selected.
 */
function computeFacetCounts(
  allPlants: BrowsePlant[],
  state: FacetState
): FacetCounts {
  const counts: FacetCounts = {};

  for (const facet of FACET_REGISTRY) {
    if (!facet.countable) continue;

    // Build predicates for all OTHER active facets
    const otherPredicates = FACET_REGISTRY
      .filter((f) => f.key !== facet.key)
      .map((f) => buildFacetPredicate(f, state))
      .filter((p): p is PlantPredicate => p !== null);

    // Also apply keyword filter
    const q = state.q.trim();
    const baseSet = allPlants.filter((plant) => {
      if (q && !matchesKeyword(plant, q)) return false;
      return otherPredicates.every((pred) => pred(plant));
    });

    counts[facet.key] = {};

    if (facet.type === 'multi-select' && facet.options) {
      const field = facet.dataFields[0] as keyof BrowsePlant;
      for (const option of facet.options) {
        counts[facet.key][option.value] = baseSet.filter(
          (p) => p[field] != null && String(p[field]) === option.value
        ).length;
      }
    } else if (facet.type === 'boolean') {
      const field = facet.dataFields[0] as keyof BrowsePlant;
      counts[facet.key]['true'] = baseSet.filter((p) => {
        const v = p[field];
        return typeof v === 'number' ? v > 0 : Boolean(v);
      }).length;
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Recovery hints (for zero-result states)
// ---------------------------------------------------------------------------

/**
 * When the filtered result set is empty, compute how many results each
 * active facet is individually blocking. This helps users understand
 * which filter to remove first to recover results.
 */
function computeRecoveryHints(
  allPlants: BrowsePlant[],
  state: FacetState
): RecoveryHint[] {
  const hints: RecoveryHint[] = [];

  for (const facet of FACET_REGISTRY) {
    const predicate = buildFacetPredicate(facet, state);
    if (!predicate) continue; // facet not active, nothing to remove

    // Build predicates for all OTHER active facets (excluding this one)
    const otherPredicates = FACET_REGISTRY
      .filter((f) => f.key !== facet.key)
      .map((f) => buildFacetPredicate(f, state))
      .filter((p): p is PlantPredicate => p !== null);

    const q = state.q.trim();
    const countWithout = allPlants.filter((plant) => {
      if (q && !matchesKeyword(plant, q)) return false;
      return otherPredicates.every((pred) => pred(plant));
    }).length;

    if (countWithout > 0) {
      hints.push({
        facetKey: facet.key,
        label: facet.label,
        resultCount: countWithout,
      });
    }
  }

  // Also check if removing keyword would help
  if (state.q.trim()) {
    const predicates = FACET_REGISTRY
      .map((f) => buildFacetPredicate(f, state))
      .filter((p): p is PlantPredicate => p !== null);

    const countWithoutKeyword = allPlants.filter((plant) =>
      predicates.every((pred) => pred(plant))
    ).length;

    if (countWithoutKeyword > 0) {
      hints.push({
        facetKey: 'q',
        label: 'Keyword search',
        resultCount: countWithoutKeyword,
      });
    }
  }

  // Sort by most results first — removing the most restrictive filter first
  hints.sort((a, b) => b.resultCount - a.resultCount);

  return hints;
}

// ---------------------------------------------------------------------------
// Main query function
// ---------------------------------------------------------------------------

const DEFAULT_PER_PAGE = 24;

/**
 * Server-side facet query builder.
 *
 * Accepts normalized FacetState, fetches browse data, applies composable
 * registry-driven filters, computes facet counts, and returns paginated results.
 */
export async function queryBrowsePlants(
  supabase: SupabaseClient,
  state: FacetState,
  perPage: number = DEFAULT_PER_PAGE
): Promise<FacetQueryResult> {
  // Fetch all browse plants (the data layer handles multi-table assembly)
  const allPlants = await getAllBrowsePlants(supabase);

  // Build composable filter pipeline from registry
  const predicates = FACET_REGISTRY
    .map((facet) => buildFacetPredicate(facet, state))
    .filter((p): p is PlantPredicate => p !== null);

  const q = state.q.trim();

  // Apply all filters
  let filtered = allPlants.filter((plant) => {
    if (q && !matchesKeyword(plant, q)) return false;
    return predicates.every((pred) => pred(plant));
  });

  // Sort
  filtered.sort(getSortFn(state.sort));

  // Compute facet counts against all plants (with cross-facet exclusion)
  const facetCounts = computeFacetCounts(allPlants, state);

  // Paginate
  const total = filtered.length;
  const page = state.page > 0 ? state.page : 1;
  const start = (page - 1) * perPage;
  const plants = filtered.slice(start, start + perPage);

  // Compute recovery hints only when there are zero results
  const recoveryHints = total === 0
    ? computeRecoveryHints(allPlants, state)
    : [];

  return { plants, total, facetCounts, recoveryHints };
}

/**
 * Apply only filtering (no DB fetch) against a pre-loaded plant array.
 * Useful when the caller already has the plant data (e.g. client-side reuse).
 */
export function filterWithFacets(
  allPlants: BrowsePlant[],
  state: FacetState,
  perPage: number = DEFAULT_PER_PAGE
): FacetQueryResult {
  const predicates = FACET_REGISTRY
    .map((facet) => buildFacetPredicate(facet, state))
    .filter((p): p is PlantPredicate => p !== null);

  const q = state.q.trim();

  let filtered = allPlants.filter((plant) => {
    if (q && !matchesKeyword(plant, q)) return false;
    return predicates.every((pred) => pred(plant));
  });

  filtered.sort(getSortFn(state.sort));

  const facetCounts = computeFacetCounts(allPlants, state);

  const total = filtered.length;
  const page = state.page > 0 ? state.page : 1;
  const start = (page - 1) * perPage;
  const plants = filtered.slice(start, start + perPage);

  const recoveryHints = total === 0
    ? computeRecoveryHints(allPlants, state)
    : [];

  return { plants, total, facetCounts, recoveryHints };
}
