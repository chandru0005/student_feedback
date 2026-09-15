@echo off
title Python NLP Sentiment Service - Port 8000
cd /d "%~dp0\..\nlp-service"
echo [NLP Service] Starting Python FastAPI NLP Microservice on http://localhost:8000 ...
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
