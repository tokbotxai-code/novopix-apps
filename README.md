# NovoPix apps (scanner + agency panel)

Kod skanera stron i panelu agencji NovoPix: jedna baza kodu w dwóch trybach (`APP_MODE=public` i `APP_MODE=agency`).
Wdrożenie na VPS: `deploy/vps/README.md`. Sekrety (hasło panelu, klucze Google i Gemini) są tylko w pliku `.env` na serwerze i nigdy nie trafiają do tego repozytorium.

## Panel agencji (APP_MODE=agency, za PIN-em)

Jedna ścieżka pracy w CRM: zgłoszenie ze skanera → skan klienta → szkic oferty i maila (AI Gemini z regułami prawnymi, albo szablon bez AI) → zatwierdzenie przez człowieka (imię i nazwisko recenzenta) → wysyłka e-mailem / „Kopiuj” / „Pobierz .eml” + raport PDF → monitoring. Etap klienta w CRM zmienia się automatycznie na każdym kroku (nigdy wstecz).
Nic nie wychodzi do klienta bez zatwierdzenia. Zmiana treści po zatwierdzeniu wymaga ponownego zatwierdzenia. Treść z gwarancją wyniku, obietnicą ROI/przychodu lub „certyfikacją WCAG” jest blokowana przy zatwierdzaniu.

- **Raport PDF** generowany po stronie serwera (pdfkit, czcionka DejaVu, logo NovoPix); stany pomiaru: pełny Lighthouse lub częściowy (HTML) z polami „brak pomiaru”.
- **Monitoring**: cykliczne pomiary HTTP/HTML, dzienny pomiar Google PageSpeed (maks. 1 na domenę na dobę), alerty w panelu (czerwony znacznik) i mail na `ALERT_EMAIL` (domyślnie contact@novopix.uk).
- **Skan wielu stron / leady**: lista domen (wklejona lub CSV/TXT), do 20 adresów, kolejka 2 równoległe, ranking od najsłabszej strony, eksport CSV, „Dodaj do CRM”. Brak wyszukiwania firm po branży i mieście (wymagałoby zewnętrznego źródła danych; nie scrapujemy Google).
- **Zmienne środowiskowe** (tylko w `.env` na serwerze, nigdy w repozytorium): `AGENCY_PIN`, `INTERNAL_TOKEN`, `PAGESPEED_API_KEY`, `GEMINI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, opcjonalnie `SMTP_FROM`, `ALERT_EMAIL`. Konfiguracja SMTP: `deploy/vps/README.md`.
- **Dane**: `data/scanner-db.json` (wolumen). Nowe pola są opcjonalne, więc starsza baza wczytuje się bez zmian.

Struktura kodu frontendu: `src/state/useAppState.tsx` (stan i akcje), `src/tabs/*` (zakładki; agencyjne ładowane leniwie, publiczny skaner ich nie pobiera), `src/components/*` (wspólne komponenty), `src/agencyTypes.ts` (typy panelu).
