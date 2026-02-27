import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getHomepageCategories } from '@/lib/queries/plants';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { JsonLd } from '@/components/JsonLd';
import { CategoryCard } from '@/components/CategoryCard';

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
  const [categories, { data: nurseryOfferRows }, { count: publishedCultivarCount }] =
    await Promise.all([
      getHomepageCategories(supabase),
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
  const totalSpecies = categories.reduce((sum, group) => sum + group.species_count, 0);

  return (
    <div className="space-y-[var(--spacing-zone)]">
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

      <section className="py-12 text-center">
        <Text variant="display">Plant Commerce</Text>
        <Text variant="body" color="secondary" className="mx-auto mt-2 max-w-2xl">
          Search once, compare nursery stock across North America.
        </Text>
        <div className="mt-8">
          <SearchBar />
        </div>
      </section>

      <section>
        <Text variant="h2" className="mb-4">
          Browse by Category
        </Text>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.category}
              category={category.category}
              speciesCount={category.species_count}
              cultivarCount={category.cultivar_count}
              nurseryCount={category.nursery_count}
              topSpecies={category.top_species}
            />
          ))}
        </div>
      </section>

      <Surface elevation="raised" padding="default">
        <Text variant="h3">Quick Stats</Text>
        <Text variant="sm" color="secondary" className="mt-2">
          Tracking {trackedNurseryCount} nurseries · {totalSpecies}+ species ·{' '}
          {publishedCultivarCount ?? 0} cultivars
        </Text>
        <Text variant="caption" color="tertiary" className="mt-1 block">
          All purchases happen directly on nursery sites.
        </Text>
      </Surface>

      <Surface elevation="raised" padding="default">
        <Text variant="h2">How It Works</Text>
        <ol className="mt-3 space-y-2">
          <li>
            <Text variant="sm" color="secondary">
              1. Search for a plant cultivar by name or growing zone.
            </Text>
          </li>
          <li>
            <Text variant="sm" color="secondary">
              2. Compare prices and availability across nurseries.
            </Text>
          </li>
          <li>
            <Text variant="sm" color="secondary">
              3. Buy directly from the nursery - we never handle transactions.
            </Text>
          </li>
        </ol>
      </Surface>
    </div>
  );
}
