'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowsePlant, filterBrowsePlants, groupBrowsePlantsByGenus, GenusBrowseGroup } from '@/lib/queries/browse';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';
import { PlantCard } from '@/components/PlantCard';
import { PlantFilterSidebar } from '@/components/PlantFilterSidebar';
import { SortBar } from '@/components/SortBar';
import { Pagination } from '@/components/Pagination';
import { getUserZone } from '@/lib/zone-persistence';
import Link from 'next/link';

export interface BrowseFiltersState {
  categories: string[];
  zoneMin: string;
  zoneMax: string;
  available: boolean;
  sun: string[];
  growthRate: string[];
  sort: string;
  page: number;
  groupBy: 'species' | 'genus';
}

function filtersFromParams(sp: URLSearchParams): BrowseFiltersState {
  const groupByParam = sp.get('groupBy');
  return {
    categories: sp.get('category')?.split(',').filter(Boolean) ?? [],
    zoneMin: sp.get('zoneMin') ?? '',
    zoneMax: sp.get('zoneMax') ?? '',
    available: sp.get('available') === 'true',
    sun: sp.get('sun')?.split(',').filter(Boolean) ?? [],
    growthRate: sp.get('growthRate')?.split(',').filter(Boolean) ?? [],
    sort: sp.get('sort') ?? 'name-asc',
    page: sp.get('page') ? Number(sp.get('page')) : 1,
    groupBy: groupByParam === 'genus' ? 'genus' : 'species',
  };
}

function filtersToParams(f: BrowseFiltersState): string {
  const params = new URLSearchParams();
  if (f.categories.length > 0) params.set('category', f.categories.join(','));
  if (f.zoneMin) params.set('zoneMin', f.zoneMin);
  if (f.zoneMax) params.set('zoneMax', f.zoneMax);
  if (f.available) params.set('available', 'true');
  if (f.sun.length > 0) params.set('sun', f.sun.join(','));
  if (f.growthRate.length > 0) params.set('growthRate', f.growthRate.join(','));
  if (f.sort && f.sort !== 'name-asc') params.set('sort', f.sort);
  if (f.page > 1) params.set('page', String(f.page));
  if (f.groupBy === 'genus') params.set('groupBy', 'genus');
  return params.toString();
}

const PER_PAGE = 24;

