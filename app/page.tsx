import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { BrowsePageClient } from '@/components/browse/BrowsePageClient';
import { HomepageHero } from '@/components/HomepageHero';
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
  const allPlants = await getAllBrowsePlants(supabase);

  return (
    <div>
      <HomepageHero />

      {/* Main content */}
      <div id="browse" className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <BrowseGridSkeleton />
          </div>
        }>
          <BrowsePageClient allPlants={allPlants} />
        </Suspense>
      </div>
    </div>
  );
}
