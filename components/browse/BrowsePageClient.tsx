'use client';

import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { BrowseContent } from '@/components/BrowseContent';

interface BrowsePageClientProps {
  taxonomyTree: TaxonomyTree;
}

export function BrowsePageClient({ taxonomyTree }: BrowsePageClientProps) {
  return <BrowseContent taxonomyTree={taxonomyTree} />;
}
