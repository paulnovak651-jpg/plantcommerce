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
import { PriceSparkline } from '@/components/PriceSparkline';
import { getApprovedListingsForCultivar } from '@/lib/queries/listings';
import { getLatestPriceChanges, getPriceHistoryForOffers } from '@/lib/queries/price-history';
import { formatPrice } from '@/lib/format';
import { ZoneCompatibility } from '@/components/ZoneCompatibility';
import { CultivarTabs } from '@/components/CultivarTabs';
import type { TabId } from '@/components/CultivarTabs';
import { QuickFactsHero } from '@/components/QuickFactsHero';
import { ZoneBar } from '@/components/ZoneBar';
import { HarvestCalendar } from '@/components/HarvestCalendar';
import { HeightSilhouette } from '@/components/HeightSilhouette';
import type { GrowingProfile } from '@/lib/types';

interface Props {
  params: Promise<{ speciesSlug: string; cultivarSlug: string }>;
}

function formatPricesLastChecked(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAvailabilityTag(rawAvailability: string | null): { label: string; className: string } | null {
  if (!rawAvailability) return null;
  const value = rawAvailability.toLowerCase();
  if (value.includes('pre-order') || value.includes('preorder')) {
    return { label: 'Pre-Order', className: 'bg-accent-subtle text-accent' };
  }
  if (value.includes('sold out') || value.includes('out of stock')) {
    return { label: 'Sold Out', className: 'bg-surface-inset text-status-unavailable' };
  }
  if (value.includes('in stock') || value.includes('available')) {
    return { label: 'In Stock', className: 'bg-accent-light text-status-active' };
  }
  return { label: rawAvailability, className: 'bg-surface-inset text-text-secondary' };
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { speciesSlug, cultivarSlug } = await params;
  const supabase = await createClient();
  const cultivar = await getCultivarBySpeciesAndSlug(supabase, speciesSlug, cultivarSlug);
  if (!cultivar) return { title: 'Cultivar Not Found' };

  const species = (cultivar as any).plant_entities;
  const speciesName = species?.canonical_name ?? 'Plant';
  const title = `${cultivar.canonical_name} ${speciesName} — Breeder, Availability, Details`;
  const description = cultivar.notes
    ? cultivar.notes.slice(0, 160)
    : `${cultivar.canonical_name} — ${speciesName} cultivar. Find breeder info, nursery availability, and pricing.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://plantcommerce.app/plants/${speciesSlug}/${cultivarSlug}` },
    twitter: { card: 'summary' },
  };
}

