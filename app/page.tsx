import { createClient } from '@/lib/supabase/server';
import { listPlantEntities } from '@/lib/queries/plants';
import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
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

      <section className="mb-12">
        <h1 className="mb-2 text-3xl font-bold text-green-900">Plant Commerce</h1>
        <p className="mb-6 text-lg text-gray-600">
          Search across nurseries. Find cultivars. Compare availability.
        </p>
        <SearchForm size="lg" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Browse by Species</h2>
        {species.length === 0 ? (
          <p className="text-gray-500">
            No plant data loaded yet. Deploy the Wave 1 schema and seed data to Supabase to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {species.map((pe: any) => (
              <Link
                key={pe.id}
                href={`/plants/${pe.slug}`}
                className="rounded-lg border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50"
              >
                <h3 className="font-semibold text-green-800">{pe.canonical_name}</h3>
                <p className="text-sm italic text-gray-500">{pe.botanical_name}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {pe.genus} &middot; {pe.family}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
