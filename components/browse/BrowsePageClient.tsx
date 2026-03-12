'use client';

import { useCallback, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BrowsePlant } from '@/lib/queries/browse';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import { SearchBar } from '@/components/ui/SearchBar';

type BrowseMode = 'explore' | 'refine';

interface BrowsePageClientProps {
  allPlants: BrowsePlant[];
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({
  allPlants,
  taxonomyTree,
}: BrowsePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode: BrowseMode =
    searchParams.get('mode') === 'refine' ? 'refine' : 'explore';

  const setMode = useCallback(
    (newMode: BrowseMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newMode === 'explore') {
        params.delete('mode');
      } else {
        params.set('mode', 'refine');
      }
      const qs = params.toString();
      router.push(`/${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams]
  );

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const q = (formData.get('q') as string)?.trim();
      if (q) {
        router.push(`/?mode=refine&q=${encodeURIComponent(q)}`);
      }
    },
    [router]
  );

  return (
    <div className="space-y-4">
      {/* Shared header: search + mode toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar
            defaultValue={searchParams.get('q') ?? ''}
            onSubmit={handleSearchSubmit}
            className="w-full"
          />
        </div>
        <div className="inline-flex rounded-lg border border-border-subtle overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setMode('explore')}
            className={`
              px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
              ${mode === 'explore'
                ? 'bg-accent text-text-inverse'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-inset'}
            `}
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => setMode('refine')}
            className={`
              px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
              ${mode === 'refine'
                ? 'bg-accent text-text-inverse'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-inset'}
            `}
          >
            Refine
          </button>
        </div>
      </div>

      {/* Mode content */}
      {mode === 'explore' ? (
        <TaxonomyExplorer taxonomyTree={taxonomyTree} />
      ) : (
        <BrowseContent allPlants={allPlants} />
      )}
    </div>
  );
}
