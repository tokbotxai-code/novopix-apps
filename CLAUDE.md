# NovoPix: zasady dla sesji

Właściciel (Polak, pracuje na telefonie) chce krótkich raportów po polsku: tylko wyniki i to, co sprawdzone. Nigdy nie oddawaj niesprawdzonej pracy (Playwright: telefon 390 px i komputer 1280 px, tryb ciemny, zero błędów w konsoli, klikaj linki i przyciski; po wdrożeniu kontrola na żywo).

- Tylko prawdziwe dane: żadnych zmyślonych liczb, klientów, opinii, „lat doświadczenia”; bez gwarancji wyniku, obietnic ROI i „certyfikatu WCAG”.
- Kontakt wszędzie contact@novopix.uk. Zero odwołań do pepsafe.uk. Wszystkie teksty EN i PL (skaner/panel także, aplikacje wg swoich języków).
- Sekretów, haseł i PIN-ów nie wypychaj do repo ani nie wypisuj w czacie. Commity neutralne, bez wzmianek o narzędziach i modelach. Bez force-push.
- Strona (novopix-site) wdraża się sama z main co 5 min na hosting Spaceship (rsync bez --delete). Skaner, panel, FridgeBite i PantryPal wdrażają się z novopix-apps na VPS (cron co 5 min: git reset --hard origin/main, docker compose up --build, restart caddy). Błąd w deploy/vps/Caddyfile lub docker-compose.yml kładzie wszystkie usługi: zmiany minimalne, po pushu sprawdź w ciągu 8 min https://novopix.uk/, https://scanner.novopix.uk/api/health, https://panel.novopix.uk/api/health, https://fridgebite.novopix.uk/api/health, https://pantrypal.novopix.uk/ i cofnij commit przy awarii.
- FridgeBite: w publicznym repo wolno publikować wyłącznie zbudowaną, zminifikowaną paczkę (źródło jest w prywatnym repo fridgechef).

## Koszty i limity: zasady właściciela (13.11, obowiązują stale)
- **Wszystkie nowe rozmowy i sesje: najniższy poziom**: `effort low` i model `claude-sonnet-5-5`; do czysto odczytowych kontroli `claude-haiku-5-5`. Fable, Opus albo wyższy effort tylko na **wyraźne polecenie właściciela** dla konkretnego zadania.
- Jedna sesja = jedno zadanie, po kolei, nigdy dwie na tym samym repo naraz. Bez pętli odpytywania, bez zbędnych odczytów i bez wklejania wielkich wyników narzędzi do kontekstu.
- Gdy kontekst rozmowy przekroczy ok. 150 tys. tokenów, zaproponuj nową rozmowę z krótkim podsumowaniem stanu zamiast ciągnięcia starej (długi kontekst jest główną przyczyną zużycia limitu 5 h).

## Bez pytań o zgodę (decyzja właściciela 13.11, obowiązuje stale)
- **Nie pytaj właściciela o zgodę ani zatwierdzenie.** Sesje działają w trybie auto: wybierz sam najlepszą opcję, wykonaj, na końcu krótki raport (co zrobiono i co sprawdzono).
- Dotyczy planowania, zmieniania i usuwania postów w Metricool, pushów na GitHub, wdrożeń, zakładania sesji i zmian zaplanowanych zadań. Pytaj tylko, gdy czegoś nie da się zrobić bez konta, hasła, PIN-u, płatności albo kliknięcia właściciela w panelu (wtedy: jedno zdanie, jeden krok, telefon lub komputer).
- Zasady jakości, bezpieczeństwa i marek (PepSafe, Night, NovoPix osobno) obowiązują dalej. Bez sekretów w repo i czacie.

