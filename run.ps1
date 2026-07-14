# run.ps1 — launch the market terminal and open the browser.
#   .\run.ps1        -> dev mode: API on :4780 + Vite dev server on :5173 (hot reload)
#   .\run.ps1 -Prod  -> prod mode: build client once, serve everything from :4780
param(
    [switch]$Prod
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$apiPort = 4780
$webPort = 5173

function Test-PortListening([int]$Port) {
    $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-ForPort([int]$Port, [string]$Label, [int]$TimeoutSec = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortListening $Port) { return $true }
        Start-Sleep -Milliseconds 500
    }
    Write-Warning "$Label did not start listening on :$Port within ${TimeoutSec}s. Check .run\ logs."
    return $false
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'node_modules missing — running setup.ps1 first...' -ForegroundColor Yellow
    & .\setup.ps1
}
if (-not (Test-Path '.run')) { New-Item -ItemType Directory '.run' | Out-Null }

if (Test-PortListening $apiPort) {
    Write-Host "API already listening on :$apiPort — reusing it. (Use .\stop.ps1 to restart cleanly.)"
} else {
    if ($Prod) {
        Write-Host 'Building client...' -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) { Write-Error 'client build failed.' }
    }
    Write-Host "Starting API server on :$apiPort ..."
    $p = Start-Process cmd.exe -ArgumentList '/c', "npm run dev:server >> .run\server.log 2>&1" `
        -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
    $p.Id | Out-File .run\server.pid -Encoding ascii
    if (-not (Wait-ForPort $apiPort 'API server')) { exit 1 }
}

if ($Prod) {
    $url = "http://localhost:$apiPort"
} else {
    if (Test-PortListening $webPort) {
        Write-Host "Vite already listening on :$webPort — reusing it."
    } else {
        Write-Host "Starting Vite dev server on :$webPort ..."
        $p = Start-Process cmd.exe -ArgumentList '/c', "npm run dev:client >> .run\client.log 2>&1" `
            -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
        $p.Id | Out-File .run\client.pid -Encoding ascii
        if (-not (Wait-ForPort $webPort 'Vite dev server')) { exit 1 }
    }
    $url = "http://localhost:$webPort"
}

Write-Host "market-terminal running at $url" -ForegroundColor Green
Start-Process $url
