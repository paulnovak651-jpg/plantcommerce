'use client';

import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types (matching the API response shape from /api/taxonomy/genus/[slug])
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

export interface GenusPreviewData {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  species: SpeciesPreviewItem[];
}

// Re-export for backwards compat (TaxonomyExplorer uses these)
export type SpeciesPreviewData = GenusPreviewData;

// ---------------------------------------------------------------------------
// Flatten species + cultivars into a single preview list
// ---------------------------------------------------------------------------

interface PreviewItem {
  name: string;
  botanical_name: string | null;
  href: string;
  nursery_count: number;
  lowest_price_cents: number | null;
  zone_min: number | null;
  zone_max: number | null;
}

function flattenSpecies(species: SpeciesPreviewItem[]): PreviewItem[] {
  const items: PreviewItem[] = [];
  for (const sp of species) {
    if (sp.top_cultivars.length === 0) {
      items.push({
        name: sp.canonical_name,
        botanical_name: sp.botanical_name,
        href: `/plants/${sp.slug}`,
        nursery_count: sp.nursery_count,
        lowest_price_cents: null,
        zone_min: sp.zone_min,
        zone_max: sp.zone_max,
      });
    } else {
      for (const cv of sp.top_cultivars) {
        items.push({
          name: cv.name,
          botanical_name: sp.botanical_name,
          href: `/plants/${sp.slug}/${cv.slug}`,
          nursery_count: sp.nursery_count,
          lowest_price_cents: cv.lowest_price_cents,
          zone_min: sp.zone_min,
          zone_max: sp.zone_max,
        });
      }
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Skeleton
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
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview item card (compact)
// ---------------------------------------------------------------------------

function PreviewCard({ item }: { item: PreviewItem }) {
  const hasZone = item.zone_min != null || item.zone_max != null;
  const zoneLabel = hasZone
    ? `Z${item.zone_min ?? '?'}-${item.zone_max ?? '?'}`
    : null;

  return (
    <div className="border border-border-subtle rounded-lg p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={item.href}
            className="text-[13px] font-medium text-text-primary hover:text-accent transition-colors leading-tight"
          >
            {item.name}
          </Link>
          {item.botanical_name && (
            <div className="text-[10px] text-text-tertiary italic leading-tight truncate mt-0.5">
              {item.botanical_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {zoneLabel && (
            <span className="bg-surface-inset text-text-secondary text-[10px] rounded-full px-1.5 py-0.5 leading-none">
              {zoneLabel}
            </span>
          )}
          {item.nursery_count > 0 && (
            <span className="bg-accent-light text-accent text-[10px] rounded-full px-1.5 py-0.5 leading-none">
              {item.nursery_count} {item.nursery_count === 1 ? 'nursery' : 'nurseries'}
            </span>
          )}
        </div>
      </div>
      {item.lowest_price_cents != null && (
        <div className="text-[11px] text-text-secondary mt-1">
          From ${(item.lowest_price_cents / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface GenusPreviewPanelProps {
  data: GenusPreviewData | null;
  loading: boolean;
}

export function GenusPreviewPanel({ data, loading }: GenusPreviewPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
          <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Plants & Cultivars
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
            Plants & Cultivars
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[13px] text-text-tertiary text-center leading-snug">
            &larr; Select a genus to see plants and cultivars
          </p>
        </div>
      </div>
    );
  }

  const flatItems = flattenSpecies(data.species);
  const genusHref = `/plants/genus/${data.genus_slug.replace(/^genus-/, '')}`;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          {data.common_name} — {flatItems.length} plants
        </span>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {flatItems.map((item) => (
          <PreviewCard key={item.href} item={item} />
        ))}
      </div>
      <div className="border-t border-border-subtle px-3 py-2 shrink-0">
        <Link
          href={genusHref}
          className="text-[12px] font-medium text-accent hover:underline"
        >
          View all &rarr;
        </Link>
      </div>
    </div>
  );
}
