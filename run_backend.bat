@echo off
cd /d "%~dp0"

echo Killing anything on port 8000...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr :8000') DO taskkill /F /PID %%P

echo Starting FastAPI on port 8000...
set TF_CPP_MIN_LOG_LEVEL=2
set TF_ENABLE_ONEDNN_OPTS=0
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
