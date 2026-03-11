import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  getCultivarBySpeciesAndSlug,
  getOffersForCultivar,
  getAliasesForCultivar,
  getLegalIdentifiers,
} from '@/lib/queries/cultivars';
import { getGrowingProfile } from '@/lib/queries/growing';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { Surface } from '@/components/ui/Surface';
import { Disclosure } from '@/components/ui/Disclosure';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { NurseryMap } from '@/components/NurseryMap';
import type { NurseryPin } from '@/components/NurseryMap';
import { ListingCard } from '@/components/ListingCard';
import { PriceComparisonTable } from '@/components/PriceComparisonTable';
import type { TrustLevel } from '@/components/PriceComparisonTable';
import { AlertSignupForm } from '@/components/AlertSignupForm';
import { QuickFactsRibbon } from '@/components/QuickFactsRibbon';
import { PriceSparkline } from '@/components/PriceSparkline';
import { getApprovedListingsForCultivar } from '@/lib/queries/listings';
import { getLatestPriceChanges, getPriceHistoryForOffers } from '@/lib/queries/price-history';
import { formatPrice } from '@/lib/format';
import { ZoneCompatibility } from '@/components/ZoneCompatibility';
import type { GrowingProfile } from '@/lib/types';

interface Props {
  params: Promise<{ speciesSlug: string; cultivarSlug: string }>;
}

