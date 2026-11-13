import React from "react";
import type { DomainHealth, Presence } from "../utils/domainHealthTypes";

export function DomainHealthCard({ data, loading, isPolish, onAsk }: { data: DomainHealth | null; loading: boolean; isPolish: boolean; onAsk: (seed: string) => void }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!data && !loading) return null;
  const mark = (s: "ok" | "warn" | "unknown") => (s === "ok" ? "✓" : s === "warn" ? "!" : "?");
  const color = (s: "ok" | "warn" | "unknown") => (s === "ok" ? "text-emerald-700 bg-emerald-50" : s === "warn" ? "text-amber-800 bg-amber-50" : "text-slate-600 bg-slate-100");
  const pres = (p: Presence): "ok" | "warn" | "unknown" => (p === "found" ? "ok" : p === "not_found" ? "warn" : "unknown");
  type Row = { label: string; state: "ok" | "warn" | "unknown"; text: string };
  const rows: Row[] = [];
  if (data) {
    const s = data.ssl;
    rows.push({
      label: L("Certyfikat SSL (kłódka w przeglądarce)", "SSL certificate (padlock in the browser)"),
      state: s.status === "ok" ? "ok" : s.status === "unknown" ? "unknown" : "warn",
      text:
        s.status === "unknown"
          ? L("Nie udało się sprawdzić.", "Could not be checked.")
          : s.status === "invalid"
          ? L("Certyfikat jest nieważny lub wygasł.", "The certificate is invalid or has expired.")
          : s.status === "expiring"
          ? L(`Wygasa za ${s.daysLeft} dni (${s.validTo}). Warto go odnowić.`, `Expires in ${s.daysLeft} days (${s.validTo}). Worth renewing.`)
          : L(`Ważny jeszcze ${s.daysLeft} dni (do ${s.validTo}).`, `Valid for another ${s.daysLeft} days (until ${s.validTo}).`),
    });
    const m = data.mail;
    rows.push({ label: L("Poczta: serwer odbierający (MX)", "Email: receiving server (MX)"), state: pres(m.mx), text: m.mx === "found" ? L("Domena ma skonfigurowany serwer poczty.", "The domain has a mail server set up.") : m.mx === "not_found" ? L("Nie znaleźliśmy rekordu MX. Jeśli używasz poczty na tej domenie, sprawdź konfigurację.", "No MX record found. If you use email on this domain, check the setup.") : L("Nie udało się sprawdzić.", "Could not be checked.") });
    rows.push({ label: "SPF", state: pres(m.spf), text: m.spf === "found" ? L("Jest. Mówi odbiorcom, które serwery mogą wysyłać pocztę z Twojej domeny.", "Found. It tells recipients which servers may send email from your domain.") : m.spf === "not_found" ? L("Nie znaleźliśmy. Bez tego Twoje maile częściej trafiają do spamu.", "Not found. Without it your emails are more likely to land in spam.") : L("Nie udało się sprawdzić.", "Could not be checked.") });
    rows.push({ label: "DMARC", state: pres(m.dmarc), text: m.dmarc === "found" ? L(`Jest${m.dmarcPolicy ? ` (polityka: ${m.dmarcPolicy})` : ""}.`, `Found${m.dmarcPolicy ? ` (policy: ${m.dmarcPolicy})` : ""}.`) : m.dmarc === "not_found" ? L("Nie znaleźliśmy. Chroni przed podszywaniem się pod Twoją domenę.", "Not found. It protects against others pretending to be your domain.") : L("Nie udało się sprawdzić.", "Could not be checked.") });
    rows.push({ label: "DKIM", state: pres(m.dkim), text: m.dkim === "found" ? L("Znaleziono popularny selektor.", "A common selector was found.") : m.dkim === "not_found" ? L("Nie znaleźliśmy popularnych selektorów. DKIM może mieć inną nazwę, więc to tylko wskazówka.", "No common selectors found. DKIM may use another name, so this is only a hint.") : L("Nie udało się sprawdzić.", "Could not be checked.") });
    const h = data.headers;
    const hrow = (label: string, p: Presence, okPl: string, okEn: string, noPl: string, noEn: string) => rows.push({ label, state: pres(p), text: p === "found" ? L(okPl, okEn) : p === "not_found" ? L(noPl, noEn) : L("Nie udało się sprawdzić.", "Could not be checked.") });
    hrow(L("Wymuszanie HTTPS (HSTS)", "Forced HTTPS (HSTS)"), h.hsts, "Jest.", "Present.", "Nie znaleźliśmy.", "Not found.");
    hrow(L("Ochrona przed osadzeniem strony w cudzej ramce", "Protection against framing by other sites"), h.framing, "Jest.", "Present.", "Nie znaleźliśmy.", "Not found.");
    hrow("X-Content-Type-Options", h.contentTypeOptions, "Jest.", "Present.", "Nie znaleźliśmy.", "Not found.");
    hrow("Referrer-Policy", h.referrerPolicy, "Jest.", "Present.", "Nie znaleźliśmy.", "Not found.");
  }
  const anyWarn = rows.some((r) => r.state === "warn");
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 no-print" data-testid="domain-health">
      <h3 className="text-base font-extrabold text-slate-900">{L("Domena i poczta", "Domain & email")}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">{L("Sprawdzamy tylko publicznie widoczne ustawienia. Brak rekordu nie zawsze oznacza błąd, np. gdy poczta działa w innej domenie.", "We only check publicly visible settings. A missing record is not always an error, for example when email runs on another domain.")}</p>
      {loading && !data ? (
        <p className="text-sm text-slate-600" role="status">{L("Sprawdzam domenę i pocztę…", "Checking domain and email…")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex gap-3 items-start text-sm">
              <span aria-hidden="true" className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${color(r.state)}`}>{mark(r.state)}</span>
              <span><b className="text-slate-900">{r.label}:</b> <span className="text-slate-700">{r.text}</span></span>
            </li>
          ))}
        </ul>
      )}
      {anyWarn && (
        <button type="button" onClick={() => onAsk(L("Konfiguracja domeny i poczty (SPF, DKIM, DMARC, nagłówki)", "Domain and email setup (SPF, DKIM, DMARC, headers)"))} className="mt-3 px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm cursor-pointer hover:bg-slate-900 hover:text-white transition-colors">
          {L("Zapytaj o pomoc w konfiguracji", "Ask for help with the setup")}
        </button>
      )}
    </div>
  );
}
