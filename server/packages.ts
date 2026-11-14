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
  P("pkg_template", "web", 1, "Szablon (sam)", "Template (only)", 590, 149, true),
  P("pkg_start", "web", 2, "Start", "Start", 2490, 590),
  P("pkg_standard", "web", 3, "Standard", "Standard", 5490, 1290),
  P("pkg_extended", "web", 4, "Rozbudowana", "Extended", 9990, 2490, true),
  P("pkg_speed_sprint", "speed", 5, "Speed Sprint", "Speed Sprint", 1990, 490),
  P("pkg_a11y_review", "a11y", 6, "Przegląd dostępności", "Accessibility review", 1590, 390),
  P("pkg_a11y_audit", "a11y", 7, "Pełny audyt dostępności", "Full accessibility audit", 4990, 1200, true),
  P("pkg_webapp", "app", 8, "Aplikacja webowa", "Web application", 9990, 2500, true),
  P("pkg_care_basic", "care", 9, "Opieka Basic", "Care Basic", 199, 49, false, true),
  P("pkg_care_standard", "care", 10, "Opieka Standard", "Care Standard", 399, 99, false, true),
  P("pkg_care_plus", "care", 11, "Opieka Plus", "Care Plus", 799, 199, false, true),
];

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
