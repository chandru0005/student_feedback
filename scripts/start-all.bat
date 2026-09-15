@echo off
title Student Feedback Sentiment Analysis Launcher
echo =========================================================================
echo    Starting Student Feedback Sentiment Analysis System (3 Services)
echo =========================================================================
echo.

set SCRIPTS_DIR=%~dp0

echo [1/3] Launching Python NLP Service (Port 8000)...
start "Python NLP Service (Port 8000)" cmd /c "%SCRIPTS_DIR%start-nlp.bat"
timeout /t 3 /nobreak >nul

echo [2/3] Launching Node.js Backend API (Port 5000)...
start "Node.js Backend (Port 5000)" cmd /c "%SCRIPTS_DIR%start-backend.bat"
timeout /t 3 /nobreak >nul

echo [3/3] Launching React Vite Frontend (Port 5173)...
start "React Frontend (Port 5173)" cmd /c "%SCRIPTS_DIR%start-frontend.bat"
timeout /t 4 /nobreak >nul

echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo =========================================================================
echo   All 3 services have been launched!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   NLP Model: http://localhost:8000
echo =========================================================================
echo.
pause
