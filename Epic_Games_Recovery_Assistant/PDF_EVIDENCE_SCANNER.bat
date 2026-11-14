@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul || (echo Install Python 3 first: https://www.python.org/downloads/ & pause & exit /b 1)
py -3 -c "import pypdf" >nul 2>nul
if errorlevel 1 py -3 -m pip install --user -r requirements-pdf.txt
if errorlevel 1 (echo PDF dependency setup failed.& pause & exit /b 1)
if "%~1"=="" (echo Drag one or more PDF files onto this batch file to scan them.& pause & exit /b 0)
py -3 pdf_evidence_scanner.py %*
pause
