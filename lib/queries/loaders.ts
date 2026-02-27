import { createClient } from '@/lib/supabase/server';
import {
  getPlantEntityBySlug,
  getCultivarsForSpecies,
  getOfferStatsForSpecies,
} from '@/lib/queries/plants';
import { getTaxonomyPath } from '@/lib/queries/taxonomy';
import { getGrowingProfile } from '@/lib/queries/growing';
import { getApprovedListingsForSpecies } from '@/lib/queries/listings';
import type { CommunityListing, Cultivar, GrowingProfile, PlantEntity } from '@/lib/types';
import type { TaxonomyNode } from '@/lib/queries/taxonomy';

export interface SpeciesPageLoaderResult {
  species: PlantEntity;
  cultivars: Cultivar[];
  taxonomyPath: TaxonomyNode[];
  growingProfile: GrowingProfile | null;
  offerStats: { nurseryCount: number; perCultivar: Record<string, number> };
  communityListings: CommunityListing[];
}

export async function loadSpeciesPage(
  speciesSlug: string
): Promise<SpeciesPageLoaderResult | null> {
  const supabase = await createClient();
  const species = await getPlantEntityBySlug(supabase, speciesSlug);
  if (!species) return null;

  const cultivars = await getCultivarsForSpecies(supabase, species.id);
  const cultivarIds = cultivars.map((c) => c.id);

  const [taxonomyPath, growingProfile, offerStats, communityListings] = await Promise.all([
    getTaxonomyPath(supabase, species.id),
    getGrowingProfile(supabase, species.id),
    getOfferStatsForSpecies(supabase, cultivarIds),
    getApprovedListingsForSpecies(supabase, species.id),
  ]);

  return {
    species,
    cultivars,
    taxonomyPath,
    growingProfile,
    offerStats,
    communityListings,
  };
}
