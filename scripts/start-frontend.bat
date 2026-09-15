@echo off
title React Frontend - Port 5173
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0\..\frontend"
echo [Frontend] Starting Vite React Development Server on http://localhost:5173 ...
call "%ProgramFiles%\nodejs\npm.cmd" run dev
pause
