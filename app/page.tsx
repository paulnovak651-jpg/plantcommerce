import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  getRecentlyRestocked,
  getBestDeals,
  getNewAdditions,
  getZoneRecommendationSpecies,
} from '@/lib/queries/plants';
import type { HomepagePlant } from '@/lib/queries/plants';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { JsonLd } from '@/components/JsonLd';
import { BrowseContent } from '@/components/BrowseContent';
import { BrowseGridSkeleton } from '@/components/PlantCardSkeleton';
import { HomepageSection } from '@/components/HomepageSection';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SeasonalBanner } from '@/components/SeasonalBanner';
import { ZoneRecommendations } from '@/components/ZoneRecommendations';

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

function DealCard({ plant }: { plant: HomepagePlant }) {
  return (
    <Link
      href={`/plants/${plant.speciesSlug}/${plant.cultivarSlug}`}
      className="group min-w-[200px] snap-start rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-4 transition-colors hover:bg-surface-raised hover:border-border md:min-w-0"
    >
      <Text variant="h3" color="accent" className="line-clamp-1">
        {plant.cultivarName}
      </Text>
      <Text variant="caption" color="secondary" className="mt-0.5 line-clamp-1">
        {plant.speciesName}
      </Text>
      {plant.lowestPriceCents != null && (
        <Text variant="price" color="accent" as="p" className="mt-2">
          ${(plant.lowestPriceCents / 100).toFixed(2)}
        </Text>
      )}
      {plant.nurseryName && (
        <Text variant="caption" color="tertiary" className="mt-0.5">
          at {plant.nurseryName}
        </Text>
      )}
    </Link>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [
    allPlants,
    { data: nurseryOfferRows },
    { count: publishedCultivarCount },
    recentlyRestocked,
    bestDeals,
    newAdditions,
    zoneRecommendationSpecies,
  ] = await Promise.all([
    getAllBrowsePlants(supabase),
    supabase
      .from('inventory_offers')
      .select('nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('cultivars')
      .select('id', { count: 'exact', head: true })
      .eq('curation_status', 'published'),
    getRecentlyRestocked(supabase),
    getBestDeals(supabase),
    getNewAdditions(supabase),
    getZoneRecommendationSpecies(supabase),
  ]);

  const trackedNurseryCount = new Set(
    ((nurseryOfferRows ?? []) as NurseryOfferRow[]).map((row) => row.nursery_id)
  ).size;
  const totalSpecies = allPlants.length;

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
          <Text variant="display" as="h1" color="inverse" className="text-4xl md:text-5xl">
            Find Plants, Compare Nurseries
          </Text>
          <Text variant="body" color="inverse" className="mt-4 text-lg opacity-80">
            Search once, compare nursery stock across North America.
          </Text>
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
                <Text variant="h2" color="inverse" as="p">{stat.value}</Text>
                <Text variant="caption" color="inverse" as="p" className="uppercase tracking-wide opacity-60">{stat.label}</Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeasonalBanner />

      {/* Browse Funnel */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Suspense fallback={<BrowseGridSkeleton />}>
          <BrowseContent allPlants={allPlants} />
        </Suspense>
      </section>

      {/* Dynamic Sections */}
      {recentlyRestocked.length > 0 && (
        <ScrollReveal>
          <HomepageSection title="Recently Restocked" seeAllHref="/?available=true&sort=available">
            {recentlyRestocked.map((plant) => (
              <DealCard key={plant.cultivarSlug} plant={plant} />
            ))}
          </HomepageSection>
        </ScrollReveal>
      )}

      {bestDeals.length > 0 && (
        <ScrollReveal>
          <HomepageSection title="Best Deals" seeAllHref="/?available=true&sort=available">
            {bestDeals.map((plant) => (
              <DealCard key={plant.cultivarSlug} plant={plant} />
            ))}
          </HomepageSection>
        </ScrollReveal>
      )}

      {newAdditions.length > 0 && (
        <ScrollReveal>
          <HomepageSection title="New to the Database" seeAllHref="/?sort=name-asc">
            {newAdditions.map((plant) => (
              <DealCard key={plant.cultivarSlug} plant={plant} />
            ))}
          </HomepageSection>
        </ScrollReveal>
      )}

      <ZoneRecommendations species={zoneRecommendationSpecies} />

      {/* How It Works — demoted below dynamic sections */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Text variant="h1" className="text-center">How It Works</Text>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Search',
              description: 'Find the exact cultivar you\'re looking for across multiple nurseries',
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
              ),
            },
            {
              title: 'Compare',
              description: 'See prices, availability, and forms side-by-side',
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
                  <path strokeLinecap="round" d="M9 6v12M15 6v12" />
                </svg>
              ),
            },
            {
              title: 'Buy',
              description: 'Go directly to the nursery\'s product page to purchase',
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              ),
            },
          ].map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-6 py-8 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                {step.icon}
              </div>
              <Text variant="caption" color="tertiary" as="p" className="mt-1 font-medium uppercase tracking-wide">
                Step {i + 1}
              </Text>
              <Text variant="h3" className="mt-3">{step.title}</Text>
              <Text variant="sm" color="secondary" as="p" className="mt-2">{step.description}</Text>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
