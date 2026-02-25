-- ============================================================================
-- MIGRATION 002: Taxonomy Tree
-- Adds hierarchical taxonomy for "where does this plant sit in the kingdom?"
-- visualization. Self-referential tree from Kingdom down to Genus.
-- 
-- Designed so plant_entities link into the tree at the genus level,
-- and the UI can walk upward to show lineage.
-- ============================================================================

BEGIN;

-- The ranks themselves (reference data, rarely changes)
CREATE TABLE IF NOT EXISTS taxonomy_ranks (
  id            SERIAL PRIMARY KEY,
  rank_name     TEXT UNIQUE NOT NULL,  -- 'kingdom', 'division', 'class', 'order', 'family', 'genus'
  rank_level    INTEGER NOT NULL,       -- 1=kingdom, 2=division, ... 6=genus (for sort order)
  display_name  TEXT NOT NULL            -- 'Kingdom', 'Division', etc.
);

INSERT INTO taxonomy_ranks (rank_name, rank_level, display_name) VALUES
  ('kingdom',  1, 'Kingdom'),
  ('division', 2, 'Division'),
  ('class',    3, 'Class'),
  ('order',    4, 'Order'),
  ('family',   5, 'Family'),
  ('genus',    6, 'Genus')
ON CONFLICT (rank_name) DO NOTHING;

-- The tree nodes — each node has a parent (except the root)
CREATE TABLE IF NOT EXISTS taxonomy_nodes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank_id         INTEGER NOT NULL REFERENCES taxonomy_ranks(id),
  name            TEXT NOT NULL,            -- e.g. 'Corylus', 'Betulaceae', 'Fagales'
  botanical_name  TEXT,                     -- full botanical if relevant
  common_name     TEXT,                     -- e.g. 'Birch family' for Betulaceae
  parent_id       UUID REFERENCES taxonomy_nodes(id),
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  notable_for_permaculture BOOLEAN DEFAULT FALSE,
  display_order   INTEGER DEFAULT 0,        -- for sibling sorting
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_taxonomy_slug CHECK (length(trim(slug)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_nodes_parent ON taxonomy_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_nodes_rank ON taxonomy_nodes(rank_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_nodes_slug ON taxonomy_nodes(slug);
CREATE INDEX IF NOT EXISTS idx_taxonomy_nodes_name ON taxonomy_nodes(name);

-- Link plant_entities to their genus node in the taxonomy tree
-- This is a nullable FK so existing data isn't broken
ALTER TABLE plant_entities 
  ADD COLUMN IF NOT EXISTS taxonomy_node_id UUID REFERENCES taxonomy_nodes(id);

CREATE INDEX IF NOT EXISTS idx_plant_entities_taxonomy ON plant_entities(taxonomy_node_id);

-- Trigger for updated_at
CREATE TRIGGER trg_taxonomy_nodes_updated 
  BEFORE UPDATE ON taxonomy_nodes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read
ALTER TABLE taxonomy_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read taxonomy_ranks" ON taxonomy_ranks FOR SELECT USING (true);
CREATE POLICY "Public read taxonomy_nodes" ON taxonomy_nodes FOR SELECT USING (true);

-- ============================================================================
-- Recursive CTE helper: get full lineage path for any node
-- Usage: SELECT * FROM get_taxonomy_path('node-uuid-here');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_path(leaf_node_id UUID)
RETURNS TABLE (
  node_id UUID,
  rank_name TEXT,
  rank_level INTEGER,
  node_name TEXT,
  common_name TEXT,
  slug TEXT
) AS $$
  WITH RECURSIVE lineage AS (
    SELECT tn.id, tr.rank_name, tr.rank_level, tn.name, tn.common_name, tn.slug, tn.parent_id
    FROM taxonomy_nodes tn
    JOIN taxonomy_ranks tr ON tn.rank_id = tr.id
    WHERE tn.id = leaf_node_id
    
    UNION ALL
    
    SELECT tn.id, tr.rank_name, tr.rank_level, tn.name, tn.common_name, tn.slug, tn.parent_id
    FROM taxonomy_nodes tn
    JOIN taxonomy_ranks tr ON tn.rank_id = tr.id
    JOIN lineage l ON tn.id = l.parent_id
  )
  SELECT lineage.id, lineage.rank_name, lineage.rank_level, lineage.name, lineage.common_name, lineage.slug
  FROM lineage
  ORDER BY lineage.rank_level ASC;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- Get siblings at any rank (for "also in this family" displays)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_taxonomy_siblings(node_id_param UUID)
RETURNS TABLE (
  sibling_id UUID,
  name TEXT,
  common_name TEXT,
  slug TEXT,
  notable_for_permaculture BOOLEAN
) AS $$
  SELECT tn.id, tn.name, tn.common_name, tn.slug, tn.notable_for_permaculture
  FROM taxonomy_nodes tn
  WHERE tn.parent_id = (SELECT parent_id FROM taxonomy_nodes WHERE id = node_id_param)
    AND tn.id != node_id_param
  ORDER BY tn.display_order, tn.name;
$$ LANGUAGE sql STABLE;

COMMENT ON TABLE taxonomy_ranks IS 'Reference table for taxonomic rank hierarchy (Kingdom → Genus).';
COMMENT ON TABLE taxonomy_nodes IS 'Hierarchical tree of life nodes. Each plant_entity links to its genus node. Walk upward for lineage display.';
COMMENT ON FUNCTION get_taxonomy_path IS 'Returns full taxonomic lineage from any node up to Kingdom. Used for breadcrumb/lineage visualizations.';
COMMENT ON FUNCTION get_taxonomy_siblings IS 'Returns sibling nodes at the same rank. Used for "also in this family" displays.';

COMMIT;
