import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getNurseryBySlug, getInventoryForNursery } from '@/lib/queries/nurseries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: Promise<{ nurserySlug: string }>;
}

function displayNurseryName(name: string): string {
  if (name === name.toUpperCase() && /[A-Z]/.test(name)) {
    return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

function formatNurseryUpdateLabel(iso: string | null): string | null {
  if (!iso) return null;

  const completedAt = new Date(iso);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysAgo = Math.floor(
    (now.getTime() - completedAt.getTime()) / msPerDay
  );

  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;

  return completedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
  const displayName = displayNurseryName(nursery.name);
  const title = `${displayName} — Inventory & Info`;
  const description = `Browse inventory and availability at ${displayName}${location ? ` in ${location}` : ''}. Compare plant pricing and find what you need.`;

  return {
    title,
    description,
    openGraph: {
      title: `${displayName} | Plant Commerce`,
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

  const [inventory] = await Promise.all([
    getInventoryForNursery(supabase, nursery.id),
  ]);

  const displayName = displayNurseryName(nursery.name);
  const location = [nursery.location_city, nursery.location_state, nursery.location_country]
    .filter(Boolean)
    .join(', ');
  const websiteHost = (() => {
    if (!nursery.website_url) return null;
    try {
      return new URL(nursery.website_url).hostname.replace(/^www\./, '');
    } catch {
      return nursery.website_url;
    }
  })();
  const lastUpdatedLabel = formatNurseryUpdateLabel(
    (nursery as any).last_scraped_at ?? null
  );

  const trustLabel = (() => {
    const lastScraped = (nursery as any).last_scraped_at;
    if (!lastScraped) return null;
    const daysSince = Math.floor((Date.now() - new Date(lastScraped).getTime()) / (1000 * 60 * 60 * 24));
    if ((nursery as any).consent_status === 'approved' && daysSince <= 14)
      return { text: 'Live Inventory', type: 'availability' as const };
    if (daysSince <= 14) return { text: 'Tracked', type: 'info' as const };
    return null;
  })();

  const localBusinessJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://plantcommerce.app/nurseries/${nurserySlug}`,
    name: displayName,
    url: `https://plantcommerce.app/nurseries/${nurserySlug}`,
    sameAs: nursery.website_url || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: nursery.location_city,
      addressRegion: nursery.location_state,
      addressCountry: nursery.location_country,
    },
  };

  if (nursery.latitude != null && nursery.longitude != null) {
    localBusinessJsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: nursery.latitude,
      longitude: nursery.longitude,
    };
  }

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Nurseries', href: '/nurseries' },
          { label: displayName },
        ]}
      />

      {/* Nursery header */}
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <Text variant="h1">{displayName}</Text>
          {trustLabel && <Tag type={trustLabel.type}>{trustLabel.text}</Tag>}
        </div>
        <Text variant="body" color="secondary" className="mt-1">{location}</Text>
        {nursery.website_url && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={nursery.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-text-inverse hover:bg-accent-hover"
            >
              Visit nursery website
            </a>
            {websiteHost && (
              <Text variant="sm" color="tertiary">
                {websiteHost}
              </Text>
            )}
          </div>
        )}

        {/* Metadata cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Surface elevation="raised" padding="compact">
            <Text variant="caption" color="tertiary">Active Offers</Text>
            <Text variant="body" className="font-medium">{inventory.length}</Text>
          </Surface>
          {lastUpdatedLabel && (
            <Surface elevation="raised" padding="compact">
              <Text variant="caption" color="tertiary">Inventory last updated</Text>
              <Text variant="body" className="font-medium">{lastUpdatedLabel}</Text>
            </Surface>
          )}
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="sm:text-right">
                      {offer.raw_price_text ? (
                        <Text variant="price">{offer.raw_price_text}</Text>
                      ) : (
                        <Text variant="sm" color="tertiary">
                          Contact nursery for pricing
                        </Text>
                      )}
                      {offer.product_page_url && (
                        <a
                          href={offer.product_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-text-inverse hover:bg-accent-hover"
                        >
                          View at nursery
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
            description="We don't have active offers from this nursery yet. We'll show inventory here as soon as it's available."
          />
        )}
      </section>

      <JsonLd data={localBusinessJsonLd} />
    </div>
  );
}
