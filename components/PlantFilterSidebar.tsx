'use client';

import { useState } from 'react';
import { Disclosure } from '@/components/ui/Disclosure';
import type { BrowseFiltersState } from '@/components/BrowseContent';

export const CATEGORY_OPTIONS = [
  'Nut Trees',
  'Apples & Crabapples',
  'Berries',
  'Cherries & Plums',
  'Figs',
  'Grapes',
  'Mulberries',
  'Pears',
  'Persimmons',
  'Quinces',
  'Other',
] as const;

export const SUN_OPTIONS = [
  'Full Sun',
  'Full Sun to Partial Shade',
  'Partial Shade',
  'Full Shade',
] as const;

export const GROWTH_RATE_OPTIONS = ['Slow', 'Moderate', 'Fast'] as const;

interface FacetCounts {
  categories: Record<string, number>;
  sun: Record<string, number>;
  growthRate: Record<string, number>;
  available: number;
}

interface Props {
  filters: BrowseFiltersState;
  facetCounts: FacetCounts;
  totalResults: number;
  onZoneMinChange: (value: string) => void;
  onZoneMaxChange: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleSun: (value: string) => void;
  onToggleGrowthRate: (value: string) => void;
  onChillHoursMinChange: (value: string) => void;
  onChillHoursMaxChange: (value: string) => void;
  onBearingAgeMinChange: (value: string) => void;
  onBearingAgeMaxChange: (value: string) => void;
  onHeightMinChange: (value: string) => void;
  onHeightMaxChange: (value: string) => void;
  onSpreadMinChange: (value: string) => void;
  onSpreadMaxChange: (value: string) => void;
  onSoilPhMinChange: (value: string) => void;
  onSoilPhMaxChange: (value: string) => void;
  onToggleAvailable: () => void;
  onClearAll: () => void;
}

