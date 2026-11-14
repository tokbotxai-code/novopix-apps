// Werdykt „W skrócie” i rekomendacje „Co z tym zrobić”: jawne reguły na danych ze skanu, bez zgadywania i bez obietnic wyniku.
import type { ContactCheck } from "./contactTypes";
import type { DomainHealth } from "./domainHealthTypes";

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

export function computeVerdict(report: ReportLike, audience: Audience, isPolish: boolean, extras?: { noContact?: boolean; contactWeak?: string[]; mailWeak?: string[]; sslWeak?: boolean }): Verdict | null {
  if (!report || report.isSample || report.measurementStatus === "failed" || report.overallScore === null) return null;
  const c = report.categories;
  const vals = [c.performance, c.seo, c.accessibility].filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  const P = PRICES[isPolish ? "PLN" : "GBP"];
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const perfLow = typeof c.performance === "number" && c.performance < 70;
  const perfMid = typeof c.performance === "number" && c.performance >= 70 && c.performance < 90;
  const seoLow = typeof c.seo === "number" && c.seo < 70;
  const mobLow = typeof report.seoBreakdown?.mobileFriendly === "number" && report.seoBreakdown.mobileFriendly < 70;
  const a11yLow = typeof c.accessibility === "number" && c.accessibility < 90;
  const min = Math.min(...vals);
  const allGood = vals.every((v) => v >= 90) && (typeof c.bestPractices !== "number" || c.bestPractices >= 90);
  const level: Verdict["level"] = min >= 90 ? "great" : min < 50 ? "attention" : "work";
  const extraNotes = (audience === "company" && (extras?.contactWeak?.length || 0) > 0) || (extras?.mailWeak?.length || 0) > 0 || !!extras?.sslWeak;
  const label =
    level === "great"
      ? extraNotes
        ? L("Dobrze, z uwagami", "Good, with a few notes")
        : L("Bardzo dobrze", "Very good")
      : level === "work"
      ? L("Do poprawy", "Needs work")
      : L("Wymaga uwagi", "Needs attention");

  const problems: string[] = [];
  if (audience === "company" && extras?.noContact) problems.push(L("nie znaleźliśmy na stronie głównej sposobu kontaktu", "we did not find a way to get in touch on the home page"));
  if (perfLow) problems.push(L("na telefonie ładuje się wolno", "it loads slowly on mobile"));
  else if (perfMid) problems.push(L("na telefonie mogłaby ładować się szybciej", "it could load faster on mobile"));
  if (seoLow || mobLow) problems.push(L("ma braki, przez które trudniej ją znaleźć w Google i używać na telefonie", "it has gaps that make it harder to find in Google and to use on a phone"));
  if (a11yLow) problems.push(L("kontrole automatyczne wykryły problemy z dostępnością", "automated checks found accessibility problems"));
  const notes: string[] = [];
  if (audience === "company" && (extras?.contactWeak?.length || 0) > 0) notes.push(L("kontakt dla klienta z telefonu", "contact for phone visitors"));
  if ((extras?.mailWeak?.length || 0) > 0) notes.push(L("ustawienia poczty", "email settings"));
  if (extras?.sslWeak) notes.push(L("certyfikat SSL", "the SSL certificate"));
  const summary = allGood && notes.length
    ? L(`Wyniki Google są dobre, ale niżej znaleźliśmy rzeczy do sprawdzenia: ${joinList(notes, "oraz")}.`, `Google's results are good, but below we found things worth checking: ${joinList(notes, "and")}.`)
    : allGood
    ? L("Strona wygląda dobrze: główne kontrole automatyczne wypadły dobrze. To nie znaczy, że wszystko jest idealne, bo część rzeczy trzeba sprawdzić ręcznie.", "The site looks good: the main automated checks came out well. That does not mean everything is perfect, because some things have to be checked by hand.")
    : problems.length
    ? L(`Strona działa, ale ${joinList(problems, "oraz")}.`, `The site works, but ${joinList(problems, "and")}.`)
    : L("Strona działa. Poniżej to, co warto sprawdzić dalej.", "The site works. Below is what is worth checking next.");

  const items: VerdictItem[] = [];
  if (audience === "company" && extras?.noContact) {
    items.push({ key: "contact", problem: L("Klient może nie wiedzieć, jak się z Wami skontaktować", "A customer may not know how to contact you"), service: L("Strona Start", "Start website"), price: money(P.start, isPolish, true), why: L("nie znaleźliśmy na stronie głównej numeru telefonu, formularza ani linku do kontaktu", "we did not find a phone number, a form or a contact link on the home page") });
  }
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
  if (perfMid && !perfLow) items.push({ key: "sprint", problem: L("Szybkość na telefonie można poprawić", "Mobile speed can be improved"), service: "Speed Sprint", price: money(P.sprint, isPolish, false), why: L(`wynik wydajności to ${num(c.performance)}, a dobrym wynikiem jest 90 i więcej`, `the performance score is ${num(c.performance)}, and a good score is 90 or more`) });
  const custom = L("wycena indywidualna", "quoted individually");
  if (audience === "company" && !extras?.noContact && (extras?.contactWeak?.length || 0) > 0)
    items.push({ key: "contact-fix", problem: L("Kontakt dla klienta z telefonu", "Contact for phone visitors"), service: L("Poprawka kontaktu na stronie", "Contact fix on the site"), price: custom, why: L(`nie znaleźliśmy: ${joinList(extras!.contactWeak!, "ani")}`, `we did not find: ${joinList(extras!.contactWeak!, "or")}`) });
  if ((extras?.mailWeak?.length || 0) > 0 || extras?.sslWeak) {
    const what = [...(extras?.mailWeak || []), ...(extras?.sslWeak ? [L("ważnego certyfikatu SSL na dłużej niż 14 dni", "an SSL certificate valid for more than 14 days")] : [])];
    items.push({ key: "mail", problem: L("Poczta i domena", "Email and domain"), service: L("Konfiguracja poczty i domeny", "Email and domain setup"), price: custom, why: L(`nie znaleźliśmy: ${joinList(what, "ani")}`, `we did not find: ${joinList(what, "or")}`) });
  }
  if (!items.length && allGood) items.push({ key: "care", problem: L("Utrzymanie dobrego wyniku", "Keeping the good result"), service: L("Opieka miesięczna", "Monthly care"), price: money(P.care, isPolish, true) + L(" / mies.", " / month"), why: L("wynik jest dobry, a strony z czasem się psują, więc warto go pilnować", "the result is good, and sites degrade over time, so it is worth keeping an eye on it") });
  return { level, label, summary, items: items.slice(0, 3) };
}

// Dodatkowe sygnały do werdyktu z kart kontroli (kontakt, poczta, SSL): jedno miejsce dla ekranu i raportu HTML.
export function verdictExtras(contact: ContactCheck | null | undefined, domain: DomainHealth | null | undefined, isPolish: boolean) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const noContact = !!contact && contact.ok && !contact.telLink && !contact.mailLink && !contact.form && !contact.contactLink;
  const contactWeak: string[] = [];
  if (contact?.ok && !noContact) {
    if (!contact.telLink) contactWeak.push(L("klikalnego numeru telefonu", "a tappable phone number"));
    if (!contact.form && !contact.mailLink) contactWeak.push(L("formularza ani linku do e-maila", "a form or an email link"));
  }
  const mailWeak: string[] = [];
  if (domain) {
    if (domain.mail.mx === "found" && domain.mail.spf === "not_found") mailWeak.push(L("rekordu SPF", "an SPF record"));
    if (domain.mail.mx === "found" && domain.mail.dmarc === "not_found") mailWeak.push(L("rekordu DMARC", "a DMARC record"));
  }
  const sslWeak = !!domain && (domain.ssl.status === "expiring" || domain.ssl.status === "invalid");
  return { noContact, contactWeak, mailWeak, sslWeak };
}
