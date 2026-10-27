#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🌐 AntiTheca — Live Public Demo Expose Engine"
echo "Nebius x NVIDIA Global AI Hackathon (Personal AI Track)"
echo "=========================================================="

# Check if frontend is running on 3000
if ! nc -z 127.0.0.1 3000 2>/dev/null && ! curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "⚠️ Frontend is not currently detected on port 3000."
    echo "   Starting AntiTheca stack in background first..."
    ./start.sh &
    sleep 6
fi

TUNNEL_PORT=3000
SUBDOMAIN="antitheca-demo"

echo "🚀 Launching public HTTPS tunnel for judges on port $TUNNEL_PORT..."
echo ""
echo "Select tunneling provider:"
echo "1) Localtunnel (Zero-signup, instant HTTPS link)"
echo "2) Ngrok (Requires ngrok authtoken)"
echo "3) Cloudflare Quick Tunnel (if cloudflared installed)"

# Default to localtunnel for frictionless zero-signup judge access
if command -v npx >/dev/null 2>&1; then
    echo ""
    echo "⚡ Spawning localtunnel for instant public access..."
    echo "👉 Share the generated URL in your Devpost submission under 'Try It Out / Live Demo'!"
    echo "----------------------------------------------------------------------------------"
    npx --yes localtunnel --port $TUNNEL_PORT --subdomain $SUBDOMAIN || npx --yes localtunnel --port $TUNNEL_PORT
elif command -v ngrok >/dev/null 2>&1; then
    echo ""
    echo "⚡ Spawning ngrok tunnel..."
    ngrok http $TUNNEL_PORT
else
    echo "❌ Neither npx nor ngrok was found. Please ensure Node.js is installed."
    exit 1
fi
