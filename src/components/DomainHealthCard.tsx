import React from "react";
import type { DomainHealth } from "../utils/domainHealthTypes";
import { domainRows, type CheckRow, type RowState } from "../utils/checkRows";

export function DomainHealthCard({ data, loading, isPolish, onAsk }: { data: DomainHealth | null; loading: boolean; isPolish: boolean; onAsk: (seed: string) => void }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!data && !loading) return null;
  const mark = (st: RowState) => (st === "ok" ? "✓" : st === "warn" ? "!" : "?");
  const color = (st: RowState) => (st === "ok" ? "text-emerald-700 bg-emerald-50" : st === "warn" ? "text-amber-800 bg-amber-50" : "text-slate-600 bg-slate-100");
  const rows: CheckRow[] = data ? domainRows(data, isPolish) : [];
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
