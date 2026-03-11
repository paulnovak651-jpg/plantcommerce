'use client';

import { useState } from 'react';
import { Disclosure } from '@/components/ui/Disclosure';
import {
  FACET_REGISTRY,
  getFacetsByGroup,
  type FacetDefinition,
} from '@/lib/facets/registry';
import {
  MultiSelectControl,
  BooleanControl,
  ZoneRangeControl,
  RangeControl,
} from '@/components/browse/FacetControl';

// Re-export option values for backwards compatibility with BrowseContent facet counting
export const CATEGORY_OPTIONS = FACET_REGISTRY.find((f) => f.key === 'category')!.options!.map((o) => o.value);
export const SUN_OPTIONS = FACET_REGISTRY.find((f) => f.key === 'sun')!.options!.map((o) => o.value);
export const GROWTH_RATE_OPTIONS = FACET_REGISTRY.find((f) => f.key === 'growthRate')!.options!.map((o) => o.value);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Generic facet counts — keyed by facet key. */
export interface FacetCounts {
  /** Multi-select facets: facetKey → value → count */
  multiSelect: Record<string, Record<string, number>>;
  /** Boolean facets: facetKey → count */
  boolean: Record<string, number>;
}

export interface FilterValues {
  /** Multi-select selected values, keyed by facet key */
  multiSelect: Record<string, string[]>;
  /** Boolean values, keyed by facet key */
  booleans: Record<string, boolean>;
  /** Range min values, keyed by range param name (e.g. "zoneMin") */
  rangeMin: Record<string, string>;
  /** Range max values, keyed by range param name (e.g. "zoneMax") */
  rangeMax: Record<string, string>;
}

interface Props {
  filterValues: FilterValues;
  facetCounts: FacetCounts;
  totalResults: number;
  /** Selected categories — used to determine contextual facet visibility */
  selectedCategories: string[];
  onMultiSelectToggle: (facetKey: string, value: string) => void;
  onBooleanToggle: (facetKey: string) => void;
  onRangeChange: (param: string, value: string) => void;
  onClearAll: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRangeMinParam(facet: FacetDefinition): string {
  return facet.rangeMinParam ?? `${facet.key}Min`;
}

function getRangeMaxParam(facet: FacetDefinition): string {
  return facet.rangeMaxParam ?? `${facet.key}Max`;
}

function countActiveFilters(values: FilterValues): number {
  let count = 0;

  for (const facet of FACET_REGISTRY) {
    switch (facet.type) {
      case 'multi-select':
        count += (values.multiSelect[facet.key] ?? []).length;
        break;
      case 'boolean':
        if (values.booleans[facet.key]) count += 1;
        break;
      case 'zone-range': {
        const minVal = values.rangeMin[getRangeMinParam(facet)] ?? '';
        const maxVal = values.rangeMax[getRangeMaxParam(facet)] ?? '';
        if (minVal && maxVal && minVal === maxVal) {
          count += 1;
        } else {
          if (minVal) count += 1;
          if (maxVal) count += 1;
        }
        break;
      }
      case 'range': {
        if (values.rangeMin[getRangeMinParam(facet)]) count += 1;
        if (values.rangeMax[getRangeMaxParam(facet)]) count += 1;
        break;
      }
    }
  }
  return count;
}

function hasAnyActiveFilter(values: FilterValues): boolean {
  return countActiveFilters(values) > 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlantFilterSidebar({
  filterValues,
  facetCounts,
  totalResults,
  selectedCategories,
  onMultiSelectToggle,
  onBooleanToggle,
  onRangeChange,
  onClearAll,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount = countActiveFilters(filterValues);
  const hasActive = hasAnyActiveFilter(filterValues);

  function closeSheet(options?: { scrollToTop?: boolean }) {
    setSheetOpen(false);
    if (options?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderFacet(facet: FacetDefinition) {
    switch (facet.type) {
      case 'multi-select':
        return (
          <MultiSelectControl
            facet={facet}
            selected={filterValues.multiSelect[facet.key] ?? []}
            counts={facetCounts.multiSelect[facet.key] ?? {}}
            onToggle={(value) => onMultiSelectToggle(facet.key, value)}
          />
        );

      case 'boolean':
        return (
          <BooleanControl
            facet={facet}
            checked={filterValues.booleans[facet.key] ?? false}
            count={facetCounts.boolean[facet.key] ?? 0}
            onToggle={() => onBooleanToggle(facet.key)}
          />
        );

      case 'zone-range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        return (
          <ZoneRangeControl
            facet={facet}
            minValue={filterValues.rangeMin[minParam] ?? ''}
            maxValue={filterValues.rangeMax[maxParam] ?? ''}
            onMinChange={(v) => onRangeChange(minParam, v)}
            onMaxChange={(v) => onRangeChange(maxParam, v)}
          />
        );
      }

      case 'range': {
        const minParam = getRangeMinParam(facet);
        const maxParam = getRangeMaxParam(facet);
        return (
          <RangeControl
            facet={facet}
            minValue={filterValues.rangeMin[minParam] ?? ''}
            maxValue={filterValues.rangeMax[maxParam] ?? ''}
            onMinChange={(v) => onRangeChange(minParam, v)}
            onMaxChange={(v) => onRangeChange(maxParam, v)}
          />
        );
      }
    }
  }

  function renderFilters() {
    const groups = getFacetsByGroup(selectedCategories);

    return (
      <>
        {groups.map(({ group, facets }) => (
          <div key={group.key}>
            {facets.map((facet) => (
              <Disclosure key={facet.key} title={facet.label} defaultOpen={facet.defaultOpen}>
                {renderFacet(facet)}
              </Disclosure>
            ))}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {/* Mobile filter trigger */}
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

      {/* Mobile full-screen filter sheet */}
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-full">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <span className="text-sm font-medium uppercase tracking-wide text-text-primary">
            Refine Results
          </span>
          {hasActive && (
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
