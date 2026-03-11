'use client';

import { useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types (matching the API response shape)
// ---------------------------------------------------------------------------

export interface SpeciesPreviewCultivar {
  slug: string;
  name: string;
  lowest_price_cents: number | null;
}

export interface SpeciesPreviewItem {
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  zone_min: number | null;
  zone_max: number | null;
  nursery_count: number;
  cultivar_count: number;
  top_cultivars: SpeciesPreviewCultivar[];
}

export interface SpeciesPreviewData {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  species: SpeciesPreviewItem[];
}

// ---------------------------------------------------------------------------
// Skeleton — 3 blocks matching species card layout
// ---------------------------------------------------------------------------

function PreviewSkeleton() {
  return (
    <div className="p-2 space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border-subtle rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="h-3.5 bg-surface-inset rounded w-3/5" />
              <div className="h-2.5 bg-surface-inset rounded w-2/5" />
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="h-4 w-8 bg-surface-inset rounded-full" />
              <div className="h-4 w-14 bg-surface-inset rounded-full" />
            </div>
          </div>
          <div className="h-2.5 bg-surface-inset rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cultivar list (expandable)
// ---------------------------------------------------------------------------

function CultivarList({
  cultivars,
  speciesSlug,
}: {
  cultivars: SpeciesPreviewCultivar[];
  speciesSlug: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (cultivars.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer leading-none"
      >
        {expanded ? '\u25B4' : '\u25BE'} {cultivars.length} cultivar{cultivars.length !== 1 ? 's' : ''}
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-px pl-2 border-l border-border-subtle ml-1">
          {cultivars.map((cv) => (
            <div key={cv.slug} className="flex items-center justify-between gap-2 py-px">
              <Link
                href={`/plants/${speciesSlug}/${cv.slug}`}
                className="text-[11px] text-text-secondary hover:text-accent transition-colors truncate"
              >
                &lsquo;{cv.name}&rsquo;
              </Link>
              {cv.lowest_price_cents != null && (
                <span className="text-[10px] text-text-tertiary shrink-0">
                  ${(cv.lowest_price_cents / 100).toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Species card
// ---------------------------------------------------------------------------

function SpeciesCard({ species }: { species: SpeciesPreviewItem }) {
  const hasZone = species.zone_min != null || species.zone_max != null;
  const zoneLabel =
    hasZone
      ? `Z${species.zone_min ?? '?'}-${species.zone_max ?? '?'}`
      : null;

  return (
    <div className="border border-border-subtle rounded-lg p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/plants/${species.slug}`}
            className="text-[13px] font-medium text-text-primary hover:text-accent transition-colors leading-tight"
          >
            {species.canonical_name}
          </Link>
          {species.botanical_name && (
            <div className="text-[10px] text-text-tertiary italic leading-tight truncate mt-0.5">
              {species.botanical_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {zoneLabel && (
            <span className="bg-surface-inset text-text-secondary text-[10px] rounded-full px-1.5 py-0.5 leading-none">
              {zoneLabel}
            </span>
          )}
          {species.nursery_count > 0 && (
            <span className="bg-accent-light text-accent text-[10px] rounded-full px-1.5 py-0.5 leading-none">
              {species.nursery_count} {species.nursery_count === 1 ? 'nursery' : 'nurseries'}
            </span>
          )}
        </div>
      </div>

      <CultivarList
        cultivars={species.top_cultivars}
        speciesSlug={species.slug}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface SpeciesPreviewPanelProps {
  data: SpeciesPreviewData | null;
  loading: boolean;
}

export function SpeciesPreviewPanel({ data, loading }: SpeciesPreviewPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
          <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Species & Cultivars
          </span>
        </div>
        <PreviewSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
          <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Species & Cultivars
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[13px] text-text-tertiary text-center leading-snug">
            &larr; Select a genus to see species and cultivars
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          {data.common_name} — {data.species.length} species
        </span>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {data.species.map((sp) => (
          <SpeciesCard key={sp.slug} species={sp} />
        ))}
      </div>
    </div>
  );
}
