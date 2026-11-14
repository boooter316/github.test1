@echo off
rem One-click builder; the compiler logic lives in setup.bat.
cd /d "%~dp0"
call setup.bat
exit /b %ERRORLEVEL%
