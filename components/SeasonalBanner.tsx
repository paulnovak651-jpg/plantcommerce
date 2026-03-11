import Link from 'next/link';
import { Text } from '@/components/ui/Text';

interface SeasonalMessage {
  title: string;
  description: string;
  href: string;
  cta: string;
}

function getSeasonalMessage(month: number): SeasonalMessage {
  if (month >= 0 && month <= 2) {
    return {
      title: 'Spring planning season',
      description: 'Browse bare root availability while planning spring plantings.',
      href: '/browse?available=true',
      cta: 'Browse availability',
    };
  }
  if (month >= 3 && month <= 5) {
    return {
      title: 'Spring planting',
      description: "See what's in stock now across tracked nurseries.",
      href: '/browse?available=true&sort=available',
      cta: 'See in-stock plants',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      title: 'Fall planting prep',
      description: 'Research cultivars now and pre-order for autumn delivery.',
      href: '/browse',
      cta: 'Research cultivars',
    };
  }
  return {
    title: 'Winter planning',
    description: 'Use winter to compare cultivars and plan for spring.',
    href: '/browse',
    cta: 'Start planning',
  };
}

export function SeasonalBanner() {
  const now = new Date();
  const message = getSeasonalMessage(now.getMonth());

  return (
    <section className="border-b border-border-subtle bg-surface-primary">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h3">{message.title}</Text>
          <Text variant="sm" color="secondary">
            {message.description}
          </Text>
        </div>
        <Link
          href={message.href}
          className="inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-inset"
        >
          {message.cta}
        </Link>
      </div>
    </section>
  );
}
