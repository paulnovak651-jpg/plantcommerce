import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getHomepageCategories } from '@/lib/queries/plants';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
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

      {/* Hero */}
      <section className="relative bg-accent px-4 py-20 text-center hero-grain">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl font-semibold text-text-inverse md:text-5xl">
            Find Plants, Compare Nurseries
          </h1>
          <p className="mt-4 text-lg text-text-inverse/80">
            Search once, compare nursery stock across North America.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            {[
              { value: totalSpecies, label: 'Species' },
              { value: publishedCultivarCount ?? 0, label: 'Cultivars' },
              { value: trackedNurseryCount, label: 'Nurseries' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-lg)] bg-white/10 px-5 py-3 text-center backdrop-blur-sm"
              >
                <p className="font-serif text-2xl font-semibold text-text-inverse">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-text-inverse/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Text variant="h1">Browse by Category</Text>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((group) => (
            <CategoryCard key={group.category} group={group} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/browse"
            className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Browse All Plants 
          </Link>
        </div>
      </section>
    </div>
  );
}
