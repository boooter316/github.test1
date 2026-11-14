@echo off
title Epic Games Recovery Assistant 4.3
cd /d "%~dp0"
if not exist Epic_Games_Recovery_Assistant.exe (
  echo Run build.bat or setup.bat first to build the application.
  pause
  exit /b 1
)
Epic_Games_Recovery_Assistant.exe
pause
