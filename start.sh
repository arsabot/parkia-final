#!/usr/bin/env bash

# PARKIA - Script de inicio rápido

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "🚗 Iniciando PARKIA..."

# Iniciar Backend
echo "📦 Iniciando Backend Django (http://127.0.0.1:8000)..."
if [ ! -d "$DIR/backend/venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv "$DIR/backend/venv"
    "$DIR/backend/venv/bin/pip" install -r "$DIR/backend/requirements.txt"
    "$DIR/backend/venv/bin/python" "$DIR/backend/manage.py" migrate
    "$DIR/backend/venv/bin/python" "$DIR/backend/manage.py" seed_data
fi

"$DIR/backend/venv/bin/python" "$DIR/backend/manage.py" runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# Iniciar Frontend
echo "⚛️  Iniciando Frontend Vite (http://127.0.0.1:5173)..."
cd "$DIR/frontend"
if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "Instalando dependencias npm..."
    npm install
fi

npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

trap "echo 'Deteniendo PARKIA...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

echo ""
echo "=========================================="
echo "  🚀 PARKIA está ejecutándose"
echo "  🌐 Frontend: http://localhost:5173"
echo "  🔌 Backend API: http://127.0.0.1:8000/api/"
echo "  🛠️  Admin Django: http://127.0.0.1:8000/admin/"
echo "=========================================="
echo "Presiona Ctrl + C para detener ambos servidores."
echo ""

wait
