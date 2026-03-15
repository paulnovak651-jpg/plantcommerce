param(
  [string]$SessionId = $env:SESSION_ID,
  [ValidateSet("completed", "dropped")][string]$Status = "completed",
  [string]$Summary = "Session ended",
  [string]$ApiBase = "http://localhost:3000",
  [string]$Secret = $env:ADMIN_STATUS_SECRET
)

. (Join-Path $PSScriptRoot "lib/session-config.ps1")

$Secret = Get-CommandCenterSecret -PreferredSecret $Secret

if (-not $SessionId) {
  Write-Error "[command-center] SESSION_ID is required (pass -SessionId or set `$env:SESSION_ID)."
  exit 1
}

Stop-CommandCenterHeartbeat -SessionId $SessionId

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
