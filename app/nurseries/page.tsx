import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listNurseries } from '@/lib/queries/nurseries';
import Link from 'next/link';
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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Nurseries</h1>

      {nurseries.length === 0 ? (
        <p className="text-gray-500">No nursery data loaded yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nurseries.map((n: any) => (
            <Link
              key={n.id}
              href={`/nurseries/${n.slug}`}
              className="rounded-lg border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50"
            >
              <h3 className="font-semibold text-green-800">{n.name}</h3>
              <p className="text-sm text-gray-500">
                {[n.location_city, n.location_state, n.location_country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {n.sales_type && (
                <span className="mt-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {n.sales_type}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <JsonLd data={jsonLd} />
    </div>
  );
}
