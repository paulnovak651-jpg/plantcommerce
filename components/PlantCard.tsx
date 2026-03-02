import Link from 'next/link';
import { PlantImage } from '@/components/ui/PlantImage';

export interface PlantCardProps {
  slug: string;
  canonicalName: string;
  botanicalName?: string | null;
  imageUrl?: string | null;
  nurseryCount: number;
  cultivarCount: number;
  zoneMin?: number | null;
  zoneMax?: number | null;
}

export function PlantCard(props: PlantCardProps) {
  return (
    <Link
      href={`/plants/${props.slug}`}
      className="group block plant-card-hover rounded-[var(--radius-lg)] bg-surface-raised"
    >
      <div className="relative">
        <PlantImage src={props.imageUrl ?? null} alt={props.canonicalName} aspectRatio="3/4" />
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-white"
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
        {props.zoneMin != null && props.zoneMax != null && (
          <p className="mt-1 text-xs text-text-tertiary">Zone {props.zoneMin}{'\u2013'}{props.zoneMax}</p>
        )}
      </div>
    </Link>
  );
}
