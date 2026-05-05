#!/usr/bin/env bash
# Usage: ./scripts/smoke-test-binary.sh ./binaries/streamline-linux-x64
set -euo pipefail
BINARY=${1:?Provide binary path}

echo "Starting $BINARY on port 7999..."
PORT=7999 "$BINARY" &
PID=$!
sleep 3

echo "Checking /api/env..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7999/api/env)
kill "$PID" 2>/dev/null || true

if [ "$STATUS" = "200" ]; then
  echo "Binary smoke test passed (HTTP $STATUS)"
  exit 0
else
  echo "Binary smoke test FAILED (HTTP $STATUS)"
  exit 1
fi
