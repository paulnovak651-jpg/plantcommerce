'use client';

import Link from 'next/link';
import type { BrowsePlant, GenusBrowseGroup } from '@/lib/queries/browse';
import type { RecoveryHint } from '@/lib/queries/facet-query-builder';
import { PlantCard } from '@/components/PlantCard';
import { Pagination } from '@/components/Pagination';
import { ActiveFilterPills } from './ActiveFilterPills';
import type { FilterPill } from './ActiveFilterPills';
import { SmartEmptyState } from './SmartEmptyState';

interface BrowseGridProps {
  groupBy: 'species' | 'genus';
  plants: BrowsePlant[];
  genusGroups: GenusBrowseGroup[];
  activePills: FilterPill[];
  recoveryHints?: RecoveryHint[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearAll: () => void;
}

export function BrowseGrid({
  groupBy,
  plants,
  genusGroups,
  activePills,
  recoveryHints,
  currentPage,
  totalPages,
  onPageChange,
  onClearAll,
}: BrowseGridProps) {
  return (
    <>
      <ActiveFilterPills pills={activePills} onClearAll={onClearAll} />

      {groupBy === 'genus' ? (
        genusGroups.length === 0 ? (
          <SmartEmptyState
            activePills={activePills}
            onClearAll={onClearAll}
            recoveryHints={recoveryHints}
            genusView
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genusGroups.map((g) => (
              <GenusGroupCard key={g.genus_slug} group={g} />
            ))}
          </div>
        )
      ) : (
        <>
          {plants.length === 0 ? (
            <SmartEmptyState
              activePills={activePills}
              onClearAll={onClearAll}
              recoveryHints={recoveryHints}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {plants.map((p) => (
                <PlantCard
                  key={p.slug}
                  slug={p.slug}
                  canonicalName={p.canonical_name}
                  botanicalName={p.botanical_name}
                  nurseryCount={p.nursery_count}
                  cultivarCount={p.cultivar_count}
                  zoneMin={p.zone_min}
                  zoneMax={p.zone_max}
                  lowestPrice={p.lowest_price_cents}
                  bestNursery={p.best_nursery_name}
                  hasGrowingProfile={p.has_growing_profile}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

function GenusGroupCard({ group }: { group: GenusBrowseGroup }) {
  return (
    <Link
      href={`/plants/genus/${group.genus_slug}`}
      className="group block rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-5 plant-card-hover transition-colors hover:border-border hover:bg-surface-raised"
    >
      <p className="font-serif text-lg font-semibold text-text-primary group-hover:text-accent">
        {group.genus_common_name}
      </p>
      <p className="mt-0.5 font-serif text-sm italic text-text-tertiary">
        {group.genus_name}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {group.species_count} {group.species_count === 1 ? 'species' : 'species'}
        <span className="mx-1.5 text-border">&middot;</span>
        {group.cultivar_count} cultivar{group.cultivar_count !== 1 ? 's' : ''}
      </p>
      {group.nursery_count > 0 && (
        <span className="mt-2 inline-block rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
          {group.nursery_count} {group.nursery_count === 1 ? 'nursery' : 'nurseries'} with stock
        </span>
      )}
      {group.display_category && (
        <p className="mt-2 text-xs text-text-tertiary">{group.display_category}</p>
      )}
    </Link>
  );
}
