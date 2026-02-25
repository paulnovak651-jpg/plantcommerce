import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getNurseryBySlug, getInventoryForNursery } from '@/lib/queries/nurseries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
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
    <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Nurseries', href: '/nurseries' },
          { label: nursery.name },
        ]}
      />

      {/* Nursery header */}
      <section>
        <Text variant="h1">{nursery.name}</Text>
        <Text variant="body" color="secondary" className="mt-1">{location}</Text>
        {nursery.website_url && (
          <a
            href={nursery.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            {nursery.website_url}
          </a>
        )}

        {/* Metadata cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {nursery.sales_type && (
            <Surface elevation="raised" padding="compact">
              <Text variant="caption" color="tertiary">Sales Type</Text>
              <Text variant="body" className="font-medium">{nursery.sales_type}</Text>
            </Surface>
          )}
          <Surface elevation="raised" padding="compact">
            <Text variant="caption" color="tertiary">Active Offers</Text>
            <Text variant="body" className="font-medium">{inventory.length}</Text>
          </Surface>
        </div>
      </section>

      {/* Inventory */}
      <section>
        <Text variant="h2" className="mb-4">
          Inventory ({inventory.length})
        </Text>
        {inventory.length > 0 ? (
          <div className="space-y-3">
            {inventory.map((offer: any) => {
              const cv = offer.cultivars;
              const pe = offer.plant_entities ?? cv?.plant_entities;

              return (
                <Surface key={offer.id} elevation="raised" padding="default">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="body" className="font-medium">
                        {cv ? (
                          <Link
                            href={`/plants/${pe?.slug ?? 'unknown'}/${cv.slug}`}
                            className="text-accent hover:underline"
                          >
                            {cv.canonical_name}
                          </Link>
                        ) : pe ? (
                          <Link
                            href={`/plants/${pe.slug}`}
                            className="text-accent hover:underline"
                          >
                            {pe.canonical_name}
                          </Link>
                        ) : (
                          offer.raw_product_name
                        )}
                      </Text>
                      <Text variant="caption" color="tertiary">{offer.raw_product_name}</Text>
                    </div>
                    <div className="text-right">
                      {offer.raw_price_text && (
                        <Text variant="price">{offer.raw_price_text}</Text>
                      )}
                      {offer.product_page_url && (
                        <a
                          href={offer.product_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent hover:underline"
                        >
                          View at nursery &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No active inventory"
            description="No active inventory scraped yet. Run the pipeline to populate offers."
          />
        )}
      </section>

      <JsonLd data={orgJsonLd} />
    </div>
  );
}
