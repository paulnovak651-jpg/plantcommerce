#!/usr/bin/env bash
# Register an agent session with the Command Center.
# Usage: source scripts/register-session.sh "claude-code" "Starting X" [task-uuid]
# On success, exports SESSION_ID to the current shell.

AGENT="${1:-claude-code}"
SUMMARY="${2:-Starting session}"
TASK_ID="${3:-}"
SECRET="${DASHBOARD_SECRET:-dev-local-secret-dashboard-2026}"

PAYLOAD="{\"agent\":\"$AGENT\",\"project_slug\":\"plantcommerce\",\"summary\":\"$SUMMARY\""
if [ -n "$TASK_ID" ]; then
  PAYLOAD="$PAYLOAD,\"task_id\":\"$TASK_ID\""
fi
PAYLOAD="$PAYLOAD}"

RESPONSE=$(curl -s -X POST "http://localhost:3001/api/sessions" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null)

SESSION_ID=$(echo "$RESPONSE" | node -e \
  "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);console.log(r.data?.id||'')}catch{console.log('')}})" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "[command-center] Warning: Could not register session (is dashboard running on port 3001?)" >&2
else
  export SESSION_ID
  echo "[command-center] Session registered: $SESSION_ID  agent=$AGENT"
fi
