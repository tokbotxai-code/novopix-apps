#!/usr/bin/env bash
# Aktualizator aplikacji "Mów po angielsku" (cron co 5 min przez /usr/local/bin/kamilka-update). Pobiera prywatne repo
# tokbotxai-code/kamilka; to pliki statyczne, więc kontener nie wymaga przebudowy.
set -euo pipefail
D=/opt/kamilka; cd "$D"
exec 9>/var/lock/kamilka-update.lock; flock -n 9 || exit 0
TOKEN_FILE=.gh-token; [ -f "$TOKEN_FILE" ] || TOKEN_FILE=/opt/rentproof/.gh-token
[ -f "$TOKEN_FILE" ] || { echo "Brak tokenu GitHub"; exit 1; }
H="Authorization: Basic $(printf 'x-access-token:%s' "$(cat "$TOKEN_FILE")" | base64 -w0)"
if [ ! -d src/.git ]; then git -c http.extraheader="$H" clone -q https://github.com/tokbotxai-code/kamilka src; fi
git -C src -c http.extraheader="$H" fetch -q origin main
NEW=$(git -C src rev-parse origin/main); OLD=$(git -C src rev-parse HEAD)
[ "$NEW" = "$OLD" ] || { git -C src reset -q --hard origin/main; echo "Mów po angielsku zaktualizowane do ${NEW:0:8}"; }
if [ "$(docker inspect -f '{{.State.Running}}' kamilka 2>/dev/null || echo false)" != true ]; then
  docker rm -f kamilka >/dev/null 2>&1 || true
  docker run -d --name kamilka --restart unless-stopped --memory 64m --network novopix_web --env-file .env \
    -v "$D/src":/site:ro -v "$D/kamilka-serve.mjs":/app/serve.mjs:ro -w /app node:20-alpine node serve.mjs >/dev/null
fi
cp -f /opt/novopix/deploy/vps/kamilka-serve.mjs "$D/kamilka-serve.mjs" 2>/dev/null || true
