'use client';

import { useState } from 'react';
import { Disclosure } from '@/components/ui/Disclosure';
import type { BrowseFiltersState } from '@/components/BrowseContent';

interface Props {
  filters: BrowseFiltersState;
  onZoneMinChange: (value: string) => void;
  onZoneMaxChange: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleSun: (value: string) => void;
  onToggleGrowthRate: (value: string) => void;
  onToggleAvailable: () => void;
  onClearAll: () => void;
}

export function PlantFilterSidebar({
  filters,
  onZoneMinChange,
  onZoneMaxChange,
  onToggleCategory,
  onToggleSun,
  onToggleGrowthRate,
  onToggleAvailable,
  onClearAll,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.zoneMin !== '' ||
    filters.zoneMax !== '' ||
    filters.available ||
    filters.sun.length > 0 ||
    filters.growthRate.length > 0;

  function renderFilters() {
    return (
      <>
        <Disclosure title="Plant Type" defaultOpen={true}>
          {[
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
          ].map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => onToggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
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
          <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={filters.available}
              onChange={onToggleAvailable}
            />
            In stock at nurseries
          </label>
        </Disclosure>

        <Disclosure title="Sun Requirement" defaultOpen={false}>
          {['Full Sun', 'Full Sun to Partial Shade', 'Partial Shade', 'Full Shade'].map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={filters.sun.includes(val)}
                onChange={() => onToggleSun(val)}
              />
              {val}
            </label>
          ))}
        </Disclosure>

        <Disclosure title="Growth Rate" defaultOpen={false}>
          {['Slow', 'Moderate', 'Fast'].map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={filters.growthRate.includes(val)}
                onChange={() => onToggleGrowthRate(val)}
              />
              {val}
            </label>
          ))}
        </Disclosure>
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
        Filters
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 filter-sheet-backdrop filter-sheet-backdrop-enter" onClick={() => setSheetOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-surface-raised p-4 shadow-xl filter-sheet-enter">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium uppercase tracking-wide text-text-primary">Filters</span>
              <button onClick={() => setSheetOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderFilters()}
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
