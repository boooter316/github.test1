$ErrorActionPreference = "Stop"
$webRoot = $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "Node.js 26 LTS or newer is required."; exit 1 }
$env:WEB_ROOT = $webRoot
$env:PORT = "8080"
$env:DASHBOARD_USERS_FILE = Join-Path $webRoot ".dashboard-users.json"
Write-Host "Starting the protected dashboard at http://127.0.0.1:8080" -ForegroundColor Green
Write-Host "On first launch, choose Register to create the owner account. Later launches use Sign in."
Write-Host "Keep this window open while using the dashboard. Press Ctrl+C to stop it."
& node (Join-Path $webRoot "server.mjs")
