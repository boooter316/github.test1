@echo off
title Epic Games Recovery Assistant 4.6 - Builder
cd /d "%~dp0"
where g++ >nul 2>nul
if errorlevel 1 (
  echo C++17 compiler not found. Install MinGW-w64/GCC and add g++ to PATH.
  echo https://www.mingw-w64.org/
  pause
  exit /b 1
)
echo Building recovery_assistant.c++ with C++17...
g++ -std=c++17 -O2 -Wall -Wextra recovery_assistant.c++ -o Epic_Games_Recovery_Assistant.exe -static -static-libgcc -static-libstdc++ -lshell32 -lwinhttp -lbcrypt
if errorlevel 1 (
  echo Build failed. Check the compiler and source.
  pause
  exit /b 1
)
echo Build complete: Epic_Games_Recovery_Assistant.exe
pause
