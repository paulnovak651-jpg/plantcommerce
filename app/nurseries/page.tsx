import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listNurseries } from '@/lib/queries/nurseries';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { NurseryMap } from '@/components/NurseryMap';
import type { NurseryPin } from '@/components/NurseryMap';

export const metadata: Metadata = {
  title: 'Nurseries',
  description:
    'Browse plant nurseries with live inventory. Compare availability and pricing across nurseries for permaculture cultivars.',
  openGraph: {
    title: 'Nurseries | Plant Commerce',
    description:
      'Browse plant nurseries with live inventory. Compare availability and pricing across nurseries.',
    url: 'https://plantcommerce.app/nurseries',
  },
};

function displayNurseryName(name: string): string {
  if (name === name.toUpperCase() && /[A-Z]/.test(name)) {
    return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

export default async function NurseriesPage() {
  const supabase = await createClient();
  const nurseries = await listNurseries(supabase);
  const liveNurseries = nurseries.filter((nursery: any) => nursery.offer_count > 0);
  const comingSoonNurseries = nurseries.filter(
    (nursery: any) => nursery.offer_count === 0
  );

  const nurseryPins: NurseryPin[] = liveNurseries
    .filter((n: any) => n.latitude != null && n.longitude != null)
    .map((n: any) => ({
      id: n.id as string,
      name: displayNurseryName(n.name as string),
      slug: n.slug as string,
      latitude: n.latitude as number,
      longitude: n.longitude as number,
    }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Plant Nurseries',
    numberOfItems: liveNurseries.length,
    itemListElement: liveNurseries.map((n: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Organization',
        name: n.name,
        url: `https://plantcommerce.app/nurseries/${n.slug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: n.location_city,
          addressRegion: n.location_state,
          addressCountry: n.location_country,
        },
      },
    })),
  };

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <section>
        <Text variant="h1">Nurseries</Text>
        <Text variant="body" color="secondary" className="mt-1">
          Browse plant nurseries with live inventory and pricing.
        </Text>
      </section>

      {nurseries.length === 0 || liveNurseries.length === 0 ? (
        <EmptyState
          title="No nursery data yet"
          description="Deploy the schema and run the pipeline to populate nursery data."
        />
      ) : (
        <div className="space-y-6">
          {nurseryPins.length > 0 && (
            <NurseryMap nurseries={nurseryPins} height="300px" />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveNurseries.map((n: any) => (
              <Link key={n.id} href={`/nurseries/${n.slug}`}>
                <div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
                  <Text variant="h3" color="accent">{displayNurseryName(n.name)}</Text>
                  <Text variant="sm" color="secondary" className="mt-1">
                    {[n.location_city, n.location_state, n.location_country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Tag type="availability">{n.offer_count} {n.offer_count === 1 ? 'offer' : 'offers'}</Tag>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {comingSoonNurseries.length > 0 && (
            <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3">
              <Text variant="h3">More Nurseries Coming Soon</Text>
              <Text variant="sm" color="secondary" className="mt-1">
                We&rsquo;re expanding our network. More nurseries will appear here as we add
                inventory sources.
              </Text>
            </section>
          )}
        </div>
      )}

      <JsonLd data={jsonLd} />
    </div>
  );
}
