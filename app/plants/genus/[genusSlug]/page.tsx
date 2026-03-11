import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGenusBySlug } from '@/lib/queries/genus';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { RangeBar } from '@/components/ui/RangeBar';
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: Promise<{ genusSlug: string }>;
}

interface RelatedGenusLink {
  slug: string;
  name: string;
  speciesWithOffers: number;
  nurseryCount: number;
}

async function getRelatedGeneraInCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  category: string,
  excludeGenusSlug: string
): Promise<RelatedGenusLink[]> {
  const [
    { data: speciesRows, error: speciesError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: genusRows, error: genusError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, taxonomy_node_id')
      .eq('curation_status', 'published')
      .eq('display_category', category),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('taxonomy_nodes')
      .select('id, slug, name, taxonomy_ranks!inner(rank_name)')
      .eq('taxonomy_ranks.rank_name', 'genus'),
  ]);

  if (speciesError || cultivarError || offerError || genusError) {
    console.error(
      'getRelatedGeneraInCategory error:',
      speciesError ?? cultivarError ?? offerError ?? genusError
    );
    return [];
  }

  const species = (speciesRows ?? []) as Array<{ id: string; taxonomy_node_id: string | null }>;
  const speciesGenusById = new Map<string, string>();
  for (const sp of species) {
    if (sp.taxonomy_node_id) speciesGenusById.set(sp.id, sp.taxonomy_node_id);
  }

  const cultivarToSpecies = new Map<string, string>();
  for (const row of (cultivarRows ?? []) as Array<{ id: string; plant_entity_id: string | null }>) {
    if (row.plant_entity_id && speciesGenusById.has(row.plant_entity_id)) {
      cultivarToSpecies.set(row.id, row.plant_entity_id);
    }
  }

  const speciesWithOffersByGenus = new Map<string, Set<string>>();
  const nurseryByGenus = new Map<string, Set<string>>();
  for (const row of (offerRows ?? []) as Array<{ cultivar_id: string | null; nursery_id: string }>) {
    if (!row.cultivar_id) continue;
    const speciesId = cultivarToSpecies.get(row.cultivar_id);
    if (!speciesId) continue;
    const genusId = speciesGenusById.get(speciesId);
    if (!genusId) continue;

    if (!speciesWithOffersByGenus.has(genusId)) {
      speciesWithOffersByGenus.set(genusId, new Set<string>());
    }
    if (!nurseryByGenus.has(genusId)) {
      nurseryByGenus.set(genusId, new Set<string>());
    }

    speciesWithOffersByGenus.get(genusId)?.add(speciesId);
    nurseryByGenus.get(genusId)?.add(row.nursery_id);
  }

  const links: RelatedGenusLink[] = [];
  for (const row of (genusRows ?? []) as Array<{ id: string; slug: string; name: string }>) {
    if (row.slug === excludeGenusSlug) continue;
    const speciesWithOffers = speciesWithOffersByGenus.get(row.id)?.size ?? 0;
    if (speciesWithOffers === 0) continue;

    links.push({
      slug: row.slug,
      name: row.name,
      speciesWithOffers,
      nurseryCount: nurseryByGenus.get(row.id)?.size ?? 0,
    });
  }

  return links
    .sort((a, b) => {
      if (b.speciesWithOffers !== a.speciesWithOffers) {
        return b.speciesWithOffers - a.speciesWithOffers;
      }
      if (b.nurseryCount !== a.nurseryCount) {
        return b.nurseryCount - a.nurseryCount;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 6);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genusSlug } = await params;
  const supabase = await createClient();
  const genus = await getGenusBySlug(supabase, genusSlug);

  if (!genus) return { title: 'Genus Not Found' };

  const commonName = GENUS_COMMON_NAMES[genusSlug] ?? genus.name;
  const title = `${commonName} (${genus.name}) - Species & Availability`;
  const description = genus.description
    ? genus.description.slice(0, 160)
    : `Browse all ${commonName} species, cultivars, and nursery availability.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://plantcommerce.app/plants/genus/${genusSlug}`,
    },
    twitter: { card: 'summary' },
  };
}

