'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { GenusPlantItem } from '@/lib/types/genus-plants';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { getForSaleNow, setForSaleNow as persistForSaleNow } from '@/lib/zone-persistence';

type SortOption = 'name' | 'price_low' | 'price_high' | 'nursery_count';

interface GenusPlantListProps {
  initialItems: GenusPlantItem[];
  speciesFilterOptions: Array<{ slug: string; name: string; count: number }>;
  genusSlug: string;
}

const SORT_LABELS: Record<SortOption, string> = {
  name: 'Name (A-Z)',
  price_low: 'Price (Low-High)',
  price_high: 'Price (High-Low)',
  nursery_count: 'Most Nurseries',
};

const PAGE_SIZE = 24;

function sortItems(items: GenusPlantItem[], sort: SortOption): GenusPlantItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'price_low':
      sorted.sort((a, b) => {
        if (a.lowest_price_cents == null && b.lowest_price_cents == null) return 0;
        if (a.lowest_price_cents == null) return 1;
        if (b.lowest_price_cents == null) return -1;
        return a.lowest_price_cents - b.lowest_price_cents;
      });
      break;
    case 'price_high':
      sorted.sort((a, b) => {
        if (a.lowest_price_cents == null && b.lowest_price_cents == null) return 0;
        if (a.lowest_price_cents == null) return 1;
        if (b.lowest_price_cents == null) return -1;
        return b.lowest_price_cents - a.lowest_price_cents;
      });
      break;
    case 'nursery_count':
      sorted.sort((a, b) => b.nursery_count - a.nursery_count);
      break;
    case 'name':
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  return sorted;
}

function PlantCard({ item }: { item: GenusPlantItem }) {
  const href =
    item.type === 'cultivar'
      ? `/plants/${item.species_slug}/${item.slug}`
      : `/plants/${item.species_slug}`;

  const hasZone = item.zone_min != null && item.zone_max != null;

  return (
    <Link href={href}>
      <div className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-5 transition-colors hover:border-border hover:bg-surface-raised">
        <Text variant="h3" color="accent" className="line-clamp-1">
          {item.name}
        </Text>
        {item.botanical_name && (
          <Text variant="caption" color="tertiary" className="mt-0.5">
            <BotanicalName>{item.botanical_name}</BotanicalName>
            {item.type === 'cultivar' && (
              <span className="not-italic"> · {item.species_name}</span>
            )}
          </Text>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {hasZone && (
            <Tag type="info" size="sm">
              Z{item.zone_min}-{item.zone_max}
            </Tag>
          )}
          {item.nursery_count > 0 && (
            <Tag type="availability" size="sm">
              {item.nursery_count} {item.nursery_count === 1 ? 'nursery' : 'nurseries'}
            </Tag>
          )}
        </div>
        {item.lowest_price_cents != null ? (
          <Text variant="caption" color="accent" as="p" className="mt-2 font-medium">
            From ${(item.lowest_price_cents / 100).toFixed(2)}
          </Text>
        ) : item.nursery_count === 0 ? (
          <Text variant="caption" color="tertiary" as="p" className="mt-2">
            No current listings
          </Text>
        ) : null}
      </div>
    </Link>
  );
}

export function GenusPlantList({
  initialItems,
  speciesFilterOptions,
  genusSlug,
}: GenusPlantListProps) {
  const [sort, setSort] = useState<SortOption>('name');
  const [speciesFilter, setSpeciesFilter] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showCount, setShowCount] = useState(PAGE_SIZE);

  // Initialize from persisted "For sale now" preference
  useEffect(() => {
    setInStockOnly(getForSaleNow());
  }, []);

  const filtered = useMemo(() => {
    let result = initialItems;
    if (speciesFilter) {
      result = result.filter((item) => item.species_slug === speciesFilter);
    }
    if (inStockOnly) {
      result = result.filter((item) => item.nursery_count > 0);
    }
    return sortItems(result, sort);
  }, [initialItems, sort, speciesFilter, inStockOnly]);

  const visible = filtered.slice(0, showCount);
  const hasMore = showCount < filtered.length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-[13px] text-text-secondary">
            Sort:
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setShowCount(PAGE_SIZE);
              }}
              className="rounded-md border border-border-subtle bg-surface-primary px-2 py-1 text-[13px] text-text-primary"
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>

          {speciesFilterOptions.length > 1 && (
            <label className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              Species:
              <select
                value={speciesFilter}
                onChange={(e) => {
                  setSpeciesFilter(e.target.value);
                  setShowCount(PAGE_SIZE);
                }}
                className="rounded-md border border-border-subtle bg-surface-primary px-2 py-1 text-[13px] text-text-primary"
              >
                <option value="">All ({initialItems.length})</option>
                {speciesFilterOptions.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.name} ({opt.count})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-1.5 text-[13px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                persistForSaleNow(e.target.checked);
                setShowCount(PAGE_SIZE);
              }}
              className="h-4 w-4 rounded border-border-subtle accent-accent"
            />
            In Stock Only
          </label>
        </div>

        <Text variant="caption" color="tertiary">
          Showing {visible.length} of {filtered.length} plants
        </Text>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-6 py-12 text-center">
          <Text variant="body" color="tertiary">
            No varieties currently match your filters. Remove filters to see all varieties.
          </Text>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((item) => (
              <PlantCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowCount((c) => c + PAGE_SIZE)}
                className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-6 py-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:border-border cursor-pointer"
              >
                Show more ({filtered.length - showCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
