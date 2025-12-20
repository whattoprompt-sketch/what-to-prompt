@echo off
echo Starting Minimal Test Server on Port 8001...
cd backend
python -m uvicorn minimal_main:app --host 127.0.0.1 --port 8001
pause
