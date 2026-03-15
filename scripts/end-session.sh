#!/usr/bin/env bash
# Mark a session as completed or dropped.
# Usage: bash scripts/end-session.sh "$SESSION_ID" "completed" "What was accomplished"

SESSION_ID="${1:-$SESSION_ID}"
STATUS="${2:-completed}"
SUMMARY="${3:-Session ended}"
API_BASE="${API_BASE:-http://localhost:3000}"

load_dotenv_value() {
  local key="$1"
  if [ -f .env.local ]; then
    sed -n "s/^${key}=//p" .env.local | tail -n 1 | tr -d '\r'
  fi
}

ENV_ADMIN_STATUS_SECRET="${ENV_ADMIN_STATUS_SECRET:-$(load_dotenv_value ADMIN_STATUS_SECRET)}"
ENV_CRON_SECRET="${ENV_CRON_SECRET:-$(load_dotenv_value CRON_SECRET)}"
SECRET="${ADMIN_STATUS_SECRET:-${ENV_ADMIN_STATUS_SECRET:-${CRON_SECRET:-${ENV_CRON_SECRET:-dev-local-secret-plantcommerce-2026}}}}"
SESSION_URL="$API_BASE/api/dashboard/sessions/$SESSION_ID"

abort() {
  echo "$1" >&2
  return 1 2>/dev/null || exit 1
}

json_escape() {
  local value="$1"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  value=${value//$'\t'/\\t}
  printf '%s' "$value"
}

if [ -z "$SESSION_ID" ]; then
  abort "[command-center] Error: SESSION_ID is required (pass as arg or set env var)"
fi

PAYLOAD="{\"status\":\"$(json_escape "$STATUS")\",\"summary\":\"$(json_escape "$SUMMARY")\"}"

curl -fsS --max-time 30 -X PATCH "$SESSION_URL" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > /dev/null 2>&1 || abort "[command-center] Could not close session via $SESSION_URL"

echo "[command-center] Session $SESSION_ID marked $STATUS"
