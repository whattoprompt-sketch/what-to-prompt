@echo off
echo Starting Backend on Port 8888 (All Interfaces)...
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8888
echo.
echo IF YOU SEE THIS, THE SERVER CRASHED.
pause
