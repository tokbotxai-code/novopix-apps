import React from "react";
import type { StatementCheck } from "../utils/statementTypes";
import type { Presence } from "../utils/domainHealthTypes";

export function StatementCard({ data, loading, isPolish, onAsk }: { data: StatementCheck | null; loading: boolean; isPolish: boolean; onAsk: (seed: string) => void }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!data && !loading) return null;
  const mark = (p: Presence) => (p === "found" ? "✓" : p === "not_found" ? "!" : "?");
  const col = (p: Presence) => (p === "found" ? "text-emerald-700 bg-emerald-50" : p === "not_found" ? "text-amber-800 bg-amber-50" : "text-slate-600 bg-slate-100");
  const names: [keyof StatementCheck["elements"], string, string][] = [
    ["date", "Data sporządzenia lub aktualizacji", "Date of preparation or update"],
    ["compliance", "Informacja o stanie zgodności", "Compliance status"],
    ["nonAccessible", "Wskazanie treści niedostępnych lub wyłączeń", "Inaccessible content or exemptions listed"],
    ["contact", "Dane kontaktowe", "Contact details"],
    ["complaint", "Informacja o skargach lub procedurze odwoławczej", "Complaints or enforcement procedure"],
    ["wcag", "Odniesienie do WCAG", "Reference to WCAG"],
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 no-print" data-testid="statement-card">
      <h3 className="text-base font-extrabold text-slate-900">{L("Deklaracja dostępności", "Accessibility statement")}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">
        {L("Szkoły, urzędy i inne instytucje publiczne zwykle muszą publikować deklarację dostępności. Sprawdzamy tylko, czy jest i jakie elementy w niej znaleźliśmy. To nie jest opinia prawna ani ocena zgodności.", "Schools, councils and other public bodies usually have to publish an accessibility statement. We only check whether one exists and which elements we found in it. This is not legal advice or a compliance assessment.")}
      </p>
      {loading && !data ? (
        <p className="text-sm text-slate-600" role="status">{L("Szukam deklaracji dostępności…", "Looking for an accessibility statement…")}</p>
      ) : data?.found === null ? (
        <p className="text-sm text-slate-600">{L("Nie udało się sprawdzić (strona nie odpowiedziała).", "Could not be checked (the site did not respond).")}</p>
      ) : data && data.found === false ? (
        <>
          <p className="text-sm text-slate-700">{L("Nie znaleźliśmy linku do deklaracji dostępności na stronie głównej ani pod typowymi adresami. Może być pod innym adresem, więc sprawdź to ręcznie.", "We did not find a link to an accessibility statement on the home page or at the usual addresses. It may be elsewhere, so please check by hand.")}</p>
          <button type="button" onClick={() => onAsk(L("Pomoc z deklaracją dostępności", "Help with an accessibility statement"))} className="mt-3 px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm cursor-pointer hover:bg-slate-900 hover:text-white transition-colors">
            {L("Zapytaj o pomoc z deklaracją", "Ask for help with a statement")}
          </button>
        </>
      ) : data ? (
        <>
          <p className="text-sm text-slate-700 mb-2">
            {L("Znaleźliśmy stronę z deklaracją:", "We found a statement page:")}{" "}
            <a className="font-bold underline" href={data.url || "#"} target="_blank" rel="noopener noreferrer">{data.url}</a>
          </p>
          <ul className="space-y-2">
            {names.map(([k, pl, en]) => (
              <li key={k} className="flex gap-3 items-start text-sm">
                <span aria-hidden="true" className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${col(data.elements[k])}`}>{mark(data.elements[k])}</span>
                <span className="text-slate-700">
                  <b className="text-slate-900">{L(pl, en)}:</b> {data.elements[k] === "found" ? L("znaleźliśmy", "found") : data.elements[k] === "not_found" ? L("nie znaleźliśmy", "not found") : L("nie udało się sprawdzić", "could not be checked")}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onAsk(L("Przegląd deklaracji dostępności", "Review of an accessibility statement"))} className="mt-3 px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm cursor-pointer hover:bg-slate-900 hover:text-white transition-colors">
            {L("Zapytaj o przegląd deklaracji", "Ask about a statement review")}
          </button>
        </>
      ) : null}
    </div>
  );
}
