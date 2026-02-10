#!/bin/bash
# Stop PAI Voice Server V2

PLIST="$HOME/Library/LaunchAgents/com.pai.voice-server.plist"
PORT=8888

echo "Stopping PAI Voice Server V2..."

# Unload LaunchAgent
if [ -f "$PLIST" ]; then
    launchctl unload "$PLIST" 2>/dev/null || true
fi

# Kill any process on the port (cross-platform)
if node ../lib/check-port.js $PORT --kill >/dev/null 2>&1; then
    echo "Killed processes on port $PORT"
fi

sleep 1

# Verify stopped (cross-platform)
if node ../lib/check-port.js $PORT >/dev/null 2>&1; then
    echo "WARNING: Server may still be running"
else
    echo "Server stopped"
fi
