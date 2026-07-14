# stop.ps1 — stop all market-terminal processes cleanly.
# Kills whatever listens on the app ports (authoritative), then cleans pid files.
$ErrorActionPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

$ports = @(4780, 5173)
$stopped = 0

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($procId in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping $($proc.ProcessName) (pid $procId) on :$port"
            Stop-Process -Id $procId -Force -Confirm:$false
            $stopped++
        }
    }
}

# Backup: pid files written by run.ps1 (cmd.exe wrappers whose children may linger)
foreach ($pidFile in @('.run\server.pid', '.run\client.pid')) {
    if (Test-Path $pidFile) {
        $procId = Get-Content $pidFile
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $procId -Force -Confirm:$false
            $stopped++
        }
        Remove-Item $pidFile -Force
    }
}

if ($stopped -eq 0) {
    Write-Host 'Nothing was running.'
} else {
    Write-Host "Stopped $stopped process(es)." -ForegroundColor Green
}
