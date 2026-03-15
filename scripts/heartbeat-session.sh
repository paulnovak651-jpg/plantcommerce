#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/session-config.sh"

SESSION_ID="${1:-}"
API_BASE="${2:-$COMMAND_CENTER_DEFAULT_API_BASE}"
PARENT_PROCESS_ID="${3:-0}"
INTERVAL_SECONDS="${COMMAND_CENTER_HEARTBEAT_SECONDS:-240}"
SECRET="$(command_center_secret)"

if [ -z "$SESSION_ID" ]; then
  exit 1
fi

while true; do
  sleep "$INTERVAL_SECONDS"

  if [ "$PARENT_PROCESS_ID" -gt 0 ] && ! kill -0 "$PARENT_PROCESS_ID" 2>/dev/null; then
    exit 0
  fi

  curl -fsS --max-time 30 -X PATCH "$API_BASE/api/dashboard/sessions/$SESSION_ID" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d '{"status":"active"}' > /dev/null 2>&1 || true
done

