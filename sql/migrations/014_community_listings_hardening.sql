-- ============================================================================
-- MIGRATION 014: Community Listings hardening + schema compatibility
-- Aligns older marketplace schema with the v1 no-auth moderation workflow.
-- ============================================================================

BEGIN;

-- Add/align columns used by app/api/listings and listing queries.
ALTER TABLE community_listings
  ADD COLUMN IF NOT EXISTS listing_type TEXT,
  ADD COLUMN IF NOT EXISTS raw_cultivar_text TEXT,
  ADD COLUMN IF NOT EXISTS raw_species_text TEXT,
  ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS trust_tier SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mod_reason TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS resolve_confidence NUMERIC(3,2) DEFAULT 0.0;

-- If legacy schema exists, backfill v1 columns from legacy fields.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_listings'
      AND column_name = 'raw_listing_text'
  ) THEN
    UPDATE community_listings
    SET raw_cultivar_text = COALESCE(raw_cultivar_text, raw_listing_text)
    WHERE raw_cultivar_text IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_listings'
      AND column_name = 'sale_form'
  ) THEN
    UPDATE community_listings
    SET material_type = COALESCE(material_type, sale_form::text, 'unknown')
    WHERE material_type IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_listings'
      AND column_name = 'listing_status'
  ) THEN
    UPDATE community_listings
    SET status = CASE listing_status::text
      WHEN 'active' THEN 'approved'
      WHEN 'pending_review' THEN 'pending'
      WHEN 'sold' THEN 'expired'
      WHEN 'expired' THEN 'expired'
      WHEN 'flagged' THEN 'rejected'
      WHEN 'removed' THEN 'rejected'
      ELSE COALESCE(status, 'pending')
    END
    WHERE status IS NULL OR status = '';
  END IF;
END $$;

-- Ensure moderation-safe defaults on existing rows.
UPDATE community_listings SET status = 'pending' WHERE status IS NULL OR status = '';
UPDATE community_listings SET trust_tier = 0 WHERE trust_tier IS NULL;
UPDATE community_listings SET listing_type = 'wts' WHERE listing_type IS NULL;
UPDATE community_listings SET raw_cultivar_text = 'Unknown listing' WHERE raw_cultivar_text IS NULL;
UPDATE community_listings SET material_type = 'unknown' WHERE material_type IS NULL;

-- Legacy schema can have seller_id NOT NULL; allow anon submissions for v1.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_listings'
      AND column_name = 'seller_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE community_listings ALTER COLUMN seller_id DROP NOT NULL;
  END IF;
END $$;

-- Enforce current check constraints if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_cl_listing_type'
  ) THEN
    ALTER TABLE community_listings
      ADD CONSTRAINT chk_cl_listing_type
      CHECK (listing_type IN ('wts', 'wtb'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_cl_status'
  ) THEN
    ALTER TABLE community_listings
      ADD CONSTRAINT chk_cl_status
      CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_cl_trust_tier'
  ) THEN
    ALTER TABLE community_listings
      ADD CONSTRAINT chk_cl_trust_tier
      CHECK (trust_tier BETWEEN 0 AND 3);
  END IF;
END $$;

ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;

-- Remove legacy and permissive policies, then recreate minimal-safe set.
DROP POLICY IF EXISTS "Public read active listings" ON community_listings;
DROP POLICY IF EXISTS "Sellers manage own listings" ON community_listings;
DROP POLICY IF EXISTS "Public read approved listings" ON community_listings;
DROP POLICY IF EXISTS "Anyone can submit listing" ON community_listings;

CREATE POLICY "Public read approved listings"
  ON community_listings FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can submit listing"
  ON community_listings FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND trust_tier = 0
    AND mod_reason IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_cl_status ON community_listings(status);
CREATE INDEX IF NOT EXISTS idx_cl_created ON community_listings(created_at DESC);

COMMIT;

