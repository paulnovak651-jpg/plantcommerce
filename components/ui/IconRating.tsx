import { Text } from './Text';

interface IconRatingProps {
  label: string;
  value: string;
  filled: number;
  total?: number;
  icon: 'sun' | 'water' | 'growth';
}

function titleize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function IconGlyph({ icon }: { icon: IconRatingProps['icon'] }) {
  if (icon === 'sun') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
      </svg>
    );
  }

  if (icon === 'water') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M12 3c-2.8 4.2-6 7.2-6 10a6 6 0 1 0 12 0c0-2.8-3.2-5.8-6-10z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M5 16c1.5-4 5.5-6 10-6" />
      <path d="M14 6h5v5" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function IconRating({
  label,
  value,
  filled,
  total = 4,
  icon,
}: IconRatingProps) {
  const filledCount = Math.max(0, Math.min(total, filled));

  return (
    <div>
      <Text variant="caption" color="tertiary" className="block">
        {label}
      </Text>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, idx) => {
            const isFilled = idx < filledCount;
            return (
              <span
                key={idx}
                className={`inline-flex h-4 w-4 ${isFilled ? 'text-accent' : 'text-text-tertiary opacity-30'}`}
              >
                <IconGlyph icon={icon} />
              </span>
            );
          })}
        </div>
        <Text variant="sm" color="secondary">
          {titleize(value)}
        </Text>
      </div>
    </div>
  );
}

