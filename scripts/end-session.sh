#!/usr/bin/env bash
# Mark a session as completed or dropped.
# Usage: bash scripts/end-session.sh "$SESSION_ID" "completed" "What was accomplished"

SESSION_ID="${1:-$SESSION_ID}"
STATUS="${2:-completed}"
SUMMARY="${3:-Session ended}"
SECRET="${DASHBOARD_SECRET:-dev-local-secret-dashboard-2026}"

if [ -z "$SESSION_ID" ]; then
  echo "[command-center] Error: SESSION_ID is required (pass as arg or set env var)" >&2
  exit 1
fi

curl -s -X PATCH "http://localhost:3001/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"$STATUS\",\"summary\":\"$SUMMARY\"}" > /dev/null 2>&1

echo "[command-center] Session $SESSION_ID marked $STATUS"
