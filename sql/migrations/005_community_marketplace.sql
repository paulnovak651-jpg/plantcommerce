-- ============================================================================
-- MIGRATION 005: Community Marketplace
-- Two-sided marketplace: users can list material for sale/trade.
-- Listings go through the same resolver pipeline as scraped nursery data.
-- ============================================================================

BEGIN;

-- ── Profile for authenticated users ──
-- Extends Supabase auth.users with marketplace-specific fields.

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  email           TEXT,                    -- denormalized from auth for convenience
  zip_code        TEXT,
  usda_zone       TEXT,                    -- auto-derived from zip or user-entered
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  location_state  TEXT,
  location_country TEXT DEFAULT 'US',
  bio             TEXT,
  website_url     TEXT,
  
  -- Reputation
  reputation_score  INTEGER DEFAULT 0,
  listing_count     INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  is_verified       BOOLEAN DEFAULT FALSE,
  is_nursery        BOOLEAN DEFAULT FALSE,  -- if true, could link to nurseries table
  nursery_id        UUID REFERENCES nurseries(id),  -- optional link for nursery operators
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_zone ON profiles(usda_zone);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Listing price types ──

DO $$ BEGIN
  CREATE TYPE price_type AS ENUM ('fixed', 'negotiable', 'trade_only', 'free', 'contact');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'pending_review', 'sold', 'expired', 'flagged', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Community Listings
