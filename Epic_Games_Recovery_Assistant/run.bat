@echo off
title Epic Games Recovery Assistant
py app.py
if errorlevel 1 (
  echo Could not start the application. Run setup.bat first.
  pause
)
