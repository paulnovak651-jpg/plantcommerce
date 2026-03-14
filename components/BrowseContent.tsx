'use client';

import { useState, useEffect, useMemo } from 'react';
import { ZoneFilterBar } from '@/components/browse/ZoneFilterBar';
import { TaxonomyExplorer } from '@/components/browse/TaxonomyExplorer';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import {
  getUserZone,
  getStockType, setStockType as persistStockType,
  getForSaleNow, setForSaleNow as persistForSaleNow,
  type StockTypeFilter,
} from '@/lib/zone-persistence';
import { filterTaxonomyTree, type BrowseFilters } from '@/lib/browse-filters';

interface BrowseContentProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowseContent({ taxonomyTree }: BrowseContentProps) {
  const [zoneMin, setZoneMin] = useState('');
  const [zoneMax, setZoneMax] = useState('');
  const [stockType, setStockType] = useState<StockTypeFilter>('either');
  const [forSaleNow, setForSaleNow] = useState(false);

  // Pre-fill from localStorage
  useEffect(() => {
    const zone = getUserZone();
    if (zone) {
      setZoneMin(String(zone));
      setZoneMax(String(zone));
    }
    setStockType(getStockType());
    setForSaleNow(getForSaleNow());
  }, []);

  function handleStockTypeChange(value: StockTypeFilter) {
    setStockType(value);
    persistStockType(value);
  }

  function handleForSaleNowChange(value: boolean) {
    setForSaleNow(value);
    persistForSaleNow(value);
  }

  const filters: BrowseFilters = useMemo(() => {
    const min = zoneMin ? Number(zoneMin) : undefined;
    const max = zoneMax ? Number(zoneMax) : undefined;
    if (min != null && max != null && min > max) return {};
    return { zoneMin: min, zoneMax: max, stockType, forSaleNow };
  }, [zoneMin, zoneMax, stockType, forSaleNow]);

  const filteredTree = useMemo(
    () => filterTaxonomyTree(taxonomyTree, filters),
    [taxonomyTree, filters]
  );

  return (
    <>
      <ZoneFilterBar
        zoneMin={zoneMin}
        zoneMax={zoneMax}
        onZoneMinChange={setZoneMin}
        onZoneMaxChange={setZoneMax}
        stockType={stockType}
        onStockTypeChange={handleStockTypeChange}
        forSaleNow={forSaleNow}
        onForSaleNowChange={handleForSaleNowChange}
      />
      <TaxonomyExplorer taxonomyTree={filteredTree} zoneFilters={filters} />
    </>
  );
}
