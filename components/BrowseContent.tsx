'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { ZoneFilterBar } from '@/components/browse/ZoneFilterBar';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { getUserZone } from '@/lib/zone-persistence';

interface BrowseContentProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowseContent({ taxonomyTree }: BrowseContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [zoneMin, setZoneMin] = useState('');
  const [zoneMax, setZoneMax] = useState('');

  // Pre-fill zone from localStorage
  useEffect(() => {
    const zone = getUserZone();
    if (zone) {
      setZoneMin(String(zone));
      setZoneMax(String(zone));
    }
  }, []);

  // Handle search submission — navigate to /search?q=...
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  return (
    <>
      {/* Search bar with Explore button */}
      <div className="flex gap-2 mb-4">
        <SearchBar
          value={query}
          onValueChange={setQuery}
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="w-full max-w-none flex-1"
          placeholders={[
            "Search 'bare root hazel'...",
            "Search 'disease resistant'...",
            "Search 'EFB resistant'...",
          ]}
          inputId="browse-search-input"
        />
        <button
          onClick={handleSearch}
          className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-text-inverse hover:bg-accent-hover transition-colors"
        >
          Explore
        </button>
      </div>

      {/* Zone filter bar */}
      <ZoneFilterBar
        zoneMin={zoneMin}
        zoneMax={zoneMax}
        onZoneMinChange={setZoneMin}
        onZoneMaxChange={setZoneMax}
      />

      {/* Three-column taxonomy explorer */}
      <TaxonomyExplorer taxonomyTree={taxonomyTree} />
    </>
  );
}
