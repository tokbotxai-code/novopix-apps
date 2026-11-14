# Monitoring usług NovoPix

## Co jest w panelu
Moduł `server/uptimeMonitor.ts` (panel, tryb agency) co 5 minut sprawdza:
`https://novopix.uk/`, `https://scanner.novopix.uk/api/health`, `https://panel.novopix.uk/api/health`, `https://fridgebite.novopix.uk/api/health`, `https://pantrypal.novopix.uk/` (OK = odpowiedź HTTP < 400, limit 10 s).

- **Alert** po 2 kolejnych porażkach: mail na `contact@novopix.uk` (lub `ALERT_EMAIL`) przez to samo SMTP co alerty monitoringu stron. Jeden mail na awarię, potem **mail o odzyskaniu**.
- Bez SMTP: tylko czerwony znacznik w panelu (zakładka **Status usług**, za PIN-em; szczegóły: HTTP, czas, liczba porażek, stan maila).
- **Publiczna strona `/status`** w skanerze i w panelu (oraz `/api/status`): tylko OK / Nie OK / brak danych i czas ostatniego sprawdzenia, PL/EN (`?lang=en`). Bez adresów, błędów i linków do panelu. Skaner pobiera dane z panelu po sieci wewnętrznej.
- Stan zapisuje się w wolumenie panelu (`status-state.json`), więc restart nie zeruje liczników.

## Ograniczenie
Monitor działa **na tym samym VPS**. Gdy padnie cały serwer (lub Docker, sieć, DNS), panel nie wyśle nic i `/status` też nie odpowie. Dlatego potrzebny jest strażnik z zewnątrz.

## Propozycja: zewnętrzny strażnik (PHP + cron cPanel) – NIE wdrożony
Plik gotowy do wgrania: [`docs/guard/novopix-guard.php`](guard/novopix-guard.php). Sprawdza te same 5 adresów, po 2 porażkach mailuje na `contact@novopix.uk`, po odzyskaniu też.

1. cPanel → Menedżer plików: utwórz katalog **poza** `public_html` (np. `novopix-guard`) i wgraj tam `novopix-guard.php` (zapisze obok `state.json`).
2. cPanel → szukaj: **Cron Jobs / Zadania Cron** → dodaj co 5 minut (`*/5 * * * *`), polecenie:
   `/usr/local/bin/php /home/UŻYTKOWNIK/novopix-guard/novopix-guard.php`
   (ścieżkę do PHP i nazwę użytkownika sprawdź w cPanelu; kod nie działa przez przeglądarkę, tylko z CLI).
3. Sprawdź: zmień tymczasowo jeden adres na nieistniejący, poczekaj 10 min, powinien przyjść mail.
4. Jeśli `mail()` na hostingu jest zablokowane, nadawcę (`$from`) ustaw na istniejącą skrzynkę domeny.

Uwaga: strażnik ma tę samą skrzynkę docelową co monitor w panelu, więc przy awarii jednej usługi mogą przyjść dwa maile (to zamierzone).
