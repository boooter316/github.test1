@echo off
setlocal
title Epic Games Recovery Assistant - Native Windows Dashboard
cd /d "%~dp0" || exit /b 1
call "%~dp0FIRST_RUN_SETUP.bat"
exit /b %ERRORLEVEL%
