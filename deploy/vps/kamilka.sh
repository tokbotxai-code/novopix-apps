#!/usr/bin/env bash
# Aplikacja "Mów po angielsku" na VPS, chroniona hasłem (adres: https://rentproof.novopix.uk/angielski/).
# Uruchom jako root w konsoli VPS:
#   curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/kamilka.sh | bash
# Hasło wpisujesz na serwerze (/opt/kamilka/.env, chmod 600); nie trafia do repo ani do czatu.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Uruchom jako root."; exit 1; }
D=/opt/kamilka; mkdir -p "$D"; cd "$D"
curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/kamilka-serve.mjs -o kamilka-serve.mjs
curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/kamilka-update.sh -o /opt/kamilka/kamilka-update.fallback.sh
cat > /usr/local/bin/kamilka-update <<'EOS'
#!/usr/bin/env bash
U=/opt/novopix/deploy/vps/kamilka-update.sh
[ -f "$U" ] || U=/opt/kamilka/kamilka-update.fallback.sh
exec bash "$U" "$@"
EOS
chmod 755 /usr/local/bin/kamilka-update
try_clone() { local H="Authorization: Basic $(printf 'x-access-token:%s' "$1" | base64 -w0)"; git -c http.extraheader="$H" ls-remote -q https://github.com/tokbotxai-code/kamilka HEAD >/dev/null 2>&1; }
if [ -f /opt/rentproof/.gh-token ] && try_clone "$(cat /opt/rentproof/.gh-token)"; then
  echo "Używam istniejącego tokenu GitHub (ma dostęp do repo kamilka)."
else
  read -rsp "Token GitHub (read-only, repo kamilka): " T </dev/tty; echo
  try_clone "$T" || { echo "Token nie ma dostępu do repo tokbotxai-code/kamilka."; exit 1; }
  umask 077; printf '%s' "$T" > .gh-token; chmod 600 .gh-token; unset T
fi
if [ ! -f .env ] || [ "${KAMILKA_NEW_PASSWORD:-0}" = 1 ]; then
  read -rsp "Ustaw hasło do aplikacji (min. 6 znaków): " P </dev/tty; echo
  [ "${#P}" -ge 6 ] || { echo "Hasło za krótkie."; exit 1; }
  case "$P" in *\'*|*\"*|*" "*|*"#"*) echo "Użyj hasła bez spacji, apostrofów, cudzysłowów i znaku #."; exit 1;; esac
  umask 077; printf 'KAMILKA_ROOT=/site\nKAMILKA_PASSWORD=%s\nKAMILKA_COOKIE_KEY=%s\n' "$P" "$(openssl rand -hex 24)" > .env; chmod 600 .env; unset P
fi
docker rm -f kamilka >/dev/null 2>&1 || true
kamilka-update
echo '*/5 * * * * root /usr/local/bin/kamilka-update >> /var/log/kamilka-update.log 2>&1' > /etc/cron.d/kamilka
chmod 644 /etc/cron.d/kamilka
sleep 2
echo "Stan: $(docker inspect -f '{{.State.Status}}' kamilka)"
echo
echo "Adres aplikacji (hasło podaj osobie osobno): https://rentproof.novopix.uk/angielski/"
