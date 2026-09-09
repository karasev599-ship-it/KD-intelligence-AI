#!/bin/zsh
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8787}"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 не найден. Установи Python 3 и запусти файл снова."
  read -r
  exit 1
fi
URL="http://127.0.0.1:${PORT}/"
echo "KD Messenger: ${URL}"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/kd-messenger-server.log 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT
sleep 1
open "$URL"
echo "KD Messenger запущен. Для остановки закрой это окно Terminal."
wait "$PID"
