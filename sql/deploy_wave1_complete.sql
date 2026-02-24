-- ============================================================================
-- WAVE 1 COMPLETE DEPLOYMENT
-- Combined: wave1_schema.sql + wave1_seed_data.sql + wave1_1_patch.sql
-- Target: Supabase SQL Editor (run as a single transaction)
-- Generated: 2026-02-24
-- ============================================================================
-- INSTRUCTIONS:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--   4. Verify with: SELECT count(*) FROM cultivars; (should return 44)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: SCHEMA (tables, enums, indexes, triggers, RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUM TYPES
CREATE TYPE entity_type AS ENUM ('species', 'subspecies', 'hybrid_species', 'species_group');
CREATE TYPE material_type AS ENUM ('cultivar_clone', 'named_seed_strain', 'breeding_population', 'geographic_population', 'species_seedling', 'unknown_named_line');
CREATE TYPE alias_type AS ENUM ('common_name', 'botanical_synonym', 'trade_name', 'abbreviation', 'misspelling', 'nursery_variant', 'former_name', 'foreign_name');
CREATE TYPE alias_target_type AS ENUM ('plant_entity', 'cultivar');
CREATE TYPE offer_status AS ENUM ('active', 'stale', 'sold_out', 'discontinued');
CREATE TYPE resolution_status AS ENUM ('resolved_cultivar', 'resolved_plant_entity', 'resolved_named_material', 'resolved_population', 'unresolved', 'review_needed');
CREATE TYPE genetic_specificity AS ENUM ('cultivar_clone', 'cultivar_derived_seed', 'species_seedling', 'mixed_population', 'unknown');
CREATE TYPE curation_status AS ENUM ('draft', 'reviewed', 'published');
CREATE TYPE patent_status AS ENUM ('none', 'patented', 'patent_expired', 'trademarked', 'registered_trademark', 'unknown');

-- Patch: propagation_method (cleaned — no sale_form values)
CREATE TYPE propagation_method AS ENUM ('grafted', 'layered_clone', 'tissue_cultured', 'seedling', 'seed', 'cutting', 'unknown');
-- Patch: sale_form enum
CREATE TYPE sale_form AS ENUM ('bare_root', 'potted', 'plug', 'tubeling', 'container', 'field_dug', 'unknown');

-- KNOWLEDGE LAYER
CREATE TABLE plant_entities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  canonical_name TEXT NOT NULL,
  botanical_name TEXT,
  family        TEXT,
  genus         TEXT,
  species       TEXT,
  entity_type   entity_type NOT NULL DEFAULT 'species',
  description   TEXT,
  curation_status curation_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_plant_entity_slug CHECK (length(trim(slug)) > 0)
);

CREATE INDEX idx_plant_entities_slug ON plant_entities(slug);
CREATE INDEX idx_plant_entities_genus ON plant_entities(genus);
CREATE INDEX idx_plant_entities_botanical ON plant_entities(botanical_name);

CREATE TABLE plant_entity_parents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hybrid_id     UUID NOT NULL REFERENCES plant_entities(id) ON DELETE CASCADE,
  parent_id     UUID NOT NULL REFERENCES plant_entities(id) ON DELETE CASCADE,
  contribution_percent NUMERIC(5,2),
  UNIQUE(hybrid_id, parent_id)
);

COMMENT ON COLUMN plant_entity_parents.contribution_percent IS 'Percentage genetic contribution. E.g., Grand Traverse = 25% C. colurna. NULL if unknown.';

CREATE TABLE cultivars (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  canonical_name  TEXT NOT NULL,
  plant_entity_id UUID REFERENCES plant_entities(id),
  material_type   material_type NOT NULL DEFAULT 'cultivar_clone',
  breeder         TEXT,
  origin_location TEXT,
  year_released   INTEGER,
  patent_status   patent_status NOT NULL DEFAULT 'unknown',
  description     TEXT,
  notes           TEXT,
  curation_status curation_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cultivar_slug CHECK (length(trim(slug)) > 0)
);

CREATE INDEX idx_cultivars_slug ON cultivars(slug);
CREATE INDEX idx_cultivars_plant_entity ON cultivars(plant_entity_id);
CREATE INDEX idx_cultivars_material_type ON cultivars(material_type);
CREATE INDEX idx_cultivars_name_trgm ON cultivars USING gin(canonical_name gin_trgm_ops);

