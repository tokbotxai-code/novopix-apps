#!/usr/bin/env bash
# RentProof na VPS NovoPix (wersja testowa, dane fikcyjne). Uruchom jako root w konsoli VPS:
#   curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/rentproof.sh | bash
# Skrypt prosi o token GitHub (tylko do odczytu repo tokbotxai-code/rentoroof). Token zapisuje w /opt/rentproof/.gh-token
# (chmod 600, tylko root), żeby co 5 minut pobierać poprawki (rentproof-update). Nie trafia do repo ani do czatu.
# Sekrety aplikacji powstają na serwerze w /opt/rentproof/.env (chmod 600).
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Uruchom jako root."; exit 1; }
D=/opt/rentproof; mkdir -p "$D"; cd "$D"

# Aktualizator: cienki skrypt uruchamiający wersję z repo (/opt/novopix/deploy/vps/rentproof-update.sh, odświeżaną przez novopix-update).
cat > /usr/local/bin/rentproof-update <<'EOS'
#!/usr/bin/env bash
U=/opt/novopix/deploy/vps/rentproof-update.sh
[ -f "$U" ] || U=/opt/rentproof/rentproof-update.fallback.sh
exec bash "$U" "$@"
EOS
chmod 755 /usr/local/bin/rentproof-update
curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/rentproof-update.sh -o /opt/rentproof/rentproof-update.fallback.sh

if [ ! -f .gh-token ] || [ "${RENTPROOF_NEW_TOKEN:-0}" = 1 ]; then
  read -rsp "Token GitHub (read-only do rentoroof): " T </dev/tty; echo
  umask 077; printf '%s' "$T" > .gh-token; chmod 600 .gh-token; unset T
fi
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
rm -f .deployed   # wymusza przebudowę teraz
rentproof-update
echo '*/5 * * * * root /usr/local/bin/rentproof-update >> /var/log/rentproof-update.log 2>&1' > /etc/cron.d/rentproof
chmod 644 /etc/cron.d/rentproof
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
echo "Adres: https://rentproof.novopix.uk | kody i zaproszenia: rentproof-codes | aktualizacje: co 5 min automatycznie"
if [ "$FIRST" = 1 ]; then
  echo "Jednorazowy kod założenia konta właściciela (zapisz teraz):"
  grep '^RENTPROOF_BOOTSTRAP_TOKEN=' .env | cut -d= -f2
fi
