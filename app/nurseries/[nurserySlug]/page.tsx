import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getNurseryBySlug, getInventoryForNursery } from '@/lib/queries/nurseries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { InfoCard } from '@/components/InfoCard';
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: Promise<{ nurserySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nurserySlug } = await params;
  const supabase = await createClient();
  const nursery = await getNurseryBySlug(supabase, nurserySlug);

  if (!nursery) {
    return { title: 'Nursery Not Found' };
  }

  const location = [nursery.location_city, nursery.location_state, nursery.location_country]
    .filter(Boolean)
    .join(', ');
  const title = `${nursery.name} — Inventory & Info`;
  const description = `Browse inventory and availability at ${nursery.name}${location ? ` in ${location}` : ''}. Compare plant pricing and find what you need.`;

  return {
    title,
    description,
    openGraph: {
      title: `${nursery.name} | Plant Commerce`,
      description,
      url: `https://plantcommerce.app/nurseries/${nurserySlug}`,
    },
    twitter: { card: 'summary' },
  };
}

export default async function NurseryPage({ params }: Props) {
  const { nurserySlug } = await params;
  const supabase = await createClient();
  const nursery = await getNurseryBySlug(supabase, nurserySlug);

  if (!nursery) notFound();

  const inventory = await getInventoryForNursery(supabase, nursery.id);

  const location = [nursery.location_city, nursery.location_state, nursery.location_country]
    .filter(Boolean)
    .join(', ');

  // JSON-LD: Organization
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: nursery.name,
    url: nursery.website_url || `https://plantcommerce.app/nurseries/${nurserySlug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: nursery.location_city,
      addressRegion: nursery.location_state,
      addressCountry: nursery.location_country,
    },
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Nurseries', href: '/nurseries' },
          { label: nursery.name },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-900">{nursery.name}</h1>
        <p className="text-gray-500">{location}</p>
        {nursery.website_url && (
          <a
            href={nursery.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:underline"
          >
            {nursery.website_url}
          </a>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {nursery.sales_type && <InfoCard label="Sales Type" value={nursery.sales_type} />}
        <InfoCard label="Active Offers" value={String(inventory.length)} />
      </div>

      <h2 className="mb-3 text-xl font-semibold text-gray-800">Inventory</h2>
      {inventory.length > 0 ? (
        <div className="space-y-2">
          {inventory.map((offer: any) => {
            const cv = offer.cultivars;
            const pe = offer.plant_entities ?? cv?.plant_entities;

            return (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {cv ? (
                      <Link
                        href={`/plants/${pe?.slug ?? 'unknown'}/${cv.slug}`}
                        className="text-green-800 hover:underline"
                      >
                        {cv.canonical_name}
                      </Link>
                    ) : pe ? (
                      <Link
                        href={`/plants/${pe.slug}`}
                        className="text-green-800 hover:underline"
                      >
                        {pe.canonical_name}
                      </Link>
                    ) : (
                      offer.raw_product_name
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{offer.raw_product_name}</p>
                </div>
                <div className="text-right">
                  {offer.raw_price_text && (
                    <p className="font-semibold text-gray-700">{offer.raw_price_text}</p>
                  )}
                  {offer.product_page_url && (
                    <a
                      href={offer.product_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:underline"
                    >
                      View &rarr;
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No active inventory offers found.</p>
      )}

      <JsonLd data={orgJsonLd} />
    </div>
  );
}
