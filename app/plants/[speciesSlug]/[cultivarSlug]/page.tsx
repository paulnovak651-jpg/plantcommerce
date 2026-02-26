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
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: Promise<{ speciesSlug: string; cultivarSlug: string }>;
}

function fmtEnum(val: string): string {
  return val
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function GrowingProfileGrid({ profile }: { profile: Record<string, unknown> }) {
  const rows: Array<{ label: string; value: string }> = [];

  if (profile.usda_zone_min != null && profile.usda_zone_max != null) {
    const zones = `Zone ${profile.usda_zone_min}–${profile.usda_zone_max}`;
    rows.push({
      label: 'USDA Zones',
      value: profile.usda_zone_notes ? `${zones} — ${profile.usda_zone_notes}` : zones,
    });
  }
  if (profile.chill_hours_min != null && profile.chill_hours_max != null) {
    rows.push({ label: 'Chill Hours', value: `${profile.chill_hours_min}–${profile.chill_hours_max} hrs` });
  }
  if (profile.mature_height_min_ft != null && profile.mature_height_max_ft != null) {
    rows.push({ label: 'Mature Height', value: `${profile.mature_height_min_ft}–${profile.mature_height_max_ft} ft` });
  }
  if (profile.mature_spread_min_ft != null && profile.mature_spread_max_ft != null) {
    rows.push({ label: 'Mature Spread', value: `${profile.mature_spread_min_ft}–${profile.mature_spread_max_ft} ft` });
  }
  if (profile.sun_requirement != null) {
    rows.push({ label: 'Sun', value: fmtEnum(profile.sun_requirement as string) });
  }
  if (profile.water_needs != null) {
    rows.push({ label: 'Water', value: fmtEnum(profile.water_needs as string) });
  }
  if (profile.soil_ph_min != null && profile.soil_ph_max != null) {
    rows.push({ label: 'Soil pH', value: `${profile.soil_ph_min}–${profile.soil_ph_max}` });
  }
  if (profile.years_to_bearing_min != null && profile.years_to_bearing_max != null) {
    rows.push({ label: 'Years to Bearing', value: `${profile.years_to_bearing_min}–${profile.years_to_bearing_max} yrs` });
  }
  if (profile.growth_rate != null) {
    rows.push({ label: 'Growth Rate', value: fmtEnum(profile.growth_rate as string) });
  }
  if (profile.native_range_description != null) {
    rows.push({ label: 'Native Range', value: profile.native_range_description as string });
  }

  if (rows.length === 0) return null;

  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <Text variant="caption" color="tertiary">{label}</Text>
          <Text variant="body">{value}</Text>
        </div>
      ))}
    </div>
  );
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

  const [offers, aliases, legal, growingProfile] = await Promise.all([
    getOffersForCultivar(supabase, cultivar.id),
    getAliasesForCultivar(supabase, cultivar.id),
    getLegalIdentifiers(supabase, cultivar.id),
    species?.id ? getGrowingProfile(supabase, species.id) : Promise.resolve(null),
  ]);

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

      {/* ZONE 1: THE ANSWER CARD */}
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

        {/* Metadata grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        {cultivar.notes && (
          <Text variant="body" color="secondary" className="mt-4">
            {cultivar.notes}
          </Text>
        )}
      </section>

      {/* ZONE 2: WHERE TO GET IT */}
      <section>
        <Text variant="h2" className="mb-4">
          Nursery Offers ({offers.length})
        </Text>
        {offers.length > 0 ? (
          <div className="space-y-3">
            {offers.map((offer: any) => {
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
          </div>
        ) : (
          <EmptyState
            title="No offers yet"
            description="No nursery offers yet. We're adding new sources regularly."
          />
        )}
      </section>

      {/* ZONE 3: KNOWLEDGE (disclosure sections) */}
      {(aliases.length > 0 || legal.length > 0 || growingProfile != null) && (
        <section>
          {growingProfile != null && (
            <Disclosure title="Growing Requirements">
              <GrowingProfileGrid profile={growingProfile} />
            </Disclosure>
          )}

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

      <JsonLd data={productJsonLd} />
    </div>
  );
}
