# setup.ps1 — prepare the market-terminal environment on Windows.
# Idempotent: safe to run repeatedly.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host '== market-terminal setup ==' -ForegroundColor Yellow

# 1. Node version check (node:sqlite needs Node >= 24)
$nodeVersion = (& node --version) -replace '^v', ''
if (-not $nodeVersion) {
    Write-Error 'Node.js not found on PATH. Install Node 24+ from https://nodejs.org'
}
$major = [int]($nodeVersion.Split('.')[0])
if ($major -lt 24) {
    Write-Error "Node $nodeVersion found, but Node >= 24 is required (built-in node:sqlite)."
}
Write-Host "Node v$nodeVersion OK"

# 2. Install dependencies
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Write-Error 'npm install failed.' }

# 3. Ensure runtime directories exist
foreach ($dir in @('data', '.run')) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory $dir | Out-Null }
}

Write-Host ''
Write-Host 'Setup complete. Launch with: .\run.ps1' -ForegroundColor Green
