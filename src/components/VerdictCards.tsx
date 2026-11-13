import React from "react";
import type { AuditReport } from "../scannerTypes";
import { Audience, computeVerdict } from "../utils/verdict";

export function VerdictCards({
  report,
  isPolish,
  audience,
  setAudience,
  onAsk,
}: {
  report: AuditReport;
  isPolish: boolean;
  audience: Audience;
  setAudience: (a: Audience) => void;
  onAsk: (seed: string) => void;
}) {
  const v = computeVerdict(report, audience, isPolish);
  if (!v) return null;
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const tone = v.level === "great" ? "text-emerald-700 border-emerald-500" : v.level === "work" ? "text-amber-700 border-amber-500" : "text-red-700 border-red-500";
  return (
    <div className="space-y-4 no-print" data-testid="verdict-cards">
      <div className={`bg-white rounded-2xl border border-slate-200 border-l-8 ${tone.split(" ")[1]} p-5`}>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{L("W skrócie", "In short")}</div>
        <div className={`text-2xl font-extrabold ${tone.split(" ")[0]} mt-1`}>{v.label}</div>
        <p className="text-sm text-slate-700 mt-1">{v.summary}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-extrabold text-slate-900">{L("Co z tym zrobić", "What to do about it")}</h3>
          <div role="group" aria-label={L("Dla kogo", "Who is it for")} className="flex bg-slate-100 rounded-xl p-0.5 text-xs font-bold">
            {(["company", "institution"] as Audience[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                aria-pressed={audience === a}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${audience === a ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {a === "company" ? L("Firma", "Business") : L("Szkoła lub urząd", "School or public body")}
              </button>
            ))}
          </div>
        </div>
        {v.items.length === 0 ? (
          <p className="text-sm text-slate-600">{L("Na podstawie tego skanu nie mamy konkretnej rekomendacji.", "Based on this scan we have no specific recommendation.")}</p>
        ) : (
          <div className="space-y-3">
            {v.items.map((it) => (
              <div key={it.key} className="border border-slate-200 rounded-xl p-4">
                <div className="font-bold text-slate-900 text-sm">{it.problem}</div>
                <div className="inline-block mt-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-lg px-2 py-1">
                  {it.service}: {it.price}
                </div>
                <div className="text-xs text-slate-500 mt-1">{L("Polecamy, bo", "We suggest it because")} {it.why}.</div>
                <button
                  type="button"
                  onClick={() => onAsk(`${it.service} (${it.price})`)}
                  className="mt-2 w-full sm:w-auto px-4 py-2 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm cursor-pointer hover:bg-slate-900 hover:text-white transition-colors"
                >
                  {L("Zapytaj o to", "Ask about this")}
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          {L("Rekomendacja wynika z jawnych reguł i nie jest obietnicą wyniku. Kontrole dostępności są automatyczne: to nie certyfikat ani ocena zgodności z WCAG.", "The recommendation comes from open rules and is not a promise of results. Accessibility checks are automated: this is not a certificate or a WCAG conformance assessment.")}
          {audience === "institution" ? ` ${L("To nie jest opinia prawna.", "This is not legal advice.")}` : ""}
        </p>
      </div>
    </div>
  );
}
