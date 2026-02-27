import type { SupabaseClient } from '@supabase/supabase-js';

export async function getCultivarBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('cultivars')
    .select(`
      *,
      plant_entities (
        id, slug, canonical_name, botanical_name, genus, family
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getCultivarBySpeciesAndSlug(
  supabase: SupabaseClient,
  speciesSlug: string,
  cultivarSlug: string
) {
  const cultivar = await getCultivarBySlug(supabase, cultivarSlug);
  if (!cultivar) return null;

  const plantEntity = cultivar.plant_entities as { slug: string } | null;
  if (plantEntity?.slug !== speciesSlug) return null;
  return cultivar;
}

export async function getOffersForCultivar(supabase: SupabaseClient, cultivarId: string) {
  const { data, error } = await supabase
    .from('inventory_offers')
    .select(`
      *,
      nurseries (
        id, slug, name, website_url, location_state, location_country, latitude, longitude, last_scraped_at
      )
    `)
    .eq('cultivar_id', cultivarId)
    .eq('offer_status', 'active')
    .order('raw_price_text');

  if (error) return [];
  return data;
}

export async function getAliasesForCultivar(supabase: SupabaseClient, cultivarId: string) {
  const { data, error } = await supabase
    .from('aliases')
    .select('*')
    .eq('target_type', 'cultivar')
    .eq('target_id', cultivarId)
    .order('alias_text');

  if (error) return [];
  return data;
}

export async function getLegalIdentifiers(supabase: SupabaseClient, cultivarId: string) {
  const { data, error } = await supabase
    .from('legal_identifiers')
    .select('*')
    .eq('cultivar_id', cultivarId);

  if (error) return [];
  return data;
}
