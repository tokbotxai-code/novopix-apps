#!/usr/bin/env bash
# Aktualizator RentProof (uruchamiany z crona przez /usr/local/bin/rentproof-update). Leży w repo, więc zmiany
# w nim trafiają na VPS razem z cronem novopix-update (bez ręcznego wklejania).
# Zawiera jednorazowe, bezpieczne przejście z trybu testowego na produkcyjny (kopia, kontrola zdrowia, automatyczne cofnięcie).
set -euo pipefail
D=${RENTPROOF_DIR:-/opt/rentproof}; cd "$D"
[ -f .gh-token ] || { echo "Brak $D/.gh-token"; exit 1; }
exec 9>"${RENTPROOF_LOCK:-/var/lock/rentproof-update.lock}"; flock -n 9 || exit 0
H="Authorization: Basic $(printf 'x-access-token:%s' "$(cat .gh-token)" | base64 -w0)"
BACKUPS=${RENTPROOF_BACKUPS:-/var/backups}
CRON_DIR=${RENTPROOF_CRON_DIR:-/etc/cron.d}

start_container() {
  docker volume create rentproof-data >/dev/null
  docker rm -f rentproof >/dev/null 2>&1 || true
  docker run -d --name rentproof --restart unless-stopped --memory 256m \
    --network novopix_web --env-file .env -v rentproof-data:/data rentproof >/dev/null
}
app_ok() { docker exec rentproof node -e "fetch('http://127.0.0.1:8766/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; }
wait_ok() { local i; for i in $(seq 1 "${HEALTH_TRIES:-45}"); do app_ok && return 0; sleep "${HEALTH_SLEEP:-2}"; done; return 1; }

# Jednorazowo: NODE_ENV=test -> production. Klucz bazy z <dane>/.local-data-key trafia do .env jako RENTPROOF_DATA_KEY.
# Przed zmianą: kopia wolumenu (umask 077, zawiera klucz) i kopia .env. Gdy po zmianie aplikacja nie odpowiada, wraca poprzedni .env.
migrate_prod() {
  [ -f .prod-migrated ] && return 0
  [ -f .prod-failed ] && return 0
  if ! grep -q '^NODE_ENV=test' .env; then touch .prod-migrated; return 0; fi
  [ "$(docker inspect -f '{{.State.Running}}' rentproof 2>/dev/null || echo false)" = true ] || return 0
  docker exec rentproof test -f scripts/export-key.mjs >/dev/null 2>&1 || return 0
  app_ok || return 0
  local ts bk key
  ts=$(date +%F-%H%M); mkdir -p "$BACKUPS"; bk="$BACKUPS/rentproof-data-$ts.tgz"
  if ! docker run --rm -v rentproof-data:/d -v "$BACKUPS":/b alpine sh -c "umask 077; tar czf /b/rentproof-data-$ts.tgz -C /d ."; then
    echo "Przejście na produkcję wstrzymane: nie udała się kopia wolumenu"; return 0; fi
  [ -s "$bk" ] || { echo "Przejście na produkcję wstrzymane: pusta kopia"; return 0; }
  chmod 600 "$bk"; cp -p .env .env.bak-przed-produkcja
  key=$(docker exec rentproof node scripts/export-key.mjs 2>/dev/null | tr -d '\r\n') || key=""
  if ! printf '%s' "$key" | grep -Eq '^[A-Za-z0-9+/]{43}=$'; then echo "Przejście na produkcję wstrzymane: nieprawidłowy klucz z export-key"; return 0; fi
  umask 077
  { grep -v '^RENTPROOF_DATA_KEY=' .env | sed 's/^NODE_ENV=.*/NODE_ENV=production/'; printf 'RENTPROOF_DATA_KEY=%s\n' "$key"; } > .env.new
  mv .env.new .env; chmod 600 .env
  start_container
  if wait_ok; then
    touch .prod-migrated
    echo "RentProof działa w trybie produkcyjnym (kopia: $bk)"
    install_backup_cron
  else
    echo "Przejście na produkcję nieudane: cofam poprzednie ustawienia"
    docker logs --tail 15 rentproof 2>&1 | sed 's/RENTPROOF_DATA_KEY=[^ ]*/RENTPROOF_DATA_KEY=***/' || true
    cp -p .env.bak-przed-produkcja .env; chmod 600 .env
    start_container; wait_ok || echo "UWAGA: po cofnięciu aplikacja nie odpowiada, sprawdź docker logs rentproof"
    touch .prod-failed
  fi
}
# Kopia szyfrogramów poza kontener (cron codziennie 03:17), 14 ostatnich; test przywracania do katalogu tymczasowego.
install_backup_cron() {
  [ -f src/scripts/backup-offsite.sh ] || return 0
  cp -f src/scripts/backup-offsite.sh "$D/backup-offsite.sh"; chmod 755 "$D/backup-offsite.sh"
  if BACKUP_DIR="$BACKUPS/rentproof" "$D/backup-offsite.sh"; then
    echo "17 3 * * * root BACKUP_DIR=$BACKUPS/rentproof $D/backup-offsite.sh >> /var/log/rentproof-backup.log 2>&1" > "$CRON_DIR/rentproof-backup"; chmod 644 "$CRON_DIR/rentproof-backup"
    local last; last=$(ls -1d "$BACKUPS"/rentproof/rentproof-* 2>/dev/null | sort | tail -1)
    if [ -n "$last" ] && docker run --rm -v "$BACKUPS/rentproof":/bk:ro -e RENTPROOF_DATA_DIR=/tmp/restored -e RENTPROOF_RESTORE_FROM="/bk/$(basename "$last")" rentproof npm run restore >/dev/null 2>&1; then
      echo "Test przywracania kopii: OK ($(basename "$last"))"; else echo "Test przywracania kopii: BŁĄD (sprawdź ręcznie: npm run restore w DEPLOY.md)"; fi
  else echo "Kopia poza kontenerem nie powiodła się (cron nie zainstalowany)"; fi
}

# Poczta: te same dane SMTP co w panelu (/opt/novopix/.env), jeśli są ustawione.
if [ -f "${NOVOPIX_ENV:-/opt/novopix/.env}" ] && grep -q '^SMTP_HOST=.\+' "${NOVOPIX_ENV:-/opt/novopix/.env}"; then
  umask 077
  grep -v '^SMTP_' .env > .env.new || true
  grep '^SMTP_' "${NOVOPIX_ENV:-/opt/novopix/.env}" | tr -d '\r' | sed -E "s/^(SMTP_[A-Z_]+)=[[:space:]]*(['\"])(.*)\\2[[:space:]]*\$/\\1=\\3/" | grep -v '^SMTP_[A-Z_]*=$' >> .env.new || true
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
if [ "$KEY" = "$OLD" ] && [ "$RUNNING" = true ]; then migrate_prod; echo "$NEW-$(sha256sum .env | cut -c1-12)" > .deployed; exit 0; fi
git -C src reset -q --hard origin/main
docker build -q -t rentproof src >/dev/null
start_container
wait_ok || echo "Ostrzeżenie: aplikacja nie odpowiada po wdrożeniu, sprawdź docker logs rentproof"
echo "$KEY" > .deployed
echo "RentProof zaktualizowany do ${NEW:0:8} ($(grep -c '^SMTP_HOST=' .env) SMTP)"
migrate_prod
echo "$NEW-$(sha256sum .env | cut -c1-12)" > .deployed