-- The core marketplace table. Same resolver integration as inventory_offers.
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_listings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Resolution (same pattern as inventory_offers)
  cultivar_id         UUID REFERENCES cultivars(id),
  plant_entity_id     UUID REFERENCES plant_entities(id),
  resolution_status   resolution_status NOT NULL DEFAULT 'unresolved',
  resolution_confidence NUMERIC(3,2) DEFAULT 0.0,
  resolution_method   TEXT,
  
  -- User-provided text (input to resolver)
  raw_listing_text    TEXT NOT NULL,         -- what the user typed
  parsed_cultivar_name TEXT,                 -- resolver output
  
  -- What's being offered
  sale_form           sale_form NOT NULL DEFAULT 'unknown',
  propagation_method  propagation_method DEFAULT 'unknown',
  genetic_specificity genetic_specificity DEFAULT 'unknown',
  quantity_available  INTEGER,
  quantity_unit       TEXT,                  -- 'plants', 'sticks', 'cuttings', 'lbs', etc.
  
  -- Pricing
  price_cents         INTEGER,               -- null for trade/free
  price_type          price_type NOT NULL DEFAULT 'fixed',
  currency            TEXT DEFAULT 'USD',
  
  -- Description
  title               TEXT,                  -- optional user-provided title
  description         TEXT,                  -- full listing description
  photos              TEXT[],                -- array of image URLs
  
  -- Location & shipping
  location_zip        TEXT,
  location_city       TEXT,
  location_state      TEXT,
  location_country    TEXT DEFAULT 'US',
  location_lat        NUMERIC(9,6),
  location_lng        NUMERIC(9,6),
  shipping_available  BOOLEAN DEFAULT FALSE,
  shipping_notes      TEXT,
  local_pickup        BOOLEAN DEFAULT TRUE,
  shipping_radius_miles INTEGER,             -- how far they'll ship
  
  -- Timing
  available_from      DATE,                  -- when material is available (scion season, etc.)
  available_until     DATE,
  
  -- Status
  listing_status      listing_status NOT NULL DEFAULT 'active',
  view_count          INTEGER DEFAULT 0,
  inquiry_count       INTEGER DEFAULT 0,
  expires_at          TIMESTAMPTZ,           -- auto-expire after N days
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Same XOR constraint as inventory_offers
  CONSTRAINT valid_listing_resolution CHECK (
    (resolution_status IN ('unresolved', 'review_needed') AND cultivar_id IS NULL AND plant_entity_id IS NULL)
    OR (resolution_status = 'resolved_plant_entity' AND plant_entity_id IS NOT NULL AND cultivar_id IS NULL)
    OR (resolution_status IN ('resolved_cultivar', 'resolved_named_material', 'resolved_population') AND cultivar_id IS NOT NULL AND plant_entity_id IS NULL)
  ),
  CONSTRAINT chk_listing_confidence CHECK (resolution_confidence >= 0 AND resolution_confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON community_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_cultivar ON community_listings(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_listings_entity ON community_listings(plant_entity_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON community_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON community_listings(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_listings_form ON community_listings(sale_form);
CREATE INDEX IF NOT EXISTS idx_listings_zone ON community_listings(location_state);
CREATE INDEX IF NOT EXISTS idx_listings_raw_trgm ON community_listings USING gin(raw_listing_text gin_trgm_ops);

CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON community_listings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Wanted / Request board
-- Users can post "looking for" requests — the demand side.
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- What they're looking for (same resolver pattern)
  cultivar_id       UUID REFERENCES cultivars(id),
  plant_entity_id   UUID REFERENCES plant_entities(id),
  raw_request_text  TEXT NOT NULL,
  
  -- Preferences
  sale_forms_wanted sale_form[],            -- willing to accept these forms
  max_price_cents   INTEGER,
  willing_to_trade  BOOLEAN DEFAULT FALSE,
  
  -- Location
  location_zip      TEXT,
  location_state    TEXT,
  location_country  TEXT DEFAULT 'US',
  max_shipping_distance_miles INTEGER,
  
  -- Status
  request_status    TEXT NOT NULL DEFAULT 'active',  -- 'active', 'fulfilled', 'expired'
  notes             TEXT,
  expires_at        TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_requester ON material_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_cultivar ON material_requests(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON material_requests(request_status);

CREATE TRIGGER trg_requests_updated
  BEFORE UPDATE ON material_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Grower Reports (crowdsourced "where is this growing?" map)
-- ============================================================================

CREATE TABLE IF NOT EXISTS grower_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cultivar_id     UUID REFERENCES cultivars(id),
  plant_entity_id UUID REFERENCES plant_entities(id),
  
  location_lat    NUMERIC(9,6) NOT NULL,
  location_lng    NUMERIC(9,6) NOT NULL,
  usda_zone       TEXT,
  
  planted_year    INTEGER,
  tree_count      INTEGER DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'growing',  -- 'thriving', 'growing', 'struggling', 'died', 'removed'
  
  -- Growing conditions context
  soil_type       TEXT,
  irrigation      TEXT,                    -- 'none', 'drip', 'sprinkler'
  rootstock_used  TEXT,                    -- free text, could reference cultivar
  
  notes           TEXT,
  photos          TEXT[],
  verified        BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grower_reports_profile ON grower_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_grower_reports_cultivar ON grower_reports(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_grower_reports_location ON grower_reports(location_lat, location_lng);

CREATE TRIGGER trg_grower_reports_updated
  BEFORE UPDATE ON grower_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS Policies — Community tables need user-scoped writes
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE grower_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Listings: public read active, sellers manage own
CREATE POLICY "Public read active listings" ON community_listings 
  FOR SELECT USING (listing_status = 'active');
CREATE POLICY "Sellers manage own listings" ON community_listings 
  FOR ALL USING (auth.uid() = seller_id);

-- Requests: public read active, requesters manage own
CREATE POLICY "Public read active requests" ON material_requests 
  FOR SELECT USING (request_status = 'active');
CREATE POLICY "Requesters manage own requests" ON material_requests 
  FOR ALL USING (auth.uid() = requester_id);

-- Grower reports: public read, reporters manage own
CREATE POLICY "Public read grower reports" ON grower_reports FOR SELECT USING (true);
CREATE POLICY "Reporters manage own reports" ON grower_reports 
  FOR ALL USING (auth.uid() = profile_id);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth. Marketplace identity with location and reputation.';
COMMENT ON TABLE community_listings IS 'User-submitted listings for sale/trade. Goes through same resolver as nursery scrapes. XOR constraint links to cultivar or plant_entity.';
COMMENT ON TABLE material_requests IS 'Demand-side: users post what they are looking for. Can be matched against listings and nursery inventory.';
COMMENT ON TABLE grower_reports IS 'Crowdsourced growing reports. Pins on the "where is this growing?" map. Social proof for cultivar adaptation.';

COMMIT;
