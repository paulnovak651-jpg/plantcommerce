'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { getUserZone } from '@/lib/zone-persistence';

export function HomepageHero() {
  const router = useRouter();

  const quickStarts = [
    { label: 'Fruit trees', href: '/?cat=tree-fruit' },
    { label: 'Nut trees', href: '/?cat=nut-trees' },
    { label: 'Nitrogen fixers', href: '/?cat=support-species' },
    { label: 'In stock now', href: '/?available=true' },
  ];

  const zone = typeof window !== 'undefined' ? getUserZone() : null;

  return (
    <section className="bg-surface-raised border-b border-border-subtle">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary">
          Search once, compare nurseries.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-text-secondary">
          The free plant comparison tool for the permaculture community.
        </p>

        <div className="mt-6 mx-auto max-w-xl">
          <SearchBar
            inputId="hero-search"
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const q = (formData.get('q') as string)?.trim();
              if (q) {
                router.push(`/?q=${encodeURIComponent(q)}`);
              }
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {zone && (
            <button
              type="button"
              onClick={() => router.push(`/?zoneMin=${zone}&zoneMax=${zone}`)}
              className="rounded-full border border-accent bg-accent-light px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-text-inverse cursor-pointer"
            >
              My zone ({zone})
            </button>
          )}
          {quickStarts.map((qs) => (
            <button
              key={qs.label}
              type="button"
              onClick={() => router.push(qs.href)}
              className="rounded-full border border-border-subtle bg-surface-primary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent cursor-pointer"
            >
              {qs.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
