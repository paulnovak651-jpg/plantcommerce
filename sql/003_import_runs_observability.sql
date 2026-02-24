-- ============================================================================
-- 003: Import Runs Observability Columns
-- Adds diagnostic fields to import_runs for pipeline monitoring.
-- Safe to rerun (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS duration_ms integer;
ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS error_samples jsonb DEFAULT '[]';
ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS scraper_version text;
ALTER TABLE import_runs ADD COLUMN IF NOT EXISTS rows_errored integer DEFAULT 0;
