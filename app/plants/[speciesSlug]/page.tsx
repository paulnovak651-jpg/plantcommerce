import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getRelatedSpecies } from '@/lib/queries/plants';
import { loadSpeciesPage } from '@/lib/queries/loaders';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard } from '@/components/ListingCard';
import type { Cultivar } from '@/lib/types';

interface Props {
  params: Promise<{ speciesSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { speciesSlug } = await params;
  const supabase = await createClient();
  const species = await getPlantEntityBySlug(supabase, speciesSlug);

  if (!species) {
    return { title: 'Species Not Found' };
  }

  const title = `${species.canonical_name} (${species.botanical_name}) — Cultivars & Availability`;
  const description = species.description
    ? species.description.slice(0, 160)
    : `Browse cultivars, seed strains, and nursery availability for ${species.canonical_name} (${species.botanical_name}).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://plantcommerce.app/plants/${speciesSlug}`,
    },
    twitter: { card: 'summary' },
  };
}

export default async function SpeciesPage({ params }: Props) {
  const { speciesSlug } = await params;
  const loaded = await loadSpeciesPage(speciesSlug);
  if (!loaded) notFound();
  const { species, cultivars, taxonomyPath, growingProfile, offerStats, communityListings } = loaded;
  const supabase = await createClient();
  const relatedSpecies = await getRelatedSpecies(supabase, species.genus, species.slug);

  // Group cultivars by material type
  const clones = cultivars.filter((c) => c.material_type === 'cultivar_clone');
  const seedStrains = cultivars.filter((c) => c.material_type === 'named_seed_strain');
  const populations = cultivars.filter(
    (c) =>
      c.material_type === 'breeding_population' || c.material_type === 'geographic_population'
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${species.canonical_name} Cultivars`,
    numberOfItems: cultivars.length,
    itemListElement: cultivars.map((cv, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cv.canonical_name,
      url: `https://plantcommerce.app/plants/${speciesSlug}/${cv.slug}`,
    })),
  };

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: species.canonical_name },
        ]}
      />

      <section>
        <Text variant="h1">{species.canonical_name}</Text>
        <Text variant="body" color="secondary" className="mt-1">
          <BotanicalName>{species.botanical_name}</BotanicalName>
        </Text>
        {taxonomyPath.length > 0 ? (
          <Text variant="caption" color="tertiary" className="mt-1">
            {taxonomyPath
              .filter((n) => n.rank === 'family' || n.rank === 'genus')
              .map((n) => n.name)
              .join(' › ')}{' '}
            &middot; <Tag type="neutral">{species.entity_type}</Tag>
          </Text>
        ) : (
          <Text variant="sm" color="tertiary" className="mt-1">
            {species.genus} &middot; {species.family} &middot;{' '}
            <Tag type="neutral">{species.entity_type}</Tag>
          </Text>
        )}

        {/* Stats line */}
        {(cultivars.length > 0 || offerStats.nurseryCount > 0) && (
          <Text variant="sm" color="tertiary" className="mt-2">
            {cultivars.length > 0 && (
              <span>
                <span className="font-medium text-text-secondary">{cultivars.length}</span> cultivars
              </span>
            )}
            {cultivars.length > 0 && offerStats.nurseryCount > 0 && (
              <span className="mx-2 text-border">&middot;</span>
            )}
            {offerStats.nurseryCount > 0 && (
              <span>
                <span className="font-medium text-text-secondary">{offerStats.nurseryCount}</span>{' '}
                {offerStats.nurseryCount === 1 ? 'nursery' : 'nurseries'} with stock
              </span>
            )}
          </Text>
        )}

        {species.description && (
          <Text variant="body" color="secondary" className="mt-4">
            {species.description}
          </Text>
        )}
      </section>

      {growingProfile && (
        <section>
          <Text variant="h2" className="mb-3">
            Growing Requirements
          </Text>
          <TraitGrid profile={growingProfile} />
        </section>
      )}

      {clones.length > 0 && (
        <CultivarSection
          title="Cultivars"
          items={clones}
          speciesSlug={speciesSlug}
          nurseryCountById={offerStats.perCultivar}
        />
      )}

      {seedStrains.length > 0 && (
        <CultivarSection
          title="Named Seed Strains"
          items={seedStrains}
          speciesSlug={speciesSlug}
          nurseryCountById={offerStats.perCultivar}
        />
      )}

      {populations.length > 0 && (
        <CultivarSection
          title="Breeding & Geographic Populations"
          items={populations}
          speciesSlug={speciesSlug}
          nurseryCountById={offerStats.perCultivar}
        />
      )}

      {cultivars.length === 0 && (
        <EmptyState
          title="No cultivar data yet"
          description="No cultivar data for this species yet."
        />
      )}

      {relatedSpecies.length > 0 && (
        <section>
          <Text variant="h2" className="mb-2">
            Related Species
          </Text>
          <Text variant="sm" color="secondary" className="mb-2">
            Other {species.genus} species:
          </Text>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {relatedSpecies.map((item) => (
              <Link
                key={item.slug}
                href={`/plants/${item.slug}`}
                className="text-sm text-accent hover:underline"
              >
                {item.canonical_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {communityListings.length > 0 && (
        <section>
          <Text variant="h2" className="mb-3">
            Community Listings ({communityListings.length})
          </Text>
          <div className="space-y-3">
            {communityListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <JsonLd data={jsonLd} />
    </div>
  );
}

function CultivarSection({
  title,
  items,
  speciesSlug,
  nurseryCountById,
}: {
  title: string;
  items: Cultivar[];
  speciesSlug: string;
  nurseryCountById: Record<string, number>;
}) {
  return (
    <section>
      <Text variant="h2" className="mb-4">
        {title} ({items.length})
      </Text>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cv) => {
          const nurseryCount = nurseryCountById[cv.id] ?? 0;
          return (
            <Link key={cv.id} href={`/plants/${speciesSlug}/${cv.slug}`}>
              <div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
                <div className="flex items-start justify-between gap-2">
                  <Text variant="h3" color="accent">{cv.canonical_name}</Text>
                  {nurseryCount > 0 && (
                    <span className="shrink-0 rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
                      {nurseryCount} {nurseryCount === 1 ? 'nursery' : 'nurseries'}
                    </span>
                  )}
                </div>
                {cv.breeder && <Text variant="caption" color="tertiary">{cv.breeder}</Text>}
                {cv.notes && (
                  <Text variant="caption" color="secondary" className="mt-1 line-clamp-2">
                    {cv.notes}
                  </Text>
                )}
                {cv.patent_status !== 'unknown' && cv.patent_status !== 'none' && cv.patent_status && (
                  <Tag type="community" size="sm">{cv.patent_status.replace(/_/g, ' ')}</Tag>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
