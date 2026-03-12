import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGenusBySlug } from '@/lib/queries/genus';
import { getGenusPlantList } from '@/lib/queries/genus-plants';
import { genusCommonName } from '@/lib/genus-names';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { JsonLd } from '@/components/JsonLd';
import { GenusPlantList } from '@/components/genus/GenusPlantList';
import Link from 'next/link';

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

  const commonName = genusCommonName(genusSlug) ?? genus.name;
  const title = `${commonName} (${genus.name}) — Browse All Varieties & Availability`;
  const description = `Compare ${genus.total_cultivar_count} ${commonName.toLowerCase()} varieties across nurseries. Filter by species, price, and availability.`;

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

  const [genus, plantList] = await Promise.all([
    getGenusBySlug(supabase, genusSlug),
    getGenusPlantList(supabase, genusSlug),
  ]);

  if (!genus || !plantList) notFound();

  const commonName = genusCommonName(genusSlug) ?? genus.name;
  const categoryName = genus.species[0]?.display_category ?? genus.family_name ?? 'Plants';
  const categoryParam = genus.species[0]?.display_category
    ? `/?category=${encodeURIComponent(genus.species[0].display_category)}`
    : '/';

  const speciesWithOffersCount = genus.species.filter((sp) => sp.nursery_count > 0).length;
  const categoryForRelatedGenera = genus.species[0]?.display_category ?? null;
  const relatedGenera =
    speciesWithOffersCount < 3 && categoryForRelatedGenera
      ? await getRelatedGeneraInCategory(supabase, categoryForRelatedGenera, genusSlug)
      : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${commonName} Varieties`,
    numberOfItems: plantList.total_count,
    itemListElement: plantList.items.slice(0, 50).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url:
        item.type === 'cultivar'
          ? `https://plantcommerce.app/plants/${item.species_slug}/${item.slug}`
          : `https://plantcommerce.app/plants/${item.species_slug}`,
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
            <span className="font-medium text-text-secondary">{plantList.total_count}</span>{' '}
            {plantList.total_count === 1 ? 'plant' : 'plants'} across{' '}
            <span className="font-medium text-text-secondary">{genus.species.length}</span>{' '}
            {genus.species.length === 1 ? 'species' : 'species'}
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
          <GenusPlantList
            initialItems={plantList.items}
            speciesFilterOptions={plantList.species_filter_options}
            genusSlug={genusSlug}
          />
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
                const displayName = genusCommonName(item.slug) ?? item.name;
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
