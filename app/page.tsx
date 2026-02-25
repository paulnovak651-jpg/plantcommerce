import { createClient } from '@/lib/supabase/server';
import { listPlantEntities } from '@/lib/queries/plants';
import Link from 'next/link';
import { SearchBar } from '@/components/ui/SearchBar';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

export default async function HomePage() {
  const supabase = await createClient();
  const species = await listPlantEntities(supabase);

  return (
    <div>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Plant Commerce',
            url: 'https://plantcommerce.app',
            description:
              'Plant database and nursery inventory aggregator for the permaculture community.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://plantcommerce.app/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />

      {/* Hero: search-first, centered, breathing room */}
      <section className="flex flex-col items-center py-16 text-center">
        <h1 className="mb-2 font-serif text-[2.4rem] font-semibold leading-[1.2] text-text-primary">
          Plant Commerce
        </h1>
        <p className="mb-8 text-lg text-text-secondary">
          Find plants. Compare nurseries.
        </p>
        <SearchBar />

        {/* Quick-access genus chips */}
        {species.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {species.map((pe: any) => (
              <Link
                key={pe.id}
                href={`/plants/${pe.slug}`}
                className="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
              >
                {pe.canonical_name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Browse by Species grid */}
      <section className="pb-8">
        <h2 className="mb-4 font-serif text-[1.25rem] font-semibold text-text-primary">
          Browse by Species
        </h2>
        {species.length === 0 ? (
          <EmptyState
            title="No plant data yet"
            description="Deploy the Wave 1 schema and seed data to Supabase to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {species.map((pe: any) => (
              <Link key={pe.id} href={`/plants/${pe.slug}`}>
                <Surface elevation="raised" padding="default" className="h-full hover:border-accent">
                  <h3 className="font-medium text-accent">{pe.canonical_name}</h3>
                  <p className="font-serif text-sm italic text-text-secondary">{pe.botanical_name}</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {pe.genus} &middot; {pe.family}
                  </p>
                </Surface>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
