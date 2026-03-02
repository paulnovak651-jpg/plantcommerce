import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  getPollinationCheckerData,
  listPollinationSpecies,
} from '@/lib/queries/pollination';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { Tag } from '@/components/ui/Tag';

interface Props {
  searchParams: Promise<{ species?: string }>;
}

function pollinationTypeLabel(value: string | null): string {
  switch (value) {
    case 'self_fertile':
      return 'Self-fertile';
    case 'partially_self':
      return 'Partially self-fertile';
    case 'wind_cross':
      return 'Cross-pollination required (wind)';
    case 'cross_required':
      return 'Cross-pollination required';
    default:
      return 'Unknown';
  }
}

function mechanismLabel(value: string | null): string | null {
  switch (value) {
    case 'wind':
      return 'Wind';
    case 'insect':
      return 'Insect';
    case 'wind_and_insect':
      return 'Wind + insect';
    default:
      return null;
  }
}

function selfFertileLabel(value: string | null): string {
  if (value === 'self_fertile') return 'Yes';
  if (value === 'cross_required' || value === 'wind_cross') return 'No';
  if (value === 'partially_self') return 'Partially';
  return 'Unknown';
}

export const metadata: Metadata = {
  title: 'Pollination Checker',
  description:
    'Check species-level pollination guidance and potential same-genus pollinizer options.',
};

export default async function PollinationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const speciesOptions = await listPollinationSpecies(supabase);

  if (speciesOptions.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-[var(--spacing-zone)]">
          <section>
            <Text variant="h1">Pollination Checker</Text>
            <Text variant="body" color="secondary" className="mt-2">
              Find pollination guidance and potential compatible species.
            </Text>
          </section>
          <EmptyState
            title="No species available"
            description="No published species are available for pollination checks yet."
          />
        </div>
      </div>
    );
  }

  const requestedSlug = sp.species?.trim();
  const selectedSlug = speciesOptions.some((row) => row.slug === requestedSlug)
    ? requestedSlug
    : speciesOptions[0]?.slug;

  const checker = selectedSlug
    ? await getPollinationCheckerData(supabase, selectedSlug)
    : null;

  const profile = checker?.profile ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
      <section>
        <Text variant="h1">Pollination Checker</Text>
        <Text variant="body" color="secondary" className="mt-2">
          Species-level guidance for cross-pollination and same-genus pollinizer options.
        </Text>
      </section>

      <Surface elevation="raised" padding="default">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <Text variant="sm" color="secondary" as="span">
              I have
            </Text>
            <select
              name="species"
              defaultValue={selectedSlug}
              className="mt-1 block w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              {speciesOptions.map((species) => (
                <option key={species.id} value={species.slug}>
                  {species.canonical_name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover"
          >
            Check
          </button>
        </form>
      </Surface>

      {checker ? (
        <>
          <Surface elevation="raised" padding="default">
            <div className="flex flex-wrap items-center gap-2">
              <Text variant="h2">{checker.species.canonical_name}</Text>
              <Tag type="pollination">{checker.species.genus}</Tag>
            </div>
            {checker.species.botanical_name && (
              <Text variant="sm" color="secondary" className="mt-1">
                <BotanicalName>{checker.species.botanical_name}</BotanicalName>
              </Text>
            )}

            {profile ? (
              <div className="mt-4 space-y-2">
                <Text variant="sm" color="secondary">
                  Pollination type: {pollinationTypeLabel(profile.pollination_type)}
                </Text>
                <Text variant="sm" color="secondary">
                  Self-fertile: {selfFertileLabel(profile.pollination_type)}
                </Text>
                {profile.min_pollinizer_count != null && (
                  <Text variant="sm" color="secondary">
                    Recommended pollinizers: at least {profile.min_pollinizer_count}
                  </Text>
                )}
                {profile.max_pollinizer_distance_ft != null && (
                  <Text variant="sm" color="secondary">
                    Max distance: {profile.max_pollinizer_distance_ft} ft
                  </Text>
                )}
                {mechanismLabel(profile.pollination_mechanism) && (
                  <Text variant="sm" color="secondary">
                    Mechanism: {mechanismLabel(profile.pollination_mechanism)}
                  </Text>
                )}
                {profile.bloom_period_general && (
                  <Text variant="sm" color="secondary">
                    Bloom window: {profile.bloom_period_general}
                  </Text>
                )}
                {profile.notes && (
                  <Text variant="sm" color="tertiary" className="pt-1">
                    {profile.notes}
                  </Text>
                )}
              </div>
            ) : (
              <Text variant="sm" color="secondary" className="mt-4">
                Pollination profile not available for this species yet. Plant at least two
                different cultivars within 50 feet for better fruit set.
              </Text>
            )}
          </Surface>

          <section>
            <Text variant="h2" className="mb-3">
              Compatible pollinizers
            </Text>
            {checker.pollinizers.length > 0 ? (
              <div className="space-y-2">
                {checker.pollinizers.map((pollinizer) => (
                  <Surface key={pollinizer.id} elevation="raised" padding="compact">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/plants/${pollinizer.slug}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          {pollinizer.canonical_name}
                        </Link>
                        {pollinizer.botanical_name && (
                          <Text variant="caption" color="tertiary" className="ml-2">
                            <BotanicalName>{pollinizer.botanical_name}</BotanicalName>
                          </Text>
                        )}
                      </div>
                      <Tag type="availability">
                        {pollinizer.nursery_count}{' '}
                        {pollinizer.nursery_count === 1 ? 'nursery' : 'nurseries'}
                      </Tag>
                    </div>
                  </Surface>
                ))}
              </div>
            ) : (
              <Text variant="sm" color="secondary">
                No same-genus pollinizer species found yet.
              </Text>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          title="Species not found"
          description="The selected species could not be loaded."
        />
      )}

      <Text variant="caption" color="tertiary">
        Based on species-level pollination profiles. Cultivar-level compatibility is not yet
        available.
      </Text>
      </div>
    </div>
  );
}
