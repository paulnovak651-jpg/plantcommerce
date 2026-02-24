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
import { Badge } from '@/components/Badge';
import { InfoCard } from '@/components/InfoCard';
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
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          ...(species
            ? [{ label: species.canonical_name, href: `/plants/${speciesSlug}` }]
            : []),
          { label: cultivar.canonical_name },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-green-900">{cultivar.canonical_name}</h1>
          <Badge label={cultivar.material_type} />
        </div>
        {species && (
          <p className="mt-1 text-sm italic text-gray-500">{species.botanical_name}</p>
        )}
      </div>

      {/* Metadata grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cultivar.breeder && <InfoCard label="Breeder" value={cultivar.breeder} />}
        {cultivar.origin_location && <InfoCard label="Origin" value={cultivar.origin_location} />}
        {cultivar.year_released && (
          <InfoCard label="Released" value={String(cultivar.year_released)} />
        )}
        {cultivar.patent_status !== 'unknown' && (
          <InfoCard label="Patent Status" value={cultivar.patent_status.replace(/_/g, ' ')} />
        )}
      </div>

      {cultivar.notes && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Notes</h2>
          <p className="text-gray-700">{cultivar.notes}</p>
        </div>
      )}

      {/* Legal identifiers */}
      {legal.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Legal Identifiers</h2>
          <div className="space-y-1">
            {legal.map((l: any) => (
              <div key={l.id} className="text-sm text-gray-600">
                <span className="font-medium">{l.id_type}:</span> {l.value_raw}
                {l.status && (
                  <span className="ml-2 text-xs text-gray-400">({l.status})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Where to buy */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Where to Buy ({offers.length} offer{offers.length !== 1 ? 's' : ''})
        </h2>
        {offers.length > 0 ? (
          <div className="space-y-3">
            {offers.map((offer: any) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <Link
                    href={`/nurseries/${offer.nurseries?.slug}`}
                    className="font-semibold text-green-800 hover:underline"
                  >
                    {offer.nurseries?.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {offer.nurseries?.location_state}, {offer.nurseries?.location_country}
                  </p>
                  <p className="text-xs text-gray-400">
                    {offer.propagation_method !== 'unknown' &&
                      offer.propagation_method.replace(/_/g, ' ')}
                    {offer.sale_form !== 'unknown' &&
                      ` \u00b7 ${offer.sale_form.replace(/_/g, ' ')}`}
                  </p>
                </div>
                <div className="text-right">
                  {offer.raw_price_text && (
                    <p className="font-semibold text-gray-800">{offer.raw_price_text}</p>
                  )}
                  {offer.product_page_url && (
                    <a
                      href={offer.product_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:underline"
                    >
                      View at nursery &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active offers found. Check back later.</p>
        )}
      </div>

      {/* Known aliases */}
      {aliases.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Also Known As</h2>
          <div className="flex flex-wrap gap-2">
            {aliases.map((a: any) => (
              <span
                key={a.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
              >
                {a.alias_text}
                <span className="ml-1 text-xs text-gray-400">
                  ({a.alias_type.replace(/_/g, ' ')})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <JsonLd data={productJsonLd} />
    </div>
  );
}
