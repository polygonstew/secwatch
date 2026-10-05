#!/bin/sh
# SECWATCH CONTROL for Mac / Linux: serves this folder and opens the editor.
# Usage: ./control.sh            (editor)
#        ./control.sh index.html (play)
cd "$(dirname "$0")"
PORT=8777
PAGE=${1:-control.html}
if ! (command -v lsof >/dev/null && lsof -i :$PORT >/dev/null 2>&1); then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
URL="http://localhost:$PORT/$PAGE"
if command -v open >/dev/null; then open "$URL"; else xdg-open "$URL"; fi
echo "Serving on $URL  (Ctrl+C or close this window to stop)"
wait
