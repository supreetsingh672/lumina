#!/bin/bash
# Lumina — local dev startup
# Usage: ./dev.sh

set -e

PYTHON_BIN="python3"
PIP_BIN="pip3"
UVICORN_BIN="$HOME/Library/Python/3.9/bin/uvicorn"
# fallback to PATH
command -v uvicorn &>/dev/null && UVICORN_BIN="uvicorn"

echo ""
echo "  ✦ Lumina dev server"
echo ""

# ── Backend ──────────────────────────────────────────
echo "  → Starting FastAPI backend on :8000"
cd backend

if [ ! -f ".env" ]; then
  echo ""
  echo "  ⚠  backend/.env not found — copy from .env.example and add your GROQ_API_KEY"
  echo "     cp backend/.env.example backend/.env"
  echo ""
fi

$UVICORN_BIN main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# ── Frontend ─────────────────────────────────────────
echo "  → Starting Next.js frontend on :3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  ✓  Backend:  http://localhost:8000"
echo "  ✓  Frontend: http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# cleanup on exit
trap "echo ''; echo '  Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
