# Status API Contract

This document defines the integration contract for machine-readable status endpoints.

## Endpoints

### `GET /api/status`

- Auth: none
- Purpose: safe public summary for agents/monitoring
- Response envelope: `{ ok, data, meta?, links? }`

Data shape:

```json
{
  "app": "plantcommerce",
  "env": "development|preview|production|local",
  "git_sha": "string|null",
  "time_utc": "ISO-8601 string",
  "counts": {
    "inventory_offers": "number|null",
    "nurseries": "number|null",
    "unmatched_pending": "number|null"
  },
  "pipeline": {
    "last_import_run": {
      "id": "uuid",
      "started_at": "ISO-8601 string",
      "completed_at": "ISO-8601 string|null",
      "status": "string",
      "rows_total": "number|null",
      "rows_resolved": "number|null",
      "rows_unmatched": "number|null"
    }
  },
  "dashboard": {
    "tasks": {
      "todo": "number|null",
      "in_progress": "number|null",
      "blocked": "number|null",
      "done": "number|null"
    },
    "sessions": {
      "active": "number",
      "dropped": "number"
    }
  }
}
```

### `GET /api/admin/status`

- Auth: `Authorization: Bearer <ADMIN_STATUS_SECRET>`
- Fallback auth secret: `CRON_SECRET` (if `ADMIN_STATUS_SECRET` is not set)
- Purpose: protected status surface for internal automation tools
- Data payload: same shape as `GET /api/status`

## Error Behavior

- `401 UNAUTHORIZED`: missing/invalid bearer token on `/api/admin/status`
- `503 SERVER_MISCONFIG`: required env vars are missing
- `500 SERVER_ERROR`: unexpected runtime failure

## Stability Rules

- Keep top-level keys stable: `app`, `env`, `git_sha`, `time_utc`, `counts`, `pipeline`, `dashboard`
- Additive changes only unless versioning is introduced
- Do not include secrets, raw credentials, or privileged per-row details

