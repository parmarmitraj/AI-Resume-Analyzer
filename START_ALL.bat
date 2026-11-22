@echo off
title AI Resume Analyzer - Dev Server Launcher
color 0A

echo.
echo  ============================================
echo   AI Resume Analyzer — Starting All Servers
echo  ============================================
echo.

cd /d "%~dp0"

:: ── 1. FastAPI (Python ML Backend) on port 8000 ──────────────────────────
echo  [1/3] Starting FastAPI (BiLSTM + TF-IDF) on port 8000...
start "FastAPI :8000" cmd /k "cd /d "%~dp0" && set TF_CPP_MIN_LOG_LEVEL=2 && set TF_ENABLE_ONEDNN_OPTS=0 && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait for model to load
timeout /t 3 /nobreak >nul

:: ── 2. Node.js Backend (Auth + Jobs) on port 5000 ─────────────────────────
echo  [2/3] Starting Node.js backend (Auth + Jobs) on port 5000...
start "Node.js :5000" cmd /k "cd /d "%~dp0backend" && npm start"

timeout /t 2 /nobreak >nul

:: ── 3. React Vite Frontend on port 5173 ───────────────────────────────────
echo  [3/3] Starting React Vite frontend on port 5173...
start "Vite Frontend :5173" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ============================================
echo   All 3 servers starting in separate windows
echo.
echo   FastAPI    : http://127.0.0.1:8000
echo   Node.js    : http://127.0.0.1:5000
echo   Frontend   : http://localhost:5173
echo.
echo   Wait ~20s for FastAPI model to load fully.
echo   Then open: http://localhost:5173
echo  ============================================
echo.
pause
