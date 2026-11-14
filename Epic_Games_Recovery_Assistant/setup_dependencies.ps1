[CmdletBinding()]
param([switch]$InstallPdfTools)
$ErrorActionPreference = 'Stop'
if (-not $IsWindows -and $env:OS -ne 'Windows_NT') { throw 'This installer is for Windows 10/11.' }

$Gcc = Get-Command g++ -ErrorAction SilentlyContinue
$PdfText = Get-Command pdftotext.exe -ErrorAction SilentlyContinue
$NeedGcc = -not $Gcc
$NeedPdf = $InstallPdfTools -and -not $PdfText

# Do not run a full MSYS2 package update when the requested tools already exist.
if (-not $NeedGcc -and -not $NeedPdf) {
    Write-Host 'C++17 compiler and requested dependencies are already available.'
    exit 0
}

$MsysBash = 'C:\msys64\usr\bin\bash.exe'
if (-not (Test-Path -LiteralPath $MsysBash)) {
    if (-not $NeedGcc) {
        throw 'MSYS2 is required to install Poppler automatically. Install Poppler manually and add pdftotext.exe to PATH, or install MSYS2 in its default location.'
    }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'Install MSYS2 from https://www.msys2.org/, then install mingw-w64-ucrt-x86_64-gcc and mingw-w64-ucrt-x86_64-poppler in its UCRT64 terminal.'
    }
    $answer = Read-Host 'Install official MSYS2 using winget now? [Y/N]'
    if ($answer -notin @('Y','y','YES','yes')) { throw 'Compiler installation was declined.' }
    & winget install --id MSYS2.MSYS2 --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw 'MSYS2 installation failed.' }
}
if (-not (Test-Path -LiteralPath $MsysBash)) {
    throw 'MSYS2 bash.exe was not found at C:\msys64\usr\bin. Install MSYS2 in its default location, then retry.'
}

$Packages = @()
if ($NeedGcc) { $Packages += 'mingw-w64-ucrt-x86_64-gcc' }
if ($NeedPdf) { $Packages += 'mingw-w64-ucrt-x86_64-poppler' }
$PackageList = $Packages -join ' '
& $MsysBash -lc ("pacman -Syu --noconfirm && pacman -S --needed --noconfirm " + $PackageList)
if ($LASTEXITCODE -ne 0) { throw 'MSYS2 dependency installation failed.' }

$GccBin = 'C:\msys64\ucrt64\bin'
$env:Path = $GccBin + ';' + $env:Path
$UserPath = [Environment]::GetEnvironmentVariable('Path','User')
if (($UserPath -split ';') -notcontains $GccBin) {
    [Environment]::SetEnvironmentVariable('Path', (($UserPath.TrimEnd(';') + ';' + $GccBin).Trim(';')), 'User')
}
if (-not (Get-Command g++ -ErrorAction SilentlyContinue)) {
    throw 'GCC installation completed but g++ is not available on PATH. Restart the terminal and retry.'
}
if ($InstallPdfTools -and -not (Get-Command pdftotext.exe -ErrorAction SilentlyContinue)) {
    throw 'Poppler installation completed but pdftotext.exe is not available on PATH. Restart the terminal and retry.'
}
Write-Host 'C++17 compiler and requested dependencies are ready.'
