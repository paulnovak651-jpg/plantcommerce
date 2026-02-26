'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Cladogram } from '@/components/Cladogram';
import { FilterBar } from '@/components/FilterBar';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import type { ExplorerSpecies } from '@/lib/queries/explorer';

interface ExplorerLayoutProps {
  species: ExplorerSpecies[];
  profiles: Record<string, Record<string, unknown>>;
  /** Active category from URL — passed from server so we don't need useSearchParams here */
  category: string;
}

export function ExplorerLayout({ species, profiles, category }: ExplorerLayoutProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const selectedSpecies = selectedSlug
    ? (species.find((s) => s.slug === selectedSlug) ?? null)
    : null;

  return (
    <div>
      {/* FilterBar needs useSearchParams — wrapped in Suspense */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded bg-surface-inset" />}>
        <FilterBar />
      </Suspense>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-6">
        {/* Cladogram */}
        <div className="min-w-0">
          <Cladogram
            species={species}
            category={category}
            onSpeciesSelect={setSelectedSlug}
            selectedSlug={selectedSlug}
          />
        </div>

        {/* Detail panel — desktop only */}
        <aside className="hidden lg:block">
          {selectedSpecies ? (
            <DetailPanel
              species={selectedSpecies}
              profile={profiles[selectedSpecies.id] ?? null}
            />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-subtle">
              <Text variant="sm" color="tertiary">Select a species to see details</Text>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DetailPanel({
  species,
  profile,
}: {
  species: ExplorerSpecies;
  profile: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-4">
      <div>
        <Text variant="h2">{species.canonical_name}</Text>
        {species.botanical_name && (
          <Text variant="sm" color="secondary" className="mt-0.5 block">
            <BotanicalName>{species.botanical_name}</BotanicalName>
          </Text>
        )}
        <Text variant="caption" color="tertiary" className="mt-1 block">
          {species.family} &rsaquo; <em>{species.genus}</em>
        </Text>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3">
        {species.cultivar_count > 0 && (
          <Text variant="sm" color="secondary">
            <span className="font-semibold text-text-primary">{species.cultivar_count}</span> cultivars
          </Text>
        )}
        {species.nursery_count > 0 && (
          <Tag type="availability">
            {species.nursery_count} {species.nursery_count === 1 ? 'nursery' : 'nurseries'}
          </Tag>
        )}
      </div>

      {/* Growing profile */}
      {profile && <TraitGrid profile={profile} compact />}

      <Link
        href={`/plants/${species.slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
      >
        View full page →
      </Link>
    </div>
  );
}
