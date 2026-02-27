import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityListing } from '@/lib/types';

export interface AdminListing extends CommunityListing {
  contact_email: string | null;
  mod_reason: string | null;
}

const PUBLIC_SELECT = `
  id, listing_type, raw_cultivar_text, raw_species_text, material_type,
  quantity, price_cents, location_state, notes, status, trust_tier,
  resolve_confidence, cultivar_id, plant_entity_id, created_at, expires_at,
  cultivars(canonical_name, slug, plant_entities(slug)),
  plant_entities(canonical_name, slug)
`;

const ADMIN_SELECT = `
  id, listing_type, raw_cultivar_text, raw_species_text, material_type,
  quantity, price_cents, location_state, notes, status, trust_tier,
  resolve_confidence, cultivar_id, plant_entity_id, created_at, expires_at,
  contact_email, mod_reason,
  cultivars(canonical_name, slug, plant_entities(slug)),
  plant_entities(canonical_name, slug)
`;

export async function getApprovedListingsForCultivar(
  supabase: SupabaseClient,
  cultivarId: string
): Promise<CommunityListing[]> {
  const { data } = await supabase
    .from('community_listings')
    .select(PUBLIC_SELECT)
    .eq('cultivar_id', cultivarId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []) as unknown as CommunityListing[];
}

export async function getApprovedListingsForSpecies(
  supabase: SupabaseClient,
  plantEntityId: string
): Promise<CommunityListing[]> {
  const { data } = await supabase
    .from('community_listings')
    .select(PUBLIC_SELECT)
    .eq('plant_entity_id', plantEntityId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []) as unknown as CommunityListing[];
}

export async function getListingsForAdmin(
  supabase: SupabaseClient,
  status: string
): Promise<AdminListing[]> {
  let query = supabase
    .from('community_listings')
    .select(ADMIN_SELECT)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return (data ?? []) as unknown as AdminListing[];
}

export async function getMarketplaceListings(
  supabase: SupabaseClient,
  listingType: 'all' | 'wts' | 'wtb' = 'all'
): Promise<CommunityListing[]> {
  let query = supabase
    .from('community_listings')
    .select(PUBLIC_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  if (listingType !== 'all') {
    query = query.eq('listing_type', listingType);
  }

  const { data } = await query;
  return (data ?? []) as unknown as CommunityListing[];
}
