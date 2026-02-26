import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listPlantEntitiesForBrowse } from '@/lib/queries/plants';
import { Cladogram } from '@/components/Cladogram';
import { Text } from '@/components/ui/Text';

export const metadata: Metadata = {
  title: 'Browse',
  description:
    'Browse all plants in the Plant Commerce catalog, organized by taxonomy. Filter by nut trees, fruit trees, and more.',
};

export default async function BrowsePage() {
  const supabase = await createClient();
  const species = await listPlantEntitiesForBrowse(supabase);

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <section>
        <Text variant="h1">Browse</Text>
        <Text variant="body" color="secondary" className="mt-1">
          Species organized by taxonomy. Filter by category, click to explore.
        </Text>
      </section>

      <Cladogram species={species} />
    </div>
  );
}
