param(
  [string]$SessionId = $env:SESSION_ID,
  [ValidateSet("completed", "dropped")][string]$Status = "completed",
  [string]$Summary = "Session ended",
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

if (-not $SessionId) {
  Write-Error "[command-center] SESSION_ID is required (pass -SessionId or set `$env:SESSION_ID)."
  exit 1
}

$payload = @{
  status = $Status
  summary = $Summary
}

try {
  Invoke-RestMethod -Uri "$ApiBase/api/dashboard/sessions/$SessionId" -Method Patch `
    -Headers @{ Authorization = "Bearer $Secret" } `
    -TimeoutSec 30 `
    -ContentType "application/json" `
    -Body ($payload | ConvertTo-Json) | Out-Null
} catch {
  Write-Error "[command-center] Could not close session: $($_.Exception.Message)"
  exit 1
}

Write-Output "[command-center] Session $SessionId marked $Status"
