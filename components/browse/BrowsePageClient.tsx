'use client';

import { useCallback, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BrowsePlant } from '@/lib/queries/browse';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';
import { SearchBar } from '@/components/ui/SearchBar';

interface BrowsePageClientProps {
  allPlants: BrowsePlant[];
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({
  allPlants,
}: BrowsePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const q = (formData.get('q') as string)?.trim();
      if (q) {
        router.push(`/?q=${encodeURIComponent(q)}`);
      }
    },
    [router]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar
            defaultValue={searchParams.get('q') ?? ''}
            onSubmit={handleSearchSubmit}
            className="w-full"
          />
        </div>
      </div>
      <BrowseContent allPlants={allPlants} />
    </div>
  );
}