export default async function CultivarPage({ params }: Props) {
  const { speciesSlug, cultivarSlug } = await params;
  const supabase = await createClient();
  const cultivar = await getCultivarBySpeciesAndSlug(supabase, speciesSlug, cultivarSlug);
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

  const latestScrapeIso = offers.reduce<string | null>((latest, offer: any) => {
    const value = offer.nurseries?.last_scraped_at as string | null | undefined;
    if (!value) return latest;
    if (!latest) return value;
    return new Date(value) > new Date(latest) ? value : latest;
  }, null) ?? null;
  const pricesLastCheckedLabel = formatPricesLastChecked(latestScrapeIso);

  const activeOffers = offers.filter((o: any) => o.offer_status === 'active');
  const bestOffer = activeOffers.reduce<any | null>((best, offer: any) => {
    if (offer.price_cents == null) return best;
    if (!best || offer.price_cents < best.price_cents) return offer;
    return best;
  }, null);

  const comparisonOffers = offers.map((offer: any) => {
    const availability = getAvailabilityTag(offer.raw_availability);
    const location = [offer.nurseries?.location_state, offer.nurseries?.location_country].filter(Boolean).join(', ');
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
    .filter((o: any) =>
      o.nurseries?.latitude != null && o.nurseries?.longitude != null &&
      !seen.has(o.nurseries.id) && seen.add(o.nurseries.id)
    )
    .map((o: any) => ({
      id: o.nurseries.id as string,
      name: o.nurseries.name as string,
      slug: o.nurseries.slug as string,
      latitude: o.nurseries.latitude as number,
      longitude: o.nurseries.longitude as number,
    }));

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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cultivar.canonical_name,
    category: species?.canonical_name,
    description: cultivar.notes || undefined,
    url: `https://plantcommerce.app/plants/${speciesSlug}/${cultivarSlug}`,
    offers: offers.map((o: any) => ({
      '@type': 'Offer',
      seller: { '@type': 'Organization', name: o.nurseries?.name, url: o.nurseries?.slug ? `https://plantcommerce.app/nurseries/${o.nurseries.slug}` : undefined },
      price: o.raw_price_text,
      priceCurrency: 'USD',
      url: o.product_page_url,
      availability: o.offer_status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    })),
  };

  // Build tab definitions
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'growing', label: 'Growing' },
  ];
  if (growingProfile?.harvest_season || growingProfile?.years_to_bearing_min != null) {
    tabs.push({ id: 'production', label: 'Production' });
  }
  if (growingProfile) {
    tabs.push({ id: 'pollination', label: 'Pollination' });
  }
  tabs.push({ id: 'availability', label: 'Buy', count: offers.length });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            ...(species ? [{ label: species.canonical_name, href: `/plants/${speciesSlug}` }] : []),
            { label: cultivar.canonical_name },
          ]}
        />

        {/* Hero header */}
        <section className="rounded-[var(--radius-xl)] bg-accent-hover p-6 text-surface-raised">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-surface-raised/20 text-xs text-surface-raised/40">
              Plant image
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="font-serif text-3xl font-bold text-surface-raised">{cultivar.canonical_name}</h1>
                <span className="rounded-[var(--radius-md)] bg-surface-raised/15 px-3 py-1 text-xs font-medium text-surface-raised/80">
                  {cultivar.material_type.replace(/_/g, ' ')}
                </span>
              </div>
              {species && (
                <div className="text-surface-raised/70 mb-0.5">
                  <BotanicalName>{species.botanical_name}</BotanicalName>
                </div>
              )}
              <div className="text-sm text-surface-raised/50 mb-4">
                {species?.canonical_name}
                {cultivar.breeder && <> &middot; {cultivar.breeder}</>}
                {cultivar.year_released && <> ({cultivar.year_released})</>}
              </div>
              <QuickFactsHero profile={growingProfile} />
              {bestOffer && (
                <div className="mt-3 inline-flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface-raised/12 px-4 py-2">
                  <span className="text-xs text-surface-raised/60">Best price</span>
                  <span className="text-xl font-bold text-surface-raised">
                    {formatPrice(bestOffer.raw_price_text, bestOffer.price_cents)}
                  </span>
                  <span className="text-xs text-surface-raised/60">at {bestOffer.nurseries?.name}</span>
                  {bestOffer.product_page_url && (
                    <a href={bestOffer.product_page_url} target="_blank" rel="noopener noreferrer"
                      className="rounded-[var(--radius-md)] bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light">
                      View &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tabbed content */}
        <CultivarTabs tabs={tabs}>
          {{
            overview: (
              <div className="space-y-6">
                {cultivar.notes && <Text variant="body" color="secondary">{cultivar.notes}</Text>}
                {growingProfile && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {growingProfile.usda_zone_min != null && growingProfile.usda_zone_max != null && (
                      <Surface elevation="raised" padding="default">
                        <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">USDA Hardiness Zones</Text>
                        <ZoneBar min={growingProfile.usda_zone_min} max={growingProfile.usda_zone_max} />
                      </Surface>
                    )}
                    {(growingProfile.mature_height_min_ft != null || growingProfile.mature_height_max_ft != null) && (
                      <Surface elevation="raised" padding="default">
                        <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">Size at Maturity</Text>
                        <HeightSilhouette minFt={growingProfile.mature_height_min_ft} maxFt={growingProfile.mature_height_max_ft} />
                      </Surface>
                    )}
                  </div>
                )}
                {growingProfile?.harvest_season && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">Annual Calendar</Text>
                    <HarvestCalendar harvestSeason={growingProfile.harvest_season} />
                  </Surface>
                )}
                {(cultivar.breeder || cultivar.origin_location || cultivar.year_released || (cultivar.patent_status !== 'unknown' && cultivar.patent_status)) && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {cultivar.breeder && (<Surface elevation="raised" padding="compact"><Text variant="caption" color="tertiary">Breeder</Text><Text variant="body" className="font-medium">{cultivar.breeder}</Text></Surface>)}
                    {cultivar.origin_location && (<Surface elevation="raised" padding="compact"><Text variant="caption" color="tertiary">Origin</Text><Text variant="body" className="font-medium">{cultivar.origin_location}</Text></Surface>)}
                    {cultivar.year_released && (<Surface elevation="raised" padding="compact"><Text variant="caption" color="tertiary">Released</Text><Text variant="body" className="font-medium">{String(cultivar.year_released)}</Text></Surface>)}
                    {cultivar.patent_status !== 'unknown' && cultivar.patent_status && (<Surface elevation="raised" padding="compact"><Text variant="caption" color="tertiary">Patent Status</Text><Text variant="body" className="font-medium">{cultivar.patent_status.replace(/_/g, ' ')}</Text></Surface>)}
                  </div>
                )}
                {growingProfile && <ZoneCompatibility zoneMin={growingProfile.usda_zone_min ?? null} zoneMax={growingProfile.usda_zone_max ?? null} />}
                {(aliases.length > 0 || legal.length > 0) && (
                  <div>
                    {aliases.length > 0 && (
                      <Disclosure title="Also Known As" badge={<Tag type="neutral" size="sm">{aliases.length}</Tag>}>
                        <div className="flex flex-wrap gap-2">
                          {aliases.map((a: any) => (
                            <span key={a.id} className="rounded-full bg-surface-inset px-3 py-1 text-sm text-text-secondary">
                              {a.alias_text}<Text variant="caption" color="tertiary" as="span" className="ml-1">({a.alias_type.replace(/_/g, ' ')})</Text>
                            </span>
                          ))}
                        </div>
                      </Disclosure>
                    )}
                    {legal.length > 0 && (
                      <Disclosure title="Legal Identifiers" badge={<Tag type="neutral" size="sm">{legal.length}</Tag>}>
                        <div className="space-y-1">
                          {legal.map((l: any) => (
                            <Text key={l.id} variant="sm" color="secondary" as="div">
                              <span className="font-medium">{l.id_type}:</span> {l.value_raw}
                              {l.status && <Text variant="caption" color="tertiary" as="span" className="ml-2">({l.status})</Text>}
                            </Text>
                          ))}
                        </div>
                      </Disclosure>
                    )}
                  </div>
                )}
              </div>
            ),

            growing: (
              <div className="space-y-6">
                {growingProfile ? (
                  <>
                    {growingProfile.usda_zone_min != null && growingProfile.usda_zone_max != null && (
                      <Surface elevation="raised" padding="default">
                        <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">USDA Hardiness Zones</Text>
                        <ZoneBar min={growingProfile.usda_zone_min} max={growingProfile.usda_zone_max} />
                      </Surface>
                    )}
                    {(growingProfile.mature_height_min_ft != null || growingProfile.mature_height_max_ft != null) && (
                      <Surface elevation="raised" padding="default">
                        <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">Size at Maturity</Text>
                        <HeightSilhouette minFt={growingProfile.mature_height_min_ft} maxFt={growingProfile.mature_height_max_ft} />
                        {growingProfile.mature_spread_min_ft != null && growingProfile.mature_spread_max_ft != null && (
                          <Text variant="sm" color="secondary" className="mt-2">Spread: {growingProfile.mature_spread_min_ft}&ndash;{growingProfile.mature_spread_max_ft} ft</Text>
                        )}
                      </Surface>
                    )}
                    <TraitGrid profile={growingProfile} />
                  </>
                ) : (
                  <EmptyState title="No growing data yet" description="Growing requirements for this cultivar are being catalogued." />
                )}
              </div>
            ),

            production: (
              <div className="space-y-6">
                {growingProfile?.harvest_season && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">Annual Calendar</Text>
                    <HarvestCalendar harvestSeason={growingProfile.harvest_season} />
                  </Surface>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  {growingProfile?.years_to_bearing_min != null && (
                    <Surface elevation="raised" padding="default" className="text-center">
                      <Text variant="caption" color="tertiary" className="block mb-1 uppercase tracking-wider text-[10px]">Years to First Harvest</Text>
                      <div className="text-2xl font-bold text-accent">{growingProfile.years_to_bearing_min}{growingProfile.years_to_bearing_max != null && `\u2013${growingProfile.years_to_bearing_max}`}</div>
                      <Text variant="caption" color="tertiary">years</Text>
                    </Surface>
                  )}
                  {growingProfile?.harvest_season && (
                    <Surface elevation="raised" padding="default" className="text-center">
                      <Text variant="caption" color="tertiary" className="block mb-1 uppercase tracking-wider text-[10px]">Harvest Season</Text>
                      <div className="text-2xl font-bold text-accent capitalize">{growingProfile.harvest_season.replace(/_/g, ' ')}</div>
                    </Surface>
                  )}
                  {growingProfile?.growth_rate && (
                    <Surface elevation="raised" padding="default" className="text-center">
                      <Text variant="caption" color="tertiary" className="block mb-1 uppercase tracking-wider text-[10px]">Growth Rate</Text>
                      <div className="text-2xl font-bold text-accent capitalize">{growingProfile.growth_rate.replace(/_/g, ' ')}</div>
                    </Surface>
                  )}
                </div>
                {cultivar.notes && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-2 block uppercase tracking-wider font-semibold text-[11px]">Cultivar Notes</Text>
                    <Text variant="body" color="secondary">{cultivar.notes}</Text>
                  </Surface>
                )}
              </div>
            ),

            pollination: (
              <div className="space-y-6">
                <Surface elevation="raised" padding="default" className="border-l-4 border-l-community">
                  <Text variant="h3" className="mb-2">Pollination Requirements</Text>
                  <Text variant="body" color="secondary">
                    Detailed pollination compatibility data (S-alleles, compatible partners, bloom overlap)
                    is being added to PlantCommerce. Check back soon for cultivar-level pollination planning tools.
                  </Text>
                  {species && (
                    <Link href={`/pollination/${speciesSlug}`} className="mt-3 inline-block text-sm text-accent hover:underline">
                      View species-level pollination info &rarr;
                    </Link>
                  )}
                </Surface>
                {growingProfile?.harvest_season && (
                  <Surface elevation="raised" padding="default">
                    <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">Seasonal Timeline</Text>
                    <HarvestCalendar harvestSeason={growingProfile.harvest_season} bloomPeriod="mid" />
                  </Surface>
                )}
              </div>
            ),

            availability: (
              <div className="space-y-6">
                <section>
                  <Text variant="h2" className="mb-4">Nursery Offers ({offers.length})</Text>
                  {offers.length >= 2 ? (
                    <PriceComparisonTable offers={comparisonOffers} lastCheckedAt={pricesLastCheckedLabel} />
                  ) : offers.length === 1 ? (
                    <div className="space-y-3">
                      {offers.slice(0, 1).map((offer: any) => {
                        const availability = getAvailabilityTag(offer.raw_availability);
                        const offerDetails = [offer.propagation_method, offer.sale_form].filter((v: string | null | undefined) => v && v !== 'unknown').map((v: string) => v.replace(/_/g, ' '));
                        const location = [offer.nurseries?.location_state, offer.nurseries?.location_country].filter(Boolean).join(', ');
                        return (
                          <Surface key={offer.id} elevation="raised" padding="default">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <Link href={`/nurseries/${offer.nurseries?.slug}`} className="font-medium text-accent hover:underline">{offer.nurseries?.name}</Link>
                                {location && <Text variant="sm" color="secondary">{location}</Text>}
                                {offerDetails.length > 0 && <Text variant="caption" color="tertiary">{offerDetails.join(' \u00b7 ')}</Text>}
                                {availability && (<div className="mt-2"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${availability.className}`}>{availability.label}</span></div>)}
                              </div>
                              <div className="sm:text-right">
                                {offer.raw_price_text ? <Text variant="price">{offer.raw_price_text}</Text> : <Text variant="sm" color="tertiary">Contact nursery for pricing</Text>}
                                {offer.product_page_url && (<a href={offer.product_page_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-text-inverse hover:bg-accent-hover">View at nursery</a>)}
                              </div>
                            </div>
                          </Surface>
                        );
                      })}
                      {pricesLastCheckedLabel && <Text variant="sm" color="tertiary">Prices last checked: {pricesLastCheckedLabel}</Text>}
                    </div>
                  ) : (
                    <EmptyState title={`No tracked nurseries currently stock ${cultivar.canonical_name}`} description="Get notified when it's available.">
                      <div className="space-y-4">
                        <AlertSignupForm cultivarId={cultivar.id} plantEntityId={species?.id ?? null} cultivarName={cultivar.canonical_name} compact />
                        <div className="flex flex-col gap-2 text-sm">
                          <Link href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`} className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset">Know a nursery that carries this? Let us know</Link>
                          <Link href={`/plants/${speciesSlug}`} className="rounded-[var(--radius-md)] border border-border bg-surface-raised px-4 py-2 text-text-secondary transition-colors hover:bg-surface-inset">Browse other {species?.canonical_name ?? 'species'} cultivars</Link>
                        </div>
                      </div>
                    </EmptyState>
                  )}
                </section>
                {sparklineData.length > 0 && (
                  <section>
                    <Text variant="h3" className="mb-3">Price History</Text>
                    <Surface elevation="raised" padding="default"><div className="space-y-2">{sparklineData.map((sd) => (<PriceSparkline key={sd.nurseryName} nurseryName={sd.nurseryName} points={sd.points} />))}</div></Surface>
                  </section>
                )}
                {offers.length > 0 && <AlertSignupForm cultivarId={cultivar.id} plantEntityId={species?.id ?? null} cultivarName={cultivar.canonical_name} />}
                {nurseryPins.length > 0 && (<section><Text variant="h2" className="mb-3">Where to Buy</Text><NurseryMap nurseries={nurseryPins} height="300px" /></section>)}
                <section>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <Text variant="h2">Community Listings{communityListings.length > 0 && <span className="ml-2 text-base font-normal text-text-tertiary">({communityListings.length})</span>}</Text>
                    <Link href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`} className="text-sm text-accent hover:underline">+ List {cultivar.canonical_name}</Link>
                  </div>
                  {communityListings.length > 0 ? (
                    <div className="space-y-3">{communityListings.map((listing) => (<ListingCard key={listing.id} listing={listing} />))}</div>
                  ) : (
                    <p className="text-sm text-text-tertiary">No community listings yet. <a href={`/marketplace/submit?cultivar=${encodeURIComponent(cultivar.canonical_name)}`} className="text-accent hover:underline">Be the first to list this cultivar &rarr;</a></p>
                  )}
                </section>
              </div>
            ),
          }}
        </CultivarTabs>

        <JsonLd data={productJsonLd} />
      </div>
    </div>
  );
}
