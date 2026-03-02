'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_LABELS } from '@/lib/search/categories';

interface SearchFiltersProps {
  currentZone?: number;
  currentCategory?: string;
  currentInStock?: boolean;
}

const ZONE_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 1);

export function SearchFilters({
  currentZone,
  currentCategory,
  currentInStock,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(
    key: 'zone' | 'category' | 'inStock',
    value: string | undefined
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3">
      <span className="text-sm text-text-secondary">Filters:</span>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Zone</span>
        <select
          value={currentZone != null ? String(currentZone) : ''}
          onChange={(e) => setParam('zone', e.target.value || undefined)}
          className="rounded-[var(--radius-sm)] border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">Any</option>
          {ZONE_OPTIONS.map((zone) => (
            <option key={zone} value={String(zone)}>
              {zone}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Category</span>
        <select
          value={currentCategory ?? ''}
          onChange={(e) => setParam('category', e.target.value || undefined)}
          className="rounded-[var(--radius-sm)] border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="">Any</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={Boolean(currentInStock)}
          onChange={(e) => setParam('inStock', e.target.checked ? 'true' : undefined)}
          className="accent-accent"
        />
        <span>In Stock</span>
      </label>
    </div>
  );
}
