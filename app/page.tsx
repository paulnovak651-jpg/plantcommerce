import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowsePageClient } from '@/components/browse/BrowsePageClient';
import { HomepageHero } from '@/components/HomepageHero';

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
  const taxonomyTree = await getTaxonomyTree(supabase);

  return (
    <div>
      <HomepageHero />

      {/* Main content */}
      <div id="browse" className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
          Browse All Plants
        </h2>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-inset" />}>
          <BrowsePageClient taxonomyTree={taxonomyTree} />
        </Suspense>
      </div>
    </div>
  );
}
