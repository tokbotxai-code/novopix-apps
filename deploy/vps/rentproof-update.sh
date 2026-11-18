#!/usr/bin/env bash
# Aktualizator RentProof (uruchamiany z crona przez /usr/local/bin/rentproof-update). Leży w repo, więc zmiany
# w nim trafiają na VPS razem z cronem novopix-update (bez ręcznego wklejania).
set -euo pipefail
D=/opt/rentproof; cd "$D"
[ -f .gh-token ] || { echo "Brak /opt/rentproof/.gh-token"; exit 1; }
exec 9>/var/lock/rentproof-update.lock; flock -n 9 || exit 0
H="Authorization: Basic $(printf 'x-access-token:%s' "$(cat .gh-token)" | base64 -w0)"
# Poczta: te same dane SMTP co w panelu (/opt/novopix/.env), jeśli są ustawione.
if [ -f /opt/novopix/.env ] && grep -q '^SMTP_HOST=.\+' /opt/novopix/.env; then
  umask 077
  grep -v '^SMTP_' .env > .env.new || true
  grep '^SMTP_' /opt/novopix/.env | tr -d '\r' | sed -E "s/^(SMTP_[A-Z_]+)=[[:space:]]*(['\"])(.*)\\2[[:space:]]*\$/\\1=\\3/" | grep -v '^SMTP_[A-Z_]*=$' >> .env.new || true
  if ! cmp -s .env .env.new; then mv .env.new .env; else rm -f .env.new; fi
  chmod 600 .env
fi
# Po założeniu konta właściciela kod startowy nie jest już potrzebny: usuń go z .env (kontener wstaje ponownie poniżej).
if grep -q '^RENTPROOF_BOOTSTRAP_TOKEN=' .env && [ "$(docker inspect -f '{{.State.Running}}' rentproof 2>/dev/null || echo false)" = true ] \
   && docker exec rentproof node -e "fetch('http://127.0.0.1:8766/api/auth/status').then(r=>r.json()).then(j=>process.exit(j.ownerExists?0:1)).catch(()=>process.exit(2))" 2>/dev/null; then
  umask 077; grep -v '^RENTPROOF_BOOTSTRAP_TOKEN=' .env > .env.new && mv .env.new .env; chmod 600 .env
  echo "Usunięto RENTPROOF_BOOTSTRAP_TOKEN (konto właściciela istnieje)"
fi
if [ ! -d src/.git ]; then git -c http.extraheader="$H" clone -q https://github.com/tokbotxai-code/rentoroof src; fi
git -C src -c http.extraheader="$H" fetch -q origin main
NEW=$(git -C src rev-parse origin/main)
KEY="$NEW-$(sha256sum .env | cut -c1-12)"; OLD=$(cat .deployed 2>/dev/null || echo none)
RUNNING=$(docker inspect -f '{{.State.Running}}' rentproof 2>/dev/null || echo false)
if [ "$KEY" = "$OLD" ] && [ "$RUNNING" = true ]; then exit 0; fi
git -C src reset -q --hard origin/main
docker build -q -t rentproof src >/dev/null
docker volume create rentproof-data >/dev/null
docker rm -f rentproof >/dev/null 2>&1 || true
docker run -d --name rentproof --restart unless-stopped --memory 256m \
  --network novopix_web --env-file .env -v rentproof-data:/data rentproof >/dev/null
echo "$KEY" > .deployed
echo "RentProof zaktualizowany do ${NEW:0:8} ($(grep -c '^SMTP_HOST=' .env) SMTP)"
