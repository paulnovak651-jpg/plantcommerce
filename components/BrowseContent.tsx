'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BrowsePlant } from '@/lib/queries/browse';
import { groupBrowsePlantsByGenus } from '@/lib/queries/browse';
import { filterWithFacets, type FacetCounts as QueryFacetCounts, type RecoveryHint } from '@/lib/queries/facet-query-builder';
import { parseFacetState, serializeFacetState, type FacetState } from '@/lib/facets/state';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';
import {
  PlantFilterSidebar,
} from '@/components/PlantFilterSidebar';
import type { FacetCounts as SidebarFacetCounts, FilterValues } from '@/components/PlantFilterSidebar';
import { getUserZone } from '@/lib/zone-persistence';
import { BrowseShell } from '@/components/browse/BrowseShell';
import { BrowseHeader } from '@/components/browse/BrowseHeader';
import { BrowseGrid } from '@/components/browse/BrowseGrid';
import { CategoryContext } from '@/components/browse/CategoryContext';
import type { FilterPill } from '@/components/browse/ActiveFilterPills';
import { FACET_REGISTRY } from '@/lib/facets/registry';

const PER_PAGE = 24;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Bridge: FacetState ↔ sidebar types
// ---------------------------------------------------------------------------

/** Convert FacetState → FilterValues for the registry-driven sidebar. */
function toFilterValues(state: FacetState): FilterValues {
  return {
    multiSelect: state.multiSelect,
    booleans: state.booleans,
    rangeMin: state.rangeMin,
    rangeMax: state.rangeMax,
  };
}

/** Convert query builder FacetCounts → sidebar FacetCounts shape. */
function toSidebarCounts(counts: QueryFacetCounts): SidebarFacetCounts {
  const multiSelect: Record<string, Record<string, number>> = {};
  const boolean: Record<string, number> = {};

  for (const facet of FACET_REGISTRY) {
    if (!facet.countable) continue;
    const facetCounts = counts[facet.key];
    if (!facetCounts) continue;

    if (facet.type === 'multi-select') {
      multiSelect[facet.key] = facetCounts;
    } else if (facet.type === 'boolean') {
      boolean[facet.key] = facetCounts['true'] ?? 0;
    }
  }

  return { multiSelect, boolean };
}

/** Build active filter pills from FacetState. */
function buildActivePills(
  state: FacetState,
  updateState: (patch: Partial<FacetState>) => void
): FilterPill[] {
  const pills: FilterPill[] = [];

  if (state.q.trim()) {
    pills.push({
      label: `Keyword: ${state.q.trim()}`,
      onRemove: () => updateState({ q: '' }),
    });
  }

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select': {
        const values = state.multiSelect[facet.key] ?? [];
        for (const value of values) {
          const option = facet.options?.find((o) => o.value === value);
          pills.push({
            label: option?.label ?? value,
            onRemove: () => {
              const updated = (state.multiSelect[facet.key] ?? []).filter((v) => v !== value);
              updateState({
                multiSelect: { ...state.multiSelect, [facet.key]: updated },
              });
            },
          });
        }
        break;
      }
      case 'boolean': {
        if (state.booleans[facet.key]) {
          pills.push({
            label: 'In stock',
            onRemove: () =>
              updateState({ booleans: { ...state.booleans, [facet.key]: false } }),
          });
        }
        break;
      }
      case 'zone-range': {
        const minParam = facet.rangeMinParam ?? `${facet.key}Min`;
        const maxParam = facet.rangeMaxParam ?? `${facet.key}Max`;
        const minVal = state.rangeMin[minParam] ?? '';
        const maxVal = state.rangeMax[maxParam] ?? '';

        if (minVal && maxVal && minVal === maxVal) {
          pills.push({
            label: `Showing plants for Zone ${minVal}`,
            onRemove: () =>
              updateState({
                rangeMin: { ...state.rangeMin, [minParam]: '' },
                rangeMax: { ...state.rangeMax, [maxParam]: '' },
              }),
          });
        } else {
          if (minVal) {
            pills.push({
              label: `Zone min: ${minVal}`,
              onRemove: () =>
                updateState({ rangeMin: { ...state.rangeMin, [minParam]: '' } }),
            });
          }
          if (maxVal) {
            pills.push({
              label: `Zone max: ${maxVal}`,
              onRemove: () =>
                updateState({ rangeMax: { ...state.rangeMax, [maxParam]: '' } }),
            });
          }
        }
        break;
      }
      case 'range': {
        const minParam = facet.rangeMinParam ?? `${facet.key}Min`;
        const maxParam = facet.rangeMaxParam ?? `${facet.key}Max`;
        const minVal = state.rangeMin[minParam] ?? '';
        const maxVal = state.rangeMax[maxParam] ?? '';
        const unit = facet.unit ?? '';

        if (minVal) {
          pills.push({
            label: `${facet.label} min: ${minVal}${unit}`,
            onRemove: () =>
              updateState({ rangeMin: { ...state.rangeMin, [minParam]: '' } }),
          });
        }
        if (maxVal) {
          pills.push({
            label: `${facet.label} max: ${maxVal}${unit}`,
            onRemove: () =>
              updateState({ rangeMax: { ...state.rangeMax, [maxParam]: '' } }),
          });
        }
        break;
      }
    }
  }

  return pills;
}

