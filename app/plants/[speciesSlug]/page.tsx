import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { Surface } from '@/components/ui/Surface';
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
        <h1 className="font-serif text-[1.8rem] font-semibold leading-[1.2] text-text-primary">
          {species.canonical_name}
        </h1>
        <p className="mt-1 font-serif text-base italic text-text-secondary">
          <BotanicalName>{species.botanical_name}</BotanicalName>
        </p>
        <p className="mt-1 text-sm text-text-tertiary">
          {species.genus} &middot; {species.family} &middot;{' '}
          <Tag type="neutral">{species.entity_type}</Tag>
        </p>

        {species.description && (
          <p className="mt-4 leading-[1.6] text-text-secondary">{species.description}</p>
        )}
      </section>

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
          description="We haven't loaded cultivar data for this species. Check back as we add more sources."
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
      <h2 className="mb-4 font-serif text-[1.25rem] font-semibold text-text-primary">
        {title} ({items.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cv: any) => (
          <Link key={cv.id} href={`/plants/${speciesSlug}/${cv.slug}`}>
            <Surface elevation="raised" padding="compact" className="h-full hover:border-accent">
              <h3 className="font-medium text-accent">{cv.canonical_name}</h3>
              {cv.breeder && <p className="text-xs text-text-tertiary">{cv.breeder}</p>}
              {cv.notes && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">{cv.notes}</p>
              )}
              {cv.patent_status !== 'unknown' && cv.patent_status !== 'none' && (
                <Tag type="community" size="sm">{cv.patent_status.replace(/_/g, ' ')}</Tag>
              )}
            </Surface>
          </Link>
        ))}
      </div>
    </section>
  );
}
