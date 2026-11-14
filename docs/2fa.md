# Włączanie 2FA (z telefonu)

Zasada wszędzie: **aplikacja uwierzytelniająca** (np. Google Authenticator / Microsoft Authenticator / Authy) zamiast SMS, a **kody zapasowe** zapisz w menedżerze haseł lub wydrukuj. Bez nich utrata telefonu = utrata konta.
Gdzie nazwa menu jest niepewna, jest „szukaj: …”, wpisz to w wyszukiwarce ustawień lub pomocy usługi.

## GitHub (pewne)
1. Zaloguj się na github.com w przeglądarce telefonu (włącz „widok klasyczny / wersja na komputer”, jeśli menu nie widać).
2. Zdjęcie profilu → **Settings** → **Password and authentication**.
3. **Two-factor authentication** → **Enable two-factor authentication**.
4. Wybierz **Authenticator app**, zeskanuj kod QR (lub użyj klucza tekstowego) w aplikacji, wpisz 6-cyfrowy kod.
5. Pobierz / zapisz **recovery codes** i dopiero potem zamknij okno.

## Spaceship (domeny)
1. Zaloguj się na spaceship.com.
2. szukaj: **Security / Bezpieczeństwo** (ustawienia konta) → **Two-factor authentication / 2FA**.
3. Wybierz aplikację uwierzytelniającą, zeskanuj QR, wpisz kod.
4. Zapisz kody zapasowe, jeśli są oferowane. Włącz to **koniecznie**: kto przejmie konto, przejmie domenę novopix.uk.

## Metricool
1. Zaloguj się w przeglądarce.
2. szukaj: **Account / Konto → Security / Bezpieczeństwo → Two-factor / 2FA** (jeśli opcji nie ma, zapisz to w notatkach i włącz po jej udostępnieniu).
3. Aplikacja uwierzytelniająca → QR → kod → zapisz kody zapasowe.

## Ko-fi
1. Zaloguj się na ko-fi.com.
2. szukaj: **Settings / Ustawienia → Security / Bezpieczeństwo → Two-factor authentication**.
3. Aplikacja uwierzytelniająca → QR → kod → zapisz kody zapasowe. Jeśli opcji brak, ustaw długie unikalne hasło z menedżera haseł i sprawdź, czy logowanie nie jest przez Google/inne konto (wtedy włącz 2FA tam).

## Poczta contact@novopix.uk
Zależy od dostawcy poczty (hosting w cPanel, Google Workspace, Zoho itp.): najpierw sprawdź, gdzie skrzynka działa.
1. Zaloguj się do panelu dostawcy poczty (nie do samej skrzynki).
2. szukaj: **Security / Bezpieczeństwo → 2-Step Verification / Two-factor authentication / Weryfikacja dwuetapowa**.
3. Aplikacja uwierzytelniająca → QR → kod → zapisz kody zapasowe.
4. Jeśli to zwykła skrzynka z hostingu bez 2FA: włącz 2FA na koncie hostingu (cPanel: szukaj **Two-Factor Authentication**) i ustaw długie unikalne hasło skrzynki.
5. Po włączeniu 2FA hasło SMTP panelu może wymagać **hasła aplikacji** (szukaj: **App passwords / Hasła aplikacji**); wtedy zaktualizuj SMTP wg `deploy/vps/README.md`.
