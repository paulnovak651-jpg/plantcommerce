'use client';

import { useState, useEffect } from 'react';
import { ZoneFilterBar } from '@/components/browse/ZoneFilterBar';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { getUserZone } from '@/lib/zone-persistence';

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
      <TaxonomyExplorer taxonomyTree={taxonomyTree} />
    </>
  );
}