## Test ścieżek użytkownika, nie tylko checklisty (decyzja właściciela 13.11)
- Samo sprawdzenie zmienionych elementów nie wystarcza: 13.11 nikt nie zauważył, że eksport raportu HTML ignoruje wybrany język, że publiczny skaner nie ma linku do panelu ani oferty audytu, i że język strony zależał od przypadku. Zadanie przeglądu i każda zmiana kończy się **przejściem pełnej ścieżki jak nowy klient, osobno w EN i PL (przeglądarka en-US i pl-PL)**: wejście → wybór języka → wykonanie głównej akcji (skan, formularz, pobranie raportu, wysłanie PDF) → sprawdzenie WYNIKU (treść pobranego pliku, mail, język, liczby) → następny krok i kontakt.
- Dla każdej funkcji pytaj: **skąd użytkownik wie, że ona istnieje i jak do niej trafić?** (link, przycisk, opis). Funkcja bez drogi dojścia albo bez wzmianki na stronie to usterka.
- Pobrane pliki i wysłane maile otwieraj i czytaj (język, zmyślone liczby, słowa „compliance/gwarancja"), nie zakładaj, że działają.

## Skaner publiczny: jedno narzędzie (stan 13.11, decyzja właściciela)
- Cel: skaner to przynęta na klientów. Wynik zaczyna się od decyzji (karty „W skrócie” i „Co z tym zrobić” z jawnymi regułami i cenami z `src/utils/verdict.ts`), liczby Google są niżej. Ceny netto zmieniaj tylko w `PRICES` (verdict.ts).
- Karty kontroli (serwer + `src/utils/checkRows.ts` jako jedno źródło tekstów dla ekranu i raportu HTML): domena i poczta (`server/domainHealth.ts`), kontakt na stronie głównej (`server/contactCheck.ts`, tryb Firma), deklaracja dostępności (`server/accessibilityStatement.ts`, tryb Szkoła lub urząd). Zawsze „znaleźliśmy / nie znaleźliśmy”, nigdy opinia prawna ani „nie masz”. Gdy DNS serwera nie działa, wynik to „nie udało się sprawdzić”.
- Werdykt uwzględnia też karty kontroli (`verdictExtras` w verdict.ts): braki w kontakcie (firma), SPF/DMARC przy istniejącym MX i SSL < 14 dni dają „Dobrze, z uwagami” i rekomendacje z „wyceną indywidualną” (nie ma ich w cenniku). Formularz „Zapytaj o to” zapisuje zgłoszenie w CRM panelu i wysyła powiadomienie mailem (sprawdzone 14.11).
- Raport HTML: publiczny skrócony (3 problemy, ramka „raport skrócony”) vs pełny w panelu (wszystkie problemy, wyniki szczegółowe, kosztorys). Obie wersje zawierają karty kontroli.
- Zrzut strony na telefonie z czerwonymi ramkami błędów dostępności: dane z Lighthouse (pole `fullPageScreenshot` + pozycje węzłów), bez przeglądarki na VPS (`server/visualMarks.ts`, karta `VisualCard`). Obraz ograniczony do ok. 1,3 MB, nie trafia do bazy migawek. Nie dodawaj Chromium do obrazu Dockera bez sprawdzenia pamięci VPS.
- Po wdrożeniu przez kilka minut skaner zwraca 502 (przebudowa kontenera): testy na żywo rób po pojawieniu się nowego pliku JS.

## Zero „na później” (decyzja właściciela 15.11, obowiązuje stale)
- Każdy zauważony błąd, usterkę, niespójność języka albo drobiazg **naprawiasz od razu, w tej samej sesji**. Nie zostawiaj niczego „na osobną poprawkę”, nie odkładaj, nie pytaj. Wszystko ma być „tip top”.
- Wynik audytu (własnego albo z innej sesji) obsługujesz do końca: naprawa, wdrożenie, kontrola na żywo. W raporcie nie ma sekcji „niezrobione”, chyba że wymaga konta, PIN-u lub kliknięcia właściciela.
- Błąd znaleziony przy okazji innej pracy też naprawiasz automatycznie.

## Social media NovoPix (decyzja właściciela 18.11)
- Instagram (marka Metricool 8044531, nov_opix): **2 posty dziennie**: obraz 12:30 UK (POST, karta 1080×1350 z `instagram/`) i rolka 19:00 UK (to samo wideo co TikTok 18:30). Każdy opis ma link: „novopix.uk (link in bio)” i zaproszenie „Want a demo of your idea? See novopix.uk”. Tylko prawdziwe dane i ceny z novopix.uk/pricing/, skaner i przegląd dostępności z dopiskiem „nie certyfikat WCAG”.
- Link w bio Instagrama ustawia właściciel w aplikacji: https://novopix.uk (API Metricool go nie zmienia).
- Sesje i zadania cykliczne: model `claude-sonnet-5-5`, effort low (konkretny model, nie „domyślny”).
- **TikTok też 2 posty dziennie (decyzja właściciela 18.11):** marka 8044531, TikTok novopix.studio: film 18:30 UK + obraz z `instagram/` (ten sam co IG) o 12:30 UK jako zdjęcie (`tiktokData` bez `isAigc`). Razem 2 posty dziennie na IG i 2 na TikToku.
