@echo off
title Workshop Maintenance System Launcher
echo ================================================================
echo         SMART WORKSHOP MAINTENANCE SYSTEM LAUNCHER
echo ================================================================
echo.

:: 1. Free up ports 5000 and 3000 if already occupied
echo [*] Checking and freeing ports 8000, 5000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 2. Start Python ML Service
echo [*] Starting ML service on http://127.0.0.1:8000 ...
start "Bearing ML (Port 8000)" cmd /k "cd /d ""%~dp0"" && python -m uvicorn ml.api.ml_server:app --host 127.0.0.1 --port 8000"
timeout /t 5 /nobreak >nul

:: 3. Start Backend Server
echo [*] Starting Backend Server on http://localhost:5000 ...
start "Workshop Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && echo Starting Backend... && npm start"

:: 3. Brief pause for backend initialization
timeout /t 3 /nobreak >nul

:: 4. Start Frontend React Application
echo [*] Starting Frontend Server on http://localhost:3000 ...
start "Workshop Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && echo Starting Frontend... && npm start"

echo.
echo ================================================================
echo  Servers are starting in separate windows:
echo    - ML API:       http://127.0.0.1:8000/health
echo    - Frontend UI:  http://localhost:3000
echo    - Backend API:  http://localhost:5000
echo.
echo  To stop everything later, close the windows or run stop.bat
echo ================================================================
echo.
pause
