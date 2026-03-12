import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { getTaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { Text } from '@/components/ui/Text';
import { BrowsePageClient } from '@/components/browse/BrowsePageClient';
import { BrowseGridSkeleton } from '@/components/PlantCardSkeleton';

export const metadata: Metadata = {
  title: 'Plant Commerce',
  description:
    'Search once, compare nursery stock across North America. Plant Commerce aggregates cultivars, pricing, and availability across nurseries.',
  openGraph: {
    title: 'Plant Commerce',
    description:
      'Search once, compare nursery stock across North America.',
    url: 'https://plantcommerce.app/',
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const [allPlants, taxonomyTree] = await Promise.all([
    getAllBrowsePlants(supabase),
    getTaxonomyTree(supabase),
  ]);

  return (
    <div>
      {/* Compact page header */}
      <div className="border-b border-border-subtle bg-surface-primary px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <Text variant="h2" as="h1">Browse All Plants</Text>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <BrowseGridSkeleton />
          </div>
        }>
          <BrowsePageClient allPlants={allPlants} taxonomyTree={taxonomyTree} />
        </Suspense>
      </div>
    </div>
  );
}
