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
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary/50"
          >
            <path d="M17 8c.7-1 1-2.2 1-3.5 0-.4 0-.8-.1-1.2C14.8 3.8 12 6 12 6s-2.8-2.2-5.9-2.7C6 3.7 6 4.1 6 4.5 6 5.8 6.3 7 7 8c-2.2 1.2-4 3.4-4 6.5 0 4.4 4 8.5 9 9.5 5-1 9-5.1 9-9.5 0-3.1-1.8-5.3-4-6.5z" />
            <path d="M12 6v18" />
          </svg>
          <span className="mt-2 text-xs text-text-tertiary/50">{props.alt}</span>
        </div>
      )}
    </div>
  );
}
