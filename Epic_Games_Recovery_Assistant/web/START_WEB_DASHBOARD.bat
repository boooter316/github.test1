@echo off
setlocal
title Recovery Assistant - Secure Web Dashboard
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_WEB_DASHBOARD.ps1"
pause
