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