function formatPricesLastChecked(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAvailabilityTag(rawAvailability: string | null): {
  label: string;
  className: string;
} | null {
  if (!rawAvailability) return null;

  const value = rawAvailability.toLowerCase();
  if (value.includes('pre-order') || value.includes('preorder')) {
    return {
      label: 'Pre-Order',
      className: 'bg-accent-subtle text-accent',
    };
  }

  if (value.includes('sold out') || value.includes('out of stock')) {
    return {
      label: 'Sold Out',
      className: 'bg-surface-inset text-status-unavailable',
    };
  }

  if (value.includes('in stock') || value.includes('available')) {
    return {
      label: 'In Stock',
      className: 'bg-accent-light text-status-active',
    };
  }

  return {
    label: rawAvailability,
    className: 'bg-surface-inset text-text-secondary',
  };
}

function computeTrustLevel(nursery: any): TrustLevel {
  if (!nursery?.last_scraped_at) return 'community';
  const daysSinceScrape = Math.floor(
    (Date.now() - new Date(nursery.last_scraped_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nursery.consent_status === 'approved' && daysSinceScrape <= 14) return 'live';
  if (daysSinceScrape <= 14) return 'tracked';
  return 'community';
}

function buildQuickFacts(profile: GrowingProfile | null): { label: string; value: string }[] {
  if (!profile) return [];
  const facts: { label: string; value: string }[] = [];

  if (profile.usda_zone_min != null && profile.usda_zone_max != null) {
    facts.push({ label: 'Zone', value: `${profile.usda_zone_min}\u2013${profile.usda_zone_max}` });
  }
  if (profile.mature_height_min_ft != null || profile.mature_height_max_ft != null) {
    const min = profile.mature_height_min_ft;
    const max = profile.mature_height_max_ft;
    const value = min != null && max != null ? `${min}\u2013${max} ft` : `${min ?? max} ft`;
    facts.push({ label: 'Height', value });
  }
  if (profile.sun_requirement) {
    facts.push({ label: 'Sun', value: profile.sun_requirement.replace(/_/g, ' ') });
  }
  if (profile.years_to_bearing_min != null || profile.years_to_bearing_max != null) {
    const min = profile.years_to_bearing_min;
    const max = profile.years_to_bearing_max;
    const value = min != null && max != null ? `${min}\u2013${max} yrs` : `${min ?? max} yrs`;
    facts.push({ label: 'Bearing', value });
  }
  if (profile.harvest_season) {
    facts.push({ label: 'Harvest', value: profile.harvest_season.replace(/_/g, ' ') });
  }

  return facts;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { speciesSlug, cultivarSlug } = await params;
  const supabase = await createClient();
  const cultivar = await getCultivarBySpeciesAndSlug(
    supabase,
    speciesSlug,
    cultivarSlug
  );

  if (!cultivar) {
    return { title: 'Cultivar Not Found' };
  }

  const species = (cultivar as any).plant_entities;
  const speciesName = species?.canonical_name ?? 'Hazelnut';
  const title = `${cultivar.canonical_name} ${speciesName} — Breeder, Availability, Details`;
  const description = cultivar.notes
    ? cultivar.notes.slice(0, 160)
    : `${cultivar.canonical_name} — ${speciesName} cultivar. Find breeder info, nursery availability, and pricing.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://plantcommerce.app/plants/${speciesSlug}/${cultivarSlug}`,
    },
    twitter: { card: 'summary' },
  };
}

export default async function CultivarPage({ params }: Props) {
  const { speciesSlug, cultivarSlug } = await params;
  const supabase = await createClient();
  const cultivar = await getCultivarBySpeciesAndSlug(
    supabase,
    speciesSlug,
    cultivarSlug
  );

  if (!cultivar) notFound();

  const species = (cultivar as any).plant_entities;

  const [offers, aliases, legal, growingProfile, communityListings] = await Promise.all([
    getOffersForCultivar(supabase, cultivar.id),
    getAliasesForCultivar(supabase, cultivar.id),
    getLegalIdentifiers(supabase, cultivar.id),
    species?.id ? getGrowingProfile(supabase, species.id) : Promise.resolve(null),
    getApprovedListingsForCultivar(supabase, cultivar.id),
  ]);

  const offerIds = offers.map((o: any) => o.id as string).filter(Boolean);
  const [priceChanges, priceHistoryMap] = await Promise.all([
    getLatestPriceChanges(supabase, offerIds),
    getPriceHistoryForOffers(supabase, offerIds),
  ]);

  const latestScrapeIso =
    offers.reduce<string | null>((latest, offer: any) => {
      const value = offer.nurseries?.last_scraped_at as string | null | undefined;
      if (!value) return latest;
      if (!latest) return value;
      return new Date(value) > new Date(latest) ? value : latest;
    }, null) ?? null;

  const pricesLastCheckedLabel = formatPricesLastChecked(latestScrapeIso);

  // Find best price offer for the hero callout
  const activeOffers = offers.filter((o: any) => o.offer_status === 'active');
  const bestOffer = activeOffers.reduce<any | null>((best, offer: any) => {
    if (offer.price_cents == null) return best;
    if (!best || offer.price_cents < best.price_cents) return offer;
    return best;
  }, null);

  const comparisonOffers = offers.map((offer: any) => {
    const availability = getAvailabilityTag(offer.raw_availability);
    const location = [offer.nurseries?.location_state, offer.nurseries?.location_country]
      .filter(Boolean)
      .join(', ');

    return {
      nurseryName: (offer.nurseries?.name as string) ?? 'Unknown Nursery',
      nurserySlug: (offer.nurseries?.slug as string) ?? '',
      price: (offer.raw_price_text as string | null) ?? null,
      priceCents: (offer.price_cents as number | null) ?? null,
      availability: availability?.label ?? ((offer.raw_availability as string | null) ?? null),
      propagationMethod: (offer.propagation_method as string | null) ?? null,
      saleForm: (offer.sale_form as string | null) ?? null,
      productUrl: (offer.product_page_url as string | null) ?? null,
      location,
      offerStatus: (offer.offer_status as string) ?? 'active',
      lastSeenAt: (offer.last_seen_at as string | null) ?? null,
      priceChange: priceChanges.get(offer.id) ?? null,
      trustLevel: computeTrustLevel(offer.nurseries) as TrustLevel,
    };
  });

  const seen = new Set<string>();
  const nurseryPins: NurseryPin[] = offers
    .filter(
      (o: any) =>
        o.nurseries?.latitude != null &&
        o.nurseries?.longitude != null &&
        !seen.has(o.nurseries.id) &&
        seen.add(o.nurseries.id)
    )
    .map((o: any) => ({
      id: o.nurseries.id as string,
      name: o.nurseries.name as string,
      slug: o.nurseries.slug as string,
      latitude: o.nurseries.latitude as number,
      longitude: o.nurseries.longitude as number,
    }));

  // Build sparkline data: collect all offers that have 3+ history points
  const sparklineData: { nurseryName: string; points: { date: string; priceCents: number }[] }[] = [];
  for (const offer of offers) {
    const history = priceHistoryMap.get((offer as any).id);
    if (history && history.length >= 3) {
      sparklineData.push({
        nurseryName: (offer as any).nurseries?.name ?? 'Unknown',
        points: history.map((h) => ({ date: h.detectedAt, priceCents: h.priceCents })),
      });
    }
  }

  const quickFacts = buildQuickFacts(growingProfile);

  // JSON-LD: Product + Offer[]
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cultivar.canonical_name,
    category: species?.canonical_name,
    description: cultivar.notes || undefined,
    url: `https://plantcommerce.app/plants/${speciesSlug}/${cultivarSlug}`,
    offers: offers.map((o: any) => ({
      '@type': 'Offer',
      seller: {
        '@type': 'Organization',
        name: o.nurseries?.name,
        url: o.nurseries?.slug
          ? `https://plantcommerce.app/nurseries/${o.nurseries.slug}`
          : undefined,
      },
      price: o.raw_price_text,
      priceCurrency: 'USD',
      url: o.product_page_url,
      availability:
        o.offer_status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          ...(species
            ? [{ label: species.canonical_name, href: `/plants/${speciesSlug}` }]
            : []),
          { label: cultivar.canonical_name },
        ]}
      />

      {/* 1. NAME + SPECIES */}
      <section>
        <div className="flex items-start gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Text variant="h1">{cultivar.canonical_name}</Text>
              <Tag type="neutral">{cultivar.material_type.replace(/_/g, ' ')}</Tag>
            </div>
            {species && (
              <Text variant="body" color="secondary" className="mt-1">
                <BotanicalName>{species.botanical_name}</BotanicalName>
              </Text>
            )}
          </div>
        </div>
      </section>

      {/* 2. BEST PRICE CALLOUT */}
      {bestOffer && (
        <section>
          <Surface elevation="raised" padding="default">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Text variant="caption" color="tertiary">Best price</Text>
                <Text variant="h2" className="text-accent">
                  {formatPrice(bestOffer.raw_price_text, bestOffer.price_cents)}
                </Text>
                <Text variant="sm" color="secondary">
                  at{' '}
                  <Link href={`/nurseries/${bestOffer.nurseries?.slug}`} className="text-accent hover:underline">
                    {bestOffer.nurseries?.name}
                  </Link>
                </Text>
              </div>
              {bestOffer.product_page_url && (
                <a
                  href={bestOffer.product_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-text-inverse hover:bg-accent-hover"
                >
                  View at Nursery
                </a>
              )}
            </div>
          </Surface>
        </section>
      )}

      {/* 3. PRICE COMPARISON TABLE */}
      <section>
        <Text variant="h2" className="mb-4">
          Nursery Offers ({offers.length})
        </Text>
        {offers.length >= 2 ? (
          <PriceComparisonTable offers={comparisonOffers} lastCheckedAt={pricesLastCheckedLabel} />
        ) : offers.length === 1 ? (
          <div className="space-y-3">
            {offers.slice(0, 1).map((offer: any) => {
              const availability = getAvailabilityTag(offer.raw_availability);
              const offerDetails = [
                offer.propagation_method,
                offer.sale_form,
              ]
                .filter(
                  (value: string | null | undefined) =>
                    value && value !== 'unknown'
                )
                .map((value: string) => value.replace(/_/g, ' '));
              const location = [
                offer.nurseries?.location_state,
                offer.nurseries?.location_country,
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <Surface key={offer.id} elevation="raised" padding="default">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                    <Link
                      href={`/nurseries/${offer.nurseries?.slug}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {offer.nurseries?.name}
                    </Link>
                      {location && (
                        <Text variant="sm" color="secondary">
                          {location}
                        </Text>
                      )}
                      {offerDetails.length > 0 && (
                        <Text variant="caption" color="tertiary">
                          {offerDetails.join(' · ')}
                        </Text>
                      )}
                      {availability && (
                        <div className="mt-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${availability.className}`}
                          >
                            {availability.label}
                          </span>
                        </div>
                      )}
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
            {pricesLastCheckedLabel && (
              <Text variant="sm" color="tertiary">
                Prices last checked: {pricesLastCheckedLabel}
              </Text>
            )}
          </div>
        ) : (
          <EmptyState
            title={`No tracked nurseries currently stock ${cultivar.canonical_name}`}
            description="Get notified when it's available."
          >
            <div className="space-y-4">
              <AlertSignupForm
                cultivarId={cultivar.id}
                plantEntityId={species?.id ?? null}
                cultivarName={cultivar.canonical_name}
                compact
              />
              <div className="flex flex-col gap-2 text-sm">
                <Link
                  href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`}
                  className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset"
                >
                  Know a nursery that carries this? Let us know
                </Link>
                <Link
                  href={`/plants/${speciesSlug}`}
                  className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset"
                >
                  Browse other {species?.canonical_name ?? 'species'} cultivars
                </Link>
              </div>
            </div>
          </EmptyState>
        )}
      </section>

      {/* 4. PRICE HISTORY SPARKLINE */}
      {sparklineData.length > 0 && (
        <section>
          <Text variant="h3" className="mb-3">Price History</Text>
          <Surface elevation="raised" padding="default">
            <div className="space-y-2">
              {sparklineData.map((sd) => (
                <PriceSparkline
                  key={sd.nurseryName}
                  nurseryName={sd.nurseryName}
                  points={sd.points}
                />
              ))}
            </div>
          </Surface>
        </section>
      )}

      {/* 5. STOCK ALERT */}
      {offers.length > 0 && (
        <section>
          <AlertSignupForm
            cultivarId={cultivar.id}
            plantEntityId={species?.id ?? null}
            cultivarName={cultivar.canonical_name}
          />
        </section>
      )}

      {/* 6. QUICK FACTS RIBBON */}
      {quickFacts.length > 0 && (
        <section>
          <QuickFactsRibbon facts={quickFacts} />
          <div className="mt-3">
            <ZoneCompatibility
              zoneMin={growingProfile?.usda_zone_min ?? null}
              zoneMax={growingProfile?.usda_zone_max ?? null}
            />
          </div>
        </section>
      )}

      {/* 7. GROWING DETAIL (collapsed) */}
      {growingProfile != null && (
        <section>
          <Disclosure title="Full Growing Guide" defaultOpen={false}>
            <TraitGrid profile={growingProfile} compact />
          </Disclosure>
        </section>
      )}

      {/* Metadata grid */}
      {(cultivar.breeder || cultivar.origin_location || cultivar.year_released || cultivar.patent_status !== 'unknown') && (
        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cultivar.breeder && (
              <Surface elevation="raised" padding="compact">
                <Text variant="caption" color="tertiary">Breeder</Text>
                <Text variant="body" className="font-medium">{cultivar.breeder}</Text>
              </Surface>
            )}
            {cultivar.origin_location && (
              <Surface elevation="raised" padding="compact">
                <Text variant="caption" color="tertiary">Origin</Text>
                <Text variant="body" className="font-medium">{cultivar.origin_location}</Text>
              </Surface>
            )}
            {cultivar.year_released && (
              <Surface elevation="raised" padding="compact">
                <Text variant="caption" color="tertiary">Released</Text>
                <Text variant="body" className="font-medium">{String(cultivar.year_released)}</Text>
              </Surface>
            )}
            {cultivar.patent_status !== 'unknown' && (
              <Surface elevation="raised" padding="compact">
                <Text variant="caption" color="tertiary">Patent Status</Text>
                <Text variant="body" className="font-medium">{cultivar.patent_status.replace(/_/g, ' ')}</Text>
              </Surface>
            )}
          </div>
        </section>
      )}

      {cultivar.notes && (
        <Text variant="body" color="secondary">
          {cultivar.notes}
        </Text>
      )}

      {/* Aliases & Legal (disclosure sections) */}
      {(aliases.length > 0 || legal.length > 0) && (
        <section>
          {aliases.length > 0 && (
            <Disclosure
              title="Also Known As"
              badge={
                <Tag type="neutral" size="sm">{aliases.length}</Tag>
              }
            >
              <div className="flex flex-wrap gap-2">
                {aliases.map((a: any) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-surface-inset px-3 py-1 text-sm text-text-secondary"
                  >
                    {a.alias_text}
                    <Text variant="caption" color="tertiary" as="span" className="ml-1">
                      ({a.alias_type.replace(/_/g, ' ')})
                    </Text>
                  </span>
                ))}
              </div>
            </Disclosure>
          )}

          {legal.length > 0 && (
            <Disclosure
              title="Legal Identifiers"
              badge={
                <Tag type="neutral" size="sm">{legal.length}</Tag>
              }
            >
              <div className="space-y-1">
                {legal.map((l: any) => (
                  <Text key={l.id} variant="sm" color="secondary" as="div">
                    <span className="font-medium">{l.id_type}:</span> {l.value_raw}
                    {l.status && (
                      <Text variant="caption" color="tertiary" as="span" className="ml-2">
                        ({l.status})
                      </Text>
                    )}
                  </Text>
                ))}
              </div>
            </Disclosure>
          )}
        </section>
      )}

      {/* NURSERY MAP */}
      {nurseryPins.length > 0 && (
        <section>
          <Text variant="h2" className="mb-3">
            Where to Buy
          </Text>
          <NurseryMap nurseries={nurseryPins} height="300px" />
        </section>
      )}

      {/* COMMUNITY LISTINGS */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <Text variant="h2">
            Community Listings
            {communityListings.length > 0 && (
              <span className="ml-2 text-base font-normal text-text-tertiary">
                ({communityListings.length})
              </span>
            )}
          </Text>
          <Link
            href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`}
            className="text-sm text-accent hover:underline"
          >
            + List {cultivar.canonical_name}
          </Link>
        </div>
        {communityListings.length > 0 ? (
          <div className="space-y-3">
            {communityListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            No community listings yet.{' '}
            <a
              href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`}
              className="text-accent hover:underline"
            >
              Be the first to list this cultivar →
            </a>
          </p>
        )}
      </section>

      <JsonLd data={productJsonLd} />
      </div>
    </div>
  );
}
