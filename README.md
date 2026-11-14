# NovoPix apps (scanner + agency panel)

Kod skanera stron i panelu agencji NovoPix: jedna baza kodu w dwóch trybach (`APP_MODE=public` i `APP_MODE=agency`).
Wdrożenie na VPS: `deploy/vps/README.md`. Sekrety (hasło panelu, klucze Google i Gemini) są tylko w pliku `.env` na serwerze i nigdy nie trafiają do tego repozytorium.

## Panel agencji (APP_MODE=agency, za PIN-em)

Jedna ścieżka pracy w CRM: zgłoszenie ze skanera → skan klienta → szkic oferty i maila (AI Gemini z regułami prawnymi, albo szablon bez AI) → zatwierdzenie przez człowieka (imię i nazwisko recenzenta) → wysyłka e-mailem / „Kopiuj” / „Pobierz .eml” + raport PDF → monitoring. Etap klienta w CRM zmienia się automatycznie na każdym kroku (nigdy wstecz).
Nic nie wychodzi do klienta bez zatwierdzenia. Zmiana treści po zatwierdzeniu wymaga ponownego zatwierdzenia. Treść z gwarancją wyniku, obietnicą ROI/przychodu lub „certyfikacją WCAG” jest blokowana przy zatwierdzaniu.

- **Raport PDF** generowany po stronie serwera (pdfkit, czcionka DejaVu, logo NovoPix); stany pomiaru: pełny Lighthouse lub częściowy (HTML) z polami „brak pomiaru”.
- **Monitoring**: cykliczne pomiary HTTP/HTML, dzienny pomiar Google PageSpeed (maks. 1 na domenę na dobę), alerty w panelu (czerwony znacznik) i mail na `ALERT_EMAIL` (domyślnie contact@novopix.uk).
- **Skan wielu stron / leady**: lista domen (wklejona lub CSV/TXT), do 20 adresów, kolejka 2 równoległe, ranking od najsłabszej strony, eksport CSV, „Dodaj do CRM”. Brak wyszukiwania firm po branży i mieście (wymagałoby zewnętrznego źródła danych; nie scrapujemy Google).
- **Język oferty, maila i PDF**: w rekordzie klienta opcjonalne pole `language` (`pl`/`en`; stare rekordy bez pola = pl). Propozycja przy tworzeniu szkicu, w kolejności: język formularza „Poproś o wycenę” / raportu (zapisany w leadzie jako `lang`), potem atrybut `<html lang>` strony klienta (zapisany w danych skanu), na końcu końcówka domeny (`.pl` → pl, inne → en). W szkicu przełącznik PL/EN regeneruje tekst oferty i maila (AI z awaryjnym szablonem); szkic zatwierdzasz z widocznym językiem, a raport PDF powstaje w języku zatwierdzonej oferty. Waluta wynika z języka: pl → PLN, en → GBP.
- **Pakiety o stałej cenie** (zakładka „Pakiety i skaner publiczny”): edytowalne pakiety (nazwa, zakres, cena PLN i GBP, czas realizacji, PL/EN). Domyślne ceny netto zatwierdził właściciel; zakres i czas uzupełniasz sam (do oferty trafia tylko to, co wpiszesz). W wycenie klienta wybierasz pakiet zamiast godzin.
- **Skaner jako lejek** (tryb publiczny): po skanie formularz „Wyślij mi pełny raport PDF na e-mail” (zgoda niezaznaczona domyślnie, link do polityki, honeypot, limit na IP, walidacja). Zgłoszenie trafia do CRM jako lead z językiem formularza i zapisaną zgodą; raport czeka na zatwierdzenie w panelu (imię i nazwisko), a powiadomienie idzie na `ALERT_EMAIL` (domyślnie contact@novopix.uk). Tryb automatyczny (wysyłka od razu) włączasz w panelu i jest dostępny tylko przy skonfigurowanym SMTP. Wynik skanu do zgłoszeń pochodzi z pamięci serwera (`scanId`), nie z danych przesłanych przez przeglądarkę.
- **Publiczne linki do wyników** `/r/<losowe-id>`: statyczny snapshot bez danych osobowych, `noindex`, wygasa po 90 dniach, usuwany przez twórcę (token w przeglądarce) lub w panelu; `og:image` (PNG 1200×630) rysowany po stronie serwera.
- **Skan „przed i po”**: w CRM przy kliencie „Skan po wdrożeniu” → tabela porównawcza (tylko mierzone wartości, brak pomiaru = „brak pomiaru”) → raport PDF przed/po dostępny dopiero po zatwierdzeniu przez człowieka.
- **Testy**: `npm test` (reguły wyboru języka, przełącznik PL/EN, domyślne pakiety i ceny). Lokalnie: `DATA_DIR=/tmp/dane APP_MODE=agency npm run dev` (katalog danych można przestawić zmienną `DATA_DIR`).
- **Zmienne środowiskowe** (tylko w `.env` na serwerze, nigdy w repozytorium): `AGENCY_PIN`, `INTERNAL_TOKEN`, `PAGESPEED_API_KEY`, `GEMINI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, opcjonalnie `SMTP_FROM`, `ALERT_EMAIL`. Konfiguracja SMTP: `deploy/vps/README.md`.
- **Dane**: `data/scanner-db.json` (wolumen). Nowe pola są opcjonalne, więc starsza baza wczytuje się bez zmian.

- **Start z adresu** (np. formularz na novopix.uk): `?url=firma.pl&lang=pl|en&autoscan=1`. `lang` ustawia język, `url` wypełnia pole, `autoscan=1` uruchamia skan tą samą ścieżką co przycisk (ta sama walidacja adresu i limity); po starcie `autoscan` znika z adresu.
- **Wyszukiwarki**: `/robots.txt` jest prawdziwym plikiem tekstowym (skaner: bez `/api/` i `/r/`; panel: `Disallow: /` oraz nagłówek `X-Robots-Tag: noindex, nofollow`). Pliki z hashem w `dist/assets` mają długi cache, HTML `no-cache`.
- **Nagłówki bezpieczeństwa** wszystkich hostów VPS ustawia `deploy/vps/Caddyfile` (HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; aparat dozwolony tylko w FridgeBite).

- **Statystyki** (zakładka w panelu, za PIN-em): `POST /api/hit` przyjmuje trafienia tylko z naszych domen (nagłówek Origin), bez ciasteczek; nie zapisuje adresów IP ani identyfikatorów, pomija boty i Do Not Track, limit 60/IP/godz. W bazie panelu są wyłącznie dzienne sumy (odsłony, unikalni dziennie, źródła, język, skany, lejek), retencja 400 dni, eksport CSV. Kod: `server/stats.ts`, `src/tabs/StatsTab.tsx`.

Struktura kodu frontendu: `src/state/useAppState.tsx` (stan i akcje), `src/tabs/*` (wszystkie zakładki, lejek i okna modalne ładowane leniwie, dopiero gdy są potrzebne), `src/components/*` (wspólne komponenty), `src/agencyTypes.ts` (typy panelu).
