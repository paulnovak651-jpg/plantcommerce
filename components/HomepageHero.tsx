'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';

export function HomepageHero() {
  const router = useRouter();

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
      </div>
    </section>
  );
}
