'use client';

import type { StockTypeFilter } from '@/lib/zone-persistence';

interface ZoneFilterBarProps {
  zoneMin: string;
  zoneMax: string;
  onZoneMinChange: (value: string) => void;
  onZoneMaxChange: (value: string) => void;
  stockType: StockTypeFilter;
  onStockTypeChange: (value: StockTypeFilter) => void;
  forSaleNow: boolean;
  onForSaleNowChange: (value: boolean) => void;
}

export function ZoneFilterBar({
  zoneMin, zoneMax, onZoneMinChange, onZoneMaxChange,
  stockType, onStockTypeChange, forSaleNow, onForSaleNowChange,
}: ZoneFilterBarProps) {
  const zones = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

  const minNum = zoneMin ? Number(zoneMin) : null;
  const maxNum = zoneMax ? Number(zoneMax) : null;

  const hasAnyFilter = zoneMin || zoneMax || stockType !== 'either' || forSaleNow;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-inset px-4 py-2.5 mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        Refine results
      </span>

      {/* Zone filter */}
      <span className="text-sm text-text-secondary">Zone:</span>
      <select
        value={zoneMin}
        onChange={(e) => {
          const newMin = e.target.value;
          onZoneMinChange(newMin);
          if (newMin && maxNum != null && Number(newMin) > maxNum) {
            onZoneMaxChange(newMin);
          }
        }}
        className="rounded-md border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
      >
        <option value="">Min</option>
        {zones.map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
      <span className="text-sm text-text-secondary">to</span>
      <select
        value={zoneMax}
        onChange={(e) => {
          const newMax = e.target.value;
          onZoneMaxChange(newMax);
          if (newMax && minNum != null && Number(newMax) < minNum) {
            onZoneMinChange(newMax);
          }
        }}
        className="rounded-md border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
      >
        <option value="">Max</option>
        {zones.map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      {/* Divider */}
      <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />

      {/* Stock type filter */}
      <span className="text-sm text-text-secondary">Stock:</span>
      <select
        value={stockType}
        onChange={(e) => onStockTypeChange(e.target.value as StockTypeFilter)}
        className="rounded-md border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
      >
        <option value="either">Any type</option>
        <option value="seed">Seeds</option>
        <option value="plant">Plants</option>
      </select>

      {/* For sale now toggle */}
      <label className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={forSaleNow}
          onChange={(e) => onForSaleNowChange(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        For sale now
      </label>

      {/* Clear all */}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={() => {
            onZoneMinChange('');
            onZoneMaxChange('');
            onStockTypeChange('either');
            onForSaleNowChange(false);
          }}
          className="text-xs text-text-tertiary hover:text-accent transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
