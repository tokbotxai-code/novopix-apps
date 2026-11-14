// Lista problemów z Google Lighthouse: bez metryk (to nie są problemy) i po polsku, gdy wybrano PL.
// Google zwraca tytuły i opisy po angielsku, więc znane audyty mają tu własne polskie opisy (bez liczb i obietnic).
const METRIC_TITLES = new Set([
  "speed index",
  "total blocking time",
  "max potential first input delay",
  "first contentful paint",
  "largest contentful paint",
  "cumulative layout shift",
  "time to interactive",
  "first meaningful paint",
]);

const PL: Record<string, [string, string]> = {
  "forced reflow": ["Wymuszone przeliczanie układu strony", "Skrypt odczytuje wymiary elementów zaraz po zmianie struktury strony, co zmusza przeglądarkę do ponownego przeliczania układu i spowalnia stronę."],
  "network dependency tree": ["Łańcuch zależnych zapytań sieciowych", "Krytyczne zasoby ładują się jeden po drugim. Skróć łańcuchy zapytań, zmniejsz rozmiar zasobów albo odłóż pobieranie tych, które nie są potrzebne od razu."],
  "minimize main-thread work": ["Zmniejsz obciążenie wątku głównego", "Przeglądarka spędza dużo czasu na parsowaniu i wykonywaniu skryptów JavaScript. Mniejsze paczki JS skracają ten czas."],
  "minify css": ["Zminifikuj pliki CSS", "Minifikacja plików CSS zmniejsza ilość pobieranych danych."],
  "minify javascript": ["Zminifikuj pliki JavaScript", "Minifikacja plików JavaScript zmniejsza ich rozmiar i czas parsowania."],
  "reduce unused javascript": ["Zmniejsz nieużywany kod JavaScript", "Usuń nieużywany kod JavaScript i opóźnij ładowanie skryptów do czasu, aż będą potrzebne."],
  "reduce unused css": ["Zmniejsz nieużywany kod CSS", "Usuń nieużywane reguły CSS i odłóż style niepotrzebne w widocznej części strony."],
  "avoid multiple page redirects": ["Unikaj wielokrotnych przekierowań", "Przekierowania wydłużają czas ładowania strony. Ogranicz ich liczbę."],
  "improve image delivery": ["Popraw dostarczanie obrazów", "Mniejsze obrazy i nowoczesne formaty skracają czas ładowania i poprawiają wskaźnik LCP."],
  "lcp request discovery": ["Wykrywanie obrazu LCP", "Główny obraz strony powinien być widoczny w kodzie HTML od razu i nie powinien być ładowany leniwie."],
  "use efficient cache lifetimes": ["Wydłuż czas przechowywania w pamięci podręcznej", "Dłuższy czas przechowywania plików w pamięci podręcznej przyspiesza kolejne wizyty."],
  "reduce initial server response time": ["Skróć czas odpowiedzi serwera", "Czas odpowiedzi serwera dla głównego dokumentu powinien być krótki, bo od niego zależą wszystkie pozostałe zapytania."],
  "render blocking requests": ["Zasoby blokujące renderowanie", "Niektóre pliki CSS lub JavaScript blokują wyświetlenie strony. Odłóż lub wbuduj te, które nie są potrzebne od razu."],
  "eliminate render-blocking resources": ["Zasoby blokujące renderowanie", "Niektóre pliki CSS lub JavaScript blokują wyświetlenie strony. Odłóż lub wbuduj te, które nie są potrzebne od razu."],
  "avoid an excessive dom size": ["Zmniejsz rozmiar struktury DOM", "Duża liczba elementów na stronie spowalnia jej wyświetlanie i przeliczanie."],
  "enable text compression": ["Włącz kompresję tekstu", "Kompresja plików tekstowych (np. gzip lub brotli) zmniejsza ilość pobieranych danych."],
  "defer offscreen images": ["Odłóż ładowanie obrazów poza ekranem", "Obrazy poza widocznym obszarem można ładować dopiero przy przewijaniu."],
  "properly size images": ["Dopasuj rozmiar obrazów", "Obrazy powinny mieć rozmiar zbliżony do wyświetlanego, bez pobierania zbędnych pikseli."],
  "serve images in next-gen formats": ["Używaj nowoczesnych formatów obrazów", "Formaty takie jak WebP i AVIF są zwykle mniejsze niż JPEG i PNG."],
  "reduce the impact of third-party code": ["Ogranicz wpływ kodu zewnętrznych firm", "Skrypty zewnętrzne mogą znacząco spowalniać stronę. Ogranicz ich liczbę i rozmiar."],
};
const GENERIC_DESC = "Szczegóły i sposób naprawy znajdziesz w dokumentacji Google Lighthouse (nazwa audytu podana w oryginale).";

type Issue = { title: string; description: string; [k: string]: any };

export function localizeIssues<T extends Issue>(issues: T[], isPolish: boolean): T[] {
  const out: T[] = [];
  for (const i of issues || []) {
    const key = String(i.title || "").trim().toLowerCase();
    if (METRIC_TITLES.has(key)) continue; // metryki są pokazane osobno w Core Web Vitals
    if (/was short$/.test(key)) continue; // komunikat o zaliczeniu, nie problem
    if (!isPolish) { out.push(i); continue; }
    const t = PL[key];
    out.push(t ? { ...i, title: t[0], description: t[1] } : { ...i, description: GENERIC_DESC });
  }
  return out;
}
