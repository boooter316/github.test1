@echo off
setlocal
cd /d "%~dp0"
if not exist "paf_evidence_scanner.exe" (
  echo Native C++ scanner is not built. Run build.bat first.
  pause
  exit /b 1
)
if "%~1"=="" (
  echo Drag one or more PDF files onto this batch file to scan them.
  pause
  exit /b 0
)
where pdftotext.exe >nul 2>nul
if errorlevel 1 (
  echo Poppler pdftotext.exe is required. Run setup_dependencies.ps1 or install Poppler and add its bin folder to PATH.
  pause
  exit /b 1
)
paf_evidence_scanner.exe %*
pause
