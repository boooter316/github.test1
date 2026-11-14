@echo off
title Epic Games Recovery Assistant Setup
echo Installing dependencies...
py -m pip install --upgrade pip
if errorlevel 1 (
  echo Python or pip was not found. Install Python from https://www.python.org/downloads/
  pause
  exit /b 1
)
py -m pip install -r requirements.txt
if errorlevel 1 (
  echo Dependency installation failed.
  pause
  exit /b 1
)
echo Installation complete. Starting application...
py app.py
pause
