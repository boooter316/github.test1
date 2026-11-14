@echo off
setlocal
title Epic Games Recovery Assistant 5.0
cd /d "%~dp0" || exit /b 1
if not exist "Epic_Games_Recovery_Assistant.exe" (
  echo The executable is missing. Building it now...
  set "BUILD_NO_PAUSE=1"
  call "%~dp0setup.bat"
  if errorlevel 1 goto :build_failed
)
if not exist "Epic_Games_Recovery_Assistant.exe" goto :missing_exe
echo Starting Epic Games Recovery Assistant...
"Epic_Games_Recovery_Assistant.exe"
set "APP_EXIT=%ERRORLEVEL%"
if not defined RUN_NO_PAUSE pause
exit /b %APP_EXIT%
:build_failed
echo The build did not complete. Install MinGW-w64/GCC and review the messages above.
if not defined RUN_NO_PAUSE pause
exit /b 1
:missing_exe
echo The executable is still missing after the build attempt.
if not defined RUN_NO_PAUSE pause
exit /b 1
