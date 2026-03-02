'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowsePlant, filterBrowsePlants } from '@/lib/queries/browse';
import { PlantCard } from '@/components/PlantCard';
import { PlantFilterSidebar } from '@/components/PlantFilterSidebar';
import { SortBar } from '@/components/SortBar';
import { Pagination } from '@/components/Pagination';

export interface BrowseFiltersState {
  categories: string[];
  zoneMin: string;
  zoneMax: string;
  available: boolean;
  sun: string[];
  growthRate: string[];
  sort: string;
  page: number;
}

function filtersFromParams(sp: URLSearchParams): BrowseFiltersState {
  return {
    categories: sp.get('category')?.split(',').filter(Boolean) ?? [],
    zoneMin: sp.get('zoneMin') ?? '',
    zoneMax: sp.get('zoneMax') ?? '',
    available: sp.get('available') === 'true',
    sun: sp.get('sun')?.split(',').filter(Boolean) ?? [],
    growthRate: sp.get('growthRate')?.split(',').filter(Boolean) ?? [],
    sort: sp.get('sort') ?? 'name-asc',
    page: sp.get('page') ? Number(sp.get('page')) : 1,
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
  return params.toString();
}

const PER_PAGE = 24;

export function BrowseContent({ allPlants }: { allPlants: BrowsePlant[] }) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<BrowseFiltersState>(() => filtersFromParams(searchParams));

  // Sync URL (no navigation) when filters change
  useEffect(() => {
    const qs = filtersToParams(filters);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [filters]);

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
    });
  }, []);

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
          total={total}
          page={filters.page}
          perPage={PER_PAGE}
          sort={filters.sort}
          onSortChange={(v) => updateFilters({ sort: v, page: 1 })}
        />

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
      </div>
    </div>
  );
}