CREATE TABLE legal_identifiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cultivar_id     UUID NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
  id_type         TEXT NOT NULL,
  value_raw       TEXT NOT NULL,
  value_normalized TEXT,
  jurisdiction    TEXT,
  status          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legal_cultivar ON legal_identifiers(cultivar_id);
CREATE INDEX idx_legal_normalized ON legal_identifiers(value_normalized);

CREATE TABLE aliases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias_text      TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  target_type     alias_target_type NOT NULL,
  target_id       UUID NOT NULL,
  alias_type      alias_type NOT NULL DEFAULT 'common_name',
  priority        INTEGER DEFAULT 0,
  is_preferred    BOOLEAN DEFAULT FALSE,
  curation_status curation_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aliases_normalized ON aliases(normalized_text);
CREATE INDEX idx_aliases_normalized_trgm ON aliases USING gin(normalized_text gin_trgm_ops);
CREATE INDEX idx_aliases_target ON aliases(target_type, target_id);
-- Patch: dedup index
CREATE UNIQUE INDEX idx_aliases_unique_target ON aliases (normalized_text, target_type, target_id);

CREATE TABLE slug_redirects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  old_slug    TEXT UNIQUE NOT NULL,
  new_slug    TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slug_redirects_old ON slug_redirects(old_slug);

-- COMMERCE LAYER
CREATE TABLE nurseries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  website_url     TEXT,
  location_city   TEXT,
  location_state  TEXT,
  location_country TEXT DEFAULT 'US',
  sales_type      TEXT,
  specialties     TEXT[],
  shipping_notes  TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  former_names    TEXT[],
  former_urls     TEXT[],
  curation_status curation_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_nursery_slug CHECK (length(trim(slug)) > 0)
);

CREATE INDEX idx_nurseries_slug ON nurseries(slug);

-- Pipeline: import_runs
CREATE TABLE import_runs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nursery_id    UUID REFERENCES nurseries(id),
  source_type   TEXT NOT NULL,
  source_url    TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'running',
  rows_total    INTEGER DEFAULT 0,
  rows_resolved INTEGER DEFAULT 0,
  rows_unmatched INTEGER DEFAULT 0,
  notes         TEXT
);

CREATE TABLE inventory_offers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nursery_id          UUID NOT NULL REFERENCES nurseries(id) ON DELETE CASCADE,
  cultivar_id         UUID REFERENCES cultivars(id),
  plant_entity_id     UUID REFERENCES plant_entities(id),
  resolution_status   resolution_status NOT NULL DEFAULT 'unresolved',
  resolution_confidence NUMERIC(3,2) DEFAULT 0.0,
  resolution_method   TEXT,
  raw_product_name    TEXT NOT NULL,
  raw_description     TEXT,
  raw_price_text      TEXT,
  raw_availability    TEXT,
  raw_form_size       TEXT,
  raw_sku             TEXT,
  product_page_url    TEXT,
  price_cents         INTEGER,
  currency            TEXT DEFAULT 'USD',
  propagation_method  propagation_method DEFAULT 'unknown',
  sale_form           sale_form DEFAULT 'unknown',
  genetic_specificity genetic_specificity DEFAULT 'unknown',
  form_description    TEXT,
  organic_status      BOOLEAN,
  offer_status        offer_status NOT NULL DEFAULT 'active',
  shipping_restrictions TEXT[],
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stale_after         TIMESTAMPTZ,
  import_run_id       UUID,
  source_offer_key    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Patch: status-aware XOR constraint
  CONSTRAINT valid_resolution CHECK (
    (resolution_status IN ('unresolved', 'review_needed') AND cultivar_id IS NULL AND plant_entity_id IS NULL)
    OR (resolution_status = 'resolved_plant_entity' AND plant_entity_id IS NOT NULL AND cultivar_id IS NULL)
    OR (resolution_status IN ('resolved_cultivar', 'resolved_named_material', 'resolved_population') AND cultivar_id IS NOT NULL AND plant_entity_id IS NULL)
  ),
  -- Patch: confidence bounds
  CONSTRAINT chk_offers_resolution_confidence CHECK (resolution_confidence >= 0 AND resolution_confidence <= 1),
  -- Patch: import_run FK
  CONSTRAINT fk_inventory_offers_import_run FOREIGN KEY (import_run_id) REFERENCES import_runs(id) ON DELETE SET NULL
);

