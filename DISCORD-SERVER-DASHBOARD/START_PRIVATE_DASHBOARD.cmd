@echo off
setlocal
title DISCORD SERVER DASHBOARD - Private LAN
cd /d "%~dp0"
echo.
echo ================================================
echo   DISCORD SERVER DASHBOARD - PRIVATE LAN MODE
echo ================================================
echo This is a read-only static dashboard host.
echo It does not run scripts, accept uploads, or expose remote commands.
echo Keep Windows on a Private network profile.
echo.
where py >nul 2>nul
if not errorlevel 1 (
  py -3 private_lan_server.py
  goto :done
)
where python >nul 2>nul
if not errorlevel 1 (
  python private_lan_server.py
  goto :done
)
echo Python 3 was not found. Install it from https://www.python.org/downloads/
start "" "https://www.python.org/downloads/"
pause
exit /b 1
:done
echo.
echo Dashboard host stopped.
pause
