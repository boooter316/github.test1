@echo off
setlocal
title Epic Games Recovery Assistant - First Run Setup
cd /d "%~dp0" || exit /b 1
echo This launcher checks and installs missing prerequisites, builds the app,
echo starts the local web server, and opens both project interfaces.
echo Windows may ask you to approve package installations.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0first_run_setup.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo Setup did not finish. Read the error above, correct it, and run OPEN_PROJECT.bat again.
  pause
)
exit /b %RESULT%
