'use client';

import type { FacetDefinition } from '@/lib/facets/registry';

const ZONES = Array.from({ length: 13 }, (_, i) => i + 1);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MultiSelectProps {
  facet: FacetDefinition;
  selected: string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
}

interface BooleanProps {
  facet: FacetDefinition;
  checked: boolean;
  count: number;
  onToggle: () => void;
}

interface ZoneRangeProps {
  facet: FacetDefinition;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

interface RangeProps {
  facet: FacetDefinition;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Multi-select checkbox group
// ---------------------------------------------------------------------------

export function MultiSelectControl({ facet, selected, counts, onToggle }: MultiSelectProps) {
  if (!facet.options) return null;

  return (
    <>
      {facet.options.map((opt) => {
        const count = counts[opt.value] ?? 0;
        const checked = selected.includes(opt.value);
        const disabled = facet.disableEmpty && count === 0 && !checked;

        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(opt.value)}
            />
            <span>
              {opt.label}
              {facet.countable && <span className="text-text-tertiary"> ({count})</span>}
            </span>
          </label>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Boolean toggle
// ---------------------------------------------------------------------------

export function BooleanControl({ facet, checked, count, onToggle }: BooleanProps) {
  const disabled = facet.disableEmpty && count === 0 && !checked;

  return (
    <label
      className={`flex items-center gap-2 py-1 text-sm text-text-secondary ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        className="custom-checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span>
        In stock at nurseries
        {facet.countable && <span className="text-text-tertiary"> ({count})</span>}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Zone range (min/max selects 1–13)
// ---------------------------------------------------------------------------

export function ZoneRangeControl({ minValue, maxValue, onMinChange, onMaxChange }: ZoneRangeProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-8 text-sm text-text-tertiary">Min</span>
        <select
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">Any</option>
          {ZONES.map((z) => (
            <option key={z} value={String(z)}>{z}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 text-sm text-text-tertiary">Max</span>
        <select
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">Any</option>
          {ZONES.map((z) => (
            <option key={z} value={String(z)}>{z}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Numeric range (min/max inputs)
// ---------------------------------------------------------------------------

export function RangeControl({ facet, minValue, maxValue, onMinChange, onMaxChange }: RangeProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-8 text-sm text-text-tertiary">Min</span>
        <input
          type="number"
          value={minValue}
          step={facet.step}
          placeholder={facet.minPlaceholder}
          onChange={(e) => onMinChange(e.target.value)}
          className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 text-sm text-text-tertiary">Max</span>
        <input
          type="number"
          value={maxValue}
          step={facet.step}
          placeholder={facet.maxPlaceholder}
          onChange={(e) => onMaxChange(e.target.value)}
          className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        />
      </div>
    </div>
  );
}
