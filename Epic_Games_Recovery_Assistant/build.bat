@echo off
setlocal
rem One-click builder. setup.bat owns compiler detection and build errors.
cd /d "%~dp0" || exit /b 1
call "%~dp0setup.bat"
set "BUILD_EXIT=%ERRORLEVEL%"
if not "%BUILD_EXIT%"=="0" echo Build failed with exit code %BUILD_EXIT%.
exit /b %BUILD_EXIT%