export default async function GenusHubPage({ params }: Props) {
  const { genusSlug } = await params;
  const supabase = await createClient();
  const genus = await getGenusBySlug(supabase, genusSlug);

  if (!genus) notFound();

  const commonName = GENUS_COMMON_NAMES[genusSlug] ?? genus.name;
  const categoryName = genus.species[0]?.display_category ?? genus.family_name ?? 'Plants';
  const categoryParam = genus.species[0]?.display_category
    ? `/browse?category=${encodeURIComponent(genus.species[0].display_category)}`
    : '/browse';

  const speciesWithOffersCount = genus.species.filter((sp) => sp.nursery_count > 0).length;
  const categoryForRelatedGenera = genus.species[0]?.display_category ?? null;
  const relatedGenera =
    speciesWithOffersCount < 3 && categoryForRelatedGenera
      ? await getRelatedGeneraInCategory(supabase, categoryForRelatedGenera, genusSlug)
      : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${commonName} Species`,
    numberOfItems: genus.species.length,
    itemListElement: genus.species.map((sp, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: sp.canonical_name,
      url: `https://plantcommerce.app/plants/${sp.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: categoryName, href: categoryParam },
            { label: commonName },
          ]}
        />

        <section className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <Text variant="h1">{commonName}</Text>
          <Text variant="body" color="secondary" className="mt-1">
            <BotanicalName>{genus.botanical_name ?? genus.name}</BotanicalName>
          </Text>

          <Text variant="sm" color="tertiary" className="mt-2">
            <span className="font-medium text-text-secondary">{genus.species.length}</span>{' '}
            {genus.species.length === 1 ? 'species' : 'species'}
            <span className="mx-2 text-border">&middot;</span>
            <span className="font-medium text-text-secondary">{genus.total_cultivar_count}</span>{' '}
            cultivars
            {genus.total_nursery_count > 0 && (
              <>
                <span className="mx-2 text-border">&middot;</span>
                <span className="font-medium text-text-secondary">{genus.total_nursery_count}</span>{' '}
                {genus.total_nursery_count === 1 ? 'nursery' : 'nurseries'} with stock
              </>
            )}
          </Text>

          {genus.description && (
            <Text variant="body" color="secondary" className="mt-4">
              {genus.description}
            </Text>
          )}
        </section>

        <section>
          <Text variant="h2" className="mb-4">
            Species in this Genus
          </Text>
          <div className="grid gap-4 md:grid-cols-2">
            {genus.species.map((sp) => (
              <Link key={sp.id} href={`/plants/${sp.slug}`}>
                <div className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-5 transition-colors hover:border-border hover:bg-surface-raised">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Text variant="h3" color="accent">
                        {sp.canonical_name}
                      </Text>
                      {sp.botanical_name && (
                        <Text variant="caption" color="tertiary" className="mt-0.5">
                          <BotanicalName>{sp.botanical_name}</BotanicalName>
                        </Text>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {sp.cultivar_count > 0 && (
                        <Tag type="info" size="sm">
                          {sp.cultivar_count} cultivar{sp.cultivar_count !== 1 ? 's' : ''}
                        </Tag>
                      )}
                      {sp.nursery_count > 0 && (
                        <Tag type="availability" size="sm">
                          {sp.nursery_count} {sp.nursery_count === 1 ? 'nursery' : 'nurseries'}
                        </Tag>
                      )}
                    </div>
                  </div>

                  {sp.zone_min != null && sp.zone_max != null && (
                    <div className="mt-3">
                      <RangeBar
                        label="USDA Zone"
                        scaleMin={1}
                        scaleMax={13}
                        valueMin={sp.zone_min}
                        valueMax={sp.zone_max}
                        color="blue"
                        compact
                      />
                    </div>
                  )}

                  {sp.description && (
                    <Text variant="caption" color="secondary" className="mt-2 line-clamp-2">
                      {sp.description}
                    </Text>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sp.sun_requirement && (
                      <Tag type="neutral" size="sm">{sp.sun_requirement}</Tag>
                    )}
                    {sp.growth_rate && (
                      <Tag type="neutral" size="sm">{sp.growth_rate} growth</Tag>
                    )}
                    {sp.mature_height_min_ft != null && sp.mature_height_max_ft != null && (
                      <Tag type="neutral" size="sm">
                        {sp.mature_height_min_ft}&ndash;{sp.mature_height_max_ft} ft
                      </Tag>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {relatedGenera.length > 0 && (
          <section>
            <Text variant="h2" className="mb-2">
              Related Categories
            </Text>
            <Text variant="sm" color="secondary" className="mb-3">
              Explore other populated genera in {categoryForRelatedGenera}.
            </Text>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedGenera.map((item) => {
                const displayName = GENUS_COMMON_NAMES[item.slug] ?? item.name;
                return (
                  <Link
                    key={item.slug}
                    href={`/plants/genus/${item.slug}`}
                    className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3 transition-colors hover:border-border hover:bg-surface-raised"
                  >
                    <Text variant="h3" color="accent">
                      {displayName}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      {item.speciesWithOffers} species with stock
                    </Text>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <JsonLd data={jsonLd} />
      </div>
    </div>
  );
}
