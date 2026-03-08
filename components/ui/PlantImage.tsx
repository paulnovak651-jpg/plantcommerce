import Image from 'next/image';

export interface PlantImageProps {
  src?: string | null;
  alt: string;
  aspectRatio?: '3/4' | '1/1' | '16/9';
  className?: string;
}

export function PlantImage(props: PlantImageProps) {
  const aspectRatio = props.aspectRatio ?? '3/4';
  const aspectClass =
    aspectRatio === '1/1'
      ? 'aspect-square'
      : aspectRatio === '16/9'
        ? 'aspect-video'
        : 'aspect-[3/4]';

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] ${aspectClass} ${props.className ?? ''}`}
    >
      {props.src ? (
        <Image
          src={props.src}
          alt={props.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-inset">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary/30"
          >
            {/* Stem */}
            <path d="M32 56V28" />
            <path d="M32 44c-4-2-8-1-12 2" />
            <path d="M32 38c3-2 7-1 10 1" />
            {/* Main leaf */}
            <path d="M32 28c0 0-12-4-14-16 8-2 14 4 14 16z" />
            <path d="M32 28c0 0 12-4 14-16-8-2-14 4-14 16z" />
            {/* Leaf veins */}
            <path d="M32 28c-3-4-7-7-11-9" strokeDasharray="2 2" />
            <path d="M32 28c3-4 7-7 11-9" strokeDasharray="2 2" />
            <path d="M32 20c-2-2-5-4-8-5" strokeDasharray="2 2" />
            <path d="M32 20c2-2 5-4 8-5" strokeDasharray="2 2" />
          </svg>
          <span className="mt-2 text-xs text-text-tertiary/40">{props.alt}</span>
        </div>
      )}
    </div>
  );
}
