-- ============================================================================
-- MIGRATION 013: Community Listings (Marketplace Foundation)
-- No-auth v1: anonymous submissions, admin-moderated, approved listings public.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS community_listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type        TEXT NOT NULL CHECK (listing_type IN ('wts', 'wtb')),

  -- Resolver output (populated on submission if cultivar name matches)
  cultivar_id         UUID REFERENCES cultivars(id),
  plant_entity_id     UUID REFERENCES plant_entities(id),
  resolve_confidence  NUMERIC(3,2) DEFAULT 0.0
                        CHECK (resolve_confidence >= 0 AND resolve_confidence <= 1),

  -- Raw user input (verbatim — input to resolver)
  raw_cultivar_text   TEXT NOT NULL,
  raw_species_text    TEXT,

  -- Offer details
  material_type       TEXT NOT NULL DEFAULT 'unknown',
  quantity            INTEGER,
  price_cents         INTEGER,       -- NULL = trade / contact / free
  location_state      TEXT NOT NULL,

  -- Contact (no auth required for v1)
  contact_email       TEXT,
  notes               TEXT,

  -- Moderation
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  trust_tier          SMALLINT NOT NULL DEFAULT 0 CHECK (trust_tier BETWEEN 0 AND 3),
  mod_reason          TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ
);

-- Set expires_at automatically on insert (90-day listings)
CREATE OR REPLACE FUNCTION set_listing_expires()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_expires
  BEFORE INSERT ON community_listings
  FOR EACH ROW EXECUTE FUNCTION set_listing_expires();

CREATE TRIGGER trg_community_listings_updated
  BEFORE UPDATE ON community_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cl_status   ON community_listings(status);
CREATE INDEX IF NOT EXISTS idx_cl_cultivar ON community_listings(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_cl_entity   ON community_listings(plant_entity_id);
CREATE INDEX IF NOT EXISTS idx_cl_type     ON community_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_cl_created  ON community_listings(created_at DESC);

-- RLS
ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;

-- Public (anon key) can read approved listings only
CREATE POLICY "Public read approved listings"
  ON community_listings FOR SELECT
  USING (status = 'approved');

-- Anyone (anon) can submit — no auth required for v1
CREATE POLICY "Anyone can submit listing"
  ON community_listings FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE community_listings IS
  'User-submitted WTS/WTB listings. Anon submissions go to pending; admin approves before public display.';

COMMIT;
