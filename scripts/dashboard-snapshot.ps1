param(
  [string]$ApiUrl = "http://localhost:3000/api/dashboard"
)

try {
  $resp = Invoke-RestMethod -Uri $ApiUrl -Method Get -TimeoutSec 15
} catch {
  Write-Error "[dashboard] Failed to fetch $ApiUrl : $($_.Exception.Message)"
  exit 1
}

$tasks = @($resp.data.tasks)
$activeSessions = @($resp.data.activeSessions)
$droppedSessions = @($resp.data.droppedSessions)

$todoCount = @($tasks | Where-Object { $_.status -eq "todo" }).Count
$inProgressCount = @($tasks | Where-Object { $_.status -eq "in_progress" }).Count
$doneCount = @($tasks | Where-Object { $_.status -eq "done" }).Count

Write-Output ("snapshot_utc={0}" -f (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("tasks_total={0} todo={1} in_progress={2} done={3}" -f $tasks.Count, $todoCount, $inProgressCount, $doneCount)
Write-Output ("sessions_active={0} sessions_dropped={1}" -f $activeSessions.Count, $droppedSessions.Count)

Write-Output "open_tasks:"
$tasks |
  Where-Object { $_.status -ne "done" } |
  Sort-Object priority, created_at |
  ForEach-Object {
    Write-Output ("P{0} [{1}] {2}" -f $_.priority, $_.status, $_.title)
  }

if ($droppedSessions.Count -gt 0) {
  Write-Output "dropped_sessions:"
  $droppedSessions | ForEach-Object {
    Write-Output ("{0} {1} {2}" -f $_.started_at, $_.agent, $_.summary)
  }
}
