BEGIN;

CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cultivar_id UUID REFERENCES cultivars(id),
  plant_entity_id UUID REFERENCES plant_entities(id),
  usda_zone INT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'triggered', 'unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  triggered_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid()
);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_alerts" ON stock_alerts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_own_alerts" ON stock_alerts
  FOR SELECT TO anon USING (true);

CREATE INDEX idx_stock_alerts_cultivar ON stock_alerts(cultivar_id) WHERE status = 'active';
CREATE INDEX idx_stock_alerts_entity ON stock_alerts(plant_entity_id) WHERE status = 'active';

COMMIT;
