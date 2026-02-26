-- ============================================================================
-- Migration 004: Add consent_status to nurseries
-- Supports the consent-first scraping policy.
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bwfhdyjjuubpzwjngquo/sql
-- ============================================================================

-- Add consent tracking column with CHECK constraint
ALTER TABLE nurseries
  ADD COLUMN consent_status text
    NOT NULL
    DEFAULT 'pending'
    CHECK (consent_status IN ('pending', 'approved', 'declined', 'no_response'));

-- Set all existing nurseries to 'pending' (retroactive outreach needed)
UPDATE nurseries
  SET consent_status = 'pending';

-- Index for pipeline filtering (when gating is added)
CREATE INDEX idx_nurseries_consent ON nurseries(consent_status);

-- ── Notes ──
--
-- consent_status values:
--   'pending'     — not yet contacted; this is the default for all new nurseries
--   'approved'    — nursery has given consent to scrape
--   'declined'    — nursery has explicitly declined; never scrape
--   'no_response' — outreach was sent but no reply after reasonable wait
--
-- The pipeline does NOT yet gate on consent_status.
-- To enable gating after outreach is complete, add this filter to
-- app/api/pipeline/scrape/route.ts selectScrapers():
--
--   .eq('consent_status', 'approved')
--
-- See the TODO comment in that file for the exact location.
