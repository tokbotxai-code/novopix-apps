#!/usr/bin/env bash
# RentProof na VPS NovoPix (wersja testowa, dane fikcyjne). Uruchom jako root w konsoli VPS:
#   curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/rentproof.sh | bash
# Skrypt prosi o token GitHub (tylko do odczytu repo tokbotxai-code/rentoroof; nie jest zapisywany).
# Sekrety powstają na serwerze w /opt/rentproof/.env (chmod 600), nic nie trafia do repo.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Uruchom jako root."; exit 1; }
D=/opt/rentproof; mkdir -p "$D"; cd "$D"
if [ ! -d src/.git ]; then
  read -rsp "Token GitHub (read-only do rentoroof): " T </dev/tty; echo
  git clone -q "https://x-access-token:${T}@github.com/tokbotxai-code/rentoroof" src
  git -C src remote set-url origin https://github.com/tokbotxai-code/rentoroof
else
  read -rsp "Token GitHub (read-only do rentoroof): " T </dev/tty; echo
  git -C src pull -q "https://x-access-token:${T}@github.com/tokbotxai-code/rentoroof" main
fi
unset T
FIRST=0
if [ ! -f .env ]; then
  FIRST=1
  umask 077
  cat > .env <<ENV
NODE_ENV=test
PORT=8766
RENTPROOF_HOST=0.0.0.0
RENTPROOF_ALLOW_INSECURE_LAN=1
RENTPROOF_DATA_DIR=/data
RENTPROOF_DATA_KEY=$(openssl rand -base64 32)
RENTPROOF_BOOTSTRAP_TOKEN=$(openssl rand -hex 18)
RENTPROOF_PUBLIC_URL=https://rentproof.novopix.uk
TRUST_PROXY_HTTPS=1
RENTPROOF_TRUST_PROXY_HEADER=x-forwarded-for
RENTPROOF_TEST_MAIL_FILE=/data/test-mail.jsonl
ENV
  chmod 600 .env
fi
docker build -q -t rentproof src >/dev/null
docker volume create rentproof-data >/dev/null
docker rm -f rentproof >/dev/null 2>&1 || true
docker run -d --name rentproof --restart unless-stopped --memory 256m \
  --network novopix_web --env-file .env -v rentproof-data:/data rentproof >/dev/null
cat > /usr/local/bin/rentproof-codes <<'EOS'
#!/usr/bin/env bash
# Pokazuje ostatnie 5 "maili" testowej wersji RentProof (kody logowania i linki zaproszeń).
docker exec rentproof sh -c 'tail -n 5 /data/test-mail.jsonl 2>/dev/null || echo "Brak wiadomości."'
EOS
chmod 755 /usr/local/bin/rentproof-codes
for i in $(seq 1 20); do
  s=$(docker inspect -f '{{.State.Health.Status}}' rentproof 2>/dev/null || echo none)
  [ "$s" = healthy ] && break; sleep 3
done
echo "Stan kontenera: $s"
echo
echo "Adres testowy: https://rentproof.novopix.uk (wymaga rekordu A rentproof -> adres IP VPS w Spaceship)."
echo "Kody i zaproszenia (zamiast maili): rentproof-codes"
if [ "$FIRST" = 1 ]; then
  echo "Jednorazowy kod założenia konta właściciela (zapisz teraz, nie będzie pokazany ponownie):"
  grep '^RENTPROOF_BOOTSTRAP_TOKEN=' .env | cut -d= -f2
fi
