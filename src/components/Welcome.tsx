import React from "react";
import type { Audience } from "../utils/verdict";

export function Welcome({ isPolish, audience, setAudience }: { isPolish: boolean; audience: Audience; setAudience: (a: Audience) => void }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const items: [string, string][] = [
    [L("Wynik prostym językiem", "A result in plain language"), L("Ocena strony i to, co poprawić najpierw, bez żargonu.", "A rating of your site and what to fix first, without jargon.")],
    [L("Zrzut strony na telefonie", "Your site on a phone"), L("Z zaznaczonymi miejscami, które nie przeszły automatycznych kontroli dostępności.", "With the places that failed the automated accessibility checks marked.")],
    [audience === "institution" ? L("Deklaracja dostępności", "Accessibility statement") : L("Kontakt z klientem", "Contact for customers"), audience === "institution" ? L("Sprawdzimy, czy na stronie jest deklaracja dostępności i jakie elementy zawiera.", "We check whether the site has an accessibility statement and which elements it contains.") : L("Czy klient z telefonu może się z Wami skontaktować: telefon, formularz, przycisk.", "Whether a phone visitor can get in touch: phone, form, button.")],
    [L("Domena i poczta", "Domain & email"), L("Certyfikat SSL, SPF, DMARC i podstawowe nagłówki bezpieczeństwa.", "SSL certificate, SPF, DMARC and basic security headers.")],
    [L("Propozycja z ceną", "A suggestion with a price"), L("Jeśli możemy pomóc, zobaczysz konkretną usługę i cenę netto. Bez zobowiązań.", "If we can help, you will see a specific service and an ex-VAT price. No obligation.")],
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 no-print" data-testid="welcome">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-extrabold text-slate-900">{L("Co dostaniesz po skanie", "What you get after the scan")}</h2>
        <div role="group" aria-label={L("Dla kogo", "Who is it for")} className="flex bg-slate-100 rounded-xl p-0.5 text-xs font-bold">
          {(["company", "institution"] as Audience[]).map((a) => (
            <button key={a} type="button" onClick={() => setAudience(a)} aria-pressed={audience === a} className={`px-3 py-1.5 rounded-lg cursor-pointer ${audience === a ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
              {a === "company" ? L("Firma", "Business") : L("Szkoła lub urząd", "School or public body")}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {items.map(([t, d]) => (
          <li key={t} className="flex gap-3 items-start">
            <span aria-hidden="true" className="shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-extrabold">✓</span>
            <span className="text-sm"><b className="text-slate-900">{t}</b><span className="block text-slate-600">{d}</span></span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-4">{L("Pomiar robi Google Lighthouse oraz nasza kontrola kodu strony. To kontrole automatyczne: nie są certyfikatem ani gwarancją wyniku.", "The measurement is done by Google Lighthouse and our own check of the page code. These are automated checks: not a certificate or a guarantee of results.")}</p>
    </div>
  );
}
