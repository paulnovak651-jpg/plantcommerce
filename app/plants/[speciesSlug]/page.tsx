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

function formatEnumValue(val: string): string {
  return val
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function GrowingProfileSection({ profile }: { profile: Record<string, unknown> }) {
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
    rows.push({ label: 'Sun', value: formatEnumValue(profile.sun_requirement as string) });
  }
  if (profile.water_needs != null) {
    rows.push({ label: 'Water', value: formatEnumValue(profile.water_needs as string) });
  }
  if (profile.soil_ph_min != null && profile.soil_ph_max != null) {
    rows.push({ label: 'Soil pH', value: `${profile.soil_ph_min}–${profile.soil_ph_max}` });
  }
  if (profile.years_to_bearing_min != null && profile.years_to_bearing_max != null) {
    rows.push({ label: 'Years to Bearing', value: `${profile.years_to_bearing_min}–${profile.years_to_bearing_max} yrs` });
  }
  if (profile.growth_rate != null) {
    rows.push({ label: 'Growth Rate', value: formatEnumValue(profile.growth_rate as string) });
  }
  if (profile.native_range_description != null) {
    rows.push({ label: 'Native Range', value: profile.native_range_description as string });
  }

  if (rows.length === 0) return null;

  return (
    <section>
      <Text variant="h2" className="mb-3">Growing Requirements</Text>
      <Surface elevation="raised" padding="compact">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <Text variant="caption" color="tertiary">{label}</Text>
              <Text variant="body">{value}</Text>
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
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

      {growingProfile && <GrowingProfileSection profile={growingProfile} />}

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
