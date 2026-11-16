@echo off
setlocal
title Recovery Assistant - Desktop Dashboard
cd /d "%~dp0" || exit /b 1
echo.
echo ==============================================
echo   RECOVERY ASSISTANT - DESKTOP DASHBOARD
echo ==============================================
echo This opens the native Windows C++ command dashboard.
echo It does NOT start Node.js, a web server, or a browser.
echo.
if exist "%~dp0Epic_Games_Recovery_Assistant.exe" goto :launch
if exist "%~dp0FIRST_RUN_SETUP.bat" (
  echo The desktop app has not been built yet. Starting first-run setup...
  call "%~dp0FIRST_RUN_SETUP.bat"
  exit /b %ERRORLEVEL%
)
echo The desktop executable is missing from this download.
echo Download the complete project ZIP or the Windows Desktop Bundle from GitHub Actions.
pause
exit /b 1
:launch
"%~dp0Epic_Games_Recovery_Assistant.exe"
set "APP_EXIT=%ERRORLEVEL%"
echo.
echo Desktop dashboard closed with exit code %APP_EXIT%.
if not defined DASHBOARD_NO_PAUSE pause
exit /b %APP_EXIT%
