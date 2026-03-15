#!/usr/bin/env bash

COMMAND_CENTER_DEFAULT_API_BASE="http://localhost:3000"
COMMAND_CENTER_DEFAULT_SECRET="dev-local-secret-plantcommerce-2026"

command_center_repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  printf '%s' "$script_dir"
}

command_center_runtime_dir() {
  printf '%s/.command-center/session-runtime' "$(command_center_repo_root)"
}

command_center_ensure_runtime_dir() {
  mkdir -p "$(command_center_runtime_dir)"
}

command_center_runtime_file() {
  printf '%s/%s.pid' "$(command_center_runtime_dir)" "$1"
}

command_center_load_dotenv_value() {
  local key="$1"
  local repo_root
  repo_root="$(command_center_repo_root)"

  if [ -f "$repo_root/.env.local" ]; then
    sed -n "s/^${key}=//p" "$repo_root/.env.local" | tail -n 1 | tr -d '\r'
  fi
}

command_center_secret() {
  local secret="${ADMIN_STATUS_SECRET:-${CRON_SECRET:-}}"

  if [ -z "$secret" ]; then
    secret="$(command_center_load_dotenv_value ADMIN_STATUS_SECRET)"
  fi

  if [ -z "$secret" ]; then
    secret="$(command_center_load_dotenv_value CRON_SECRET)"
  fi

  if [ -z "$secret" ]; then
    secret="$COMMAND_CENTER_DEFAULT_SECRET"
  fi

  printf '%s' "$secret"
}

command_center_stop_heartbeat() {
  local session_id="$1"
  local runtime_file
  local heartbeat_pid

  command_center_ensure_runtime_dir
  runtime_file="$(command_center_runtime_file "$session_id")"

  if [ ! -f "$runtime_file" ]; then
    return 0
  fi

  heartbeat_pid="$(cat "$runtime_file" 2>/dev/null)"
  if [ -n "$heartbeat_pid" ] && kill -0 "$heartbeat_pid" 2>/dev/null; then
    kill "$heartbeat_pid" 2>/dev/null || true
  fi

  rm -f "$runtime_file"
}

