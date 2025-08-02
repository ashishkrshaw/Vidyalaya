@echo off
echo ========================================
echo    Student Management System
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MySQL is running
netstat -an | findstr :3306 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL might not be running on port 3306
    echo Please make sure MySQL is started
    echo.
)

echo Starting the system...
echo.

REM Start backend
echo [1/2] Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Starting frontend server...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo    System is starting up...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Please wait for both servers to start completely.
echo You can close this window once both servers are running.
echo.
pause 