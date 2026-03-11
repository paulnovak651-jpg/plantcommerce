import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { Text } from '@/components/ui/Text';
import { BrowseContent } from '@/components/BrowseContent';
import { BrowseGridSkeleton } from '@/components/PlantCardSkeleton';

export const metadata: Metadata = {
  title: 'Browse All Plants',
  description:
    'Browse and filter all plants in the Plant Commerce catalog. Compare availability across nurseries.',
};

export default async function BrowsePage() {
  const supabase = await createClient();
  const allPlants = await getAllBrowsePlants(supabase);

  return (
    <div>
      {/* Compact page header — SEO h1 without wasting vertical space */}
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
          <BrowseContent allPlants={allPlants} />
        </Suspense>
      </div>
    </div>
  );
}
