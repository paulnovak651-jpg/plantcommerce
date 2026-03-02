import { SupabaseClient } from '@supabase/supabase-js';

export interface BrowseFilters {
  categories?: string[];
  zoneMin?: number | null;
  zoneMax?: number | null;
  availableOnly?: boolean;
  sun?: string[];
  growthRate?: string[];
  sort?: string;
  page?: number;
  perPage?: number;
}

export interface BrowsePlant {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  display_category: string | null;
  nursery_count: number;
  cultivar_count: number;
  zone_min: number | null;
  zone_max: number | null;
  sun_requirement: string | null;
  growth_rate: string | null;
}

interface PlantRow {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  display_category: string | null;
}

interface CultivarRow {
  id: string;
  plant_entity_id: string | null;
}

interface OfferRow {
  cultivar_id: string | null;
  nursery_id: string;
}

interface ProfileRow {
  plant_entity_id: string;
  usda_zone_min: number | null;
  usda_zone_max: number | null;
  sun_requirement: string | null;
  growth_rate: string | null;
}

/** Fetch and assemble all browse plants (no filtering/sorting/pagination). */
export async function getAllBrowsePlants(
  supabase: SupabaseClient
): Promise<BrowsePlant[]> {
  const [
    { data: plantRows, error: plantError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, botanical_name, display_category')
      .eq('curation_status', 'published')
      .order('canonical_name'),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('species_growing_profiles')
      .select('plant_entity_id, usda_zone_min, usda_zone_max, sun_requirement, growth_rate'),
  ]);

  if (plantError || cultivarError || offerError || profileError) {
    console.error('getAllBrowsePlants error:', plantError ?? cultivarError ?? offerError ?? profileError);
    return [];
  }

  const plants = (plantRows ?? []) as PlantRow[];
  const cultivars = (cultivarRows ?? []) as CultivarRow[];
  const offers = (offerRows ?? []) as OfferRow[];
  const profiles = (profileRows ?? []) as ProfileRow[];

  const cultivarToPlant = new Map<string, string>();
  const plantCultivarCount = new Map<string, number>();
  const plantNurseries = new Map<string, Set<string>>();
  const profileMap = new Map<string, { zone_min: number | null; zone_max: number | null; sun_requirement: string | null; growth_rate: string | null }>();

  for (const cultivar of cultivars) {
    if (!cultivar.plant_entity_id) continue;
    cultivarToPlant.set(cultivar.id, cultivar.plant_entity_id);
    plantCultivarCount.set(cultivar.plant_entity_id, (plantCultivarCount.get(cultivar.plant_entity_id) ?? 0) + 1);
  }

  for (const offer of offers) {
    if (!offer.cultivar_id) continue;
    const plantId = cultivarToPlant.get(offer.cultivar_id);
    if (!plantId) continue;
    if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
    plantNurseries.get(plantId)?.add(offer.nursery_id);
  }

  for (const profile of profiles) {
    profileMap.set(profile.plant_entity_id, {
      zone_min: profile.usda_zone_min,
      zone_max: profile.usda_zone_max,
      sun_requirement: profile.sun_requirement,
      growth_rate: profile.growth_rate,
    });
  }

  return plants.map((plant) => {
    const profile = profileMap.get(plant.id);
    return {
      id: plant.id,
      slug: plant.slug,
      canonical_name: plant.canonical_name,
      botanical_name: plant.botanical_name,
      display_category: plant.display_category,
      nursery_count: plantNurseries.get(plant.id)?.size ?? 0,
      cultivar_count: plantCultivarCount.get(plant.id) ?? 0,
      zone_min: profile?.zone_min ?? null,
      zone_max: profile?.zone_max ?? null,
      sun_requirement: profile?.sun_requirement ?? null,
      growth_rate: profile?.growth_rate ?? null,
    };
  });
}

/** Filter, sort, and paginate browse plants (client-side). */
export function filterBrowsePlants(
  allPlants: BrowsePlant[],
  filters: BrowseFilters
): { plants: BrowsePlant[]; total: number } {
  let filtered = [...allPlants];

  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(
      (plant) => plant.display_category != null && filters.categories!.includes(plant.display_category)
    );
  }
  if (filters.zoneMin != null) {
    filtered = filtered.filter((plant) => plant.zone_max == null || plant.zone_max >= filters.zoneMin!);
  }
  if (filters.zoneMax != null) {
    filtered = filtered.filter((plant) => plant.zone_min == null || plant.zone_min <= filters.zoneMax!);
  }
  if (filters.availableOnly) {
    filtered = filtered.filter((plant) => plant.nursery_count > 0);
  }
  if (filters.sun && filters.sun.length > 0) {
    filtered = filtered.filter((plant) => plant.sun_requirement != null && filters.sun!.includes(plant.sun_requirement));
  }
  if (filters.growthRate && filters.growthRate.length > 0) {
    filtered = filtered.filter((plant) => plant.growth_rate != null && filters.growthRate!.includes(plant.growth_rate));
  }

  const sort = filters.sort ?? 'name-asc';
  filtered.sort((a, b) => {
    if (sort === 'name-desc') return b.canonical_name.localeCompare(a.canonical_name);
    if (sort === 'available') {
      if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
      return a.canonical_name.localeCompare(b.canonical_name);
    }
    return a.canonical_name.localeCompare(b.canonical_name);
  });

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const perPage = filters.perPage && filters.perPage > 0 ? filters.perPage : 24;
  const start = (page - 1) * perPage;

  return { plants: filtered.slice(start, start + perPage), total: filtered.length };
}

