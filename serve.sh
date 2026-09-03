#!/usr/bin/env bash
# Serve this folder on http://localhost:8080 so team-connect.html runs over http:// instead of file://.
# Pop-ups, cross-window messaging and localStorage all behave more predictably this way,
# which matters when the presentation window has to open reliably in front of the team.
# Stop it with Ctrl+C when the session is over.
set -euo pipefail
PORT="${1:-8080}"
cd "$(dirname "$0")"
echo "TEAM CONNECT LIVE"
echo "Open: http://localhost:${PORT}/team-connect.html"
echo "Leave this window open for the whole session. Ctrl+C to stop."
exec python3 -m http.server "$PORT" --bind 127.0.0.1
