import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import {
  getCultivarBySlug,
  getOffersForCultivar,
  getAliasesForCultivar,
  getLegalIdentifiers,
} from '@/lib/queries/cultivars';
import { apiSuccess, apiNotFound, apiError } from '@/lib/api-helpers';

/**
 * JSON API for plants.
 *
 * GET /api/plants/corylus-avellana          → species info + cultivar list
 * GET /api/plants/corylus-avellana/jefferson → cultivar details + offers + aliases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  if (slug.length === 1) {
    // Species-level request
    const speciesSlug = slug[0];
    const species = await getPlantEntityBySlug(supabase, speciesSlug);

    if (!species) {
      return apiNotFound('Species');
    }

    const cultivars = await getCultivarsForSpecies(supabase, species.id);

    return apiSuccess(
      {
        type: 'plant_entity' as const,
        data: species,
        cultivars,
      },
      { total: cultivars.length },
      {
        self: `/api/plants/${speciesSlug}`,
        web: `/plants/${speciesSlug}`,
      }
    );
  }

  if (slug.length === 2) {
    // Cultivar-level request
    const [speciesSlug, cultivarSlug] = slug;
    const cultivar = await getCultivarBySlug(supabase, cultivarSlug);

    if (!cultivar) {
      return apiNotFound('Cultivar');
    }

    const [offers, aliases, legal] = await Promise.all([
      getOffersForCultivar(supabase, cultivar.id),
      getAliasesForCultivar(supabase, cultivar.id),
      getLegalIdentifiers(supabase, cultivar.id),
    ]);

    return apiSuccess(
      {
        type: 'cultivar' as const,
        data: cultivar,
        offers,
        aliases,
        legal_identifiers: legal,
      },
      { total: offers.length },
      {
        self: `/api/plants/${speciesSlug}/${cultivarSlug}`,
        web: `/plants/${speciesSlug}/${cultivarSlug}`,
        species: `/api/plants/${speciesSlug}`,
      }
    );
  }

  return apiError('INVALID_PATH', 'Expected /api/plants/{species} or /api/plants/{species}/{cultivar}', 400);
}
