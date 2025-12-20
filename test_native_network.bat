@echo off
echo Starting Basic Python HTTP Server on Port 9000...
echo Attempting to bind to ALL interfaces (0.0.0.0)...
python -m http.server 9000 --bind 0.0.0.0
echo.
echo IF YOU SEE THIS, THE SERVER CRASHED OR STOPPED.
pause
