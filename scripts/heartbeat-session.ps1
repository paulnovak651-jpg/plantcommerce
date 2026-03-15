param(
  [Parameter(Mandatory = $true)][string]$SessionId,
  [string]$ApiBase = "http://localhost:3000",
  [int]$ParentProcessId = 0,
  [int]$IntervalSeconds = 240
)

. (Join-Path $PSScriptRoot "lib/session-config.ps1")

$Secret = Get-CommandCenterSecret

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds

  if ($ParentProcessId -gt 0 -and -not (Get-Process -Id $ParentProcessId -ErrorAction SilentlyContinue)) {
    exit 0
  }

  try {
    Invoke-RestMethod -Uri "$ApiBase/api/dashboard/sessions/$SessionId" -Method Patch `
      -Headers @{ Authorization = "Bearer $Secret" } `
      -TimeoutSec 30 `
      -ContentType "application/json" `
      -Body '{"status":"active"}' | Out-Null
  } catch {
    # Ignore transient failures; the next loop iteration retries.
  }
}

