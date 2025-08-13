@echo off
echo ====================================
echo     Masjid ERP System - Docker
echo ====================================
echo.
echo Starting Docker containers...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running or not installed!
    echo Please install Docker Desktop and make sure it's running.
    echo.
    pause
    exit /b 1
)

REM Stop and remove existing containers
echo Stopping existing containers...
docker-compose down

REM Build and start containers
echo Building and starting containers...
docker-compose up --build -d

REM Wait for containers to start
echo Waiting for containers to start...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker-compose ps

echo.
echo ====================================
echo   Application is starting up...
echo ====================================
echo.
echo Web Application: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo Default Login Credentials:
echo - Admin: username='admin', password='admin123'
echo - Manager: username='manager1', password='manager123'  
echo - Cash Collector 1: username='collector1', password='collector123'
echo - Cash Collector 2: username='collector2', password='collector456'
echo.
echo WARNING: Change these default passwords after first login!
echo.
echo To stop the application: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause