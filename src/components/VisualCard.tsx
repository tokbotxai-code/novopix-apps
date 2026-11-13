import React from "react";
import type { VisualData } from "../utils/visualTypes";
import { MARK_INFO } from "../utils/visualTypes";

export function VisualCard({ visual, isPolish }: { visual: VisualData | null | undefined; isPolish: boolean }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  if (!visual?.image) return null;
  const counts: Record<string, number> = {};
  for (const m of visual.marks) counts[m.kind] = (counts[m.kind] || 0) + 1;
  const kinds = Object.keys(counts);
  const name = (k: string, title: string) => (MARK_INFO[k] ? (isPolish ? MARK_INFO[k][0] : MARK_INFO[k][1]) : isPolish ? (k.startsWith("aria") ? "Problem z oznaczeniami ARIA" : "Inny problem dostępności") : title);
  const info = (k: string) => (MARK_INFO[k] ? (isPolish ? MARK_INFO[k][2] : MARK_INFO[k][3]) : L("Szczegóły w zakładce Kontrole dostępności.", "Details in the Accessibility checks tab."));
  const titleOf = (k: string) => visual.marks.find((m) => m.kind === k)?.title || k;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 no-print" data-testid="visual-card">
      <h3 className="text-base font-extrabold text-slate-900">{L("Twoja strona na telefonie, z zaznaczonymi miejscami do poprawy", "Your site on a phone, with the places to fix marked")}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">
        {L("Czerwone ramki to elementy, które nie przeszły kontroli automatycznych dostępności. Automat nie wykrywa wszystkiego, a brak ramek nie znaczy, że strona jest dostępna.", "Red frames are elements that failed the automated accessibility checks. Automated checks do not catch everything, and no frames does not mean the site is accessible.")}
      </p>
      <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-5 items-start">
        <div className="mx-auto w-full max-w-[320px] max-h-[70vh] overflow-y-auto rounded-xl border-4 border-slate-900 bg-slate-100">
          <div className="relative w-full" style={{ aspectRatio: `${visual.width} / ${visual.height}` }}>
            <img src={visual.image} alt={L("Zrzut strony na telefonie", "Screenshot of the page on a phone")} className="absolute inset-0 w-full h-full" />
            {visual.marks.map((m, i) => (
              <div
                key={i}
                title={name(m.kind, m.title)}
                className="absolute border-2 border-red-600 bg-red-500/15 rounded-sm"
                style={{ left: `${(m.left / visual.width) * 100}%`, top: `${(m.top / visual.height) * 100}%`, width: `${(m.width / visual.width) * 100}%`, height: `${(m.height / visual.height) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div>
          {kinds.length === 0 ? (
            <p className="text-sm text-slate-700">{L("Kontrole automatyczne nie zaznaczyły elementów do poprawy na tym zrzucie.", "The automated checks did not mark any elements to fix on this screenshot.")}</p>
          ) : (
            <ul className="space-y-3">
              {kinds.map((k) => (
                <li key={k} className="text-sm">
                  <b className="text-slate-900">{name(k, titleOf(k))}</b> <span className="text-slate-500">({counts[k]})</span>
                  <div className="text-slate-600">{info(k)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
