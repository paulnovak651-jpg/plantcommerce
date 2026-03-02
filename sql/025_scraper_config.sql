BEGIN;

ALTER TABLE nurseries
  ADD COLUMN scraper_type TEXT DEFAULT NULL,
  ADD COLUMN scraper_config JSONB DEFAULT NULL;

ALTER TABLE nurseries
  ADD CONSTRAINT valid_scraper_type
  CHECK (scraper_type IN ('shopify', 'woocommerce', 'custom') OR scraper_type IS NULL);

COMMENT ON COLUMN nurseries.scraper_type IS
  'Platform type used to select the generic scraper. NULL means not yet configured for scraping.';

COMMENT ON COLUMN nurseries.scraper_config IS
  'Platform-specific config (e.g. {"domain":"example.com","collections":["/collections/nuts"]}). Only used by generic scrapers.';

UPDATE nurseries
SET scraper_type = 'custom'
WHERE slug IN ('burnt-ridge-nursery', 'grimo-nut-nursery', 'raintree-nursery');

COMMIT;
