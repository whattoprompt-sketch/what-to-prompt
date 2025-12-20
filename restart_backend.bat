
@echo off
echo Killing Python processes...
taskkill /F /IM python.exe >nul 2>&1
echo Starting Backend...
cd backend
start /B python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1
echo Backend started.
