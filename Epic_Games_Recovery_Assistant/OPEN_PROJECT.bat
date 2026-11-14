@echo off
setlocal
cd /d "%~dp0" || exit /b 1
call "%~dp0FIRST_RUN_SETUP.bat"
exit /b %ERRORLEVEL%
