param(
  [string]$Agent = "claude-code",
  [string]$Summary = "Starting session",
  [string]$TaskId = "",
  [string]$ApiBase = "http://localhost:3001",
  [string]$Secret = $env:DASHBOARD_SECRET
)

if (-not $Secret) {
  $Secret = "dev-local-secret-dashboard-2026"
}

$payload = @{
  agent = $Agent
  project_slug = "plantcommerce"
  summary = $Summary
}

if ($TaskId) {
  $payload.task_id = $TaskId
}

try {
  $resp = Invoke-RestMethod -Uri "$ApiBase/api/sessions" -Method Post `
    -Headers @{ Authorization = "Bearer $Secret" } `
    -ContentType "application/json" `
    -Body ($payload | ConvertTo-Json)
} catch {
  Write-Error "[command-center] Could not register session: $($_.Exception.Message)"
  exit 1
}

$sessionId = $resp.data.id
if (-not $sessionId) {
  Write-Error "[command-center] Could not parse session id from API response."
  exit 1
}

$env:SESSION_ID = $sessionId
Write-Output "[command-center] Session registered: $sessionId  agent=$Agent"
Write-Output "SESSION_ID=$sessionId"
