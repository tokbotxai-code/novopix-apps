#!/usr/bin/env bash
# Jednorazowa instalacja na świeżym Ubuntu 24.04. Uruchom jako root w konsoli VPS:
#   curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/install.sh | bash
# Skrypt NIE wypisuje żadnych haseł. Dane logowania do panelu zapisuje w /root/novopix-credentials.txt (tylko root).
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Uruchom jako root"; exit 1; }
export DEBIAN_FRONTEND=noninteractive
REPO_URL="${REPO_URL:-https://github.com/tokbotxai-code/novopix-apps.git}"

apt-get update -y
apt-get install -y ca-certificates curl git ufw fail2ban unattended-upgrades rsync openssl

# Port SSH wykrywany z konfiguracji (na tym VPS to 22022), żeby zapora nas nie zablokowała
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')"
SSH_PORT="${SSH_PORT:-22}"

# Docker (oficjalne repozytorium)
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# Zapora: tylko SSH (wykryty port), HTTP, HTTPS
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# fail2ban dla SSH na właściwym porcie
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/novopix.local <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

# SSH: bez logowania hasłem i bez roota z zewnątrz. Administracja przez konsolę w panelu Spaceship
# (kluczowy dostęp można dodać później do /root/.ssh/authorized_keys).
if [ -s /root/.ssh/authorized_keys ]; then
  printf 'PasswordAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/99-novopix.conf
else
  printf 'PasswordAuthentication no\nPermitRootLogin no\n' > /etc/ssh/sshd_config.d/99-novopix.conf
fi
systemctl reload ssh || systemctl reload sshd || true

# Kod aplikacji (publiczne repo, pobierane przez HTTPS, bez żadnych kluczy)
if [ ! -d /opt/novopix/.git ]; then
  rm -rf /opt/novopix
  git clone --depth 1 "$REPO_URL" /opt/novopix
fi

# Plik .env: losowe wartości generowane lokalnie, nigdzie nie wypisywane
ENVF=/opt/novopix/.env
if [ ! -f "$ENVF" ]; then
  umask 077
  INTERNAL_TOKEN="$(openssl rand -hex 24)"
  AGENCY_PIN="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
  cat > "$ENVF" <<EOF
INTERNAL_TOKEN=${INTERNAL_TOKEN}
AGENCY_PIN=${AGENCY_PIN}
PAGESPEED_API_KEY=
GEMINI_API_KEY=
EOF
  printf 'Panel agencji: https://panel.novopix.uk\nHaslo panelu (AGENCY_PIN): %s\n' "$AGENCY_PIN" > /root/novopix-credentials.txt
  chmod 600 /root/novopix-credentials.txt "$ENVF"
fi

# Kopia dzienna wolumenu panelu, retencja 30 dni
cat > /usr/local/bin/novopix-backup <<'BK'
#!/usr/bin/env bash
set -euo pipefail
DEST=/var/backups/novopix
mkdir -p "$DEST"
docker run --rm -v novopix_panel-data:/data:ro -v "$DEST":/out alpine \
  tar czf "/out/panel-data-$(date +%Y%m%d-%H%M).tar.gz" -C /data .
find "$DEST" -name 'panel-data-*.tar.gz' -mtime +30 -delete
BK
chmod 0755 /usr/local/bin/novopix-backup
echo '17 3 * * * root /usr/local/bin/novopix-backup' > /etc/cron.d/novopix-backup
install -m 0755 /opt/novopix/deploy/vps/novopix-restore-test /usr/local/bin/novopix-restore-test

# Aktualizacje: co 5 minut pobiera zmiany z GitHuba i przebudowuje tylko przy nowych commitach
cat > /usr/local/bin/novopix-update <<'UP'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/novopix
OLD="$(git rev-parse HEAD)"
git fetch -q origin main
NEW="$(git rev-parse FETCH_HEAD)"
[ "$OLD" = "$NEW" ] && exit 0
git reset -q --hard FETCH_HEAD
cd deploy/vps
docker compose --env-file /opt/novopix/.env up -d --build
docker image prune -f >/dev/null 2>&1 || true
UP
chmod 0755 /usr/local/bin/novopix-update
echo '*/5 * * * * root flock -n /var/lock/novopix-update.lock /usr/local/bin/novopix-update >> /var/log/novopix-update.log 2>&1' > /etc/cron.d/novopix-update

# Pierwsze uruchomienie kontenerów (wymaga publicznego repo z kodem aplikacji)
cd /opt/novopix/deploy/vps
docker compose --env-file /opt/novopix/.env up -d --build

echo "GOTOWE. SSH (port ${SSH_PORT}) tylko kluczem; panel: https://panel.novopix.uk (hasło w /root/novopix-credentials.txt, tylko root)."
echo "Uzupełnij klucze: nano /opt/novopix/.env (PAGESPEED_API_KEY, GEMINI_API_KEY), potem: cd /opt/novopix/deploy/vps && docker compose --env-file /opt/novopix/.env up -d"
