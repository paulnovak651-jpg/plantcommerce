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
import { Surface } from '@/components/ui/Surface';
import { TraitGrid } from '@/components/ui/TraitGrid';
import { Disclosure } from '@/components/ui/Disclosure';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard } from '@/components/ListingCard';
import { QuickFactsRibbon } from '@/components/QuickFactsRibbon';
import { QuickFactsHero } from '@/components/QuickFactsHero';
import { ZoneBar } from '@/components/ZoneBar';
import { HarvestCalendar } from '@/components/HarvestCalendar';
import { HeightSilhouette } from '@/components/HeightSilhouette';
import { ZoneCompatibility } from '@/components/ZoneCompatibility';
import { getCategoryIcon } from '@/lib/browse-categories';
import type { Cultivar, GrowingProfile } from '@/lib/types';

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
          if (species.display_category) {
            crumbs.push({
              label: species.display_category,
              href: `/?category=${encodeURIComponent(species.display_category)}`,
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

      {/* HERO HEADER — dark green, matching cultivar page */}
      <section className="rounded-[var(--radius-xl)] bg-accent-hover p-4 sm:p-6 text-surface-raised">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="hidden sm:flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-raised/10">
            <span className="text-4xl opacity-40">
              {getCategoryIcon(species.display_category)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-surface-raised">
                {species.canonical_name}
              </h1>
              <Tag type="neutral">{species.entity_type}</Tag>
            </div>
            <p className="mt-1 text-surface-raised/70">
              <BotanicalName>{species.botanical_name}</BotanicalName>
            </p>

            {/* Taxonomy path */}
            {taxonomyPath.length > 0 ? (
              <Text variant="caption" color="tertiary" className="mt-1 text-surface-raised/50">
                {taxonomyPath
                  .filter((n) => n.rank === 'family' || n.rank === 'genus')
                  .map((n) => n.name)
                  .join(' › ')}
              </Text>
            ) : (
              <Text variant="caption" color="tertiary" className="mt-1 text-surface-raised/50">
                {species.genus} &middot; {species.family}
              </Text>
            )}

            {/* Stats line */}
            {(cultivars.length > 0 || offerStats.nurseryCount > 0) && (
              <Text variant="sm" className="mt-2 text-surface-raised/70">
                {cultivars.length > 0 && (
                  <span>
                    <span className="font-medium text-surface-raised">{cultivars.length}</span> cultivars
                  </span>
                )}
                {cultivars.length > 0 && offerStats.nurseryCount > 0 && (
                  <span className="mx-2 text-surface-raised/40">&middot;</span>
                )}
                {offerStats.nurseryCount > 0 && (
                  <span>
                    <span className="font-medium text-surface-raised">{offerStats.nurseryCount}</span>{' '}
                    {offerStats.nurseryCount === 1 ? 'nursery' : 'nurseries'} with stock
                  </span>
                )}
              </Text>
            )}

            {/* Quick facts in hero */}
            {growingProfile && (
              <div className="mt-4">
                <QuickFactsHero profile={growingProfile} />
              </div>
            )}
          </div>
        </div>

        {/* Description in hero */}
        {species.description && (
          <Text variant="body" className="mt-4 text-surface-raised/80">
            {species.description}
          </Text>
        )}
      </section>

      {/* VISUAL GROWING DATA — immediately visible */}
      {growingProfile && (
        <section className="space-y-6">
          {/* Side-by-side: ZoneBar + HeightSilhouette */}
          {(growingProfile.usda_zone_min != null || growingProfile.mature_height_min_ft != null) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {growingProfile.usda_zone_min != null && growingProfile.usda_zone_max != null && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    USDA Hardiness Zones
                  </Text>
                  <ZoneBar min={growingProfile.usda_zone_min} max={growingProfile.usda_zone_max} />
                </Surface>
              )}
              {(growingProfile.mature_height_min_ft != null || growingProfile.mature_height_max_ft != null) && (
                <Surface elevation="raised" padding="default">
                  <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                    Size at Maturity
                  </Text>
                  <HeightSilhouette
                    minFt={growingProfile.mature_height_min_ft ?? null}
                    maxFt={growingProfile.mature_height_max_ft ?? null}
                  />
                  {(growingProfile.mature_spread_min_ft != null || growingProfile.mature_spread_max_ft != null) && (
                    <Text variant="sm" color="secondary" className="mt-2">
                      Spread: {growingProfile.mature_spread_min_ft ?? '?'}&ndash;{growingProfile.mature_spread_max_ft ?? '?'} ft
                    </Text>
                  )}
                </Surface>
              )}
            </div>
          )}

          {/* Harvest Calendar */}
          {growingProfile.harvest_season && (
            <Surface elevation="raised" padding="default">
              <Text variant="caption" color="tertiary" className="mb-3 block uppercase tracking-wider font-semibold text-[11px]">
                Annual Calendar
              </Text>
              <HarvestCalendar harvestSeason={growingProfile.harvest_season} />
            </Surface>
          )}

          {/* Zone Compatibility */}
          <ZoneCompatibility
            zoneMin={growingProfile.usda_zone_min}
            zoneMax={growingProfile.usda_zone_max}
          />
        </section>
      )}

      {clones.length > 0 && (
        <div className="border-b border-border-subtle pb-[var(--spacing-zone)]">
          <CultivarSection
            title="Cultivars"
            items={clones}
            speciesSlug={speciesSlug}
            nurseryCountById={offerStats.perCultivar}
            priceById={offerStats.pricePerCultivar}
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
            priceById={offerStats.pricePerCultivar}
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
            priceById={offerStats.pricePerCultivar}
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
  priceById,
}: {
  title: string;
  items: Cultivar[];
  speciesSlug: string;
  nurseryCountById: Record<string, number>;
  priceById: Record<string, number>;
}) {
  return (
    <section>
      <Text variant="h2" className="mb-4">
        {title} ({items.length})
      </Text>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cv) => {
          const nurseryCount = nurseryCountById[cv.id] ?? 0;
          const priceCents = priceById[cv.id] ?? null;
          return (
            <Link key={cv.id} href={`/plants/${speciesSlug}/${cv.slug}`}>
              <div className="h-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3 cultivar-card-hover hover:bg-surface-raised hover:border-border cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <Text variant="h3" color="accent">{cv.canonical_name}</Text>
                  <div className="flex items-center gap-2 shrink-0">
                    {priceCents != null && (
                      <span className="text-sm font-medium text-accent">
                        From ${(priceCents / 100).toFixed(2)}
                      </span>
                    )}
                    {nurseryCount > 0 && (
                      <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
                        {nurseryCount} {nurseryCount === 1 ? 'nursery' : 'nurseries'}
                      </span>
                    )}
                  </div>
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
