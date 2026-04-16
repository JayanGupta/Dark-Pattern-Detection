@echo off
echo ===================================================
echo     Starting Dark Pattern Detection System
echo     Architected by Jayan Gupta
echo ===================================================
echo.

echo [1/2] Starting Backend API Server (Port 8000)...
start "Backend API" cmd /c "cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting Frontend Development Server (Port 5173)...
start "Frontend UI" cmd /c "cd frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo.
echo Close this window or the newly opened windows to stop the servers.
pause
