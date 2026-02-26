param(
  [string]$SessionId = $env:SESSION_ID,
  [ValidateSet("completed", "dropped")][string]$Status = "completed",
  [string]$Summary = "Session ended",
  [string]$ApiBase = "http://localhost:3001",
  [string]$Secret = $env:DASHBOARD_SECRET
)

if (-not $Secret) {
  $Secret = "dev-local-secret-dashboard-2026"
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
  Invoke-RestMethod -Uri "$ApiBase/api/sessions/$SessionId" -Method Patch `
    -Headers @{ Authorization = "Bearer $Secret" } `
    -ContentType "application/json" `
    -Body ($payload | ConvertTo-Json) | Out-Null
} catch {
  Write-Error "[command-center] Could not close session: $($_.Exception.Message)"
  exit 1
}

Write-Output "[command-center] Session $SessionId marked $Status"
