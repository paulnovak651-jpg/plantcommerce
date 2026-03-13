'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { CategoryTreeSidebar } from '@/components/browse/CategoryTreeSidebar';
import { BrowseBreadcrumb } from '@/components/browse/BrowseBreadcrumb';
import type { FilterPill } from '@/components/browse/ActiveFilterPills';
import { FACET_REGISTRY } from '@/lib/facets/registry';
import { getTopCategory, CATEGORY_MAPPING } from '@/lib/browse-categories';
import { getGenusCounts } from '@/lib/queries/genus-counts';

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
// Helpers: resolve display_category values for a top-level browse category
// ---------------------------------------------------------------------------

function getDisplayCategoriesForSlug(slug: string): string[] {
  return Object.entries(CATEGORY_MAPPING)
    .filter(([, mapped]) => mapped === slug)
    .map(([displayCat]) => displayCat);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function BrowseContent({ allPlants }: { allPlants: BrowsePlant[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // FacetState is the single source of truth for all filter state
  const [facetState, setFacetState] = useState<FacetState>(() => {
    const initial = parseFacetState(searchParams);
    // Pre-populate category filter from ?cat= URL param
    const initialCat = searchParams.get('cat');
    if (initialCat) {
      const displayCats = getDisplayCategoriesForSlug(initialCat);
      initial.multiSelect = { ...initial.multiSelect, category: displayCats };
    }
    return initial;
  });

  const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(
    () => searchParams.get('cat'),
  );
  const [selectedGenus, setSelectedGenus] = useState<string | null>(
    () => searchParams.get('genus'),
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
  const [hasUserChanged, setHasUserChanged] = useState(() => {
    // If URL has any filter params, consider it a "user change" to trigger API fetch
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return !!(sp.get('cat') || sp.get('genus') || sp.get('q') || sp.get('category') || sp.get('available'));
  });

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

  // Sync URL when facet state or funnel state changes
  useEffect(() => {
    const qs = serializeFacetState(facetState);
    const params = new URLSearchParams(qs);

    // Add funnel params
    if (selectedTopCategory) params.set('cat', selectedTopCategory);
    else params.delete('cat');
    if (selectedGenus) params.set('genus', selectedGenus);
    else params.delete('genus');

    const finalQs = params.toString();
    const url = finalQs ? `/?${finalQs}` : '/';
    router.replace(url, { scroll: false });
  }, [facetState, selectedTopCategory, selectedGenus, router]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [facetState.page]);

  // -------------------------------------------------------------------------
  // Category / genus navigation (sidebar-driven)
  // -------------------------------------------------------------------------

  const handleCategorySelect = useCallback((slug: string | null) => {
    setSelectedTopCategory(slug);
    setSelectedGenus(null);
    setHasUserChanged(true);
    if (slug) {
      const displayCats = getDisplayCategoriesForSlug(slug);
      setFacetState((prev) => ({
        ...prev,
        multiSelect: { ...prev.multiSelect, category: displayCats },
        page: 1,
      }));
    } else {
      // Clear category filter
      setFacetState((prev) => ({
        ...prev,
        multiSelect: { ...prev.multiSelect, category: [] },
        page: 1,
      }));
    }
  }, []);

  const handleGenusSelect = useCallback((genusSlug: string | null) => {
    setSelectedGenus(genusSlug);
    setHasUserChanged(true);
    setFacetState((prev) => ({
      ...prev,
      page: 1,
    }));
  }, []);

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
      const params = new URLSearchParams(qs);
      // Add genus filter if selected
      if (selectedGenus) params.set('genus', selectedGenus);
      const perPage = facetState.groupBy === 'genus' ? 999 : PER_PAGE;
      params.set('perPage', String(perPage));
      const url = `/api/browse?${params.toString()}`;

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
  }, [facetState, hasUserChanged, selectedGenus]);

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

  // For cultivar step, filter by genus client-side when using seed data
  const filteredSeedPlants = useMemo(() => {
    if (!seedResult?.plants || !selectedGenus) return seedResult?.plants ?? [];
    return seedResult.plants.filter((p) => {
      const slug = p.genus_slug?.replace(/^genus-/, '');
      return slug === selectedGenus;
    });
  }, [seedResult, selectedGenus]);

  const plants = apiPlants ?? filteredSeedPlants;
  const total = apiTotal ?? (selectedGenus ? filteredSeedPlants.length : seedResult?.total ?? 0);
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

  // Genus counts for sidebar tree
  const genusCounts = useMemo(() => {
    if (!selectedTopCategory) return {};
    return getGenusCounts(allPlants, selectedTopCategory);
  }, [selectedTopCategory, allPlants]);

  // Resolve top category and genus label for breadcrumb
  const topCategory = selectedTopCategory ? getTopCategory(selectedTopCategory) : undefined;
  const genusEntry = topCategory?.genera.find((g) => g.genusSlug === selectedGenus);

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
  // Render — always show unified sidebar + grid layout
  // -------------------------------------------------------------------------

  const headerTotal = facetState.groupBy === 'genus' ? genusGroups.length : total;
  const headerPage = facetState.groupBy === 'genus' ? 1 : facetState.page;
  const headerPerPage = facetState.groupBy === 'genus' ? genusGroups.length : PER_PAGE;
  const selectedCategories = facetState.multiSelect['category'] ?? [];

  return (
    <>
      <BrowseBreadcrumb
        step="cultivars"
        categoryLabel={topCategory?.label}
        genusLabel={genusEntry?.commonName}
        onNavigate={(step) => {
          if (step === 'categories') {
            handleCategorySelect(null);
          } else if (step === 'genera') {
            handleGenusSelect(null);
          }
        }}
      />
      <BrowseShell
        sidebar={
          <div>
            <CategoryTreeSidebar
              selectedCategory={selectedTopCategory}
              selectedGenus={selectedGenus}
              genusCounts={genusCounts}
              onCategorySelect={handleCategorySelect}
              onGenusSelect={handleGenusSelect}
            />
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
          </div>
        }
      >
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
          inFunnel={!!(selectedTopCategory || selectedGenus)}
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
    </>
  );
}
