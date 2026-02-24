import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/Badge';
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
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: species.canonical_name },
        ]}
      />

      <h1 className="mb-1 text-3xl font-bold text-green-900">{species.canonical_name}</h1>
      <p className="mb-1 text-lg italic text-gray-500">{species.botanical_name}</p>
      <p className="mb-6 text-sm text-gray-400">
        {species.genus} &middot; {species.family} &middot;{' '}
        <Badge label={species.entity_type} variant="gray" />
      </p>

      {species.description && (
        <p className="mb-8 text-gray-700">{species.description}</p>
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
        <p className="text-gray-500">No cultivar data loaded for this species yet.</p>
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
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-gray-800">
        {title} ({items.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cv: any) => (
          <Link
            key={cv.id}
            href={`/plants/${speciesSlug}/${cv.slug}`}
            className="rounded-lg border border-gray-200 p-3 hover:border-green-300 hover:bg-green-50"
          >
            <h3 className="font-semibold text-green-800">{cv.canonical_name}</h3>
            {cv.breeder && <p className="text-xs text-gray-500">{cv.breeder}</p>}
            {cv.notes && <p className="mt-1 text-xs text-gray-400 line-clamp-2">{cv.notes}</p>}
            {cv.patent_status !== 'unknown' && cv.patent_status !== 'none' && (
              <Badge label={cv.patent_status} variant="amber" />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
