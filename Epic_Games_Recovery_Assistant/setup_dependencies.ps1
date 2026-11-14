[CmdletBinding()]
param([switch]$InstallPdfTools)
$ErrorActionPreference = 'Stop'
if (-not $IsWindows -and $env:OS -ne 'Windows_NT') { throw 'This installer is for Windows 10/11.' }
$Gcc = Get-Command g++ -ErrorAction SilentlyContinue
$MsysBash = 'C:\msys64\usr\bin\bash.exe'
if (-not $Gcc) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'Install MSYS2 from https://www.msys2.org/, then install mingw-w64-ucrt-x86_64-gcc and mingw-w64-ucrt-x86_64-poppler in its UCRT64 terminal.'
    }
    $answer = Read-Host 'Install official MSYS2 using winget now? [Y/N]'
    if ($answer -notin @('Y','y','YES','yes')) { throw 'Compiler installation was declined.' }
    & winget install --id MSYS2.MSYS2 --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw 'MSYS2 installation failed.' }
}
if (-not (Test-Path -LiteralPath $MsysBash)) {
    if ($InstallPdfTools) { throw 'MSYS2 UCRT64 is required for the automatic Poppler install. Install Poppler manually and add pdftotext.exe to PATH.' }
    throw 'MSYS2 bash.exe was not found. Install MSYS2 in its default location, then retry.'
}
$Packages = 'mingw-w64-ucrt-x86_64-gcc'
if ($InstallPdfTools) { $Packages += ' mingw-w64-ucrt-x86_64-poppler' }
& $MsysBash -lc ("pacman -Sy --noconfirm && pacman -S --needed --noconfirm " + $Packages)
if ($LASTEXITCODE -ne 0) { throw 'MSYS2 dependency installation failed.' }
$GccBin = 'C:\msys64\ucrt64\bin'
$env:Path = $GccBin + ';' + $env:Path
$UserPath = [Environment]::GetEnvironmentVariable('Path','User')
if (($UserPath -split ';') -notcontains $GccBin) {
    [Environment]::SetEnvironmentVariable('Path', (($UserPath.TrimEnd(';') + ';' + $GccBin).Trim(';')), 'User')
}
if ($InstallPdfTools -and -not (Get-Command pdftotext.exe -ErrorAction SilentlyContinue)) {
    throw 'Poppler installed but pdftotext.exe is not on the current PATH. Restart the terminal and retry.'
}
Write-Host 'C++17 compiler and requested dependencies are ready.'
