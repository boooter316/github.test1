@echo off
setlocal
title Epic Games Recovery Assistant 4.10 - Builder
cd /d "%~dp0" || goto :failed
where g++ >nul 2>nul
if errorlevel 1 (
  echo C++17 compiler not found. Starting the first-run dependency wizard...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_dependencies.ps1"
  if errorlevel 1 goto :no_compiler
  where g++ >nul 2>nul
  if errorlevel 1 goto :no_compiler
)
echo Building recovery_assistant.c++ with C++17...
g++ -std=c++17 -O2 -Wall -Wextra recovery_assistant.c++ -o Epic_Games_Recovery_Assistant.exe -static -static-libgcc -static-libstdc++ -lshell32 -lwinhttp -lbcrypt
if errorlevel 1 goto :build_failed
if not exist "Epic_Games_Recovery_Assistant.exe" goto :missing_output
echo Build complete: Epic_Games_Recovery_Assistant.exe
set "BUILD_EXIT=0"
goto :finish
:no_compiler
echo C++17 compiler not found. Install MinGW-w64/GCC and add g++ to PATH.
echo https://www.mingw-w64.org/
set "BUILD_EXIT=1"
goto :finish
:build_failed
echo Build failed. Review the compiler messages above.
set "BUILD_EXIT=1"
goto :finish
:missing_output
echo Compiler returned success, but the executable was not created.
set "BUILD_EXIT=1"
goto :finish
:failed
echo Could not switch to the project directory.
set "BUILD_EXIT=1"
:finish
if not defined BUILD_NO_PAUSE pause
exit /b %BUILD_EXIT%
