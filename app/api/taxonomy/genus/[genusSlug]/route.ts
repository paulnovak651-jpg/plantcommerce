import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiNotFound } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeciesPreview {
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  zone_min: number | null;
  zone_max: number | null;
  nursery_count: number;
  cultivar_count: number;
  top_cultivars: Array<{
    slug: string;
    name: string;
    lowest_price_cents: number | null;
  }>;
}

interface GenusPreview {
  genus_slug: string;
  genus_name: string;
  common_name: string;
  species: SpeciesPreview[];
}

// ---------------------------------------------------------------------------
// Internal row types
// ---------------------------------------------------------------------------

interface PlantRow {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
}

interface CultivarRow {
  id: string;
  slug: string;
  canonical_name: string;
  plant_entity_id: string | null;
}

interface OfferRow {
  cultivar_id: string | null;
  nursery_id: string;
  price_cents: number | null;
}

interface ProfileRow {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const GET = withRateLimit(
  async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ genusSlug: string }> }
  ) {
    const { genusSlug } = await params;

    const supabase = await createClient();

    // 1. Find the genus taxonomy node
    let { data: genusNode } = await supabase
      .from('taxonomy_nodes')
      .select('id, slug, name, taxonomy_ranks!inner(rank_name)')
      .eq('taxonomy_ranks.rank_name', 'genus')
      .eq('slug', genusSlug)
      .single();

    // Retry with genus- prefix
    if (!genusNode && !genusSlug.startsWith('genus-')) {
      const retry = await supabase
        .from('taxonomy_nodes')
        .select('id, slug, name, taxonomy_ranks!inner(rank_name)')
        .eq('taxonomy_ranks.rank_name', 'genus')
        .eq('slug', `genus-${genusSlug}`)
        .single();
      genusNode = retry.data;
    }

    if (!genusNode) {
      return apiNotFound('Genus');
    }

    const node = genusNode as { id: string; slug: string; name: string };

    // 2. Fetch species, cultivars, offers, and profiles in parallel
    const [
      { data: plantRows },
      { data: cultivarRows },
      { data: offerRows },
      { data: profileRows },
    ] = await Promise.all([
      supabase
        .from('plant_entities')
        .select('id, slug, canonical_name, botanical_name')
        .eq('taxonomy_node_id', node.id)
        .eq('curation_status', 'published')
        .order('canonical_name'),
      supabase
        .from('cultivars')
        .select('id, slug, canonical_name, plant_entity_id')
        .eq('curation_status', 'published'),
      supabase
        .from('inventory_offers')
        .select('cultivar_id, nursery_id, price_cents')
        .eq('offer_status', 'active'),
      supabase
        .from('species_growing_profiles')
        .select('plant_entity_id, usda_zone_min, usda_zone_max'),
    ]);

    const plants = (plantRows ?? []) as PlantRow[];
    if (plants.length === 0) {
      return apiNotFound('Genus');
    }

    const cultivars = (cultivarRows ?? []) as CultivarRow[];
    const offers = (offerRows ?? []) as OfferRow[];
    const profiles = (profileRows ?? []) as ProfileRow[];

    const plantIds = new Set(plants.map((p) => p.id));

    // 3. Build lookup maps
    const cultivarToPlant = new Map<string, string>();
    const plantCultivars = new Map<string, CultivarRow[]>();
    for (const cv of cultivars) {
      if (!cv.plant_entity_id || !plantIds.has(cv.plant_entity_id)) continue;
      cultivarToPlant.set(cv.id, cv.plant_entity_id);
      if (!plantCultivars.has(cv.plant_entity_id)) {
        plantCultivars.set(cv.plant_entity_id, []);
      }
      plantCultivars.get(cv.plant_entity_id)!.push(cv);
    }

    // Per-cultivar: lowest price and nursery count
    const cultivarLowestPrice = new Map<string, number>();
    const cultivarNurseries = new Map<string, Set<string>>();
    const plantNurseries = new Map<string, Set<string>>();

    for (const offer of offers) {
      if (!offer.cultivar_id) continue;
      const plantId = cultivarToPlant.get(offer.cultivar_id);
      if (!plantId) continue;

      // Track nurseries per plant
      if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
      plantNurseries.get(plantId)!.add(offer.nursery_id);

      // Track nurseries per cultivar
      if (!cultivarNurseries.has(offer.cultivar_id)) {
        cultivarNurseries.set(offer.cultivar_id, new Set());
      }
      cultivarNurseries.get(offer.cultivar_id)!.add(offer.nursery_id);

      // Track lowest price per cultivar
      if (offer.price_cents != null) {
        const current = cultivarLowestPrice.get(offer.cultivar_id);
        if (current === undefined || offer.price_cents < current) {
          cultivarLowestPrice.set(offer.cultivar_id, offer.price_cents);
        }
      }
    }

    // Profile map
    const profileMap = new Map<string, ProfileRow>();
    for (const p of profiles) {
      if (plantIds.has(p.plant_entity_id)) {
        profileMap.set(p.plant_entity_id, p);
      }
    }

    // 4. Assemble species previews
    const species: SpeciesPreview[] = plants.map((plant) => {
      const profile = profileMap.get(plant.id);
      const cvs = plantCultivars.get(plant.id) ?? [];

      // Sort cultivars: those with stock first (by nursery count desc), then name
      const sortedCvs = [...cvs].sort((a, b) => {
        const aNurseries = cultivarNurseries.get(a.id)?.size ?? 0;
        const bNurseries = cultivarNurseries.get(b.id)?.size ?? 0;
        if (bNurseries !== aNurseries) return bNurseries - aNurseries;
        return a.canonical_name.localeCompare(b.canonical_name);
      });

      const topCultivars = sortedCvs.slice(0, 5).map((cv) => ({
        slug: cv.slug,
        name: cv.canonical_name,
        lowest_price_cents: cultivarLowestPrice.get(cv.id) ?? null,
      }));

      return {
        slug: plant.slug,
        canonical_name: plant.canonical_name,
        botanical_name: plant.botanical_name,
        zone_min: profile?.usda_zone_min ?? null,
        zone_max: profile?.usda_zone_max ?? null,
        nursery_count: plantNurseries.get(plant.id)?.size ?? 0,
        cultivar_count: cvs.length,
        top_cultivars: topCultivars,
      };
    });

    const bareSlug = node.slug.replace(/^genus-/, '');
    const data: GenusPreview = {
      genus_slug: node.slug,
      genus_name: node.name,
      common_name: GENUS_COMMON_NAMES[bareSlug] ?? node.name,
      species,
    };

    const response = apiSuccess(data);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  },
  { max: 60 }
);
