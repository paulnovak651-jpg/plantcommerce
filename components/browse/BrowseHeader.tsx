'use client';

import { SearchBar } from '@/components/ui/SearchBar';
import { SortBar } from '@/components/SortBar';
import { CATEGORY_OPTIONS } from '@/lib/facets/registry';
import { categoryColors, defaultColor } from '@/lib/category-colors';

interface BrowseHeaderProps {
  query: string;
  sort: string;
  groupBy: 'species' | 'genus';
  total: number;
  page: number;
  perPage: number;
  selectedCategories: string[];
  onQueryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onGroupByChange: (value: 'species' | 'genus') => void;
  onCategorySelect: (category: string) => void;
  /** When true, hides category pills and genus toggle (user navigated via funnel). */
  inFunnel?: boolean;
}

export function BrowseHeader({
  query,
  sort,
  groupBy,
  total,
  page,
  perPage,
  selectedCategories,
  onQueryChange,
  onSortChange,
  onGroupByChange,
  onCategorySelect,
  inFunnel = false,
}: BrowseHeaderProps) {
  return (
    <>
      {/* Hide category pills when user navigated via funnel or when a category is selected */}
      {!inFunnel && selectedCategories.length === 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategorySelect(cat.value)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{
                background: categoryColors[cat.value]?.from ?? defaultColor.from,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
      <div className="mb-4">
        <SearchBar
          value={query}
          onValueChange={onQueryChange}
          onSubmit={(event) => event.preventDefault()}
          className="w-full max-w-none"
          placeholders={[
            "Search 'hazelnut'...",
            "Search 'chestnut'...",
            "Search 'disease resistant'...",
          ]}
          inputId="browse-search-input"
        />
      </div>
      <SortBar
        total={total}
        page={page}
        perPage={perPage}
        sort={sort}
        onSortChange={onSortChange}
      />
      {/* Hide species/genus toggle when user navigated via funnel (already scoped to genus) */}
      {!inFunnel && (
        <div className="mb-4 flex justify-end -mt-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-inset p-0.5">
            <button
              onClick={() => onGroupByChange('species')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                groupBy === 'species'
                  ? 'bg-surface-raised text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Species
            </button>
            <button
              onClick={() => onGroupByChange('genus')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                groupBy === 'genus'
                  ? 'bg-surface-raised text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Genus
            </button>
          </div>
        </div>
      )}
    </>
  );
}
