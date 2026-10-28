#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Installing lightweight CPU-only PyTorch for optimal memory footprint..."
pip install --upgrade pip
pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

echo "📦 Installing AntiTheca backend dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "✅ Build completed successfully."
