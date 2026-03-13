'use client';

import type { BrowsePlant } from '@/lib/queries/browse';
import { BrowseContent } from '@/components/BrowseContent';

interface BrowsePageClientProps {
  allPlants: BrowsePlant[];
}

export function BrowsePageClient({
  allPlants,
}: BrowsePageClientProps) {
  return <BrowseContent allPlants={allPlants} />;
}
