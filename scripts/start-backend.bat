@echo off
title Node.js Express Backend - Port 5000
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0\..\backend"
echo [Backend] Starting Node.js Express REST API on http://localhost:5000 ...
node server.js
pause