CREATE INDEX idx_offers_nursery ON inventory_offers(nursery_id);
CREATE INDEX idx_offers_cultivar ON inventory_offers(cultivar_id);
CREATE INDEX idx_offers_plant_entity ON inventory_offers(plant_entity_id);
CREATE INDEX idx_offers_status ON inventory_offers(offer_status);
CREATE INDEX idx_offers_resolution ON inventory_offers(resolution_status);
CREATE INDEX idx_offers_raw_name_trgm ON inventory_offers USING gin(raw_product_name gin_trgm_ops);
-- Patch: dedupe key
CREATE UNIQUE INDEX idx_offers_nursery_source_key ON inventory_offers(nursery_id, source_offer_key) WHERE source_offer_key IS NOT NULL;

COMMENT ON COLUMN inventory_offers.source_offer_key IS 'Hash of nursery + product URL + SKU + normalized form/size. Prevents duplicate offers from repeated imports. Generated in app code.';
COMMENT ON COLUMN inventory_offers.genetic_specificity IS 'Tracks whether an offer is a true clone, seed-derived (genetically variable), species seedling, or mixed population.';
COMMENT ON COLUMN inventory_offers.resolution_confidence IS 'Parser confidence score: 0.95+ for exact alias match, 0.80-0.95 for normalized match, 0.50-0.80 for fuzzy/heuristic, below 0.50 routes to review queue.';

-- Pipeline: raw_inventory_rows
CREATE TABLE raw_inventory_rows (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_run_id UUID NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  nursery_id    UUID NOT NULL REFERENCES nurseries(id),
  raw_product_name TEXT NOT NULL,
  raw_description  TEXT,
  raw_price_text   TEXT,
  raw_availability TEXT,
  raw_form_size    TEXT,
  raw_sku          TEXT,
  raw_url          TEXT,
  raw_category     TEXT,
  raw_botanical    TEXT,
  raw_full_html    TEXT,
  parsed_core_name    TEXT,
  parsed_botanical    TEXT,
  parsed_propagation  TEXT,
  parsed_organic      BOOLEAN,
  parsed_patent_info  TEXT,
  stripped_tokens      JSONB,
  offer_id            UUID REFERENCES inventory_offers(id),
  resolution_status   resolution_status DEFAULT 'unresolved',
  resolution_confidence NUMERIC(3,2) DEFAULT 0.0,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Patch: confidence bounds
  CONSTRAINT chk_raw_rows_resolution_confidence CHECK (resolution_confidence >= 0 AND resolution_confidence <= 1)
);

CREATE INDEX idx_raw_rows_import ON raw_inventory_rows(import_run_id);
CREATE INDEX idx_raw_rows_nursery ON raw_inventory_rows(nursery_id);
CREATE INDEX idx_raw_rows_resolution ON raw_inventory_rows(resolution_status);

