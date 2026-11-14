@echo off
title Epic Games Recovery Assistant 3.3 - Build
cd /d "%~dp0"
where g++ >nul 2>nul
if errorlevel 1 (
  echo C++17 compiler not found. Install MinGW-w64/GCC and add g++ to PATH.
  echo https://www.mingw-w64.org/
  pause
  exit /b 1
)
echo Building C++17 application...
g++ -std=c++17 -O2 -Wall -Wextra recovery_assistant.cpp -o recovery_assistant.exe -lshell32
if errorlevel 1 (
  echo Build failed. Check the compiler and source.
  pause
  exit /b 1
)
echo Build complete: recovery_assistant.exe
pause
