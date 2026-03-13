'use client';

interface ZoneFilterBarProps {
  zoneMin: string;
  zoneMax: string;
  onZoneMinChange: (value: string) => void;
  onZoneMaxChange: (value: string) => void;
}

export function ZoneFilterBar({ zoneMin, zoneMax, onZoneMinChange, onZoneMaxChange }: ZoneFilterBarProps) {
  const zones = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

  // Disable max values below min (prevent invalid range)
  const minNum = zoneMin ? Number(zoneMin) : null;
  const maxNum = zoneMax ? Number(zoneMax) : null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-inset px-4 py-2.5 mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        Refine results
      </span>
      <span className="text-sm text-text-secondary">USDA Zone:</span>
      <select
        value={zoneMin}
        onChange={(e) => {
          const newMin = e.target.value;
          onZoneMinChange(newMin);
          // Auto-adjust max if it would be below new min
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
          // Auto-adjust min if it would be above new max
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
      {(zoneMin || zoneMax) && (
        <button
          type="button"
          onClick={() => { onZoneMinChange(''); onZoneMaxChange(''); }}
          className="text-xs text-text-tertiary hover:text-accent transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}
