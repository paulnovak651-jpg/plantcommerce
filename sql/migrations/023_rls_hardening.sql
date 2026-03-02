-- ============================================================================
-- MIGRATION 023: RLS hardening for exposed public tables
-- Enables RLS on exposed tables, adds anon/authenticated read policies where
-- appropriate, and locks function search_path to public.
-- ============================================================================

BEGIN;

-- Public data tables: allow anon/authenticated read-only access.
ALTER TABLE IF EXISTS public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rootstocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.zip_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plant_entity_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.species_pollination_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.plants') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'plants' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.plants FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.suppliers') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.suppliers FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.supplier_listings') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'supplier_listings' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.supplier_listings FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.rootstocks') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'rootstocks' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.rootstocks FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.zip_zones') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'zip_zones' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.zip_zones FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.plant_entity_parents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'plant_entity_parents' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.plant_entity_parents FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.legal_identifiers') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'legal_identifiers' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.legal_identifiers FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.species_pollination_profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'species_pollination_profiles' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.species_pollination_profiles FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.slug_redirects') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'slug_redirects' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.slug_redirects FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF to_regclass('public.price_history') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'price_history' AND policyname = 'anon_read'
     ) THEN
    EXECUTE 'CREATE POLICY "anon_read" ON public.price_history FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END;
$$;

-- Internal/dashboard tables: enable RLS with no anon/authenticated policies.
ALTER TABLE IF EXISTS public.dashboard_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_integrations ENABLE ROW LEVEL SECURITY;

-- import_runs, raw_inventory_rows, and unmatched_names are intentionally
-- unchanged (RLS enabled, no anon/authenticated policies, service_role only).

-- Function hardening: pin mutable search_path to public.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_taxonomy_path',
        'get_taxonomy_siblings',
        'update_updated_at',
        'refresh_search_index',
        'get_explorer_species',
        'set_listing_expires'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public',
      fn.schema_name,
      fn.function_name,
      fn.args
    );
  END LOOP;
END;
$$;

REFRESH MATERIALIZED VIEW material_search_index;

COMMIT;
