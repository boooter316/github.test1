@echo off
setlocal
title Epic Games Recovery Assistant - Native Desktop Setup
cd /d "%~dp0" || exit /b 1
echo.
echo ============================================================
echo   EPIC GAMES RECOVERY ASSISTANT - WINDOWS DESKTOP
echo ============================================================
echo This setup builds and opens the native command dashboard.
echo It does NOT install Node.js, start a web server, or open a browser.
echo Windows may ask you to approve the C++ compiler installation.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0first_run_setup.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo Setup did not finish. Read the error above, correct it, and run OPEN_PROJECT.bat again.
  pause
)
exit /b %RESULT%
