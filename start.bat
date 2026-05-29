@echo off
title IntelliDoc AI — Launcher
color 0A

echo.
echo  ============================================
echo    IntelliDoc AI — Starting All Services
echo  ============================================
echo.

cd /d "%~dp0"

:: ── Check Node ──────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Please install Node.js 20+
    pause & exit /b 1
)

:: ── Use venv Python if present, else fall back to py -3.11 ──────────────────
set PYTHON=py -3.11
if exist "%~dp0.venv\Scripts\python.exe" set PYTHON=%~dp0.venv\Scripts\python.exe

echo  [1/3] Starting Flask API backend on http://localhost:5000 ...
start "IntelliDoc Flask API" /D "%~dp0" cmd /c "color 0B && title IntelliDoc Flask API && %PYTHON% api.py & pause"

timeout /t 3 /nobreak >nul

echo  [2/3] Starting Telegram Bot Server...
start "IntelliDoc Telegram Bot" /D "%~dp0" cmd /c "color 0d && title IntelliDoc Telegram Bot && %PYTHON% bot_server.py & pause"

timeout /t 3 /nobreak >nul

echo  [3/3] Starting React frontend on http://localhost:3000 ...
start "IntelliDoc React Frontend" /D "%~dp0frontend" cmd /c "color 0E && title IntelliDoc React Frontend && npm run dev & pause"

timeout /t 5 /nobreak >nul

echo.
echo  ============================================
echo    All 3 services are running!
echo    - Flask API
echo    - React Frontend
echo    - Telegram Bot
echo    Open: http://localhost:3000
echo  ============================================

echo.

start "" "http://localhost:3000"
echo  Close the server windows to stop. Press any key to exit launcher...
pause >nul
