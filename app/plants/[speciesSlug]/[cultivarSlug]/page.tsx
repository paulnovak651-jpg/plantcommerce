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
import { TraitGrid } from '@/components/ui/TraitGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { NurseryMap } from '@/components/NurseryMap';
import type { NurseryPin } from '@/components/NurseryMap';
import { ListingCard } from '@/components/ListingCard';
import { PriceComparisonTable } from '@/components/PriceComparisonTable';
import type { TrustLevel } from '@/components/PriceComparisonTable';
import { AlertSignupForm } from '@/components/AlertSignupForm';
import { QuickFactsHero } from '@/components/QuickFactsHero';
import { ZoneBar } from '@/components/ZoneBar';
import { HarvestCalendar } from '@/components/HarvestCalendar';
import { HeightSilhouette } from '@/components/HeightSilhouette';
import { PriceSparkline } from '@/components/PriceSparkline';
import { CultivarTabs } from '@/components/CultivarTabs';
import type { TabId } from '@/components/CultivarTabs';
import { getApprovedListingsForCultivar } from '@/lib/queries/listings';
import { getLatestPriceChanges, getPriceHistoryForOffers } from '@/lib/queries/price-history';
import { formatPrice } from '@/lib/format';
import { ZoneCompatibility } from '@/components/ZoneCompatibility';
import { Disclosure } from '@/components/ui/Disclosure';
import { getCategoryIcon } from '@/lib/browse-categories';
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
  const title = `${cultivar.canonical_name} ${speciesName} \u2014 Breeder, Availability, Details`;
  const description = cultivar.notes
    ? cultivar.notes.slice(0, 160)
    : `${cultivar.canonical_name} \u2014 ${speciesName} cultivar. Find breeder info, nursery availability, and pricing.`;

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
      id: offer.id as string,
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

  // "Available as" chips derived from offer sale_form values
  const saleForms = [...new Set(offers.map((o: any) => o.sale_form).filter(Boolean))] as string[];

  // Build tabs array dynamically
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'glance', label: 'At a Glance' },
    { id: 'growing', label: 'Growing' },
    { id: 'harvest', label: 'Harvest & Ecosystem' },
    { id: 'buy', label: 'Buy', count: offers.length },
  ];

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

      {/* 1. HERO — above the fold */}
      <section className="rounded-[var(--radius-xl)] bg-accent-hover p-4 sm:p-6 text-surface-raised">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="hidden sm:flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-raised/10">
            <span className="text-4xl opacity-40">
              {getCategoryIcon(species?.display_category)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-surface-raised">
                {cultivar.canonical_name}
              </h1>
              <Tag type="neutral">{cultivar.material_type.replace(/_/g, ' ')}</Tag>
            </div>
            {species && (
              <p className="mt-1 text-surface-raised/70">
                <BotanicalName>{species.botanical_name}</BotanicalName>
                {cultivar.breeder && (
                  <span className="text-surface-raised/50">
                    {' '}&mdash; {cultivar.breeder}
                    {cultivar.year_released ? ` (${cultivar.year_released})` : ''}
                  </span>
                )}
              </p>
            )}

            <div className="mt-4">
              <QuickFactsHero profile={growingProfile} />
            </div>

            {bestOffer && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-surface-raised/60">Best price:</span>
                <span className="font-serif text-xl font-bold text-surface-raised">
                  {formatPrice(bestOffer.raw_price_text, bestOffer.price_cents)}
                </span>
                <span className="text-sm text-surface-raised/70">
                  at{' '}
                  <Link href={`/nurseries/${bestOffer.nurseries?.slug}`} className="text-surface-raised underline hover:text-surface-raised/80">
                    {bestOffer.nurseries?.name}
                  </Link>
                </span>
                {bestOffer.product_page_url && (
                  <a
                    href={bestOffer.product_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-[var(--radius-md)] bg-surface-raised/20 px-3 py-1.5 text-sm font-medium text-surface-raised hover:bg-surface-raised/30 transition-colors"
                  >
                    View &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. TABBED CONTENT */}
      <CultivarTabs tabs={tabs}>
        {{
          /* ── AT A GLANCE TAB ── */
          glance: (
            <div className="space-y-6">
              {/* Description */}
              {cultivar.notes && (
                <Text variant="body" color="secondary">{cultivar.notes}</Text>
              )}

              {/* Truth badges row */}
              <div className="flex flex-wrap gap-2">
                <Tag type="neutral">{cultivar.material_type.replace(/_/g, ' ')}</Tag>
                {growingProfile?.native_range_description && (
                  <Tag type="neutral">Native</Tag>
                )}
                {growingProfile?.pollination_requirement && growingProfile.pollination_requirement !== 'self_fertile' && (
                  <Tag type="neutral">Needs pollinizer</Tag>
                )}
                {growingProfile?.suckering_tendency && growingProfile.suckering_tendency !== 'none' && (
                  <Tag type="neutral">Suckers / colony-forming</Tag>
                )}
                {cultivar.patent_status && cultivar.patent_status !== 'none' && cultivar.patent_status !== 'unknown' && (
                  <Tag type="neutral">{cultivar.patent_status.replace(/_/g, ' ')}</Tag>
                )}
              </div>

              {/* "Available as" chips */}
              {saleForms.length > 0 && (
                <div>
                  <Text variant="caption" color="tertiary" className="mb-2 block uppercase tracking-wider font-semibold text-[11px]">
                    Available As
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {saleForms.map((form) => (
                      <span key={form} className="rounded-full bg-accent-subtle px-3 py-1 text-sm font-medium text-accent">
                        {form.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-minute layer — expandable sections */}
              {(cultivar.breeder || cultivar.origin_location || cultivar.year_released || (cultivar.patent_status && cultivar.patent_status !== 'unknown')) && (
                <Disclosure title="Breeder & Origin">
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
                    {cultivar.patent_status && cultivar.patent_status !== 'unknown' && (
                      <Surface elevation="raised" padding="compact">
                        <Text variant="caption" color="tertiary">Patent Status</Text>
                        <Text variant="body" className="font-medium">{cultivar.patent_status.replace(/_/g, ' ')}</Text>
                      </Surface>
                    )}
                  </div>
                </Disclosure>
              )}

              {aliases.length > 0 && (
                <Disclosure title="Also Known As">
                  <div className="flex flex-wrap gap-2">
                    {aliases.map((a: any) => (
                      <span key={a.id} className="rounded-full bg-surface-inset px-3 py-1 text-sm text-text-secondary">
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
                <Disclosure title="Legal Identifiers">
                  <div className="space-y-1">
                    {legal.map((l: any) => (
                      <Text key={l.id} variant="sm" color="secondary" as="div">
                        <span className="font-medium">{l.id_type}:</span> {l.value_raw}
                        {l.status && (
                          <Text variant="caption" color="tertiary" as="span" className="ml-2">({l.status})</Text>
                        )}
                      </Text>
                    ))}
                  </div>
                </Disclosure>
              )}
            </div>
          ),

          /* ── GROWING TAB ── */
          growing: growingProfile ? (
            <div className="space-y-6">
              {/* ZoneBar — sole location */}
              {growingProfile.usda_zone_min != null && growingProfile.usda_zone_max != null && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    USDA Hardiness Zones
                  </Text>
                  <ZoneBar min={growingProfile.usda_zone_min} max={growingProfile.usda_zone_max} />
                </Surface>
              )}

              {/* Growing requirements */}
              {(growingProfile.sun_requirement || growingProfile.soil_ph_min != null || growingProfile.soil_drainage) && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    Growing Requirements
                  </Text>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {growingProfile.sun_requirement && (
                      <div>
                        <Text variant="caption" color="tertiary">Sun</Text>
                        <Text variant="body" className="font-medium">{growingProfile.sun_requirement.replace(/_/g, ' ')}</Text>
                      </div>
                    )}
                    {growingProfile.soil_drainage && (
                      <div>
                        <Text variant="caption" color="tertiary">Soil Drainage</Text>
                        <Text variant="body" className="font-medium">{growingProfile.soil_drainage.replace(/_/g, ' ')}</Text>
                      </div>
                    )}
                    {growingProfile.soil_ph_min != null && growingProfile.soil_ph_max != null && (
                      <div>
                        <Text variant="caption" color="tertiary">Soil pH</Text>
                        <Text variant="body" className="font-medium">{growingProfile.soil_ph_min}&ndash;{growingProfile.soil_ph_max}</Text>
                      </div>
                    )}
                  </div>
                </Surface>
              )}

              {/* HeightSilhouette + spread — sole location */}
              {(growingProfile.mature_height_min_ft != null || growingProfile.mature_height_max_ft != null) && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    Size at Maturity
                  </Text>
                  <HeightSilhouette
                    minFt={growingProfile.mature_height_min_ft ?? null}
                    maxFt={growingProfile.mature_height_max_ft ?? null}
                  />
                  {(growingProfile.mature_spread_min_ft != null || growingProfile.mature_spread_max_ft != null) && (
                    <Text variant="sm" color="secondary" className="mt-2">
                      Spread: {growingProfile.mature_spread_min_ft ?? '?'}&ndash;{growingProfile.mature_spread_max_ft ?? '?'} ft
                    </Text>
                  )}
                </Surface>
              )}

              {/* Growth habit badge */}
              {growingProfile.growth_habit && (
                <div>
                  <Tag type="neutral">{growingProfile.growth_habit.replace(/_/g, ' ')}</Tag>
                </div>
              )}

              {/* Zone Compatibility */}
              <ZoneCompatibility
                zoneMin={growingProfile.usda_zone_min ?? null}
                zoneMax={growingProfile.usda_zone_max ?? null}
              />

              {/* 2-minute layer — expandable sections */}
              {(growingProfile.drought_tolerance != null || growingProfile.shade_tolerance) && (
                <Disclosure title="Site Tolerance">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {growingProfile.drought_tolerance != null && (
                      <div>
                        <Text variant="caption" color="tertiary">Drought Tolerance</Text>
                        <Text variant="body" className="font-medium">{growingProfile.drought_tolerance}/5</Text>
                      </div>
                    )}
                    {growingProfile.shade_tolerance && (
                      <div>
                        <Text variant="caption" color="tertiary">Shade Tolerance</Text>
                        <Text variant="body" className="font-medium">{growingProfile.shade_tolerance.replace(/_/g, ' ')}</Text>
                      </div>
                    )}
                  </div>
                </Disclosure>
              )}

              {growingProfile.deer_browse_pressure && (
                <Disclosure title="Care & Maintenance">
                  <div>
                    <Text variant="caption" color="tertiary">Deer Browse Pressure</Text>
                    <Text variant="body" className="font-medium">{growingProfile.deer_browse_pressure.replace(/_/g, ' ')}</Text>
                  </div>
                </Disclosure>
              )}

              <Disclosure title="Full Trait Details">
                <TraitGrid profile={growingProfile} compact />
              </Disclosure>
            </div>
          ) : (
            <EmptyState
              title="No growing data yet"
              description={`Growing information for ${cultivar.canonical_name} has not been catalogued yet.`}
            />
          ),

          /* ── HARVEST & ECOSYSTEM TAB ── */
          harvest: (
            <div className="space-y-6">
              {/* HarvestCalendar — sole location */}
              {growingProfile?.harvest_season && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    Seasonal Timeline
                  </Text>
                  <HarvestCalendar harvestSeason={growingProfile.harvest_season} />
                </Surface>
              )}

              {/* Pollination status */}
              {growingProfile?.pollination_requirement && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-1 block uppercase tracking-wider font-semibold text-[11px]">
                    Pollination
                  </Text>
                  <Text variant="body" className="font-medium capitalize">{growingProfile.pollination_requirement.replace(/_/g, ' ')}</Text>
                </Surface>
              )}

              {/* Big-number stat cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                {(growingProfile?.years_to_bearing_min != null || growingProfile?.years_to_bearing_max != null) && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-1 block uppercase tracking-wider font-semibold text-[11px]">
                      Years to Bearing
                    </Text>
                    <p className="font-serif text-3xl font-bold text-text-primary">
                      {growingProfile?.years_to_bearing_min != null && growingProfile?.years_to_bearing_max != null
                        ? `${growingProfile.years_to_bearing_min}\u2013${growingProfile.years_to_bearing_max}`
                        : String(growingProfile?.years_to_bearing_min ?? growingProfile?.years_to_bearing_max)}
                    </p>
                    <Text variant="sm" color="tertiary">years</Text>
                  </Surface>
                )}
                {growingProfile?.harvest_season && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-1 block uppercase tracking-wider font-semibold text-[11px]">
                      Harvest Season
                    </Text>
                    <p className="font-serif text-3xl font-bold text-text-primary">
                      {growingProfile.harvest_season.replace(/_/g, ' ')}
                    </p>
                  </Surface>
                )}
                {growingProfile?.growth_rate && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-1 block uppercase tracking-wider font-semibold text-[11px]">
                      Growth Rate
                    </Text>
                    <p className="font-serif text-3xl font-bold text-text-primary capitalize">
                      {growingProfile.growth_rate.replace(/_/g, ' ')}
                    </p>
                  </Surface>
                )}
              </div>

              {/* 2-minute layer — expandable sections */}
              {(growingProfile?.food_forest_layer || (growingProfile?.wildlife_value && growingProfile.wildlife_value.length > 0) || growingProfile?.pollinator_value || growingProfile?.native_range_description) && (
                <Disclosure title="Ecosystem Role">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {growingProfile.food_forest_layer && (
                      <div>
                        <Text variant="caption" color="tertiary">Food Forest Layer</Text>
                        <Text variant="body" className="font-medium">{growingProfile.food_forest_layer.replace(/_/g, ' ')}</Text>
                      </div>
                    )}
                    {growingProfile.wildlife_value && growingProfile.wildlife_value.length > 0 && (
                      <div>
                        <Text variant="caption" color="tertiary">Wildlife Food Value</Text>
                        <Text variant="body" className="font-medium">{growingProfile.wildlife_value.map(v => v.replace(/_/g, ' ')).join(', ')}</Text>
                      </div>
                    )}
                    {growingProfile.pollinator_value && (
                      <div>
                        <Text variant="caption" color="tertiary">Pollinator Value</Text>
                        <Text variant="body" className="font-medium">{growingProfile.pollinator_value.replace(/_/g, ' ')}</Text>
                      </div>
                    )}
                    {growingProfile.native_range_description && (
                      <div>
                        <Text variant="caption" color="tertiary">Native Range</Text>
                        <Text variant="body" className="font-medium">{growingProfile.native_range_description}</Text>
                      </div>
                    )}
                  </div>
                </Disclosure>
              )}

              {/* Empty state when no harvest/ecosystem data */}
              {!growingProfile?.harvest_season && !growingProfile?.years_to_bearing_min && !growingProfile?.pollination_requirement && (
                <EmptyState title="No harvest data yet" description="Harvest and ecosystem information has not been catalogued for this cultivar." />
              )}
            </div>
          ),

          /* ── BUY TAB ── */
          buy: (
            <div className="space-y-6">
              {/* Price Comparison Table */}
              {comparisonOffers.length >= 2 ? (
                <section>
                  <Text variant="h2" className="mb-4">Where to Buy ({comparisonOffers.length})</Text>
                  <PriceComparisonTable offers={comparisonOffers} lastCheckedAt={pricesLastCheckedLabel} />
                </section>
              ) : comparisonOffers.length === 1 ? (
                <section>
                  <Text variant="h2" className="mb-4">Where to Buy</Text>
                  <div className="space-y-3">
                    {offers.slice(0, 1).map((offer: any) => {
                      const availability = getAvailabilityTag(offer.raw_availability);
                      const offerDetails = [offer.propagation_method, offer.sale_form]
                        .filter((value: string | null | undefined) => value && value !== 'unknown')
                        .map((value: string) => value.replace(/_/g, ' '));
                      const location = [offer.nurseries?.location_state, offer.nurseries?.location_country]
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <Surface key={offer.id} elevation="raised" padding="default">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <Link href={`/nurseries/${offer.nurseries?.slug}`} className="font-medium text-accent hover:underline">
                                {offer.nurseries?.name}
                              </Link>
                              {location && <Text variant="sm" color="secondary">{location}</Text>}
                              {offerDetails.length > 0 && (
                                <Text variant="caption" color="tertiary">{offerDetails.join(' \u00b7 ')}</Text>
                              )}
                              {availability && (
                                <div className="mt-2">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${availability.className}`}>
                                    {availability.label}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="sm:text-right">
                              {offer.raw_price_text ? (
                                <Text variant="price">{offer.raw_price_text}</Text>
                              ) : (
                                <Text variant="sm" color="tertiary">Contact nursery for pricing</Text>
                              )}
                              {offer.product_page_url && (
                                <a href={offer.product_page_url} target="_blank" rel="noopener noreferrer"
                                  className="mt-2 inline-block rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-text-inverse hover:bg-accent-hover">
                                  View at nursery
                                </a>
                              )}
                            </div>
                          </div>
                        </Surface>
                      );
                    })}
                    {pricesLastCheckedLabel && (
                      <Text variant="sm" color="tertiary">Prices last checked: {pricesLastCheckedLabel}</Text>
                    )}
                  </div>
                </section>
              ) : (
                <EmptyState
                  title={`No tracked nurseries currently stock ${cultivar.canonical_name}`}
                  description="Get notified when it's available."
                >
                  <div className="space-y-4">
                    <AlertSignupForm cultivarId={cultivar.id} plantEntityId={species?.id ?? null} cultivarName={cultivar.canonical_name} compact />
                    <div className="flex flex-col gap-2 text-sm">
                      <Link href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`}
                        className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset">
                        Know a nursery that carries this? Let us know
                      </Link>
                      <Link href={`/plants/${speciesSlug}`}
                        className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset">
                        Browse other {species?.canonical_name ?? 'species'} cultivars
                      </Link>
                    </div>
                  </div>
                </EmptyState>
              )}

              {/* Price History */}
              {sparklineData.length > 0 && (
                <section>
                  <Text variant="h3" className="mb-3">Price History</Text>
                  <Surface elevation="raised" padding="default">
                    <div className="space-y-2">
                      {sparklineData.map((sd) => (
                        <PriceSparkline key={sd.nurseryName} nurseryName={sd.nurseryName} points={sd.points} />
                      ))}
                    </div>
                  </Surface>
                </section>
              )}

              {/* Stock Alert */}
              {offers.length > 0 && (
                <AlertSignupForm cultivarId={cultivar.id} plantEntityId={species?.id ?? null} cultivarName={cultivar.canonical_name} />
              )}

              {/* Nursery Map */}
              {nurseryPins.length > 0 && (
                <section>
                  <Text variant="h2" className="mb-3">Where to Buy</Text>
                  <NurseryMap nurseries={nurseryPins} height="300px" />
                </section>
              )}

              {/* Community Listings */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Text variant="h2">
                    Community Listings
                    {communityListings.length > 0 && (
                      <span className="ml-2 text-base font-normal text-text-tertiary">({communityListings.length})</span>
                    )}
                  </Text>
                  <Link href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`} className="text-sm text-accent hover:underline">
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
                    <a href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`} className="text-accent hover:underline">
                      Be the first to list this cultivar &rarr;
                    </a>
                  </p>
                )}
              </section>

              {/* Compare similar cultivars */}
              <Link
                href={`/compare?cultivar=${encodeURIComponent(cultivar.canonical_name)}`}
                className="inline-block rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-inset"
              >
                Compare similar cultivars
              </Link>
            </div>
          ),
        }}
      </CultivarTabs>

      <JsonLd data={productJsonLd} />
      </div>
    </div>
  );
}
