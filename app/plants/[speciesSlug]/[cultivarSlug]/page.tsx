import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  getCultivarBySlug,
  getOffersForCultivar,
  getAliasesForCultivar,
  getLegalIdentifiers,
} from '@/lib/queries/cultivars';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tag } from '@/components/ui/Tag';
import { Surface } from '@/components/ui/Surface';
import { Disclosure } from '@/components/ui/Disclosure';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: Promise<{ speciesSlug: string; cultivarSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { speciesSlug, cultivarSlug } = await params;
  const supabase = await createClient();
  const cultivar = await getCultivarBySlug(supabase, cultivarSlug);

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
  const cultivar = await getCultivarBySlug(supabase, cultivarSlug);

  if (!cultivar) notFound();

  const [offers, aliases, legal] = await Promise.all([
    getOffersForCultivar(supabase, cultivar.id),
    getAliasesForCultivar(supabase, cultivar.id),
    getLegalIdentifiers(supabase, cultivar.id),
  ]);

  const species = (cultivar as any).plant_entities;

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
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-[1.8rem] font-semibold leading-[1.2] text-text-primary">
                {cultivar.canonical_name}
              </h1>
              <Tag type="neutral">{cultivar.material_type.replace(/_/g, ' ')}</Tag>
            </div>
            {species && (
              <p className="mt-1 font-serif text-base italic text-text-secondary">
                {species.botanical_name}
              </p>
            )}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cultivar.breeder && (
            <Surface elevation="raised" padding="compact">
              <p className="text-xs text-text-tertiary">Breeder</p>
              <p className="font-medium text-text-primary">{cultivar.breeder}</p>
            </Surface>
          )}
          {cultivar.origin_location && (
            <Surface elevation="raised" padding="compact">
              <p className="text-xs text-text-tertiary">Origin</p>
              <p className="font-medium text-text-primary">{cultivar.origin_location}</p>
            </Surface>
          )}
          {cultivar.year_released && (
            <Surface elevation="raised" padding="compact">
              <p className="text-xs text-text-tertiary">Released</p>
              <p className="font-medium text-text-primary">{String(cultivar.year_released)}</p>
            </Surface>
          )}
          {cultivar.patent_status !== 'unknown' && (
            <Surface elevation="raised" padding="compact">
              <p className="text-xs text-text-tertiary">Patent Status</p>
              <p className="font-medium text-text-primary">{cultivar.patent_status.replace(/_/g, ' ')}</p>
            </Surface>
          )}
        </div>

        {cultivar.notes && (
          <p className="mt-4 leading-[1.6] text-text-secondary">{cultivar.notes}</p>
        )}
      </section>

      {/* ZONE 2: WHERE TO GET IT */}
      <section>
        <h2 className="mb-4 font-serif text-[1.25rem] font-semibold text-text-primary">
          Nursery Offers ({offers.length})
        </h2>
        {offers.length > 0 ? (
          <div className="space-y-3">
            {offers.map((offer: any) => (
              <Surface key={offer.id} elevation="raised" padding="default">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/nurseries/${offer.nurseries?.slug}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {offer.nurseries?.name}
                    </Link>
                    <p className="text-sm text-text-secondary">
                      {offer.nurseries?.location_state}, {offer.nurseries?.location_country}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {offer.propagation_method !== 'unknown' &&
                        offer.propagation_method.replace(/_/g, ' ')}
                      {offer.sale_form !== 'unknown' &&
                        ` \u00b7 ${offer.sale_form.replace(/_/g, ' ')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {offer.raw_price_text && (
                      <p className="text-[1.1rem] font-semibold text-text-primary">{offer.raw_price_text}</p>
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
            ))}
          </div>
        ) : (
          <EmptyState
            title="No offers yet"
            description="We haven't found this cultivar at any nurseries. Check back as we add more sources."
          />
        )}
      </section>

      {/* ZONE 3: KNOWLEDGE (disclosure sections) */}
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
                    <span className="ml-1 text-xs text-text-tertiary">
                      ({a.alias_type.replace(/_/g, ' ')})
                    </span>
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
                  <div key={l.id} className="text-sm text-text-secondary">
                    <span className="font-medium">{l.id_type}:</span> {l.value_raw}
                    {l.status && (
                      <span className="ml-2 text-xs text-text-tertiary">({l.status})</span>
                    )}
                  </div>
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