export async function getBrowsePlants(
  supabase: SupabaseClient,
  filters: BrowseFilters = {}
): Promise<{ plants: BrowsePlant[]; total: number }> {
  const [
    { data: plantRows, error: plantError },
    { data: cultivarRows, error: cultivarError },
    { data: offerRows, error: offerError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('id, slug, canonical_name, botanical_name, display_category')
      .eq('curation_status', 'published')
      .order('canonical_name'),
    supabase
      .from('cultivars')
      .select('id, plant_entity_id')
      .eq('curation_status', 'published'),
    supabase
      .from('inventory_offers')
      .select('cultivar_id, nursery_id')
      .eq('offer_status', 'active'),
    supabase
      .from('species_growing_profiles')
      .select('plant_entity_id, usda_zone_min, usda_zone_max, sun_requirement, growth_rate'),
  ]);

  if (plantError || cultivarError || offerError || profileError) {
    console.error(
      'getBrowsePlants error:',
      plantError ?? cultivarError ?? offerError ?? profileError
    );
    return { plants: [], total: 0 };
  }

  try {
    const plants = (plantRows ?? []) as PlantRow[];
    const cultivars = (cultivarRows ?? []) as CultivarRow[];
    const offers = (offerRows ?? []) as OfferRow[];
    const profiles = (profileRows ?? []) as ProfileRow[];

    const cultivarToPlant = new Map<string, string>();
    const plantCultivarCount = new Map<string, number>();
    const plantNurseries = new Map<string, Set<string>>();
    const profileMap = new Map<
      string,
      {
        zone_min: number | null;
        zone_max: number | null;
        sun_requirement: string | null;
        growth_rate: string | null;
      }
    >();

    for (const cultivar of cultivars) {
      if (!cultivar.plant_entity_id) continue;
      cultivarToPlant.set(cultivar.id, cultivar.plant_entity_id);
      plantCultivarCount.set(
        cultivar.plant_entity_id,
        (plantCultivarCount.get(cultivar.plant_entity_id) ?? 0) + 1
      );
    }

    for (const offer of offers) {
      if (!offer.cultivar_id) continue;
      const plantId = cultivarToPlant.get(offer.cultivar_id);
      if (!plantId) continue;
      if (!plantNurseries.has(plantId)) plantNurseries.set(plantId, new Set());
      plantNurseries.get(plantId)?.add(offer.nursery_id);
    }

    for (const profile of profiles) {
      profileMap.set(profile.plant_entity_id, {
        zone_min: profile.usda_zone_min,
        zone_max: profile.usda_zone_max,
        sun_requirement: profile.sun_requirement,
        growth_rate: profile.growth_rate,
      });
    }

    let filtered: BrowsePlant[] = plants.map((plant) => {
      const profile = profileMap.get(plant.id);
      return {
        id: plant.id,
        slug: plant.slug,
        canonical_name: plant.canonical_name,
        botanical_name: plant.botanical_name,
        display_category: plant.display_category,
        nursery_count: plantNurseries.get(plant.id)?.size ?? 0,
        cultivar_count: plantCultivarCount.get(plant.id) ?? 0,
        zone_min: profile?.zone_min ?? null,
        zone_max: profile?.zone_max ?? null,
        sun_requirement: profile?.sun_requirement ?? null,
        growth_rate: profile?.growth_rate ?? null,
      };
    });

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(
        (plant) =>
          plant.display_category != null &&
          filters.categories?.includes(plant.display_category)
      );
    }

    if (filters.zoneMin != null) {
      filtered = filtered.filter(
        (plant) => plant.zone_max == null || plant.zone_max >= filters.zoneMin!
      );
    }

    if (filters.zoneMax != null) {
      filtered = filtered.filter(
        (plant) => plant.zone_min == null || plant.zone_min <= filters.zoneMax!
      );
    }

    if (filters.availableOnly) {
      filtered = filtered.filter((plant) => plant.nursery_count > 0);
    }

    if (filters.sun && filters.sun.length > 0) {
      filtered = filtered.filter(
        (plant) =>
          plant.sun_requirement != null &&
          filters.sun?.includes(plant.sun_requirement)
      );
    }

    if (filters.growthRate && filters.growthRate.length > 0) {
      filtered = filtered.filter(
        (plant) =>
          plant.growth_rate != null &&
          filters.growthRate?.includes(plant.growth_rate)
      );
    }

    const sort = filters.sort ?? 'name-asc';
    filtered.sort((a, b) => {
      if (sort === 'name-desc') {
        return b.canonical_name.localeCompare(a.canonical_name);
      }
      if (sort === 'available') {
        if (b.nursery_count !== a.nursery_count) return b.nursery_count - a.nursery_count;
        return a.canonical_name.localeCompare(b.canonical_name);
      }
      return a.canonical_name.localeCompare(b.canonical_name);
    });

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const perPage = filters.perPage && filters.perPage > 0 ? filters.perPage : 24;
    const start = (page - 1) * perPage;

    return { plants: filtered.slice(start, start + perPage), total: filtered.length };
  } catch (error) {
    console.error('getBrowsePlants error:', error);
    return { plants: [], total: 0 };
  }
}
