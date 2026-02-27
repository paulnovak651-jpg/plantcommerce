BEGIN;

-- Track when each nursery was last successfully scraped
ALTER TABLE nurseries
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_scrape_offer_count INT DEFAULT 0;

-- Track price changes
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES inventory_offers(id),
  price_cents_old INT,
  price_cents_new INT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_offer ON price_history(offer_id);
CREATE INDEX idx_price_history_detected ON price_history(detected_at);

COMMIT;

