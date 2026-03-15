#!/usr/bin/env bash
# Mark a session as completed or dropped.
# Usage: bash scripts/end-session.sh "$SESSION_ID" "completed" "What was accomplished"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/session-config.sh"

SESSION_ID="${1:-$SESSION_ID}"
STATUS="${2:-completed}"
SUMMARY="${3:-Session ended}"
API_BASE="${API_BASE:-$COMMAND_CENTER_DEFAULT_API_BASE}"
SECRET="$(command_center_secret)"
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

command_center_stop_heartbeat "$SESSION_ID"

PAYLOAD="{\"status\":\"$(json_escape "$STATUS")\",\"summary\":\"$(json_escape "$SUMMARY")\"}"

curl -fsS --max-time 30 -X PATCH "$SESSION_URL" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > /dev/null 2>&1 || abort "[command-center] Could not close session via $SESSION_URL"

echo "[command-center] Session $SESSION_ID marked $STATUS"
