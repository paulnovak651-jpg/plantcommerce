import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import { getTaxonomyPath } from '@/lib/queries/taxonomy';
import { getGrowingProfile } from '@/lib/queries/growing';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';

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
  const supabase = await createClient();
  const species = await getPlantEntityBySlug(supabase, speciesSlug);

  if (!species) notFound();

  const cultivars = await getCultivarsForSpecies(supabase, species.id);
  const [taxonomyPath, growingProfile] = await Promise.all([
    getTaxonomyPath(supabase, species.id),
    getGrowingProfile(supabase, species.id),
  ]);

  // Group cultivars by material type
  const clones = cultivars.filter((c: any) => c.material_type === 'cultivar_clone');
  const seedStrains = cultivars.filter((c: any) => c.material_type === 'named_seed_strain');
  const populations = cultivars.filter(
    (c: any) =>
      c.material_type === 'breeding_population' || c.material_type === 'geographic_population'
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${species.canonical_name} Cultivars`,
    numberOfItems: cultivars.length,
    itemListElement: cultivars.map((cv: any, i: number) => ({
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
        <CultivarSection title="Cultivars" items={clones} speciesSlug={speciesSlug} />
      )}

      {seedStrains.length > 0 && (
        <CultivarSection title="Named Seed Strains" items={seedStrains} speciesSlug={speciesSlug} />
      )}

      {populations.length > 0 && (
        <CultivarSection
          title="Breeding & Geographic Populations"
          items={populations}
          speciesSlug={speciesSlug}
        />
      )}

      {cultivars.length === 0 && (
        <EmptyState
          title="No cultivar data yet"
          description="No cultivar data for this species yet."
        />
      )}

      <JsonLd data={jsonLd} />
    </div>
  );
}

function CultivarSection({
  title,
  items,
  speciesSlug,
}: {
  title: string;
  items: any[];
  speciesSlug: string;
}) {
  return (
    <section>
      <Text variant="h2" className="mb-4">
        {title} ({items.length})
      </Text>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cv: any) => (
          <Link key={cv.id} href={`/plants/${speciesSlug}/${cv.slug}`}>
            <div className="h-full rounded-[var(--radius-lg)] px-4 py-3 transition-colors hover:bg-surface-raised">
              <Text variant="h3" color="accent">{cv.canonical_name}</Text>
              {cv.breeder && <Text variant="caption" color="tertiary">{cv.breeder}</Text>}
              {cv.notes && (
                <Text variant="caption" color="secondary" className="mt-1 line-clamp-2">
                  {cv.notes}
                </Text>
              )}
              {cv.patent_status !== 'unknown' && cv.patent_status !== 'none' && (
                <Tag type="community" size="sm">{cv.patent_status.replace(/_/g, ' ')}</Tag>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
