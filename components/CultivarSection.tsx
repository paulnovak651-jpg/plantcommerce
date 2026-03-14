'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { Tag } from '@/components/ui/Tag';
import { getForSaleNow, setForSaleNow as persistForSaleNow } from '@/lib/zone-persistence';
import type { Cultivar } from '@/lib/types';

interface CultivarSectionProps {
  title: string;
  items: Cultivar[];
  speciesSlug: string;
  nurseryCountById: Record<string, number>;
  priceById: Record<string, number>;
}

export function CultivarSection({
  title,
  items,
  speciesSlug,
  nurseryCountById,
  priceById,
}: CultivarSectionProps) {
  const [forSaleOnly, setForSaleOnly] = useState(false);

  useEffect(() => {
    setForSaleOnly(getForSaleNow());
  }, []);

  const handleToggle = (checked: boolean) => {
    setForSaleOnly(checked);
    persistForSaleNow(checked);
  };

  const filtered = useMemo(() => {
    if (!forSaleOnly) return items;
    return items.filter((cv) => (nurseryCountById[cv.id] ?? 0) > 0);
  }, [items, forSaleOnly, nurseryCountById]);

  const hasItemsWithoutOffers = items.some((cv) => (nurseryCountById[cv.id] ?? 0) === 0);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Text variant="h2">
          {title} ({filtered.length}{forSaleOnly && filtered.length !== items.length ? ` of ${items.length}` : ''})
        </Text>
        {hasItemsWithoutOffers && (
          <label className="flex items-center gap-1.5 text-[13px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={forSaleOnly}
              onChange={(e) => handleToggle(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle accent-accent"
            />
            In Stock Only
          </label>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-6 py-8 text-center">
          <Text variant="body" color="tertiary">
            No varieties currently in stock. Uncheck the filter to see all varieties.
          </Text>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cv) => {
            const nurseryCount = nurseryCountById[cv.id] ?? 0;
            const priceCents = priceById[cv.id] ?? null;
            return (
              <Link key={cv.id} href={`/plants/${speciesSlug}/${cv.slug}`}>
                <div className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3 cultivar-card-hover hover:bg-surface-raised hover:border-border cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <Text variant="h3" color="accent">{cv.canonical_name}</Text>
                    <div className="flex items-center gap-2 shrink-0">
                      {priceCents != null && (
                        <span className="text-sm font-medium text-accent">
                          From ${(priceCents / 100).toFixed(2)}
                        </span>
                      )}
                      {nurseryCount > 0 && (
                        <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
                          {nurseryCount} {nurseryCount === 1 ? 'nursery' : 'nurseries'}
                        </span>
                      )}
                    </div>
                  </div>
                  {cv.breeder && <Text variant="caption" color="tertiary">{cv.breeder}</Text>}
                  {cv.notes && (
                    <Text variant="caption" color="secondary" className="mt-1 line-clamp-2">
                      {cv.notes}
                    </Text>
                  )}
                  {cv.patent_status !== 'unknown' && cv.patent_status !== 'none' && cv.patent_status && (
                    <Tag type="community" size="sm">{cv.patent_status.replace(/_/g, ' ')}</Tag>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
