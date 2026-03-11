'use client';

import { SearchBar } from '@/components/ui/SearchBar';
import { SortBar } from '@/components/SortBar';

interface BrowseHeaderProps {
  query: string;
  sort: string;
  groupBy: 'species' | 'genus';
  total: number;
  page: number;
  perPage: number;
  onQueryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onGroupByChange: (value: 'species' | 'genus') => void;
}

export function BrowseHeader({
  query,
  sort,
  groupBy,
  total,
  page,
  perPage,
  onQueryChange,
  onSortChange,
  onGroupByChange,
}: BrowseHeaderProps) {
  return (
    <>
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
    </>
  );
}
