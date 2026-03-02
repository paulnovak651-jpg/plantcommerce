import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAllBrowsePlants } from '@/lib/queries/browse';
import { BrowseContent } from '@/components/BrowseContent';

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
      {/* Hero */}
      <section className="bg-accent px-4 py-16 text-center">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-semibold text-text-inverse md:text-5xl">
            Browse All Plants
          </h1>
          <p className="mt-3 text-lg text-text-inverse/80">
            Filter, sort, and compare availability across nurseries.
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={null}>
          <BrowseContent allPlants={allPlants} />
        </Suspense>
      </div>
    </div>
  );
}
