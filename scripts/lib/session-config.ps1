$CommandCenterDefaultApiBase = "http://localhost:3000"
$CommandCenterDefaultSecret = "dev-local-secret-plantcommerce-2026"

function Get-CommandCenterRepoRoot {
  (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
}

function Get-CommandCenterRuntimeDir {
  $runtimeDir = Join-Path (Get-CommandCenterRepoRoot) ".command-center\\session-runtime"
  if (-not (Test-Path $runtimeDir)) {
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
  }

  $runtimeDir
}

function Get-CommandCenterRuntimeFile {
  param(
    [Parameter(Mandatory = $true)][string]$SessionId
  )

  Join-Path (Get-CommandCenterRuntimeDir) "$SessionId.pid"
}

function Get-CommandCenterSecret {
  param(
    [string]$PreferredSecret = $env:ADMIN_STATUS_SECRET
  )

  $secret = $PreferredSecret
  if (-not $secret) {
    $secret = $env:CRON_SECRET
  }

  if (-not $secret) {
    $envPath = Join-Path (Get-CommandCenterRepoRoot) ".env.local"
    if (Test-Path $envPath) {
      $envLines = Get-Content $envPath
      $adminLine = $envLines | Where-Object { $_ -match '^ADMIN_STATUS_SECRET=' } | Select-Object -Last 1
      $cronLine = $envLines | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -Last 1

      if ($adminLine) {
        $secret = ($adminLine -replace '^ADMIN_STATUS_SECRET=', '').Trim()
      } elseif ($cronLine) {
        $secret = ($cronLine -replace '^CRON_SECRET=', '').Trim()
      }
    }
  }

  if (-not $secret) {
    $secret = $CommandCenterDefaultSecret
  }

  $secret
}

function Stop-CommandCenterHeartbeat {
  param(
    [Parameter(Mandatory = $true)][string]$SessionId
  )

  $runtimeFile = Get-CommandCenterRuntimeFile -SessionId $SessionId
  if (-not (Test-Path $runtimeFile)) {
    return
  }

  $heartbeatPidLine = Get-Content $runtimeFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $heartbeatPid = if ($heartbeatPidLine) { $heartbeatPidLine.Trim() } else { "" }
  if ($heartbeatPid) {
    $proc = Get-Process -Id $heartbeatPid -ErrorAction SilentlyContinue
    if ($proc) {
      Stop-Process -Id $heartbeatPid -ErrorAction SilentlyContinue
    }
  }

  Remove-Item $runtimeFile -Force -ErrorAction SilentlyContinue
}
