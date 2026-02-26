import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listPlantEntities } from '@/lib/queries/plants';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

interface SpeciesOfferRow {
  species_slug: string | null;
  active_offer_count: number | null;
}

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

function formatFreshnessLabel(iso: string | null): string {
  if (!iso) return 'not yet available';

  const completedAt = new Date(iso);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysAgo = Math.floor(
    (now.getTime() - completedAt.getTime()) / msPerDay
  );

  if (daysAgo <= 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;

  return completedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function HomePage() {
  const supabase = await createClient();
  const [
    species,
    { data: speciesOfferRows },
    { data: nurseryOfferRows },
    { count: publishedCultivarCount },
    { data: latestCompletedRun },
  ] = await Promise.all([
    listPlantEntities(supabase),
    supabase
      .from('material_search_index')
      .select('species_slug, active_offer_count')
      .eq('index_source', 'cultivar'),
    supabase
      .from('inventory_offers')
      .select('nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('cultivars')
      .select('id', { count: 'exact', head: true })
      .eq('curation_status', 'published'),
    supabase
      .from('import_runs')
      .select('completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const offerCountBySpeciesSlug = new Map<string, number>();
  for (const row of (speciesOfferRows ?? []) as SpeciesOfferRow[]) {
    if (!row.species_slug) continue;
    offerCountBySpeciesSlug.set(
      row.species_slug,
      (offerCountBySpeciesSlug.get(row.species_slug) ?? 0) +
        (row.active_offer_count ?? 0)
    );
  }

  const speciesWithOfferCounts = species.map((plant: any) => ({
    ...plant,
    active_offer_count: offerCountBySpeciesSlug.get(plant.slug) ?? 0,
  }));

  const trackedNurseryCount = new Set(
    ((nurseryOfferRows ?? []) as NurseryOfferRow[]).map((row) => row.nursery_id)
  ).size;
  const freshnessLabel = formatFreshnessLabel(
    latestCompletedRun?.completed_at ?? null
  );

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
        {speciesWithOfferCounts.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {speciesWithOfferCounts.map((pe: any) => (
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
          Tracking {trackedNurseryCount} nurseries &middot;{' '}
          {publishedCultivarCount ?? 0} cultivars &middot; Last updated{' '}
          {freshnessLabel}
        </Text>
      </section>

      {/* Visual bridge between hero and browse */}
      <div className="mx-auto my-12 h-px w-16 bg-border" />

      {/* Browse by Species grid */}
      <section className="pb-8">
        <Text variant="h2" className="mb-4">
          Browse by Species
        </Text>
        {speciesWithOfferCounts.length === 0 ? (
          <EmptyState
            title="No plant data yet"
            description="Deploy the Wave 1 schema and seed data to Supabase to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {speciesWithOfferCounts.map((pe: any) => (
              <Link key={pe.id} href={`/plants/${pe.slug}`}>
                <div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
                  <Text variant="h3" color="accent">{pe.canonical_name}</Text>
                  <Text variant="sm" color="secondary"><BotanicalName>{pe.botanical_name}</BotanicalName></Text>
                  <Text variant="caption" color="tertiary" className="mt-1">
                    {pe.genus} &middot; {pe.family}
                  </Text>
                  <Text variant="caption" color="tertiary" className="mt-1">
                    {pe.active_offer_count} active{' '}
                    {pe.active_offer_count === 1 ? 'offer' : 'offers'}
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
