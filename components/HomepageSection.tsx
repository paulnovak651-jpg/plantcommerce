import Link from 'next/link';
import { Text } from '@/components/ui/Text';

interface HomepageSectionProps {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
}

export function HomepageSection({ title, seeAllHref, children }: HomepageSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <Text variant="h2">{title}</Text>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm font-medium text-accent hover:text-accent-hover">
            See all &rarr;
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:overflow-visible md:snap-none">
        {children}
      </div>
    </section>
  );
}
