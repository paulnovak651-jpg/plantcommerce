import { createClient } from '@/lib/supabase/server';
import { listPlantEntities } from '@/lib/queries/plants';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { SearchBar } from '@/components/ui/SearchBar';
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
        <Text variant="display" className="mb-2">
          Plant Commerce
        </Text>
        <Text variant="body" color="secondary" className="mb-8 text-lg">
          Find plants. Compare nurseries.
        </Text>
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

      {/* Visual bridge between hero and browse */}
      <div className="mx-auto my-6 h-px w-16 bg-border" />

      {/* Browse by Species grid */}
      <section className="pb-8">
        <Text variant="h2" className="mb-4">
          Browse by Species
        </Text>
        {species.length === 0 ? (
          <EmptyState
            title="No plant data yet"
            description="Deploy the Wave 1 schema and seed data to Supabase to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {species.map((pe: any) => (
              <Link key={pe.id} href={`/plants/${pe.slug}`}>
                <div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
                  <Text variant="h3" color="accent">{pe.canonical_name}</Text>
                  <Text variant="sm" color="secondary"><BotanicalName>{pe.botanical_name}</BotanicalName></Text>
                  <Text variant="caption" color="tertiary" className="mt-1">
                    {pe.genus} &middot; {pe.family}
                  </Text>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
