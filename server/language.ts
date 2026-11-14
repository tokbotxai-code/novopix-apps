// Wybór języka oferty / maila / raportu PDF dla klienta CRM.
// Kolejność reguł przy tworzeniu szkicu:
//  1. język formularza „Poproś o wycenę” / raportu (lang interfejsu zapisany w leadzie),
//  2. atrybut <html lang> strony klienta (zapisany w danych skanu),
//  3. końcówka domeny (.pl → pl, inne → en).
// Stare rekordy bez pola language traktujemy jako „pl”.

export type Lang = "pl" | "en";
export type LangSource = "client" | "form" | "html" | "tld" | "default";

export function normalizeFormLang(v: unknown): Lang | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "pl" || s.startsWith("pl-")) return "pl";
  if (s === "en" || s.startsWith("en-")) return "en";
  return null;
}

// Atrybut <html lang>: „pl…” → pl; każdy inny poprawny kod języka → en (obsługujemy tylko PL i EN); brak/niepoprawny → null.
export function langFromHtmlLang(v: unknown): Lang | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!/^[a-z]{2,3}([-_][a-z0-9]{2,8})*$/.test(s)) return null;
  return s === "pl" || s.startsWith("pl-") || s.startsWith("pl_") ? "pl" : "en";
}

export function langFromDomain(website: unknown): Lang {
  let host = String(website ?? "").trim().toLowerCase();
  host = host.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/\.$/, "");
  return host.endsWith(".pl") ? "pl" : "en";
}

export interface LangSuggestionInput {
  formLang?: unknown;
  htmlLang?: unknown;
  website?: unknown;
}

export function suggestLanguage(input: LangSuggestionInput): { language: Lang; source: Exclude<LangSource, "client" | "default"> } {
  const form = normalizeFormLang(input.formLang);
  if (form) return { language: form, source: "form" };
  const html = langFromHtmlLang(input.htmlLang);
  if (html) return { language: html, source: "html" };
  return { language: langFromDomain(input.website), source: "tld" };
}

// Waluta oferty wynika z języka: pl → PLN, en → GBP.
export const currencyForLang = (lang: Lang): "PLN" | "GBP" => (lang === "pl" ? "PLN" : "GBP");

// Język „obowiązujący” rekordu klienta (stare rekordy bez pola = pl).
export const effectiveLanguage = (client: { language?: Lang | null }): Lang => (client.language === "en" ? "en" : "pl");