export function BrowseContent({ allPlants }: { allPlants: BrowsePlant[] }) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<BrowseFiltersState>(() => filtersFromParams(searchParams));

  // Pre-fill zone from localStorage if URL doesn't already have zone params
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.get('zoneMin') && !sp.get('zoneMax')) {
      const zone = getUserZone();
      if (zone) {
        setFilters((prev) => ({
          ...prev,
          zoneMin: String(zone),
          zoneMax: String(zone),
        }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for zone changes from ZonePrompt
  useEffect(() => {
    function handleZoneChanged(e: Event) {
      const zone = (e as CustomEvent<number | null>).detail;
      if (zone) {
        setFilters((prev) => ({
          ...prev,
          zoneMin: String(zone),
          zoneMax: String(zone),
          page: 1,
        }));
      } else {
        setFilters((prev) => ({ ...prev, zoneMin: '', zoneMax: '', page: 1 }));
      }
    }
    window.addEventListener('zone-changed', handleZoneChanged);
    return () => window.removeEventListener('zone-changed', handleZoneChanged);
  }, []);

  // Sync URL (no navigation) when filters change
  useEffect(() => {
    const qs = filtersToParams(filters);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [filters]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters.page]);

  const { plants, total } = useMemo(
    () =>
      filterBrowsePlants(allPlants, {
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        zoneMin: filters.zoneMin ? Number(filters.zoneMin) : null,
        zoneMax: filters.zoneMax ? Number(filters.zoneMax) : null,
        availableOnly: filters.available,
        sun: filters.sun.length > 0 ? filters.sun : undefined,
        growthRate: filters.growthRate.length > 0 ? filters.growthRate : undefined,
        sort: filters.sort,
        page: filters.page,
        perPage: PER_PAGE,
      }),
    [allPlants, filters]
  );

  const totalPages = Math.ceil(total / PER_PAGE);

  // Genus-grouped view: computed from ALL filtered plants (not paginated)
  const genusGroups = useMemo(() => {
    if (filters.groupBy !== 'genus') return [];
    const allFiltered = filterBrowsePlants(allPlants, {
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      zoneMin: filters.zoneMin ? Number(filters.zoneMin) : null,
      zoneMax: filters.zoneMax ? Number(filters.zoneMax) : null,
      availableOnly: filters.available,
      sun: filters.sun.length > 0 ? filters.sun : undefined,
      growthRate: filters.growthRate.length > 0 ? filters.growthRate : undefined,
      sort: filters.sort,
      perPage: 9999,
    });
    return groupBrowsePlantsByGenus(allFiltered.plants, GENUS_COMMON_NAMES);
  }, [allPlants, filters]);

  const updateFilters = useCallback((patch: Partial<BrowseFiltersState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // Reset page when filters (not page itself) change
      if (!('page' in patch)) next.page = 1;
      return next;
    });
  }, []);

  const toggleInList = useCallback(
    (key: 'categories' | 'sun' | 'growthRate', value: string) => {
      setFilters((prev) => {
        const current = prev[key];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [key]: updated, page: 1 };
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    setFilters({
      categories: [],
      zoneMin: '',
      zoneMax: '',
      available: false,
      sun: [],
      growthRate: [],
      sort: 'name-asc',
      page: 1,
      groupBy: 'species',
    });
  }, []);

  // Derive a combined zone badge when min and max are the same
  const zoneMatch = filters.zoneMin && filters.zoneMax && filters.zoneMin === filters.zoneMax
    ? filters.zoneMin
    : null;

  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (filters.categories.length > 0) {
    filters.categories.forEach((cat) => {
      activeChips.push({ label: cat, onRemove: () => toggleInList('categories', cat) });
    });
  }
  if (zoneMatch) {
    activeChips.push({
      label: `Showing plants for Zone ${zoneMatch}`,
      onRemove: () => updateFilters({ zoneMin: '', zoneMax: '' }),
    });
  } else {
    if (filters.zoneMin) {
      activeChips.push({ label: `Zone min: ${filters.zoneMin}`, onRemove: () => updateFilters({ zoneMin: '' }) });
    }
    if (filters.zoneMax) {
      activeChips.push({ label: `Zone max: ${filters.zoneMax}`, onRemove: () => updateFilters({ zoneMax: '' }) });
    }
  }
  if (filters.available) {
    activeChips.push({ label: 'In stock', onRemove: () => updateFilters({ available: false }) });
  }
  if (filters.sun.length > 0) {
    filters.sun.forEach((s) => {
      activeChips.push({ label: s, onRemove: () => toggleInList('sun', s) });
    });
  }
  if (filters.growthRate.length > 0) {
    filters.growthRate.forEach((g) => {
      activeChips.push({ label: g, onRemove: () => toggleInList('growthRate', g) });
    });
  }

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      <PlantFilterSidebar
        filters={filters}
        onZoneMinChange={(v) => updateFilters({ zoneMin: v })}
        onZoneMaxChange={(v) => updateFilters({ zoneMax: v })}
        onToggleCategory={(v) => toggleInList('categories', v)}
        onToggleSun={(v) => toggleInList('sun', v)}
        onToggleGrowthRate={(v) => toggleInList('growthRate', v)}
        onToggleAvailable={() => updateFilters({ available: !filters.available })}
        onClearAll={clearAll}
      />

      <div>
        <SortBar
          total={filters.groupBy === 'genus' ? genusGroups.length : total}
          page={filters.groupBy === 'genus' ? 1 : filters.page}
          perPage={filters.groupBy === 'genus' ? genusGroups.length : PER_PAGE}
          sort={filters.sort}
          onSortChange={(v) => updateFilters({ sort: v, page: 1 })}
        />
        <div className="mb-4 flex justify-end -mt-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-inset p-0.5">
            <button
              onClick={() => updateFilters({ groupBy: 'species', page: 1 })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filters.groupBy === 'species'
                  ? 'bg-surface-raised text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Species
            </button>
            <button
              onClick={() => updateFilters({ groupBy: 'genus', page: 1 })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filters.groupBy === 'genus'
                  ? 'bg-surface-raised text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Genus
            </button>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-primary px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                {chip.label}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-accent hover:text-accent-hover"
            >
              Clear all
            </button>
          </div>
        )}

        {filters.groupBy === 'genus' ? (
          genusGroups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-text-secondary">No genera match your filters.</p>
              <button
                onClick={clearAll}
                className="mt-2 inline-block text-sm text-accent hover:text-accent-hover"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {genusGroups.map((g) => (
                <GenusGroupCard key={g.genus_slug} group={g} />
              ))}
            </div>
          )
        ) : (
          <>
            {plants.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-text-secondary">No plants match your filters.</p>
                <button
                  onClick={clearAll}
                  className="mt-2 inline-block text-sm text-accent hover:text-accent-hover"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {plants.map((p) => (
                  <PlantCard
                    key={p.slug}
                    slug={p.slug}
                    canonicalName={p.canonical_name}
                    botanicalName={p.botanical_name}
                    nurseryCount={p.nursery_count}
                    cultivarCount={p.cultivar_count}
                    zoneMin={p.zone_min}
                    zoneMax={p.zone_max}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={(p) => updateFilters({ page: p })}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GenusGroupCard({ group }: { group: GenusBrowseGroup }) {
  return (
    <Link
      href={`/plants/genus/${group.genus_slug}`}
      className="group block rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-5 transition-colors hover:border-border hover:bg-surface-raised"
    >
      <p className="font-serif text-lg font-semibold text-text-primary group-hover:text-accent">
        {group.genus_common_name}
      </p>
      <p className="mt-0.5 font-serif text-sm italic text-text-tertiary">
        {group.genus_name}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {group.species_count} {group.species_count === 1 ? 'species' : 'species'}
        <span className="mx-1.5 text-border">&middot;</span>
        {group.cultivar_count} cultivar{group.cultivar_count !== 1 ? 's' : ''}
      </p>
      {group.nursery_count > 0 && (
        <span className="mt-2 inline-block rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
          {group.nursery_count} {group.nursery_count === 1 ? 'nursery' : 'nurseries'} with stock
        </span>
      )}
      {group.display_category && (
        <p className="mt-2 text-xs text-text-tertiary">{group.display_category}</p>
      )}
    </Link>
  );
}
