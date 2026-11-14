@echo off
setlocal
title Recovery Assistant - First Run Setup
cd /d "%~dp0" || exit /b 1
echo.
echo ==============================================
echo   Recovery Assistant - First Run Setup
echo ==============================================
echo This wizard checks and installs the C++ build tools
echo after asking for your approval.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_dependencies.ps1"
if errorlevel 1 goto :failed
echo.
echo Building the Windows application...
call "%~dp0build.bat"
if errorlevel 1 goto :failed
echo.
echo Setup complete. Starting the application...
call "%~dp0run.bat"
exit /b %ERRORLEVEL%
:failed
echo.
echo Setup did not complete. Read the message above; no project source was removed.
pause
exit /b 1
