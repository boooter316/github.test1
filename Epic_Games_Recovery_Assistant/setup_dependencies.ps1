[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
if (-not $IsWindows -and $env:OS -ne 'Windows_NT') { throw 'This installer is for Windows 10/11.' }
$ProjectRoot = $PSScriptRoot
$Gcc = Get-Command g++ -ErrorAction SilentlyContinue
if (-not $Gcc) {
    $knownGcc = @('C:\msys64\ucrt64\bin\g++.exe','C:\msys64\mingw64\bin\g++.exe')
    $GccPath = $knownGcc | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $GccPath) {
        Write-Host 'A C++17 compiler (g++) is required to build the Windows desktop app.'
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            throw 'Windows Package Manager (winget) is unavailable. Install MSYS2 from https://www.msys2.org/, then run its UCRT64 terminal and install mingw-w64-ucrt-x86_64-gcc.'
        }
        $answer = Read-Host 'Install the official MSYS2 package using winget now? [Y/N]'
        if ($answer -notin @('Y','y','YES','yes')) { throw 'Compiler installation was declined. No changes were made.' }
        & winget install --id MSYS2.MSYS2 --exact --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) { throw 'MSYS2 installation failed or was cancelled. Review winget output and retry.' }
        $bash = 'C:\msys64\usr\bin\bash.exe'
        if (-not (Test-Path -LiteralPath $bash)) { throw 'MSYS2 was installed in a non-default location. Open its UCRT64 terminal and install mingw-w64-ucrt-x86_64-gcc, then rerun START_HERE.bat.' }
        Write-Host 'Installing the GCC toolchain inside MSYS2...'
        & $bash -lc 'pacman -S --needed --noconfirm mingw-w64-ucrt-x86_64-gcc'
        if ($LASTEXITCODE -ne 0) { throw 'GCC package installation failed. Open the MSYS2 UCRT64 terminal and retry the package installation.' }
        $GccPath = 'C:\msys64\ucrt64\bin\g++.exe'
    }
    if (Test-Path -LiteralPath $GccPath) {
        $GccBin = Split-Path -Parent $GccPath
        $env:Path = $GccBin + ';' + $env:Path
        $UserPath = [Environment]::GetEnvironmentVariable('Path','User')
        if (($UserPath -split ';') -notcontains $GccBin) {
            [Environment]::SetEnvironmentVariable('Path', (($UserPath.TrimEnd(';') + ';' + $GccBin).Trim(';')), 'User')
        }
    }
}
$Gcc = Get-Command g++ -ErrorAction SilentlyContinue
if (-not $Gcc) { throw 'g++ is still unavailable. Restart the terminal and run START_HERE.bat again.' }
Write-Host ('Compiler ready: ' + (& g++ --version | Select-Object -First 1))
Write-Host 'The Windows desktop build uses the existing project source and build.bat.'
Write-Host ''
Write-Host 'Dependency check complete. Native Windows desktop build only.'
