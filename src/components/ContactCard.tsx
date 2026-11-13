import React from "react";
import type { ContactCheck } from "../utils/contactTypes";

export function ContactCard({ data, loading, isPolish, onAsk }: { data: ContactCheck | null; loading: boolean; isPolish: boolean; onAsk: (seed: string) => void }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!data && !loading) return null;
  type Row = { ok: boolean; label: string; text: string };
  const rows: Row[] = [];
  if (data?.ok) {
    rows.push({ ok: data.telLink, label: L("Telefon", "Phone"), text: data.telLink ? L("Jest link do połączenia (tel:), klient z telefonu zadzwoni jednym kliknięciem.", "There is a call link (tel:), so a phone visitor can call with one tap.") : data.telPlainOnly ? L("Numer wygląda na zwykły tekst bez linku. Na telefonie nie da się go kliknąć.", "The number looks like plain text without a link. A phone visitor cannot tap it.") : L("Nie znaleźliśmy numeru telefonu ani linku do połączenia.", "We did not find a phone number or a call link.") });
    rows.push({ ok: data.mailLink, label: "E-mail", text: data.mailLink ? L("Jest link do e-maila.", "There is an email link.") : L("Nie znaleźliśmy linku do e-maila na stronie głównej.", "We did not find an email link on the home page.") });
    rows.push({ ok: data.form, label: L("Formularz", "Form"), text: data.form ? L("Znaleźliśmy formularz kontaktowy.", "We found a contact form.") : L("Nie znaleźliśmy formularza na stronie głównej.", "We did not find a form on the home page.") });
    rows.push({ ok: data.contactLink, label: L("Link „Kontakt”", "“Contact” link"), text: data.contactLink ? L("Jest link lub przycisk prowadzący do kontaktu.", "There is a link or button leading to contact.") : L("Nie znaleźliśmy linku ani przycisku „kontakt”.", "We did not find a “contact” link or button.") });
    if (data.nearTop !== null) rows.push({ ok: data.nearTop, label: L("Gdzie jest kontakt", "Where contact is"), text: data.nearTop ? L("Kontakt jest blisko góry strony (nagłówek).", "Contact is close to the top of the page (header).") : L("Kontakt jest dopiero niżej na stronie. Klient może go nie zauważyć.", "Contact is only further down the page. A visitor may not notice it.") });
  }
  const anyMissing = rows.some((r) => !r.ok);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 no-print" data-testid="contact-card">
      <h3 className="text-base font-extrabold text-slate-900">{L("Czy klient może się z Tobą skontaktować?", "Can a customer get in touch with you?")}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">{L("Sprawdzamy kod strony głównej. Automat mógł czegoś nie zobaczyć (np. kontakt ładowany skryptem albo w obrazku), więc piszemy „nie znaleźliśmy”, a nie „nie masz”.", "We check the code of the home page. The check may miss things (for example contact loaded by a script or placed in an image), so we say “we did not find”, not “you do not have”.")}</p>
      {loading && !data ? (
        <p className="text-sm text-slate-600" role="status">{L("Sprawdzam kontakt…", "Checking contact…")}</p>
      ) : data && !data.ok ? (
        <p className="text-sm text-slate-600">{L("Nie udało się pobrać strony głównej.", "The home page could not be fetched.")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex gap-3 items-start text-sm">
              <span aria-hidden="true" className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${r.ok ? "text-emerald-700 bg-emerald-50" : "text-amber-800 bg-amber-50"}`}>{r.ok ? "✓" : "!"}</span>
              <span><b className="text-slate-900">{r.label}:</b> <span className="text-slate-700">{r.text}</span></span>
            </li>
          ))}
        </ul>
      )}
      {anyMissing && data?.ok && (
        <button type="button" onClick={() => onAsk(L("Poprawa kontaktu na stronie (telefon, formularz, przycisk)", "Improving contact on the site (phone, form, button)"))} className="mt-3 px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm cursor-pointer hover:bg-slate-900 hover:text-white transition-colors">
          {L("Zapytaj o poprawę kontaktu", "Ask about improving contact")}
        </button>
      )}
    </div>
  );
}
