@echo off
setlocal
title Epic Games Recovery Assistant 5.2.0 - C++ Builder
cd /d "%~dp0" || goto :failed
where g++ >nul 2>nul
if errorlevel 1 (
  echo C++17 compiler not found. Starting the first-run dependency wizard...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_dependencies.ps1"
  if errorlevel 1 goto :no_compiler
  where g++ >nul 2>nul
  if errorlevel 1 goto :no_compiler
)
where pdftotext.exe >nul 2>nul
if errorlevel 1 (
  echo Poppler pdftotext is required for the native C++ PDF scanner.
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_dependencies.ps1" -InstallPdfTools
  if errorlevel 1 goto :no_pdf_tools
)
echo Building recovery_assistant.c++ with C++17...
g++ -std=c++17 -O2 -Wall -Wextra recovery_assistant.c++ -o Epic_Games_Recovery_Assistant.exe -static -static-libgcc -static-libstdc++ -lshell32 -lwinhttp -lbcrypt
if errorlevel 1 goto :build_failed
echo Building paf_evidence_scanner.c++ with C++17...
g++ -std=c++17 -O2 -Wall -Wextra paf_evidence_scanner.c++ -o paf_evidence_scanner.exe -static -static-libgcc -static-libstdc++
if errorlevel 1 goto :scanner_build_failed
if not exist "Epic_Games_Recovery_Assistant.exe" goto :missing_output
if not exist "paf_evidence_scanner.exe" goto :missing_scanner
echo Build complete: both native C++ executables are ready.
set "BUILD_EXIT=0"
goto :finish
:no_compiler
echo C++17 compiler not found. Install MinGW-w64/GCC and add g++ to PATH.
set "BUILD_EXIT=1"
goto :finish
:no_pdf_tools
echo Poppler is required. Install Poppler and add pdftotext.exe to PATH, then rebuild.
set "BUILD_EXIT=1"
goto :finish
:build_failed
echo Main C++ application build failed.
set "BUILD_EXIT=1"
goto :finish
:scanner_build_failed
echo Native C++ PDF scanner build failed.
set "BUILD_EXIT=1"
goto :finish
:missing_output
echo Main executable was not created.
set "BUILD_EXIT=1"
goto :finish
:missing_scanner
echo PDF scanner executable was not created.
set "BUILD_EXIT=1"
goto :finish
:failed
echo Could not switch to the project directory.
set "BUILD_EXIT=1"
:finish
if not defined BUILD_NO_PAUSE pause
exit /b %BUILD_EXIT%
