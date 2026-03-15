param(
  [string]$Agent = "claude-code",
  [string]$Summary = "Starting session",
  [string]$TaskId = "",
  [string]$ApiBase = "http://localhost:3000",
  [string]$Secret = $env:ADMIN_STATUS_SECRET
)

. (Join-Path $PSScriptRoot "lib/session-config.ps1")

$Secret = Get-CommandCenterSecret -PreferredSecret $Secret

try {
  Invoke-RestMethod -Uri "$ApiBase/api/ready" -Method Get `
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
$runtimeFile = Get-CommandCenterRuntimeFile -SessionId $sessionId
$heartbeatScript = Join-Path $PSScriptRoot "heartbeat-session.ps1"
$heartbeatProc = Start-Process -FilePath "powershell.exe" `
  -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $heartbeatScript,
    "-SessionId", $sessionId,
    "-ApiBase", $ApiBase,
    "-ParentProcessId", $PID
  ) `
  -WindowStyle Hidden `
  -PassThru

$heartbeatProc.Id | Set-Content $runtimeFile
$env:SESSION_HEARTBEAT_PID = [string]$heartbeatProc.Id
Write-Output "[command-center] Session registered: $sessionId  agent=$Agent"
Write-Output "[command-center] Heartbeat started: pid=$($heartbeatProc.Id)"
Write-Output "SESSION_ID=$sessionId"
