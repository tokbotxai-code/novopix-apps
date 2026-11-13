// Wiersze wyników kontroli (domena i poczta, kontakt, deklaracja dostępności): jedno źródło tekstów dla ekranu i raportu HTML.
import type { DomainHealth, Presence } from "./domainHealthTypes";
import type { ContactCheck } from "./contactTypes";
import type { StatementCheck } from "./statementTypes";

export type RowState = "ok" | "warn" | "unknown";
export type CheckRow = { label: string; state: RowState; text: string };

const pres = (p: Presence): RowState => (p === "found" ? "ok" : p === "not_found" ? "warn" : "unknown");

export function domainRows(data: DomainHealth, isPolish: boolean): CheckRow[] {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const unk = L("Nie udało się sprawdzić.", "Could not be checked.");
  const rows: CheckRow[] = [];
  const s = data.ssl;
  rows.push({
    label: L("Certyfikat SSL (kłódka w przeglądarce)", "SSL certificate (padlock in the browser)"),
    state: s.status === "ok" ? "ok" : s.status === "unknown" ? "unknown" : "warn",
    text:
      s.status === "unknown"
        ? unk
        : s.status === "invalid"
        ? L("Certyfikat jest nieważny lub wygasł.", "The certificate is invalid or has expired.")
        : s.status === "expiring"
        ? L(`Wygasa za ${s.daysLeft} dni (${s.validTo}). Warto go odnowić.`, `Expires in ${s.daysLeft} days (${s.validTo}). Worth renewing.`)
        : L(`Ważny jeszcze ${s.daysLeft} dni (do ${s.validTo}).`, `Valid for another ${s.daysLeft} days (until ${s.validTo}).`),
  });
  const m = data.mail;
  rows.push({ label: L("Poczta: serwer odbierający (MX)", "Email: receiving server (MX)"), state: pres(m.mx), text: m.mx === "found" ? L("Domena ma skonfigurowany serwer poczty.", "The domain has a mail server set up.") : m.mx === "not_found" ? L("Nie znaleźliśmy rekordu MX. Jeśli używasz poczty na tej domenie, sprawdź konfigurację.", "No MX record found. If you use email on this domain, check the setup.") : unk });
  rows.push({ label: "SPF", state: pres(m.spf), text: m.spf === "found" ? L("Jest. Mówi odbiorcom, które serwery mogą wysyłać pocztę z Twojej domeny.", "Found. It tells recipients which servers may send email from your domain.") : m.spf === "not_found" ? L("Nie znaleźliśmy. Bez tego Twoje maile częściej trafiają do spamu.", "Not found. Without it your emails are more likely to land in spam.") : unk });
  rows.push({ label: "DMARC", state: pres(m.dmarc), text: m.dmarc === "found" ? L(`Jest${m.dmarcPolicy ? ` (polityka: ${m.dmarcPolicy})` : ""}.`, `Found${m.dmarcPolicy ? ` (policy: ${m.dmarcPolicy})` : ""}.`) : m.dmarc === "not_found" ? L("Nie znaleźliśmy. Chroni przed podszywaniem się pod Twoją domenę.", "Not found. It protects against others pretending to be your domain.") : unk });
  rows.push({ label: "DKIM", state: pres(m.dkim), text: m.dkim === "found" ? L("Znaleziono popularny selektor.", "A common selector was found.") : m.dkim === "not_found" ? L("Nie znaleźliśmy popularnych selektorów. DKIM może mieć inną nazwę, więc to tylko wskazówka.", "No common selectors found. DKIM may use another name, so this is only a hint.") : unk });
  const h = data.headers;
  const hrow = (label: string, p: Presence) => rows.push({ label, state: pres(p), text: p === "found" ? L("Jest.", "Present.") : p === "not_found" ? L("Nie znaleźliśmy.", "Not found.") : unk });
  hrow(L("Wymuszanie HTTPS (HSTS)", "Forced HTTPS (HSTS)"), h.hsts);
  hrow(L("Ochrona przed osadzeniem strony w cudzej ramce", "Protection against framing by other sites"), h.framing);
  hrow("X-Content-Type-Options", h.contentTypeOptions);
  hrow("Referrer-Policy", h.referrerPolicy);
  return rows;
}

export function contactRows(data: ContactCheck, isPolish: boolean): CheckRow[] {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!data.ok) return [];
  const r = (ok: boolean, label: string, yes: string, no: string): CheckRow => ({ label, state: ok ? "ok" : "warn", text: ok ? yes : no });
  const rows: CheckRow[] = [
    r(data.telLink, L("Telefon", "Phone"), L("Jest link do połączenia (tel:), klient z telefonu zadzwoni jednym kliknięciem.", "There is a call link (tel:), so a phone visitor can call with one tap."), data.telPlainOnly ? L("Numer wygląda na zwykły tekst bez linku. Na telefonie nie da się go kliknąć.", "The number looks like plain text without a link. A phone visitor cannot tap it.") : L("Nie znaleźliśmy numeru telefonu ani linku do połączenia.", "We did not find a phone number or a call link.")),
    r(data.mailLink, "E-mail", L("Jest link do e-maila.", "There is an email link."), L("Nie znaleźliśmy linku do e-maila na stronie głównej.", "We did not find an email link on the home page.")),
    r(data.form, L("Formularz", "Form"), L("Znaleźliśmy formularz kontaktowy.", "We found a contact form."), L("Nie znaleźliśmy formularza na stronie głównej.", "We did not find a form on the home page.")),
    r(data.contactLink, L("Link „Kontakt”", "“Contact” link"), L("Jest link lub przycisk prowadzący do kontaktu.", "There is a link or button leading to contact."), L("Nie znaleźliśmy linku ani przycisku „kontakt”.", "We did not find a “contact” link or button.")),
  ];
  if (data.nearTop !== null) rows.push(r(data.nearTop, L("Gdzie jest kontakt", "Where contact is"), L("Kontakt jest blisko góry strony (nagłówek).", "Contact is close to the top of the page (header)."), L("Kontakt jest dopiero niżej na stronie. Klient może go nie zauważyć.", "Contact is only further down the page. A visitor may not notice it.")));
  return rows;
}

const STATEMENT_NAMES: [keyof StatementCheck["elements"], string, string][] = [
  ["date", "Data sporządzenia lub aktualizacji", "Date of preparation or update"],
  ["compliance", "Informacja o stanie zgodności", "Compliance status"],
  ["nonAccessible", "Wskazanie treści niedostępnych lub wyłączeń", "Inaccessible content or exemptions listed"],
  ["contact", "Dane kontaktowe", "Contact details"],
  ["complaint", "Informacja o skargach lub procedurze odwoławczej", "Complaints or enforcement procedure"],
  ["wcag", "Odniesienie do WCAG", "Reference to WCAG"],
];
export function statementRows(data: StatementCheck, isPolish: boolean): CheckRow[] {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  return STATEMENT_NAMES.map(([k, pl, en]) => ({
    label: L(pl, en),
    state: pres(data.elements[k]),
    text: data.elements[k] === "found" ? L("znaleźliśmy", "found") : data.elements[k] === "not_found" ? L("nie znaleźliśmy", "not found") : L("nie udało się sprawdzić", "could not be checked"),
  }));
}
