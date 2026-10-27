#!/usr/bin/env bash
# ==============================================================================
# AntiTheca Autonomous 3:00 AM Sleep Replay Consolidation Runner
# ==============================================================================
# Executed by OS-level crontab, systemd timer, or standalone container cron.
# Operates completely independent of the FastAPI web application lifespan.
# Multi-worker concurrency deduplication is guaranteed via SQLite state lock.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${WORKSPACE_DIR}/backend"

export PYTHONPATH="${BACKEND_DIR}:${PYTHONPATH:-}"

# Locate python binary (prioritize venv if present)
PYTHON_BIN="python3"
if [ -f "${WORKSPACE_DIR}/venv/bin/python" ]; then
    PYTHON_BIN="${WORKSPACE_DIR}/venv/bin/python"
elif [ -f "${WORKSPACE_DIR}/../personal-ai-second-brain/venv/bin/python" ]; then
    PYTHON_BIN="${WORKSPACE_DIR}/../personal-ai-second-brain/venv/bin/python"
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [AntiTheca-Cron] Triggering standalone Cognitive Sleep Cycle..."
cd "${BACKEND_DIR}"
exec "${PYTHON_BIN}" -m app.scheduler --once
