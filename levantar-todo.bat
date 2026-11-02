@echo off
title PARKIA - Startup Script
echo ==========================================
echo   Iniciando PARKIA (Backend + Frontend)...
echo ==========================================

REM Configurar rutas
set "PROJECT_DIR=%~dp0"
set "NODE_DIR=C:\Users\PC\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.WinGet.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
set "PATH=%NODE_DIR%;%PATH%"

REM Iniciar Backend Django en una ventana independiente
start "PARKIA - Backend Django" cmd /k "cd /d ""%PROJECT_DIR%backend"" && call ""%PROJECT_DIR%backend\venv\Scripts\activate.bat"" && python manage.py runserver 127.0.0.1:8000"

REM Iniciar Frontend React/Vite en una ventana independiente
start "PARKIA - Frontend Vite" cmd /k "cd /d ""%PROJECT_DIR%frontend"" && set ""PATH=%NODE_DIR%;%%PATH%%"" && npm run dev"

REM Esperar 3 segundos y abrir en el navegador
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ==========================================
echo   PARKIA se esta ejecutando!
echo   Frontend: http://localhost:5173
echo   Backend API: http://127.0.0.1:8000/api/
echo   Admin Django: http://127.0.0.1:8000/admin-django/
echo ==========================================
echo.
