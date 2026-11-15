import type { ServicePackage } from "./database";

// Domyślne pakiety i ceny netto zatwierdzone przez właściciela (PL w PLN, EN w GBP).
// Zakres i czas realizacji zostają puste: właściciel uzupełnia je w panelu (niczego nie zmyślamy).
const P = (
  id: string,
  group: ServicePackage["group"],
  sort: number,
  namePl: string,
  nameEn: string,
  pricePln: number,
  priceGbp: number,
  priceFrom = false,
  recurring = false
): ServicePackage => ({ id, group, sort, namePl, nameEn, scopePl: "", scopeEn: "", durationPl: "", durationEn: "", pricePln, priceGbp, priceFrom, recurring, active: true });

export const DEFAULT_PACKAGES: ServicePackage[] = [
  // Ceny netto: GBP wg cennika (usługi od £29.99); PLN ustawione osobno pod polski rynek (decyzja właściciela 15.11, usługi od 79 zł).
  P("pkg_template", "web", 1, "Szablon (sam)", "Template (only)", 299, 149, true),
  P("pkg_start", "web", 2, "Strona Start", "Website Start", 990, 349),
  P("pkg_standard", "web", 3, "Strona Pro", "Website Pro", 2490, 1049),
  P("pkg_extended", "web", 4, "Strona Max", "Website Max", 4190, 2099),
  P("pkg_speed_sprint", "speed", 5, "Speed Sprint", "Speed Sprint", 990, 490),
  P("pkg_a11y_start", "a11y", 6, "Dostępność Start (1 podstrona)", "Accessibility Start (1 page)", 99, 55),
  P("pkg_a11y_review", "a11y", 7, "Dostępność Pro (do 5 podstron)", "Accessibility Pro (up to 5 pages)", 590, 280),
  P("pkg_a11y_audit", "a11y", 8, "Dostępność Max (do 15 podstron)", "Accessibility Max (up to 15 pages)", 1790, 799),
  P("pkg_webapp", "app", 9, "Aplikacja webowa", "Web application", 999, 500, true),
  P("pkg_care_basic", "care", 10, "Opieka Start", "Care Start", 79, 29.99, false, true),
  P("pkg_care_standard", "care", 11, "Opieka Pro", "Care Pro", 149, 84, false, true),
  P("pkg_care_plus", "care", 12, "Opieka Max", "Care Max", 299, 175, false, true),
];

// Stare ceny domyślne (do 14.11.2026): jeśli baza ma dokładnie je (właściciel ich nie zmieniał), podmieniamy na nowy cennik.
const OLD_DEFAULT_PRICES: Record<string, [number, number]> = {
  pkg_template: [590, 149], pkg_start: [2490, 590], pkg_standard: [5490, 1290], pkg_extended: [9990, 2490], pkg_speed_sprint: [1990, 490],
  pkg_a11y_review: [1590, 390], pkg_a11y_audit: [4990, 1200], pkg_webapp: [9990, 2500], pkg_care_basic: [199, 49], pkg_care_standard: [399, 99], pkg_care_plus: [799, 199],
};
const X5_DEFAULT_PRICES: Record<string, [number, number]> = {
  pkg_template: [745, 149], pkg_start: [1745, 349], pkg_standard: [5245, 1049], pkg_extended: [10495, 2099], pkg_speed_sprint: [2450, 490], pkg_a11y_start: [275, 55],
  pkg_a11y_review: [1400, 280], pkg_a11y_audit: [3995, 799], pkg_webapp: [12500, 2500], pkg_care_basic: [150, 29.99], pkg_care_standard: [420, 84], pkg_care_plus: [875, 175],
};
export function migratePackages(existing: ServicePackage[]): ServicePackage[] {
  const matches = (table: Record<string, [number, number]>) => existing.length > 0 && existing.every((p) => table[p.id] && table[p.id][0] === p.pricePln && table[p.id][1] === p.priceGbp);
  const untouched = matches(OLD_DEFAULT_PRICES) || matches(X5_DEFAULT_PRICES);
  return untouched ? clonePackages() : existing;
}

export const clonePackages = (): ServicePackage[] => DEFAULT_PACKAGES.map((p) => ({ ...p }));

// Waluta domyślnie wynika z języka, ale można ją wybrać osobno (np. firma PL płaci w PLN, czyta po angielsku).
export function packagePrice(p: ServicePackage, lang: "pl" | "en", cur?: "PLN" | "GBP"): { amount: number; currency: "PLN" | "GBP" } {
  const c = cur || (lang === "pl" ? "PLN" : "GBP");
  return c === "PLN" ? { amount: p.pricePln, currency: "PLN" } : { amount: p.priceGbp, currency: "GBP" };
}

export function packageLabel(p: ServicePackage, lang: "pl" | "en", cur?: "PLN" | "GBP"): string {
  const { amount, currency } = packagePrice(p, lang, cur);
  // Ręczne grupowanie tysięcy (Intl w pl-PL nie grupuje liczb czterocyfrowych): „5 490” / „5,490”.
  const num = String(Math.round(amount * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "pl" ? "\u00a0" : ",");
  const money = currency === "PLN" ? `${num} zł` : `£${num}`;
  const from = p.priceFrom ? (lang === "pl" ? "od " : "from ") : "";
  const per = p.recurring ? (lang === "pl" ? " / mies." : " / month") : "";
  return `${from}${money}${per}`;
}

// Normalizacja pakietu z żądania edycji (panel): twarde limity, brak ujemnych cen.
export function sanitizePackage(input: any, prev?: ServicePackage): ServicePackage | null {
  const str = (v: any, max: number, fallback = "") => (typeof v === "string" ? v.trim().slice(0, max) : fallback);
  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) / 100 : fallback;
  };
  const namePl = str(input?.namePl, 80, prev?.namePl || "");
  const nameEn = str(input?.nameEn, 80, prev?.nameEn || "");
  if (!namePl || !nameEn) return null;
  const group = ["web", "speed", "a11y", "app", "care", "other"].includes(input?.group) ? input.group : prev?.group || "other";
  return {
    id: prev?.id || `pkg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    group,
    sort: Number.isFinite(Number(input?.sort)) ? Number(input.sort) : prev?.sort ?? 99,
    namePl,
    nameEn,
    scopePl: str(input?.scopePl, 1500, prev?.scopePl || ""),
    scopeEn: str(input?.scopeEn, 1500, prev?.scopeEn || ""),
    durationPl: str(input?.durationPl, 120, prev?.durationPl || ""),
    durationEn: str(input?.durationEn, 120, prev?.durationEn || ""),
    pricePln: num(input?.pricePln, prev?.pricePln ?? 0),
    priceGbp: num(input?.priceGbp, prev?.priceGbp ?? 0),
    priceFrom: input?.priceFrom === undefined ? !!prev?.priceFrom : !!input.priceFrom,
    recurring: input?.recurring === undefined ? !!prev?.recurring : !!input.recurring,
    active: input?.active === undefined ? prev?.active ?? true : !!input.active,
  };
}
