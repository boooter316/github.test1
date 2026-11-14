[CmdletBinding()]
param([switch]$SkipLaunch)
$ErrorActionPreference = 'Stop'
$ProjectRoot = $PSScriptRoot
$WebRoot = Join-Path $ProjectRoot 'web'
$AppExe = Join-Path $ProjectRoot 'Epic_Games_Recovery_Assistant.exe'

function Write-Step([string]$Text) { Write-Host ""; Write-Host "==> $Text" -ForegroundColor Cyan }
function Test-Command([string]$Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }
function Install-WingetPackage([string]$Id, [string]$Name) {
    Write-Step "Installing $Name (only if missing)"
    & winget install --id $Id --exact --source winget --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -ne 0) { throw "winget could not install $Name (exit code $LASTEXITCODE). Install it manually, then run OPEN_PROJECT.bat again." }
}
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'recovery_assistant.c++'))) { throw 'Run this setup from the extracted Epic_Games_Recovery_Assistant project folder.' }
Write-Step 'Checking Windows package manager'
if (-not (Test-Command 'winget')) {
    throw 'Windows Package Manager (winget) is missing. Install or update App Installer from Microsoft Store, restart this window, and run OPEN_PROJECT.bat again.'
}

if (-not (Test-Command 'node')) {
    Install-WingetPackage 'OpenJS.NodeJS.LTS' 'Node.js LTS'
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
}
if (-not (Test-Command 'node')) { throw 'Node.js installation completed but node.exe is not on PATH. Sign out/in or restart Windows, then retry.' }

if (-not (Test-Command 'g++')) {
    Install-WingetPackage 'MSYS2.MSYS2' 'MSYS2 (C++ build tools)'
    $bash = @('C:\msys64\usr\bin\bash.exe', 'C:\msys64\usr\bin\bash')
    $bashPath = $bash | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $bashPath) { throw 'MSYS2 was installed but its bash.exe was not found at C:\msys64. Install MSYS2 using its default location and retry.' }
    Write-Step 'Installing the GCC C++17 compiler inside MSYS2'
    & $bashPath -lc 'pacman -Sy --noconfirm && pacman -S --needed --noconfirm mingw-w64-ucrt-x86_64-gcc'
    if ($LASTEXITCODE -ne 0) { throw 'MSYS2 could not install the GCC compiler. Open the MSYS2 UCRT64 terminal, run pacman -Syu, then rerun setup.' }
    $gccBin = 'C:\msys64\ucrt64\bin'
    $userPath = [Environment]::GetEnvironmentVariable('Path','User')
    if (($userPath -split ';') -notcontains $gccBin) {
        [Environment]::SetEnvironmentVariable('Path', (($userPath.TrimEnd(';') + ';' + $gccBin).Trim(';')), 'User')
    }
    $env:Path += ';' + $gccBin
}
if (-not (Test-Command 'g++')) { throw 'g++ is still unavailable. Restart Windows so the updated PATH is loaded, then rerun OPEN_PROJECT.bat.' }

Write-Step 'Building the Windows desktop application'
Push-Location $ProjectRoot
try {
    & (Join-Path $ProjectRoot 'setup.bat')
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $AppExe)) { throw 'The C++ build did not complete. Review the compiler output above.' }
} finally { Pop-Location }

if ($SkipLaunch) {
    Write-Host 'Setup and build completed. Launch skipped by request.' -ForegroundColor Green
    exit 0
}

Write-Step 'Starting the local browser application'
$healthUrl = 'http://127.0.0.1:8080/healthz'
$alreadyRunning = $false
try { $null = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing; $alreadyRunning = $true } catch {}
if (-not $alreadyRunning) {
    $node = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $node -ArgumentList @('server.mjs') -WorkingDirectory $WebRoot -WindowStyle Minimized
    $ready = $false
    for ($i=0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        try { $null = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing; $ready = $true; break } catch {}
    }
    if (-not $ready) { throw 'The web server did not become ready at http://127.0.0.1:8080. Check whether port 8080 is already in use.' }
}
Start-Process 'http://127.0.0.1:8080'
Write-Step 'Launching the Windows desktop application'
Start-Process -FilePath $AppExe -WorkingDirectory $ProjectRoot
Write-Host 'Setup complete. Browser app: http://127.0.0.1:8080' -ForegroundColor Green
Write-Host 'Node.js and GCC are installed. No Docker installation, API keys, or external account credentials are required for local use.'
