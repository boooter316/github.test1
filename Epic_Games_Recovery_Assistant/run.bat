@echo off
title Epic Games Recovery Assistant 3.3
cd /d "%~dp0"
if not exist recovery_assistant.exe (
  echo Run setup.bat first to build the application.
  pause
  exit /b 1
)
recovery_assistant.exe
pause
