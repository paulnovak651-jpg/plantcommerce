import type { SupabaseClient } from '@supabase/supabase-js';

export interface PollinationSpeciesOption {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  genus: string;
}

export interface SpeciesPollinationProfile {
  pollination_type: string;
  pollination_mechanism: string | null;
  min_pollinizer_count: number | null;
  max_pollinizer_distance_ft: number | null;
  bloom_period_general: string | null;
  notes: string | null;
}

export interface PollinizerCandidate {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  nursery_count: number;
}

export interface PollinationCheckerData {
  species: PollinationSpeciesOption;
  profile: SpeciesPollinationProfile | null;
  pollinizers: PollinizerCandidate[];
}

interface PlantEntityRow {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  genus: string;
}

interface PollinationProfileRow {
  pollination_type: string;
  pollination_mechanism: string | null;
  min_pollinizer_count: number | null;
  max_pollinizer_distance_ft: number | null;
  bloom_period_general: string | null;
  notes: string | null;
}

interface CultivarRow {
  id: string;
  plant_entity_id: string;
}

interface ActiveOfferRow {
  cultivar_id: string;
  nursery_id: string;
}

export async function listPollinationSpecies(
  supabase: SupabaseClient
): Promise<PollinationSpeciesOption[]> {
  const { data, error } = await supabase
    .from('plant_entities')
    .select('id, slug, canonical_name, botanical_name, genus')
    .eq('curation_status', 'published')
    .order('canonical_name');

  if (error) {
    console.error('listPollinationSpecies error:', error);
    return [];
  }

  return (data ?? []) as PollinationSpeciesOption[];
}

export async function getPollinationCheckerData(
  supabase: SupabaseClient,
  speciesSlug: string
): Promise<PollinationCheckerData | null> {
  const { data: speciesRow, error: speciesError } = await supabase
    .from('plant_entities')
    .select('id, slug, canonical_name, botanical_name, genus')
    .eq('slug', speciesSlug)
    .eq('curation_status', 'published')
    .maybeSingle();

  if (speciesError) {
    console.error('getPollinationCheckerData species error:', speciesError);
    return null;
  }
  if (!speciesRow) return null;

  const species = speciesRow as PlantEntityRow;

  const [{ data: profileRow }, { data: sameGenusRows, error: sameGenusError }] =
    await Promise.all([
      supabase
        .from('species_pollination_profiles')
        .select(
          'pollination_type, pollination_mechanism, min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general, notes'
        )
        .eq('plant_entity_id', species.id)
        .maybeSingle(),
      supabase
        .from('plant_entities')
        .select('id, slug, canonical_name, botanical_name')
        .eq('genus', species.genus)
        .eq('curation_status', 'published')
        .neq('id', species.id)
        .order('canonical_name')
        .limit(20),
    ]);

  if (sameGenusError) {
    console.error('getPollinationCheckerData pollinizer species error:', sameGenusError);
    return {
      species,
      profile: (profileRow as PollinationProfileRow | null) ?? null,
      pollinizers: [],
    };
  }

  const pollinizerSpecies = (sameGenusRows ?? []) as Array<
    Pick<PlantEntityRow, 'id' | 'slug' | 'canonical_name' | 'botanical_name'>
  >;

  if (pollinizerSpecies.length === 0) {
    return {
      species,
      profile: (profileRow as PollinationProfileRow | null) ?? null,
      pollinizers: [],
    };
  }

  const pollinizerIds = pollinizerSpecies.map((row) => row.id);

  const { data: cultivarRows, error: cultivarError } = await supabase
    .from('cultivars')
    .select('id, plant_entity_id')
    .eq('curation_status', 'published')
    .in('plant_entity_id', pollinizerIds);

  if (cultivarError) {
    console.error('getPollinationCheckerData cultivars error:', cultivarError);
    return {
      species,
      profile: (profileRow as PollinationProfileRow | null) ?? null,
      pollinizers: pollinizerSpecies.map((row) => ({ ...row, nursery_count: 0 })),
    };
  }

  const cultivarToSpecies = new Map<string, string>();
  for (const cultivar of (cultivarRows ?? []) as CultivarRow[]) {
    cultivarToSpecies.set(cultivar.id, cultivar.plant_entity_id);
  }

  const cultivarIds = Array.from(cultivarToSpecies.keys());
  if (cultivarIds.length === 0) {
    return {
      species,
      profile: (profileRow as PollinationProfileRow | null) ?? null,
      pollinizers: pollinizerSpecies.map((row) => ({ ...row, nursery_count: 0 })),
    };
  }

  const { data: offerRows, error: offerError } = await supabase
    .from('inventory_offers')
    .select('cultivar_id, nursery_id')
    .eq('offer_status', 'active')
    .in('cultivar_id', cultivarIds);

  if (offerError) {
    console.error('getPollinationCheckerData offers error:', offerError);
    return {
      species,
      profile: (profileRow as PollinationProfileRow | null) ?? null,
      pollinizers: pollinizerSpecies.map((row) => ({ ...row, nursery_count: 0 })),
    };
  }

  const speciesNurseries = new Map<string, Set<string>>();
  for (const offer of (offerRows ?? []) as ActiveOfferRow[]) {
    const speciesId = cultivarToSpecies.get(offer.cultivar_id);
    if (!speciesId) continue;
    if (!speciesNurseries.has(speciesId)) speciesNurseries.set(speciesId, new Set());
    speciesNurseries.get(speciesId)?.add(offer.nursery_id);
  }

  const pollinizers = pollinizerSpecies
    .map((row) => ({
      ...row,
      nursery_count: speciesNurseries.get(row.id)?.size ?? 0,
    }))
    .sort((a, b) => {
      if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
      return a.canonical_name.localeCompare(b.canonical_name);
    });

  return {
    species,
    profile: (profileRow as PollinationProfileRow | null) ?? null,
    pollinizers,
  };
}
