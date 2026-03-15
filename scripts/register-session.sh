#!/usr/bin/env bash
# Register an agent session with the Command Center.
# Usage: source scripts/register-session.sh "claude-code" "Starting X" [task-uuid]
# On success, exports SESSION_ID to the current shell.

AGENT="${1:-claude-code}"
SUMMARY="${2:-Starting session}"
TASK_ID="${3:-}"
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
STATUS_URL="$API_BASE/api/status"
SESSION_URL="$API_BASE/api/dashboard/sessions"

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

if ! curl -fsS --max-time 15 "$STATUS_URL" > /dev/null 2>&1; then
  abort "[command-center] App not ready at $API_BASE. Start the app and confirm the local dev server is responding."
fi

PAYLOAD="{\"agent\":\"$(json_escape "$AGENT")\",\"project\":\"plantcommerce\",\"summary\":\"$(json_escape "$SUMMARY")\""
if [ -n "$TASK_ID" ]; then
  PAYLOAD="$PAYLOAD,\"task_id\":\"$(json_escape "$TASK_ID")\""
fi
PAYLOAD="$PAYLOAD}"

RESPONSE=$(curl -fsS --max-time 30 -X POST "$SESSION_URL" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null) || abort "[command-center] Session registration failed against $SESSION_URL"

SESSION_ID=$(printf '%s' "$RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)

if [ -z "$SESSION_ID" ]; then
  abort "[command-center] Could not parse a session id from $SESSION_URL"
else
  export SESSION_ID
  echo "[command-center] Session registered: $SESSION_ID  agent=$AGENT"
fi
