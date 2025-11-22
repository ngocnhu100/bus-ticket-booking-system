@echo off
REM Redis Docker Setup Script for Windows

echo 🚀 Setting up Redis with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo    Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Redis container is already running
docker ps | findstr redis >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis container is already running
    docker ps | findstr redis
    goto :end
)

REM Check if Redis container exists but is stopped
docker ps -a | findstr redis >nul 2>&1
if %errorlevel% equ 0 (
    echo 🔄 Starting existing Redis container...
    docker start redis
) else (
    echo 🐳 Creating new Redis container...
    docker run -d --name redis -p 6379:6379 redis:alpine
)

REM Wait for Redis to be ready
echo ⏳ Waiting for Redis to be ready...
timeout /t 3 /nobreak >nul

REM Test connection
docker exec redis redis-cli ping | findstr PONG >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is running and responding to ping
    echo.
    echo 📊 Redis Info:
    echo    Host: localhost
    echo    Port: 6379
    echo    Container: redis
    echo.
    echo 🛑 To stop Redis: docker stop redis
    echo 🗑️  To remove Redis: docker rm redis
) else (
    echo ❌ Redis failed to start properly
    echo    Check: docker logs redis
    pause
    exit /b 1
)

:end
echo.
echo 🎉 Redis setup complete! You can now start your backend server.
pause