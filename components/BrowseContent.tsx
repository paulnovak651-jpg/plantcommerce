'use client';

import { useState, useEffect, useMemo } from 'react';
import { ZoneFilterBar } from '@/components/browse/ZoneFilterBar';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { getUserZone } from '@/lib/zone-persistence';
import { filterTaxonomyTree, type BrowseFilters } from '@/lib/browse-filters';

interface BrowseContentProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowseContent({ taxonomyTree }: BrowseContentProps) {
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

  const filters: BrowseFilters = useMemo(() => {
    const min = zoneMin ? Number(zoneMin) : undefined;
    const max = zoneMax ? Number(zoneMax) : undefined;
    // Invalid range (min > max): treat as no filter
    if (min != null && max != null && min > max) return {};
    return { zoneMin: min, zoneMax: max };
  }, [zoneMin, zoneMax]);

  const filteredTree = useMemo(
    () => filterTaxonomyTree(taxonomyTree, filters),
    [taxonomyTree, filters]
  );

  return (
    <>
      {/* Zone filter bar */}
      <ZoneFilterBar
        zoneMin={zoneMin}
        zoneMax={zoneMax}
        onZoneMinChange={setZoneMin}
        onZoneMaxChange={setZoneMax}
      />

      {/* Three-column taxonomy explorer */}
      <TaxonomyExplorer taxonomyTree={filteredTree} zoneFilters={filters} />
    </>
  );
}
