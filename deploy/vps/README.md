# VPS NovoPix (Ubuntu 24.04, SSH na porcie 22022)

Jedna komenda w konsoli VPS (jako root):
`curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/install.sh | bash`

- Skrypt wykrywa port SSH, ustawia zaporę (tylko SSH, 80, 443), fail2ban, automatyczne aktualizacje, wyłącza logowanie hasłem i roota z zewnątrz.
- Klonuje publiczne repo z kodem, generuje `/opt/novopix/.env` (losowy `INTERNAL_TOKEN` i `AGENCY_PIN`, bez wypisywania), hasło panelu zapisuje w `/root/novopix-credentials.txt` (tylko root).
- Klucze Google/Gemini: `nano /opt/novopix/.env`, potem `docker compose --env-file /opt/novopix/.env up -d` w `/opt/novopix/deploy/vps`.
- Co 5 minut serwer pobiera zmiany z GitHuba (`novopix-update`), kopia danych panelu codziennie o 03:17 (30 dni).
- DNS (Spaceship): rekordy A `scanner`, `panel`, `fridgebite` na adres IP VPS.
