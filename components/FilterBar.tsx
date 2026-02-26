'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ZONE_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 1);

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'nut', label: 'Nut Trees' },
  { id: 'fruit', label: 'Fruit Trees' },
  { id: 'other', label: 'Other' },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? 'all';
  const available = searchParams.get('available') === 'true';

  // Local state for zone selects — debounced to avoid a router.push on every keystroke
  const [zoneMin, setZoneMin] = useState(searchParams.get('zoneMin') ?? '');
  const [zoneMax, setZoneMax] = useState(searchParams.get('zoneMax') ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (zoneMin) params.set('zoneMin', zoneMin);
      else params.delete('zoneMin');
      if (zoneMax) params.set('zoneMax', zoneMax);
      else params.delete('zoneMax');
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [zoneMin, zoneMax]); // eslint-disable-line react-hooks/exhaustive-deps

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleAvailable() {
    const params = new URLSearchParams(searchParams.toString());
    if (available) params.delete('available');
    else params.set('available', 'true');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle pb-4">
      {/* Category tabs */}
      <div className="flex gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat.id
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface-inset hover:text-text-primary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Zone filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-tertiary">Zone</span>
        <select
          value={zoneMin}
          onChange={(e) => setZoneMin(e.target.value)}
          className="rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">any</option>
          {ZONE_OPTIONS.map((z) => (
            <option key={z} value={String(z)}>
              {z}
            </option>
          ))}
        </select>
        <span className="text-sm text-text-tertiary">to</span>
        <select
          value={zoneMax}
          onChange={(e) => setZoneMax(e.target.value)}
          className="rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">any</option>
          {ZONE_OPTIONS.map((z) => (
            <option key={z} value={String(z)}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Availability toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={available}
          onChange={toggleAvailable}
          className="accent-accent"
        />
        <span className="text-text-secondary">Available only</span>
      </label>
    </div>
  );
}
