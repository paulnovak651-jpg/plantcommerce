'use client';

import Link from 'next/link';
import { PlantImage } from '@/components/ui/PlantImage';
import { Tag } from '@/components/ui/Tag';
import { useCompare, type CompareItem } from '@/components/compare/CompareContext';

export interface PlantCardProps {
  slug: string;
  canonicalName: string;
  botanicalName?: string | null;
  imageUrl?: string | null;
  nurseryCount: number;
  cultivarCount: number;
  zoneMin?: number | null;
  zoneMax?: number | null;
  lowestPrice?: number | null;
  bestNursery?: string | null;
  hasGrowingProfile?: boolean;
  cultivarId?: string;
}

export function PlantCard(props: PlantCardProps) {
  const { add, remove, has } = useCompare();
  const isComparing = props.cultivarId ? has(props.cultivarId) : false;

  function handleCompareClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!props.cultivarId) return;
    const item: CompareItem = {
      id: props.cultivarId,
      name: props.canonicalName,
      speciesName: props.botanicalName ?? '',
      speciesSlug: props.slug,
      cultivarSlug: props.slug,
      zoneMin: props.zoneMin ?? null,
      zoneMax: props.zoneMax ?? null,
      priceCents: props.lowestPrice ?? null,
      nurseryCount: props.nurseryCount,
    };
    isComparing ? remove(props.cultivarId) : add(item);
  }

  return (
    <Link
      href={`/plants/${props.slug}`}
      className="group relative block plant-card-hover rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary"
    >
      {props.cultivarId && (
        <button
          type="button"
          onClick={handleCompareClick}
          className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer ${
            isComparing
              ? 'bg-accent text-text-inverse'
              : 'bg-surface-primary/80 text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-text-inverse'
          }`}
          aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
        >
          {isComparing ? '\u2713' : '+'}
        </button>
      )}
      <div className="relative">
        <PlantImage src={props.imageUrl ?? null} alt={props.canonicalName} aspectRatio="3/4" />
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-[var(--radius-lg)] px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-white"
          style={{
            backgroundColor:
              props.nurseryCount > 0 ? 'rgba(45,106,79,0.85)' : 'rgba(138,130,121,0.75)',
          }}
        >
          {props.nurseryCount > 0
            ? `Available at ${props.nurseryCount} ${props.nurseryCount === 1 ? 'nursery' : 'nurseries'}`
            : 'Check availability'}
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium leading-snug text-text-primary">{props.canonicalName}</p>
        {props.botanicalName && (
          <p className="mt-0.5 font-serif text-sm italic text-text-secondary">{props.botanicalName}</p>
        )}
        {props.lowestPrice != null ? (
          <p className="mt-1 text-sm font-semibold text-accent">
            from ${(props.lowestPrice / 100).toFixed(2)}
          </p>
        ) : props.nurseryCount === 0 ? (
          <p className="mt-1 text-sm text-text-tertiary">No current listings</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {props.zoneMin != null && props.zoneMax != null && (
            <Tag type="zone">Z{props.zoneMin}{'\u2013'}{props.zoneMax}</Tag>
          )}
          {props.nurseryCount === 0 && props.hasGrowingProfile && (
            <Tag type="info">Growing info</Tag>
          )}
        </div>
        {props.cultivarCount > 0 && (
          <p className="mt-1 text-xs font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {props.cultivarCount} cultivar{props.cultivarCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
