import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listNurseries } from '@/lib/queries/nurseries';
import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

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

export default async function NurseriesPage() {
  const supabase = await createClient();
  const nurseries = await listNurseries(supabase);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Plant Nurseries',
    numberOfItems: nurseries.length,
    itemListElement: nurseries.map((n: any, i: number) => ({
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
        <h1 className="font-serif text-[1.8rem] font-semibold leading-[1.2] text-text-primary">
          Nurseries
        </h1>
        <p className="mt-1 text-text-secondary">
          Browse plant nurseries with live inventory and pricing.
        </p>
      </section>

      {nurseries.length === 0 ? (
        <EmptyState
          title="No nursery data yet"
          description="Deploy the schema and run the pipeline to populate nursery data."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nurseries.map((n: any) => (
            <Link key={n.id} href={`/nurseries/${n.slug}`}>
              <Surface elevation="raised" padding="default" className="h-full hover:border-accent">
                <h3 className="font-medium text-accent">{n.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {[n.location_city, n.location_state, n.location_country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {n.sales_type && (
                  <div className="mt-2">
                    <Tag type="neutral">{n.sales_type}</Tag>
                  </div>
                )}
              </Surface>
            </Link>
          ))}
        </div>
      )}

      <JsonLd data={jsonLd} />
    </div>
  );
}
