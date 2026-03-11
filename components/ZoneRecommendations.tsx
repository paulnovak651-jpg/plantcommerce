'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clearUserZone, getUserZone, setUserZone } from '@/lib/zone-persistence';
import type { ZoneRecommendationSpecies } from '@/lib/queries/plants';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';

interface ZoneRecommendationsProps {
  species: ZoneRecommendationSpecies[];
}

const ZONES = Array.from({ length: 13 }, (_, i) => i + 1);

function dispatchZoneChanged(zone: number | null) {
  window.dispatchEvent(new CustomEvent('zone-changed', { detail: zone }));
}

export function ZoneRecommendations({ species }: ZoneRecommendationsProps) {
  const [zone, setZone] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState('');

  useEffect(() => {
    const saved = getUserZone();
    setZone(saved);
    if (saved) setSelectedZone(String(saved));

    function handleZoneChanged(event: Event) {
      const next = (event as CustomEvent<number | null>).detail;
      setZone(next);
      if (next) setSelectedZone(String(next));
    }

    window.addEventListener('zone-changed', handleZoneChanged);
    return () => window.removeEventListener('zone-changed', handleZoneChanged);
  }, []);

  const picks = useMemo(() => {
    if (!zone) return [];

    return species
      .filter((item) => {
        if (item.zone_min == null || item.zone_max == null) return false;
        if (item.nursery_count <= 0) return false;
        return item.zone_min <= zone && item.zone_max >= zone;
      })
      .sort((a, b) => {
        if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
        return a.canonical_name.localeCompare(b.canonical_name);
      })
      .slice(0, 8);
  }, [species, zone]);

  if (!zone) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-6">
          <Text variant="h2">Great Picks for Your Zone</Text>
          <Text variant="sm" color="secondary" className="mt-2">
            Set your zone to see personalized picks.
          </Text>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value)}
              className="rounded border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary"
            >
              <option value="">Select zone</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedZone}
              onClick={() => {
                if (!selectedZone) return;
                const next = Number(selectedZone);
                setUserZone(next);
                setZone(next);
                dispatchZoneChanged(next);
              }}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover disabled:opacity-50"
            >
              Set Zone
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Text variant="h2">Great Picks for Zone {zone}</Text>
        <button
          type="button"
          onClick={() => {
            clearUserZone();
            setZone(null);
            setSelectedZone('');
            dispatchZoneChanged(null);
          }}
          className="text-sm text-accent hover:underline"
        >
          Change zone
        </button>
      </div>

      {picks.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-5">
          <Text variant="sm" color="secondary">
            No in-stock recommendations yet for Zone {zone}. Try browsing all plants.
          </Text>
          <Link href="/browse" className="mt-3 inline-block text-sm text-accent hover:underline">
            Browse all plants
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {picks.map((item) => (
            <Link
              key={item.slug}
              href={`/plants/${item.slug}`}
              className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-4 transition-colors hover:border-border hover:bg-surface-raised"
            >
              <Text variant="h3" color="accent" className="line-clamp-1">
                {item.canonical_name}
              </Text>
              {item.botanical_name && (
                <Text variant="caption" color="tertiary" className="mt-0.5 line-clamp-1">
                  <BotanicalName>{item.botanical_name}</BotanicalName>
                </Text>
              )}
              <Text variant="caption" color="secondary" className="mt-2">
                Zone {item.zone_min}-{item.zone_max}
              </Text>
              <Text variant="caption" color="tertiary">
                {item.nursery_count} {item.nursery_count === 1 ? 'nursery' : 'nurseries'} with stock
              </Text>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