// ---------------------------------------------------------------------------
// API response type
// ---------------------------------------------------------------------------

interface BrowseApiResponse {
  ok: boolean;
  data?: {
    plants: BrowsePlant[];
    facetCounts: QueryFacetCounts;
    recoveryHints: RecoveryHint[];
    groupBy: 'species' | 'genus';
  };
  meta?: {
    total?: number;
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function BrowseContent({ allPlants }: { allPlants: BrowsePlant[] }) {
  const searchParams = useSearchParams();

  // FacetState is the single source of truth for all filter state
  const [facetState, setFacetState] = useState<FacetState>(() =>
    parseFacetState(searchParams)
  );

  // API-driven results state
  const [apiPlants, setApiPlants] = useState<BrowsePlant[] | null>(null);
  const [apiTotal, setApiTotal] = useState<number | null>(null);
  const [apiFacetCounts, setApiFacetCounts] = useState<QueryFacetCounts | null>(null);
  const [apiRecoveryHints, setApiRecoveryHints] = useState<RecoveryHint[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether user has made changes (to know when to show API data vs seed data)
  const [hasUserChanged, setHasUserChanged] = useState(false);

  // Pre-fill zone from localStorage if URL doesn't already have zone params
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.get('zoneMin') && !sp.get('zoneMax')) {
      const zone = getUserZone();
      if (zone) {
        setFacetState((prev) => ({
          ...prev,
          rangeMin: { ...prev.rangeMin, zoneMin: String(zone) },
          rangeMax: { ...prev.rangeMax, zoneMax: String(zone) },
        }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for zone changes from ZonePrompt/ZoneBanner
  useEffect(() => {
    function handleZoneChanged(e: Event) {
      const zone = (e as CustomEvent<number | null>).detail;
      setFacetState((prev) => ({
        ...prev,
        rangeMin: { ...prev.rangeMin, zoneMin: zone ? String(zone) : '' },
        rangeMax: { ...prev.rangeMax, zoneMax: zone ? String(zone) : '' },
        page: 1,
      }));
    }
    window.addEventListener('zone-changed', handleZoneChanged);
    return () => window.removeEventListener('zone-changed', handleZoneChanged);
  }, []);

  // Sync URL when facet state changes
  useEffect(() => {
    const qs = serializeFacetState(facetState);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [facetState]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [facetState.page]);

  // -------------------------------------------------------------------------
  // API fetch with debouncing
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!hasUserChanged) return;

    // Cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      const qs = serializeFacetState(facetState);
      const perPage = facetState.groupBy === 'genus' ? 999 : PER_PAGE;
      const url = `/api/browse?${qs}&perPage=${perPage}`;

      fetch(url, { signal: controller.signal, cache: 'no-store' })
        .then((res) => res.json() as Promise<BrowseApiResponse>)
        .then((data) => {
          if (controller.signal.aborted) return;
          if (data.ok && data.data) {
            setApiPlants(data.data.plants);
            setApiTotal(data.meta?.total ?? data.data.plants.length);
            setApiFacetCounts(data.data.facetCounts);
            setApiRecoveryHints(data.data.recoveryHints ?? []);
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error('Browse API error:', err);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [facetState, hasUserChanged]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Compute data — use API results if available, else seed data
  // -------------------------------------------------------------------------

  // SSR seed computation (used before first API response)
  const seedResult = useMemo(() => {
    if (hasUserChanged && apiPlants !== null) return null;
    return filterWithFacets(allPlants, facetState, PER_PAGE);
  }, [allPlants, facetState, hasUserChanged, apiPlants]);

  const plants = apiPlants ?? seedResult?.plants ?? [];
  const total = apiTotal ?? seedResult?.total ?? 0;
  const facetCounts = apiFacetCounts ?? seedResult?.facetCounts ?? {};
  const recoveryHints = apiRecoveryHints.length > 0
    ? apiRecoveryHints
    : seedResult?.recoveryHints ?? [];
  const totalPages = Math.ceil(total / PER_PAGE);

  const sidebarCounts = useMemo(() => toSidebarCounts(facetCounts), [facetCounts]);

  const genusGroups = useMemo(() => {
    if (facetState.groupBy !== 'genus') return [];
    return groupBrowsePlantsByGenus(plants, GENUS_COMMON_NAMES);
  }, [facetState.groupBy, plants]);

  // -------------------------------------------------------------------------
  // State update helper
  // -------------------------------------------------------------------------

  const updateState = useCallback((patch: Partial<FacetState>) => {
    setHasUserChanged(true);
    setFacetState((prev) => {
      const next = { ...prev, ...patch };
      // Reset page on non-page changes
      if (!('page' in patch)) next.page = 1;
      // Merge nested objects if provided
      if (patch.multiSelect) next.multiSelect = { ...prev.multiSelect, ...patch.multiSelect };
      if (patch.booleans) next.booleans = { ...prev.booleans, ...patch.booleans };
      if (patch.rangeMin) next.rangeMin = { ...prev.rangeMin, ...patch.rangeMin };
      if (patch.rangeMax) next.rangeMax = { ...prev.rangeMax, ...patch.rangeMax };
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setHasUserChanged(true);
    setFacetState((prev) => {
      const empty = parseFacetState(new URLSearchParams());
      return { ...empty, groupBy: prev.groupBy };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Sidebar callbacks (bridge registry keys to FacetState)
  // -------------------------------------------------------------------------

  const handleMultiSelectToggle = useCallback(
    (facetKey: string, value: string) => {
      setHasUserChanged(true);
      setFacetState((prev) => {
        const current = prev.multiSelect[facetKey] ?? [];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return {
          ...prev,
          multiSelect: { ...prev.multiSelect, [facetKey]: updated },
          page: 1,
        };
      });
    },
    []
  );

  const handleBooleanToggle = useCallback(
    (facetKey: string) => {
      setHasUserChanged(true);
      setFacetState((prev) => ({
        ...prev,
        booleans: { ...prev.booleans, [facetKey]: !prev.booleans[facetKey] },
        page: 1,
      }));
    },
    []
  );

  const handleRangeChange = useCallback(
    (param: string, value: string) => {
      setHasUserChanged(true);
      setFacetState((prev) => {
        // Determine if it's a min or max param
        const isMin = param.endsWith('Min') || param === 'zoneMin';
        if (isMin) {
          return { ...prev, rangeMin: { ...prev.rangeMin, [param]: value }, page: 1 };
        }
        return { ...prev, rangeMax: { ...prev.rangeMax, [param]: value }, page: 1 };
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Active pills
  // -------------------------------------------------------------------------

  const activePills = useMemo(
    () => buildActivePills(facetState, updateState),
    [facetState, updateState]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const headerTotal = facetState.groupBy === 'genus' ? genusGroups.length : total;
  const headerPage = facetState.groupBy === 'genus' ? 1 : facetState.page;
  const headerPerPage = facetState.groupBy === 'genus' ? genusGroups.length : PER_PAGE;
  const selectedCategories = facetState.multiSelect['category'] ?? [];

  return (
    <BrowseShell
      sidebar={
        <PlantFilterSidebar
          filterValues={toFilterValues(facetState)}
          facetCounts={sidebarCounts}
          totalResults={total}
          selectedCategories={selectedCategories}
          onMultiSelectToggle={handleMultiSelectToggle}
          onBooleanToggle={handleBooleanToggle}
          onRangeChange={handleRangeChange}
          onClearAll={clearAll}
        />
      }
    >
      {selectedCategories.length === 1 && (
        <CategoryContext
          category={selectedCategories[0]}
          total={headerTotal}
          onClear={() =>
            updateState({ multiSelect: { ...facetState.multiSelect, category: [] } })
          }
        />
      )}

      <BrowseHeader
        query={facetState.q}
        sort={facetState.sort}
        groupBy={facetState.groupBy}
        total={headerTotal}
        page={headerPage}
        perPage={headerPerPage}
        selectedCategories={selectedCategories}
        onQueryChange={(value) => updateState({ q: value })}
        onSortChange={(v) => updateState({ sort: v, page: 1 })}
        onGroupByChange={(v) => updateState({ groupBy: v, page: 1 })}
        onCategorySelect={(cat) =>
          updateState({ multiSelect: { ...facetState.multiSelect, category: [cat] } })
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="ml-2 text-sm text-text-tertiary">Updating results...</span>
        </div>
      )}

      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
        <BrowseGrid
          groupBy={facetState.groupBy}
          plants={plants}
          genusGroups={genusGroups}
          activePills={activePills}
          recoveryHints={recoveryHints}
          currentPage={facetState.page}
          totalPages={totalPages}
          onPageChange={(p) => updateState({ page: p })}
          onClearAll={clearAll}
        />
      </div>
    </BrowseShell>
  );
}
