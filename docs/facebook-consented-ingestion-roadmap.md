# Future Project: Facebook Consented Ingestion

> Status: Future backlog (not in current sprint)
> Goal: Bring Facebook reach into PlantCommerce without scraping, policy risk, or data-quality regression.

---

## Problem

Users already post WTS/WTB plant material on Facebook. PlantCommerce can ingest those posts only through official, consent-based Meta integrations and then run them through the same quality gates as native listings.

---

## Non-Negotiable Guardrails

1. Official Meta APIs and webhooks only.
2. No scraping, no crawler-based collection, no unauthorized harvesting.
3. Explicit user/page consent via OAuth before any ingestion.
4. Every imported record is tagged with source provenance.
5. Imported records must pass PlantCommerce quality gates:
   - schema validation
   - resolver validation
   - trust-tier moderation

---

## High-Level Architecture

1. User connects Facebook in PlantCommerce settings.
2. PlantCommerce stores encrypted tokens and subscribed webhook state.
3. Webhook events or sync pulls create `pending_import` jobs.
4. Ingestion worker normalizes source content into listing payloads.
5. Listing payload runs through v2 pipeline (`schema -> resolver -> trust tier`).
6. Result is either auto-published or queued for moderation.

---

## Data/Model Additions (v2+)

- `external_sources`:
  - `id`, `user_id`, `platform` (`facebook`), `external_account_id`, `status`, `scopes`, `connected_at`
- `external_import_jobs`:
  - `id`, `source_id`, `external_post_id`, `payload_raw`, `ingest_status`, `error`, `created_at`
- Listing provenance fields:
  - `source_platform`, `source_external_id`, `source_url`, `source_synced_at`

---

## API Surface (future)

- `POST /api/integrations/facebook/connect` - start OAuth flow.
- `GET /api/integrations/facebook/callback` - exchange code, save tokens.
- `POST /api/webhooks/facebook` - verified webhook receiver.
- `POST /api/integrations/facebook/sync` - manual backfill/sync for connected accounts.

All write paths stay internal to listing ingestion pipeline.

---

## Security and Compliance Requirements

1. Verify webhook signatures on every request.
2. Encrypt access tokens at rest; rotate and revoke safely.
3. Least-privilege scopes only.
4. Idempotent ingestion keyed by `external_post_id`.
5. Rate limits per user/source to prevent abuse.
6. Full audit trail for import decisions and moderation outcomes.
7. Kill switch to disable Facebook ingestion quickly.

---

## Delivery Sequence (after core v2 is stable)

1. Policy and scope discovery (what endpoints/permissions are currently approved for our use case).
2. OAuth connect/disconnect + token storage.
3. Webhook endpoint with signature verification.
4. Import queue + normalization adapter.
5. Resolver + trust-tier integration.
6. Admin monitoring panel for import errors and moderation flow.

---

## Success Criteria

- Imported posts never bypass moderation/quality gates.
- Zero unauthorized data collection patterns.
- All imported listings retain source traceability.
- Clear operational visibility in Command Center and status endpoints.
