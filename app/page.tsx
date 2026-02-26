import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listPlantEntities } from '@/lib/queries/plants';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { JsonLd } from '@/components/JsonLd';

interface NurseryOfferRow {
  nursery_id: string;
}

export const metadata: Metadata = {
  title: 'Plant Commerce',
  description:
    'Search once, compare nursery stock across North America. Plant Commerce aggregates cultivars, pricing, and availability across nurseries.',
  openGraph: {
    title: 'Plant Commerce',
    description:
      'Search once, compare nursery stock across North America. Plant Commerce aggregates cultivars, pricing, and availability across nurseries.',
    url: 'https://plantcommerce.app/',
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const [
    species,
    { data: nurseryOfferRows },
    { count: publishedCultivarCount },
  ] = await Promise.all([
    listPlantEntities(supabase),
    supabase
      .from('inventory_offers')
      .select('nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('cultivars')
      .select('id', { count: 'exact', head: true })
      .eq('curation_status', 'published'),
  ]);

  const trackedNurseryCount = new Set(
    ((nurseryOfferRows ?? []) as NurseryOfferRow[]).map((row) => row.nursery_id)
  ).size;

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
          Search once, compare nursery stock across North America.
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

        <Text variant="sm" color="tertiary" className="mt-4">
          Tracking {trackedNurseryCount} nurseries &middot; {publishedCultivarCount ?? 0} cultivars
        </Text>
      </section>
    </div>
  );
}