export function PlantFilterSidebar({
  filters,
  facetCounts,
  totalResults,
  onZoneMinChange,
  onZoneMaxChange,
  onToggleCategory,
  onToggleSun,
  onToggleGrowthRate,
  onChillHoursMinChange,
  onChillHoursMaxChange,
  onBearingAgeMinChange,
  onBearingAgeMaxChange,
  onHeightMinChange,
  onHeightMaxChange,
  onSpreadMinChange,
  onSpreadMaxChange,
  onSoilPhMinChange,
  onSoilPhMaxChange,
  onToggleAvailable,
  onClearAll,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const singleCategory = filters.categories.length === 1 ? filters.categories[0] : null;
  const showNutTreeFacets = singleCategory === 'Nut Trees';
  const showBerryFacets = singleCategory === 'Berries';
  const showProfileFacets = singleCategory != null;

  const zoneFilterCount =
    filters.zoneMin && filters.zoneMax && filters.zoneMin === filters.zoneMax
      ? 1
      : (filters.zoneMin ? 1 : 0) + (filters.zoneMax ? 1 : 0);
  const contextualFilterCount = [
    filters.chillHoursMin,
    filters.chillHoursMax,
    filters.bearingAgeMin,
    filters.bearingAgeMax,
    filters.heightMin,
    filters.heightMax,
    filters.spreadMin,
    filters.spreadMax,
    filters.soilPhMin,
    filters.soilPhMax,
  ].filter((value) => value !== '').length;

  const activeFilterCount =
    filters.categories.length +
    filters.sun.length +
    filters.growthRate.length +
    zoneFilterCount +
    contextualFilterCount +
    (filters.available ? 1 : 0);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.zoneMin !== '' ||
    filters.zoneMax !== '' ||
    filters.available ||
    filters.sun.length > 0 ||
    filters.growthRate.length > 0 ||
    contextualFilterCount > 0;

  function closeSheet(options?: { scrollToTop?: boolean }) {
    setSheetOpen(false);
    if (options?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderRangeInputs(params: {
    minValue: string;
    maxValue: string;
    minLabel: string;
    maxLabel: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
    minStep?: string;
    maxStep?: string;
    minPlaceholder?: string;
    maxPlaceholder?: string;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-8 text-sm text-text-tertiary">{params.minLabel}</span>
          <input
            type="number"
            value={params.minValue}
            step={params.minStep}
            placeholder={params.minPlaceholder}
            onChange={(e) => params.onMinChange(e.target.value)}
            className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-sm text-text-tertiary">{params.maxLabel}</span>
          <input
            type="number"
            value={params.maxValue}
            step={params.maxStep}
            placeholder={params.maxPlaceholder}
            onChange={(e) => params.onMaxChange(e.target.value)}
            className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
          />
        </div>
      </div>
    );
  }

  function renderFilters() {
    return (
      <>
        <Disclosure title="Plant Type" defaultOpen={true}>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = facetCounts.categories[cat] ?? 0;
            const checked = filters.categories.includes(cat);
            const disabled = count === 0 && !checked;
            return (
              <label
                key={cat}
                className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleCategory(cat)}
                />
                <span>
                  {cat} ({count})
                </span>
              </label>
            );
          })}
        </Disclosure>

        <Disclosure title="USDA Zone" defaultOpen={true}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 text-sm text-text-tertiary">Min</span>
              <select
                value={filters.zoneMin}
                onChange={(e) => onZoneMinChange(e.target.value)}
                className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
              >
                <option value="">Any</option>
                {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
                  <option key={z} value={String(z)}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 text-sm text-text-tertiary">Max</span>
              <select
                value={filters.zoneMax}
                onChange={(e) => onZoneMaxChange(e.target.value)}
                className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
              >
                <option value="">Any</option>
                {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
                  <option key={z} value={String(z)}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Disclosure>

        <Disclosure title="Availability" defaultOpen={true}>
          {(() => {
            const disabled = facetCounts.available === 0 && !filters.available;
            return (
          <label
            className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={filters.available}
              disabled={disabled}
              onChange={onToggleAvailable}
            />
            <span>In stock at nurseries ({facetCounts.available})</span>
          </label>
            );
          })()}
        </Disclosure>

        <Disclosure title="Sun Requirement" defaultOpen={false}>
          {SUN_OPTIONS.map((val) => {
            const count = facetCounts.sun[val] ?? 0;
            const checked = filters.sun.includes(val);
            const disabled = count === 0 && !checked;
            return (
              <label
                key={val}
                className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleSun(val)}
                />
                <span>
                  {val} ({count})
                </span>
              </label>
            );
          })}
        </Disclosure>

        <Disclosure title="Growth Rate" defaultOpen={false}>
          {GROWTH_RATE_OPTIONS.map((val) => {
            const count = facetCounts.growthRate[val] ?? 0;
            const checked = filters.growthRate.includes(val);
            const disabled = count === 0 && !checked;
            return (
              <label
                key={val}
                className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleGrowthRate(val)}
                />
                <span>
                  {val} ({count})
                </span>
              </label>
            );
          })}
        </Disclosure>

        {showNutTreeFacets && (
          <>
            <Disclosure title="Chill Hours" defaultOpen={false}>
              {renderRangeInputs({
                minValue: filters.chillHoursMin,
                maxValue: filters.chillHoursMax,
                minLabel: 'Min',
                maxLabel: 'Max',
                minPlaceholder: 'e.g. 600',
                maxPlaceholder: 'e.g. 1200',
                onMinChange: onChillHoursMinChange,
                onMaxChange: onChillHoursMaxChange,
              })}
            </Disclosure>

            <Disclosure title="Bearing Age (Years)" defaultOpen={false}>
              {renderRangeInputs({
                minValue: filters.bearingAgeMin,
                maxValue: filters.bearingAgeMax,
                minLabel: 'Min',
                maxLabel: 'Max',
                minPlaceholder: 'e.g. 3',
                maxPlaceholder: 'e.g. 7',
                onMinChange: onBearingAgeMinChange,
                onMaxChange: onBearingAgeMaxChange,
              })}
            </Disclosure>
          </>
        )}

        {showProfileFacets && (
          <>
            <Disclosure title="Mature Height (ft)" defaultOpen={false}>
              {renderRangeInputs({
                minValue: filters.heightMin,
                maxValue: filters.heightMax,
                minLabel: 'Min',
                maxLabel: 'Max',
                minPlaceholder: 'e.g. 6',
                maxPlaceholder: 'e.g. 20',
                onMinChange: onHeightMinChange,
                onMaxChange: onHeightMaxChange,
              })}
            </Disclosure>

            <Disclosure title="Mature Spread (ft)" defaultOpen={false}>
              {renderRangeInputs({
                minValue: filters.spreadMin,
                maxValue: filters.spreadMax,
                minLabel: 'Min',
                maxLabel: 'Max',
                minPlaceholder: 'e.g. 4',
                maxPlaceholder: 'e.g. 16',
                onMinChange: onSpreadMinChange,
                onMaxChange: onSpreadMaxChange,
              })}
            </Disclosure>
          </>
        )}

        {showBerryFacets && (
          <Disclosure title="Soil pH" defaultOpen={false}>
            {renderRangeInputs({
              minValue: filters.soilPhMin,
              maxValue: filters.soilPhMax,
              minLabel: 'Min',
              maxLabel: 'Max',
              minStep: '0.1',
              maxStep: '0.1',
              minPlaceholder: 'e.g. 5.5',
              maxPlaceholder: 'e.g. 7.0',
              onMinChange: onSoilPhMinChange,
              onMaxChange: onSoilPhMaxChange,
            })}
          </Disclosure>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="mb-4 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-inset lg:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 filter-sheet-backdrop filter-sheet-backdrop-enter"
            onClick={() => closeSheet()}
          />
          <div className="fixed inset-0 z-50 flex flex-col bg-surface-raised filter-sheet-enter">
            <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-raised px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wide text-text-primary">Filters</span>
                <button onClick={() => closeSheet()} className="text-text-tertiary hover:text-text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Showing {totalResults} plant{totalResults === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {renderFilters()}
            </div>

            <div className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface-raised px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClearAll}
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-inset"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => closeSheet({ scrollToTop: true })}
                  className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-accent-hover"
                >
                  Show {totalResults} Result{totalResults === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:block w-full">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <span className="text-sm font-medium uppercase tracking-wide text-text-primary">
            Refine Results
          </span>
          {hasActiveFilters && (
            <button onClick={onClearAll} className="text-xs text-accent hover:text-accent-hover">
              Clear all
            </button>
          )}
        </div>
        {renderFilters()}
      </aside>
    </>
  );
}
