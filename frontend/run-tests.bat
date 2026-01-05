@echo off
echo Running frontend tests with coverage...
cd /d "%~dp0"
call npm test -- --run --coverage
pause
