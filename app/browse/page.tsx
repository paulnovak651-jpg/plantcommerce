import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getExplorerSpecies } from '@/lib/queries/explorer';
import { getGrowingProfile } from '@/lib/queries/growing';
import { ExplorerLayout } from '@/components/ExplorerLayout';
import { Text } from '@/components/ui/Text';

export const metadata: Metadata = {
  title: 'Explore',
  description:
    'Browse all plants in the Plant Commerce catalog organized by taxonomy. Filter by zone, category, and availability.',
};

interface Props {
  searchParams: Promise<{
    category?: string;
    zoneMin?: string;
    zoneMax?: string;
    available?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: Props) {
  const sp = await searchParams;

  const category = sp.category ?? 'all';
  const zoneMin = sp.zoneMin ? Number(sp.zoneMin) : null;
  const zoneMax = sp.zoneMax ? Number(sp.zoneMax) : null;
  const availableOnly = sp.available === 'true';

  const supabase = await createClient();

  const species = await getExplorerSpecies(supabase, {
    zoneMin,
    zoneMax,
    availableOnly,
  });

  // Pre-fetch growing profiles for all species so the detail panel can show TraitGrid
  const profiles = Object.fromEntries(
    await Promise.all(
      species.map(async (s) => {
        const profile = await getGrowingProfile(supabase, s.id);
        return [s.id, profile] as [string, Record<string, unknown> | null];
      })
    )
  ) as Record<string, Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <section>
        <Text variant="h1">Explore</Text>
        <Text variant="body" color="secondary" className="mt-1">
          Filter by zone and category. Click a species to see growing details.
        </Text>
      </section>

      <ExplorerLayout species={species} profiles={profiles} category={category} />
    </div>
  );
}
