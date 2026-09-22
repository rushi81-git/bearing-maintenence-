@echo off
title Workshop Maintenance System - Shutdown
echo ================================================================
echo         STOPPING WORKSHOP MAINTENANCE SERVERS
echo ================================================================
echo.

echo [*] Stopping processes on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo     Terminated process PID %%a
)

echo [*] Stopping processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo     Terminated process PID %%a
)

echo.
echo ================================================================
echo  Servers on port 5000 and 3000 have been stopped.
echo ================================================================
echo.
pause
