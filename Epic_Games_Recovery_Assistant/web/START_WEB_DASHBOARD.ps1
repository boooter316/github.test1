$ErrorActionPreference = "Stop"
$webRoot = $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "Node.js 26 LTS or newer is required."; exit 1 }
$username = Read-Host "Dashboard username"
$securePassword = Read-Host "Dashboard password" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try { $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrEmpty($plainPassword)) { Write-Error "Username and password are required."; exit 1 }
$env:DASHBOARD_USERNAME = $username
$env:DASHBOARD_PASSWORD = $plainPassword
$env:WEB_ROOT = $webRoot
$env:PORT = "8080"
Write-Host "Starting the protected dashboard at http://127.0.0.1:8080" -ForegroundColor Green
Write-Host "Keep this window open while using the dashboard. Press Ctrl+C to stop it."
try { & node (Join-Path $webRoot "server.mjs") }
finally { Remove-Item Env:DASHBOARD_USERNAME -ErrorAction SilentlyContinue; Remove-Item Env:DASHBOARD_PASSWORD -ErrorAction SilentlyContinue; $plainPassword = $null }
