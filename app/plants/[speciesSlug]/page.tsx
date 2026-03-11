import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  getPlantEntityBySlug,
  getRelatedSpecies,
  getRelatedSpeciesWithOffers,
} from '@/lib/queries/plants';
import { loadSpeciesPage } from '@/lib/queries/loaders';
import { genusCommonName as getGenusCommonName } from '@/lib/genus-names';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { Disclosure } from '@/components/ui/Disclosure';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard } from '@/components/ListingCard';
import { QuickFactsRibbon } from '@/components/QuickFactsRibbon';
import type { Cultivar } from '@/lib/types';
import { ZoneCompatibility } from '@/components/ZoneCompatibility';
import type { GrowingProfile } from '@/lib/types';

interface Props {
  params: Promise<{ speciesSlug: string }>;
}

function buildQuickFacts(profile: GrowingProfile): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];

  if (profile.usda_zone_min != null && profile.usda_zone_max != null) {
    facts.push({ label: 'Zone', value: `${profile.usda_zone_min}\u2013${profile.usda_zone_max}` });
  }
  if (profile.mature_height_min_ft != null || profile.mature_height_max_ft != null) {
    const min = profile.mature_height_min_ft;
    const max = profile.mature_height_max_ft;
    const value = min != null && max != null ? `${min}\u2013${max} ft` : `${min ?? max} ft`;
    facts.push({ label: 'Height', value });
  }
  if (profile.sun_requirement) {
    facts.push({ label: 'Sun', value: profile.sun_requirement.replace(/_/g, ' ') });
  }
  if (profile.years_to_bearing_min != null || profile.years_to_bearing_max != null) {
    const min = profile.years_to_bearing_min;
    const max = profile.years_to_bearing_max;
    const value = min != null && max != null ? `${min}\u2013${max} yrs` : `${min ?? max} yrs`;
    facts.push({ label: 'Bearing', value });
  }
  if (profile.harvest_season) {
    facts.push({ label: 'Harvest', value: profile.harvest_season.replace(/_/g, ' ') });
  }

  return facts;
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
  const relatedSpeciesWithOffers = offerStats.nurseryCount === 0
    ? await getRelatedSpeciesWithOffers(supabase, species.genus, species.slug)
    : [];
  const genusNode = taxonomyPath.find((n) => n.rank === 'genus');
  const genusCommonName = genusNode ? (getGenusCommonName(genusNode.slug) ?? genusNode.name) : null;

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={(() => {
          const crumbs: Array<{ label: string; href?: string }> = [{ label: 'Home', href: '/' }];
          // Category crumb from display_category
          if (species.display_category) {
            crumbs.push({
              label: species.display_category,
              href: `/browse?category=${encodeURIComponent(species.display_category)}`,
            });
          }
          if (genusNode) {
            crumbs.push({
              label: genusCommonName ?? genusNode.name,
              href: `/plants/genus/${genusNode.slug}`,
            });
          }
          crumbs.push({ label: species.canonical_name });
          return crumbs;
        })()}
      />

      <section className="border-b border-border-subtle pb-[var(--spacing-zone)]">
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
        <section className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <QuickFactsRibbon facts={buildQuickFacts(growingProfile)} />
          <div className="mt-3">
            <ZoneCompatibility
              zoneMin={growingProfile.usda_zone_min}
              zoneMax={growingProfile.usda_zone_max}
            />
          </div>
        </section>
      )}

      {clones.length > 0 && (
        <div className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <CultivarSection
            title="Cultivars"
            items={clones}
            speciesSlug={speciesSlug}
            nurseryCountById={offerStats.perCultivar}
          />
        </div>
      )}

      {seedStrains.length > 0 && (
        <div className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <CultivarSection
            title="Named Seed Strains"
            items={seedStrains}
            speciesSlug={speciesSlug}
            nurseryCountById={offerStats.perCultivar}
          />
        </div>
      )}

      {populations.length > 0 && (
        <div className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <CultivarSection
            title="Breeding & Geographic Populations"
            items={populations}
            speciesSlug={speciesSlug}
            nurseryCountById={offerStats.perCultivar}
          />
        </div>
      )}

      {cultivars.length === 0 && (
        <EmptyState
          title={`No cultivar data yet for ${species.canonical_name}.`}
          description="This species is being catalogued."
          action={
            genusNode
              ? { label: 'Browse related species', href: `/plants/genus/${genusNode.slug}` }
              : undefined
          }
        />
      )}

      {offerStats.nurseryCount === 0 && relatedSpeciesWithOffers.length > 0 && (
        <section className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <Text variant="h2" className="mb-2">
            Looking to buy?
          </Text>
          <Text variant="sm" color="secondary" className="mb-3">
            These related species have nursery stock:
          </Text>
          <div className="flex flex-wrap gap-2">
            {relatedSpeciesWithOffers.map((item) => (
              <Link
                key={item.slug}
                href={`/plants/${item.slug}`}
                className="inline-block rounded-full border border-border-subtle bg-surface-primary px-3 py-1 text-sm text-accent transition-colors hover:border-accent hover:bg-accent-subtle"
              >
                {item.canonical_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {growingProfile && (
        <section className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <Disclosure title="Full Growing Guide" defaultOpen={false}>
            <TraitGrid profile={growingProfile} />
          </Disclosure>
        </section>
      )}

      {relatedSpecies.length > 0 && (() => {
        const totalSpeciesInGenus = relatedSpecies.length + 1;
        return (
          <section className={communityListings.length > 0 ? 'border-b border-border-subtle pb-[var(--spacing-zone)]' : undefined}>
            <Text variant="h2" className="mb-2">
              Related Species
            </Text>
            {genusNode && genusCommonName ? (
              <Text variant="sm" color="secondary" className="mb-2">
                Part of{' '}
                <Link href={`/plants/genus/${genusNode.slug}`} className="text-accent hover:text-accent-hover">
                  {genusCommonName}
                </Link>{' '}
                ({totalSpeciesInGenus} species){' '}
                <Link href={`/plants/genus/${genusNode.slug}`} className="text-accent hover:text-accent-hover">
                  &rarr; View all
                </Link>
              </Text>
            ) : (
              <Text variant="sm" color="secondary" className="mb-2">
                Other {species.genus} species:
              </Text>
            )}
            <div className="flex flex-wrap gap-2">
              {relatedSpecies.map((item) => (
                <Link
                  key={item.slug}
                  href={`/plants/${item.slug}`}
                  className="inline-block rounded-full border border-border-subtle bg-surface-primary px-3 py-1 text-sm text-accent transition-colors hover:border-accent hover:bg-accent-subtle"
                >
                  {item.canonical_name}
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

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
              <div className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3 cultivar-card-hover hover:bg-surface-raised hover:border-border cursor-pointer">
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
