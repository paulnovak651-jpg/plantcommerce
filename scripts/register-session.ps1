param(
  [string]$Agent = "claude-code",
  [string]$Summary = "Starting session",
  [string]$TaskId = "",
  [string]$ApiBase = "http://localhost:3000",
  [string]$Secret = $env:ADMIN_STATUS_SECRET
)

if (-not $Secret) {
  $Secret = $env:CRON_SECRET
}

if (-not $Secret -and (Test-Path ".env.local")) {
  $envLines = Get-Content ".env.local"
  $adminLine = $envLines | Where-Object { $_ -match '^ADMIN_STATUS_SECRET=' } | Select-Object -Last 1
  $cronLine = $envLines | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -Last 1

  if ($adminLine) {
    $Secret = ($adminLine -replace '^ADMIN_STATUS_SECRET=', '').Trim()
  } elseif ($cronLine) {
    $Secret = ($cronLine -replace '^CRON_SECRET=', '').Trim()
  }
}

if (-not $Secret) {
  $Secret = "dev-local-secret-plantcommerce-2026"
}

try {
  Invoke-RestMethod -Uri "$ApiBase/api/status" -Method Get `
    -TimeoutSec 15 | Out-Null
} catch {
  Write-Error "[command-center] App not ready at $ApiBase. Start the local dev server and confirm it is responding."
  exit 1
}

$payload = @{
  agent = $Agent
  project = "plantcommerce"
  summary = $Summary
}

if ($TaskId) {
  $payload.task_id = $TaskId
}

try {
  $resp = Invoke-RestMethod -Uri "$ApiBase/api/dashboard/sessions" -Method Post `
    -Headers @{ Authorization = "Bearer $Secret" } `
    -TimeoutSec 30 `
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