-- Pipeline: unmatched_names
CREATE TABLE unmatched_names (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_product_name TEXT NOT NULL,
  parsed_core_name TEXT,
  nursery_id      UUID REFERENCES nurseries(id),
  import_run_id   UUID REFERENCES import_runs(id),
  raw_row_id      UUID REFERENCES raw_inventory_rows(id),
  review_status   TEXT NOT NULL DEFAULT 'pending',
  resolved_to_type TEXT,
  resolved_to_id  UUID,
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_unmatched_status ON unmatched_names(review_status);
CREATE INDEX idx_unmatched_name ON unmatched_names(parsed_core_name);
CREATE UNIQUE INDEX idx_unmatched_unique ON unmatched_names(parsed_core_name, nursery_id) WHERE review_status = 'pending';

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plant_entities_updated BEFORE UPDATE ON plant_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cultivars_updated BEFORE UPDATE ON cultivars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_nurseries_updated BEFORE UPDATE ON nurseries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON inventory_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE plant_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivars ENABLE ROW LEVEL SECURITY;
ALTER TABLE aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_inventory_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_names ENABLE ROW LEVEL SECURITY;

-- Public read on knowledge + commerce
CREATE POLICY "Public read plant_entities" ON plant_entities FOR SELECT USING (true);
CREATE POLICY "Public read cultivars" ON cultivars FOR SELECT USING (true);
CREATE POLICY "Public read aliases" ON aliases FOR SELECT USING (true);
CREATE POLICY "Public read nurseries" ON nurseries FOR SELECT USING (true);
CREATE POLICY "Public read inventory_offers" ON inventory_offers FOR SELECT USING (true);
-- Pipeline tables: NO public policies. Service role (bypasses RLS) only.

-- COMMENTS
COMMENT ON TABLE plant_entities IS 'Species and hybrid species. The biological anchor for all cultivar data.';
COMMENT ON TABLE cultivars IS 'Unified table for cultivar clones, named seed strains, breeding populations, and geographic populations. Differentiated by material_type enum.';
COMMENT ON TABLE aliases IS 'Name resolution backbone. Maps any known name variant to its canonical plant_entity or cultivar.';
COMMENT ON TABLE nurseries IS 'Nursery business profiles. Tracks rebranding via former_names/former_urls.';
COMMENT ON TABLE inventory_offers IS 'Current commercial offers. Links nursery to cultivar/plant_entity with normalized commerce fields. Raw data always preserved.';
COMMENT ON TABLE import_runs IS 'Tracks each scrape/import batch for provenance and debugging.';
COMMENT ON TABLE raw_inventory_rows IS 'Verbatim captured data from nursery scrapes. Never modified after capture. Parser output stored alongside.';
COMMENT ON TABLE unmatched_names IS 'Review queue for names the resolver could not match. High-value signal for expanding the knowledge base.';


-- ============================================================================
-- PART 2: SEED DATA (Hazelnut Pilot)
-- ============================================================================

-- Plant Entities
INSERT INTO plant_entities (slug, canonical_name, botanical_name, family, genus, species, entity_type, curation_status) VALUES
('corylus-avellana', 'European Hazelnut', 'Corylus avellana', 'Betulaceae', 'Corylus', 'avellana', 'species', 'published'),
('corylus-americana', 'American Hazelnut', 'Corylus americana', 'Betulaceae', 'Corylus', 'americana', 'species', 'published'),
('corylus-cornuta', 'Beaked Hazelnut', 'Corylus cornuta', 'Betulaceae', 'Corylus', 'cornuta', 'species', 'published'),
('corylus-heterophylla', 'Asian Hazelnut', 'Corylus heterophylla', 'Betulaceae', 'Corylus', 'heterophylla', 'species', 'published'),
('corylus-colurna', 'Turkish Tree Hazel', 'Corylus colurna', 'Betulaceae', 'Corylus', 'colurna', 'species', 'published'),
('corylus-avellana-x-americana', 'European x American Hazelnut Hybrid', 'Corylus avellana × americana', 'Betulaceae', 'Corylus', NULL, 'hybrid_species', 'published'),
('gevuina-avellana', 'Chilean Hazelnut', 'Gevuina avellana', 'Proteaceae', 'Gevuina', 'avellana', 'species', 'published');

-- Nurseries
INSERT INTO nurseries (slug, name, website_url, location_city, location_state, location_country, sales_type, curation_status) VALUES
('burnt-ridge-nursery', 'Burnt Ridge Nursery & Orchards', 'https://burntridgenursery.com', 'Onalaska', 'WA', 'US', 'retail', 'published'),
('grimo-nut-nursery', 'Grimo Nut Nursery', 'https://grimonut.com', 'Niagara-on-the-Lake', 'ON', 'CA', 'both', 'published'),
('badgersett-research', 'Badgersett Research Corporation', 'https://badgersett.com', 'Canton', 'MN', 'US', 'both', 'published'),
('oikos-tree-crops', 'Oikos Tree Crops', 'https://oikostreecrops.com', NULL, 'MI', 'US', 'retail', 'published'),
('zs-nutty-ridge', 'Z''s Nutty Ridge LLC', 'https://znutty.com', 'McGraw', 'NY', 'US', 'retail', 'published'),
('stark-bros', 'Stark Bro''s Nurseries & Orchards Co', 'https://starkbros.com', 'Louisiana', 'MO', 'US', 'retail', 'published'),
('raintree-nursery', 'Raintree Nursery', 'https://raintreenursery.com', 'Morton', 'WA', 'US', 'retail', 'published'),
('rolling-river-nursery', 'Rolling River Nursery / Planting Justice', 'https://plantingjustice.org', 'Oakland', 'CA', 'US', 'both', 'published'),
('one-green-world', 'One Green World', 'https://onegreenworld.com', 'Portland', 'OR', 'US', 'retail', 'published'),
('nolin-river-nursery', 'Nolin River Nut Tree Nursery', 'https://nolinrivernursery.com', 'Upton', 'KY', 'US', 'retail', 'published');

UPDATE nurseries SET former_names = ARRAY['Rolling River Nursery'], former_urls = ARRAY['rollingrivernursery.com'] WHERE slug = 'rolling-river-nursery';

-- Cultivars: OSU Program
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('jefferson', 'Jefferson', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'patented', 'published', 'EFB immune. Heavy yield, large nuts. Replaces Barcelona.'),
('yamhill', 'Yamhill', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'patented', 'published', 'EFB immune. Early ripening. Compact tree.'),
('dorris', 'Dorris', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Complete EFB resistance. Large round nuts. Compact.'),
('mcdonald', 'McDonald', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Highest nut meat to shell ratio. Very early ripening.'),
('polly-o', 'Polly O', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', '2018 release. High yield medium round nuts. Chocolate industry preferred.'),
('wepster', 'Wepster', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Kernel size 11-13mm. Early ripening. Chocolate/baking industry.'),
('lewis', 'Lewis', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'none', 'published', '1997 release. EFB resistant. Compact. Early ripening.'),
('clark', 'Clark', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB resistant.'),
('sacajawea', 'Sacajawea', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Flavor similar to prized Italian varieties.'),
('felix', 'Felix', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Late pollinizer for Jefferson, Eta, Theta.'),
('eta', 'Eta', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB immune. Compact. Medium nuts.'),
('theta', 'Theta', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB immune. Very flavorful. Most desirable Oregon clone.'),
('epsilon', 'Epsilon', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB immune. Compact. Good pollinizer.'),
('zeta', 'Zeta', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB immune. Compact. Pollinated by Eta or Theta.'),
('delta', 'Delta', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB and bud mite resistant. Good pollinator for Yamhill and Lewis.'),
('gamma', 'Gamma', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'Selected as pollinizer. Medium round nuts.'),
('york', 'York', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Oregon State University', 'Oregon, USA', 'unknown', 'published', 'EFB immune. Long pollen season = great universal pollinator.');

-- Classic/European cultivars
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('barcelona', 'Barcelona', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', NULL, 'Spain', 'none', 'published', 'Most widely planted commercial variety in PNW. >60% Oregon acreage.'),
('ennis', 'Ennis', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'University of Oregon', 'Oregon, USA', 'none', 'published', 'Large oval nuts. Traditionally pollinated by Butler.'),
('casina', 'Casina', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', NULL, 'Spain', 'none', 'published', 'Chance seedling. Prolific yield.'),
('butler', 'Butler', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', NULL, 'Oregon, USA', 'none', 'published', 'Standard pollinator for Ennis.'),
('halls-giant', 'Hall''s Giant', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', NULL, 'Germany/Alsace', 'none', 'published', 'Historic cultivar. Large round nuts. Moderate EFB resistance.'),
('tonda-di-giffoni', 'Tonda di Giffoni', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', NULL, 'Italy', 'none', 'published', 'Premier Italian cultivar. Round kernels, easy to process.');

-- Rutgers / Eastern US
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('the-beast', 'The Beast', (SELECT id FROM plant_entities WHERE slug='corylus-avellana-x-americana'), 'cultivar_clone', 'Hybrid Hazelnut Research Consortium / Rutgers', 'New Jersey, USA', 'patented', 'published', 'First HHRC release. avellana x americana. 17 lbs at year 6.'),
('somerset', 'Somerset', (SELECT id FROM plant_entities WHERE slug='corylus-avellana-x-americana'), 'cultivar_clone', 'Rutgers University', 'New Jersey, USA', 'patented', 'published', 'Highest EFB resistance of any commercial cultivar. Up to 53 lbs/tree.'),
('raritan', 'Raritan', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Rutgers University', 'New Jersey, USA', 'patented', 'published', 'S-alleles 3 and 22. EFB resistant (eastern strains).'),
('monmouth', 'Monmouth', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Rutgers University', 'New Jersey, USA', 'trademarked', 'published', 'EFB resistant (multiple eastern strains). Very productive.'),
('hunterdon', 'Hunterdon', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Rutgers University', 'New Jersey, USA', 'patented', 'published', 'Cross of Sacajawea x OSU 616.055. EFB resistant.'),
('grand-traverse', 'Grand Traverse', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Cecil Farris', 'Michigan, USA', 'none', 'published', 'Michigan selection. 25% Turkish Tree Hazel. Near-universal pollinator.');

-- Grimo cultivars
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('gene', 'Gene', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo Nut Nursery', 'Ontario, Canada', 'trademarked', 'published', 'Formerly called Geneva. Main pollinizer at Grimo. High blight resistance.'),
('alex', 'Alex', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Faroka seedling)', 'Ontario, Canada', 'none', 'published', 'Large oval nut. Turkish tree hazel hybrid parentage.'),
('carmela', 'Carmela', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo Nut Nursery', 'Ontario, Canada', 'trademarked', 'published', 'Extra large oval nut. Biennial bearing.'),
('dermis', 'Dermis', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Skinner seedling)', 'Ontario, Canada', 'trademarked', 'published', 'Northern hardy. Superior to Skinner parent.'),
('edward', 'Edward', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo', 'Ontario, Canada', 'none', 'published', 'High yielding. Bud mite resistant. S-alleles 11 and 20.'),
('matt', 'Matt', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Faroka seedling)', 'Ontario, Canada', 'trademarked', 'published', 'Formerly 208D. Large oval nut.'),
('slate', 'Slate', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo', 'Ontario, Canada', 'trademarked', 'published', 'Very productive compact tree.'),
('crimson', 'Crimson', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Wisconsin source)', 'Ontario, Canada', 'none', 'published', 'Hardy red leaf ornamental hazel.'),
('dawn', 'Dawn', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Asian/Quebec source)', 'Ontario, Canada', 'none', 'published', 'Good blight resistance. Bud mite susceptible.'),
('frank', 'Frank', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Saskatchewan source)', 'Ontario, Canada', 'none', 'published', 'Medium tree 3-4m.'),
('joanne', 'Joanne', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Saskatchewan source)', 'Ontario, Canada', 'none', 'published', 'Good blight resistance. Bud mite susceptible.'),
('kiara', 'Kiara', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Dr. Les Kerr, Morden Research Station', 'Manitoba/Ontario, Canada', 'none', 'published', 'American hazel hybrid.'),
('marion', 'Marion', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Saskatchewan source)', 'Ontario, Canada', 'none', 'published', 'Medium tree 3-4m.'),
('northern-blais', 'Northern Blais', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Quebec grower (from Grimo seedlings)', 'Quebec, Canada', 'trademarked', 'published', 'Selected in zone 4 Quebec.'),
('aldara', 'Aldara', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Grimo (Asian/Quebec source)', 'Ontario, Canada', 'trademarked', 'published', 'Medium tree 3-4m.');

-- Z's Nutty Ridge cultivars
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('nitka', 'NITKA', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Z''s Nutty Ridge', 'New York, USA', 'registered_trademark', 'published', 'Extremely hardy zone 4a. No EFB after 25+ years.'),
('photon', 'Photon', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Z''s Nutty Ridge', 'New York, USA', 'patented', 'published', 'First patent for cold hardy hazelnut in native regions.'),
('truxton', 'Truxton', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'cultivar_clone', 'Z''s Nutty Ridge', 'New York, USA', 'unknown', 'published', 'Large thin-shelled nuts. Zones 6a+.');

-- American hazel cultivar
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('winkler', 'Winkler', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'cultivar_clone', NULL, 'Iowa, USA', 'none', 'published', 'Introduced 1918. Larger, more productive than typical native.');

-- Named seed strains
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('ny-hazel-seedling', 'NY Hazel Seedling', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'George Slate / Geneva Experiment Station', 'New York, USA', 'none', 'published', 'Seeds from NY 616 and/or NY 398. Blight-immune parentage.'),
('grimo-hazel-seedling', 'Grimo Hazel Seedling', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'Grimo (2nd gen Faroka)', 'Ontario, Canada', 'none', 'published', 'Faroka offspring. EFB and bud mite resistant.'),
('cortland-hazel-seedling', 'Cortland Hazel Seedling', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'Z''s Nutty Ridge', 'New York, USA', 'none', 'published', 'Named after Cortland County. Mother tree: round, thin-shelled, EFB resistant.'),
('prodigy-hazel-seedling', 'Prodigy Hazel Seedling', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'Z''s Nutty Ridge', 'New York, USA', 'none', 'published', 'Locally-named seedling line.'),
('cultivar-hazel-seedling', 'Cultivar Hazel Seedling', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'Z''s Nutty Ridge', 'New York, USA', 'none', 'published', 'CONFUSING NAME: Cultivar used as seedling line name, not indicating cultivar status.'),
('dwarf-american-hazelnut', 'Dwarf American Hazelnut', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'named_seed_strain', 'Oikos Tree Crops', 'Michigan, USA', 'none', 'published', 'Natural dwarf runner form from Iowa/Michigan populations.'),
('ecos-american-hazelnut', 'ECOS American Hazelnut', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'named_seed_strain', 'Oikos Tree Crops', 'Michigan, USA', 'none', 'published', 'Ecological Crop Opportunity Selection. Precocious heavy bearers.'),
('precocious-hazelnut', 'Precocious Hazelnut', (SELECT id FROM plant_entities WHERE slug='corylus-avellana'), 'named_seed_strain', 'Oikos Tree Crops', 'Michigan, USA', 'none', 'published', '30-year trial selection.'),
('skinner-american-hazelnut-seeds', 'Skinner American Hazelnut Seeds', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'named_seed_strain', 'Oikos Tree Crops', 'Michigan, USA', 'none', 'published', 'Seeds from Skinner cultivar. NOT clonal — genetically variable offspring.');

-- Breeding populations
INSERT INTO cultivars (slug, canonical_name, plant_entity_id, material_type, breeder, origin_location, patent_status, curation_status, notes) VALUES
('neohybrid-hazelnut', 'NeoHybrid Hazelnut', NULL, 'breeding_population', 'Badgersett Research Corporation', 'Minnesota, USA', 'none', 'published', 'Multi-generation triple-species hybrid. americana x cornuta x avellana. Breeding since 1978.'),
('northern-hazel-asian-quebec', 'Northern Hazel (Asian/Quebec Source)', (SELECT id FROM plant_entities WHERE slug='corylus-heterophylla'), 'geographic_population', 'Grimo Nut Nursery', 'Ontario, Canada', 'none', 'published', 'C. heterophylla hybrids from mixed orchard. Late August ripening.'),
('northern-hazel-saskatchewan', 'Northern Hazel (Saskatchewan Source)', (SELECT id FROM plant_entities WHERE slug='corylus-heterophylla'), 'geographic_population', 'Grimo Nut Nursery', 'Saskatchewan/Ontario, Canada', 'none', 'published', 'Manitoba crosses further selected in Saskatchewan.'),
('northern-hazel-wisconsin', 'Northern Hazel (Wisconsin Source)', (SELECT id FROM plant_entities WHERE slug='corylus-heterophylla'), 'geographic_population', 'Grimo Nut Nursery', 'Wisconsin/Ontario, Canada', 'none', 'published', 'European hybrids selected in Wisconsin/Minnesota climate.');

-- Aliases
INSERT INTO aliases (alias_text, normalized_text, target_type, target_id, alias_type, is_preferred) VALUES
('Geneva', 'geneva', 'cultivar', (SELECT id FROM cultivars WHERE slug='gene'), 'former_name', FALSE),
('Geneva Hazel Cultivar', 'geneva hazel cultivar', 'cultivar', (SELECT id FROM cultivars WHERE slug='gene'), 'nursery_variant', FALSE),
('Geneva Hazelnut', 'geneva hazelnut', 'cultivar', (SELECT id FROM cultivars WHERE slug='gene'), 'nursery_variant', FALSE);

INSERT INTO aliases (alias_text, normalized_text, target_type, target_id, alias_type) VALUES
('208D', '208d', 'cultivar', (SELECT id FROM cultivars WHERE slug='matt'), 'former_name'),
('Halles Giant', 'halles giant', 'cultivar', (SELECT id FROM cultivars WHERE slug='halls-giant'), 'misspelling'),
('Halls Giant', 'halls giant', 'cultivar', (SELECT id FROM cultivars WHERE slug='halls-giant'), 'common_name'),
('Geant de Halle', 'geant de halle', 'cultivar', (SELECT id FROM cultivars WHERE slug='halls-giant'), 'foreign_name'),
('Merville de Bollwiller', 'merville de bollwiller', 'cultivar', (SELECT id FROM cultivars WHERE slug='halls-giant'), 'foreign_name'),
('PollyO', 'pollyo', 'cultivar', (SELECT id FROM cultivars WHERE slug='polly-o'), 'nursery_variant');

-- Legal identifiers
INSERT INTO legal_identifiers (cultivar_id, id_type, value_raw, value_normalized, jurisdiction, status) VALUES
((SELECT id FROM cultivars WHERE slug='the-beast'), 'plant_patent', 'US PP33561 P2', 'USPP33561', 'US', 'active'),
((SELECT id FROM cultivars WHERE slug='somerset'), 'plant_patent', 'USPP 32,494', 'USPP32494', 'US', 'active'),
((SELECT id FROM cultivars WHERE slug='raritan'), 'plant_patent', 'USPP32,460', 'USPP32460', 'US', 'active'),
((SELECT id FROM cultivars WHERE slug='photon'), 'plant_patent', 'US-PP34790-P2', 'USPP34790', 'US', 'active');

-- Badgersett selection tier aliases
INSERT INTO aliases (alias_text, normalized_text, target_type, target_id, alias_type) VALUES
('Machine Picked hazels', 'machine picked hazels', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name'),
('Select material', 'select material', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name'),
('Experimental Mediums and Larges', 'experimental mediums and larges', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name'),
('Badgersett Hazelnut', 'badgersett hazelnut', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name'),
('Standard Hazels', 'standard hazels', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name'),
('Hybrid Hazel Seedlings', 'hybrid hazel seedlings', 'cultivar', (SELECT id FROM cultivars WHERE slug='neohybrid-hazelnut'), 'trade_name');

-- Species-level aliases
INSERT INTO aliases (alias_text, normalized_text, target_type, target_id, alias_type) VALUES
('American Hazel', 'american hazel', 'plant_entity', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'common_name'),
('American Filbert', 'american filbert', 'plant_entity', (SELECT id FROM plant_entities WHERE slug='corylus-americana'), 'common_name'),
('Beaked Hazel', 'beaked hazel', 'plant_entity', (SELECT id FROM plant_entities WHERE slug='corylus-cornuta'), 'common_name'),
('Beaked Filbert', 'beaked filbert', 'plant_entity', (SELECT id FROM plant_entities WHERE slug='corylus-cornuta'), 'common_name'),
('Chilean Hazel', 'chilean hazel', 'plant_entity', (SELECT id FROM plant_entities WHERE slug='gevuina-avellana'), 'common_name');


-- ============================================================================
-- PART 3: SEARCH INDEX (Unified — from patch)
-- ============================================================================

CREATE MATERIALIZED VIEW material_search_index AS
SELECT
  'cultivar' AS index_source,
  c.id AS entity_id, c.slug, c.canonical_name, c.material_type::text AS material_type,
  c.curation_status, pe.botanical_name, pe.canonical_name AS species_common_name, pe.genus, pe.family,
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'cultivar' AND a.target_id = c.id), '') AS aliases_text,
  (SELECT COUNT(*) FROM inventory_offers io WHERE io.cultivar_id = c.id AND io.offer_status = 'active') AS active_offer_count,
  lower(c.canonical_name) || ' ' || COALESCE(lower(pe.botanical_name), '') || ' ' || COALESCE(lower(pe.canonical_name), '') || ' ' ||
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'cultivar' AND a.target_id = c.id), '') AS search_text
FROM cultivars c LEFT JOIN plant_entities pe ON c.plant_entity_id = pe.id
WHERE c.curation_status = 'published'
UNION ALL
SELECT
  'plant_entity' AS index_source,
  pe.id AS entity_id, pe.slug, pe.canonical_name, pe.entity_type::text AS material_type,
  pe.curation_status, pe.botanical_name, pe.canonical_name AS species_common_name, pe.genus, pe.family,
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'plant_entity' AND a.target_id = pe.id), '') AS aliases_text,
  (SELECT COUNT(*) FROM inventory_offers io WHERE io.plant_entity_id = pe.id AND io.offer_status = 'active') AS active_offer_count,
  lower(pe.canonical_name) || ' ' || COALESCE(lower(pe.botanical_name), '') || ' ' ||
  COALESCE((SELECT string_agg(a.normalized_text, ' ') FROM aliases a WHERE a.target_type = 'plant_entity' AND a.target_id = pe.id), '') AS search_text
FROM plant_entities pe WHERE pe.curation_status = 'published';

CREATE INDEX idx_material_search_text_trgm ON material_search_index USING gin(search_text gin_trgm_ops);
CREATE UNIQUE INDEX idx_material_search_entity ON material_search_index(index_source, entity_id);

CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY material_search_index;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- POST-DEPLOY VERIFICATION (run these manually)
-- ============================================================================
-- SELECT count(*) FROM plant_entities;     -- expect 7
-- SELECT count(*) FROM cultivars;          -- expect 44
-- SELECT count(*) FROM nurseries;          -- expect 10
-- SELECT count(*) FROM aliases;            -- expect 17
-- SELECT count(*) FROM legal_identifiers;  -- expect 4
-- SELECT count(*) FROM material_search_index; -- expect 51 (44 cultivars + 7 plant_entities)
