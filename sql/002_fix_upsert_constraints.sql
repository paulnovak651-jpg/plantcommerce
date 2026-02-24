-- ============================================================================
-- Fix upsert constraints for pipeline writes
--
-- Problem: The original schema used partial unique indexes (with WHERE clauses)
-- for the upsert keys. PostgreSQL's ON CONFLICT doesn't work with partial
-- unique indexes unless you reference them by constraint name, and Supabase's
-- JS client doesn't support that syntax.
--
-- Solution: Replace partial indexes with full unique constraints.
-- ============================================================================

-- 1. inventory_offers: Replace partial index with full unique constraint
DROP INDEX IF EXISTS idx_offers_nursery_source_key;

-- Add a proper unique constraint (not partial) for upsert support
ALTER TABLE inventory_offers
  ADD CONSTRAINT uq_offers_nursery_source_key
  UNIQUE (nursery_id, source_offer_key);

-- 2. unmatched_names: Replace partial index with full unique constraint
DROP INDEX IF EXISTS idx_unmatched_unique;

-- Add a proper unique constraint for upsert support
ALTER TABLE unmatched_names
  ADD CONSTRAINT uq_unmatched_core_nursery
  UNIQUE (parsed_core_name, nursery_id);

-- ============================================================================
-- Rollback (if needed):
--
-- ALTER TABLE inventory_offers DROP CONSTRAINT uq_offers_nursery_source_key;
-- CREATE UNIQUE INDEX idx_offers_nursery_source_key
--   ON inventory_offers(nursery_id, source_offer_key)
--   WHERE source_offer_key IS NOT NULL;
--
-- ALTER TABLE unmatched_names DROP CONSTRAINT uq_unmatched_core_nursery;
-- CREATE UNIQUE INDEX idx_unmatched_unique
--   ON unmatched_names(parsed_core_name, nursery_id)
--   WHERE review_status = 'pending';
-- ============================================================================
