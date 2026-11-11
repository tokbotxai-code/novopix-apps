# VPS NovoPix (Ubuntu 24.04, SSH na porcie 22022)

Jedna komenda w konsoli VPS (jako root):
`curl -fsSL https://raw.githubusercontent.com/tokbotxai-code/novopix-apps/main/deploy/vps/install.sh | bash`

- Skrypt wykrywa port SSH, ustawia zaporę (tylko SSH, 80, 443), fail2ban, automatyczne aktualizacje, wyłącza logowanie hasłem i roota z zewnątrz.
- Klonuje publiczne repo z kodem, generuje `/opt/novopix/.env` (losowy `INTERNAL_TOKEN` i `AGENCY_PIN`, bez wypisywania), hasło panelu zapisuje w `/root/novopix-credentials.txt` (tylko root).
- Klucze Google/Gemini: `nano /opt/novopix/.env`, potem `docker compose --env-file /opt/novopix/.env up -d` w `/opt/novopix/deploy/vps`.
- Co 5 minut serwer pobiera zmiany z GitHuba (`novopix-update`), kopia danych panelu codziennie o 03:17 (30 dni).
- DNS (Spaceship): rekordy A `scanner`, `panel`, `fridgebite` na adres IP VPS.

## Poczta wychodząca panelu (SMTP, konto contact@novopix.uk)

Panel wysyła zatwierdzone oferty i alerty monitoringu przez SMTP. Bez konfiguracji pokazuje „SMTP nie skonfigurowane” i oferuje „Kopiuj” oraz „Pobierz .eml”.
Jedno polecenie w konsoli VPS (jako root; hasło nie jest wyświetlane ani zapisywane w historii; w haśle nie używaj znaku apostrofu `'`):

```bash
cd /opt/novopix && read -rp "SMTP host: " H && read -rp "Port [587]: " P && read -rp "Użytkownik (np. contact@novopix.uk): " U && read -rsp "Hasło: " S && echo && sed -i '/^SMTP_/d' .env && printf "SMTP_HOST='%s'\nSMTP_PORT='%s'\nSMTP_USER='%s'\nSMTP_PASS='%s'\n" "$H" "${P:-587}" "$U" "$S" >> .env && chmod 600 .env && unset S && cd deploy/vps && docker compose --env-file /opt/novopix/.env up -d panel
```

Port 465 włącza TLS automatycznie, port 587 używa STARTTLS. Opcjonalnie `SMTP_FROM` (adres nadawcy, domyślnie użytkownik SMTP) i `ALERT_EMAIL` (odbiorca alertów, domyślnie contact@novopix.uk) można dopisać do `.env` ręcznie.
