#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🛡️ AntiTheca — Autonomous Cognitive Consolidation"
echo "Nebius x NVIDIA Global AI Hackathon (Personal AI Track)"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verify Python
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 could not be found. Please install Python 3.10+."
    exit 1
fi

# Verify Node
if ! command -v npm &> /dev/null; then
    echo "❌ npm could not be found. Please install Node.js 18+."
    exit 1
fi

echo "📦 1. Starting AntiTheca Backend on port 8000..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Launch uvicorn in background
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend running (PID: $BACKEND_PID)"

echo "🎨 2. Starting AntiTheca Frontend on port 3000..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev -- -p 3000 &
FRONTEND_PID=$!
echo "✅ Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "🚀 AntiTheca is Live!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
