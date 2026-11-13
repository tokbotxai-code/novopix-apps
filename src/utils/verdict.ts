// Werdykt „W skrócie” i rekomendacje „Co z tym zrobić”: jawne reguły na danych ze skanu, bez zgadywania i bez obietnic wyniku.
// Ceny netto (bez VAT) w jednym miejscu: zmieniasz tu, a zmiana obejmuje ekran i raport.
export type Audience = "company" | "institution";

export const PRICES = {
  GBP: { sprint: 490, review: 390, audit: 1200, start: 590, template: 149, care: 49 },
  PLN: { sprint: 1990, review: 1590, audit: 4990, start: 2490, template: 590, care: 199 },
} as const;

export type VerdictItem = { key: string; problem: string; service: string; price: string; why: string };
export type Verdict = {
  level: "great" | "work" | "attention";
  label: string;
  summary: string;
  items: VerdictItem[];
};

type ReportLike = {
  overallScore: number | null;
  measurementStatus?: string;
  isSample?: boolean;
  categories: { performance: number | null; seo: number | null; accessibility: number | null; bestPractices: number | null };
  seoBreakdown?: { mobileFriendly: number | null };
};

const money = (n: number, isPolish: boolean, from: boolean) => {
  const v = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, isPolish ? "\u00a0" : ",");
  return isPolish ? `${from ? "od " : ""}${v} zł netto` : `${from ? "from " : ""}£${v} ex VAT`;
};

const joinList = (a: string[], and: string) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} ${and} ${a[a.length - 1]}`);

export function computeVerdict(report: ReportLike, audience: Audience, isPolish: boolean): Verdict | null {
  if (!report || report.isSample || report.measurementStatus === "failed" || report.overallScore === null) return null;
  const c = report.categories;
  const vals = [c.performance, c.seo, c.accessibility].filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  const P = PRICES[isPolish ? "PLN" : "GBP"];
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const perfLow = typeof c.performance === "number" && c.performance < 70;
  const seoLow = typeof c.seo === "number" && c.seo < 70;
  const mobLow = typeof report.seoBreakdown?.mobileFriendly === "number" && report.seoBreakdown.mobileFriendly < 70;
  const a11yLow = typeof c.accessibility === "number" && c.accessibility < 90;
  const min = Math.min(...vals);
  const allGood = vals.every((v) => v >= 90) && (typeof c.bestPractices !== "number" || c.bestPractices >= 90);
  const level: Verdict["level"] = min >= 90 ? "great" : min < 50 ? "attention" : "work";
  const label = level === "great" ? L("Bardzo dobrze", "Very good") : level === "work" ? L("Do poprawy", "Needs work") : L("Wymaga uwagi", "Needs attention");

  const problems: string[] = [];
  if (perfLow) problems.push(L("na telefonie ładuje się wolno", "it loads slowly on mobile"));
  if (seoLow || mobLow) problems.push(L("ma braki, przez które trudniej ją znaleźć w Google i używać na telefonie", "it has gaps that make it harder to find in Google and to use on a phone"));
  if (a11yLow) problems.push(L("kontrole automatyczne wykryły problemy z dostępnością", "automated checks found accessibility problems"));
  const summary = allGood
    ? L("Strona wygląda dobrze: główne kontrole automatyczne wypadły dobrze. To nie znaczy, że wszystko jest idealne, bo część rzeczy trzeba sprawdzić ręcznie.", "The site looks good: the main automated checks came out well. That does not mean everything is perfect, because some things have to be checked by hand.")
    : problems.length
    ? L(`Strona działa, ale ${joinList(problems, "oraz")}.`, `The site works, but ${joinList(problems, "and")}.`)
    : L("Strona działa. Poniżej to, co warto sprawdzić dalej.", "The site works. Below is what is worth checking next.");

  const items: VerdictItem[] = [];
  const num = (v: number | null) => (typeof v === "number" ? v : null);
  if (perfLow) items.push({ key: "sprint", problem: L("Wolne ładowanie na telefonie", "Slow loading on mobile"), service: "Speed Sprint", price: money(P.sprint, isPolish, false), why: L(`wynik wydajności to ${num(c.performance)}, poniżej 70`, `the performance score is ${num(c.performance)}, below 70`) });
  if (audience === "company" && (seoLow || mobLow)) {
    items.push({ key: "start", problem: L("Braki w widoczności i wersji mobilnej", "Gaps in visibility and mobile use"), service: L("Nowa strona Start", "New Start website"), price: money(P.start, isPolish, true), why: seoLow ? L(`wynik SEO to ${num(c.seo)}, poniżej 70`, `the SEO score is ${num(c.seo)}, below 70`) : L("kontrola wersji mobilnej wypadła słabo", "the mobile-friendliness check was weak") });
  }
  if (audience === "institution") {
    items.push({ key: "review", problem: L("Dostępność strony", "Website accessibility"), service: L("Przegląd dostępności", "Accessibility review"), price: money(P.review, isPolish, false), why: a11yLow ? L(`kontrole automatyczne dały ${num(c.accessibility)}, poniżej 90`, `automated checks gave ${num(c.accessibility)}, below 90`) : L("kontrole automatyczne nie sprawdzają klawiatury ani czytnika ekranu, a instytucje zwykle muszą dbać o dostępność", "automated checks do not cover the keyboard or a screen reader, and institutions usually have to care about accessibility") });
    items.push({ key: "audit", problem: L("Pełna ocena dostępności", "Full accessibility assessment"), service: L("Pełny audyt dostępności", "Full accessibility audit"), price: money(P.audit, isPolish, true), why: L("testy ręczne klawiaturą i czytnikiem ekranu oraz lista poprawek", "manual testing with a keyboard and screen reader, plus a list of fixes") });
  } else if (a11yLow) {
    items.push({ key: "review", problem: L("Problemy z dostępnością", "Accessibility problems"), service: L("Przegląd dostępności", "Accessibility review"), price: money(P.review, isPolish, false), why: L(`kontrole automatyczne dały ${num(c.accessibility)}, poniżej 90`, `automated checks gave ${num(c.accessibility)}, below 90`) });
  }
  if (!items.length && allGood) items.push({ key: "care", problem: L("Utrzymanie dobrego wyniku", "Keeping the good result"), service: L("Opieka miesięczna", "Monthly care"), price: money(P.care, isPolish, true) + L(" / mies.", " / month"), why: L("wynik jest dobry, a strony z czasem się psują, więc warto go pilnować", "the result is good, and sites degrade over time, so it is worth keeping an eye on it") });
  return { level, label, summary, items: items.slice(0, 3) };
}
