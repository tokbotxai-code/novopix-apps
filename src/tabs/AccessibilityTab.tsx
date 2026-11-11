import React from "react";
import type { AppState } from "../state/useAppState";


export default function AccessibilityTab({ app }: { app: AppState }) {
  const {
    currentReport,
    isPolish,
    liveSeo,
  } = app;
  return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Audyt Dostępności Cyfrowej WCAG 2.1 Level AA (Wymogi UE / UK EAA)" : "WCAG 2.1 Level AA & European Accessibility Act Audit"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isPolish
                      ? "Szczegółowa weryfikacja wymogów prawnych dostępności na podstawie żywego kodu DOM i testów Lighthouse."
                      : "Detailed legal accessibility verification from live DOM inspection and Lighthouse checks."}
                  </p>
                </div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 tabular-nums">
                  {currentReport.categories.accessibility}/100
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">{isPolish ? "Kontrast Tekstu (min. 4.5:1)" : "Color Contrast (4.5:1)"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.accessibilityBreakdown.contrast}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">{isPolish ? "Nawigacja Klawiaturą & Focus" : "Keyboard & Focus"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.accessibilityBreakdown.navigation}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">{isPolish ? "Etykiety Formularzy i Obrazów" : "Form & Image Labels"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.accessibilityBreakdown.names}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">{isPolish ? "Role i Atrybuty WAI-ARIA" : "WAI-ARIA Landmarks"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.accessibilityBreakdown.aria}%</div>
                </div>
              </div>

              {/* Concrete WCAG 2.1 AA DOM Verification Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">{isPolish ? "Kryterium WCAG 2.1 AA" : "WCAG 2.1 AA Criterion"}</th>
                      <th className="py-2.5 px-3">{isPolish ? "Wynik Inspekcji DOM" : "Live DOM Result"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Status Zgodności" : "Compliance Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">1.1.1 Tekst alternatywny dla grafik (img[alt])</td>
                      <td className="py-3 px-3 font-mono">
                        {liveSeo.images.missingAlt === 0
                          ? `Wszystkie ${liveSeo.images.total} obrazów posiada atrybut alt`
                          : `Wykryto ${liveSeo.images.missingAlt} obrazów bez atrybutu alt (na ${liveSeo.images.total} ogółem)`}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.images.missingAlt === 0 ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.images.missingAlt === 0 ? "Zgodny (AA)" : "Wymaga uzupełnienia"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">3.1.1 Język strony w znaczniku &lt;html lang&gt;</td>
                      <td className="py-3 px-3 font-mono">{liveSeo.htmlLang ? `lang="${liveSeo.htmlLang}"` : "Brak zdefiniowanego języka!"}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.htmlLang ? "text-emerald-700" : "text-rose-700"}>
                          {liveSeo.htmlLang ? "Zgodny (AA)" : "Błąd czytników ekranu"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">1.4.4 Skalowanie tekstu i responsywność Viewport</td>
                      <td className="py-3 px-3 font-mono truncate max-w-xs">{liveSeo.viewport || "Brak meta viewport"}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.viewport ? "text-emerald-700" : "text-rose-700"}>
                          {liveSeo.viewport ? "Zgodny (AA)" : "Brak responsywności"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">1.3.1 Hierarchia nagłówków dla osób niewidomych (H1–H6)</td>
                      <td className="py-3 px-3 font-mono">H1: {liveSeo.headings.h1} · H2: {liveSeo.headings.h2} · H3: {liveSeo.headings.h3}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.headings.h1 === 1 ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.headings.h1 === 1 ? "Zgodny (AA)" : "Wymaga korekty H1"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">1.4.3 Kontrast kolorystyczny (min. 4.5:1)</td>
                      <td className="py-3 px-3 font-mono">Wskaźnik kontrastu Lighthouse: {currentReport.accessibilityBreakdown.contrast ?? "nie zmierzono"}{currentReport.accessibilityBreakdown.contrast != null ? "%" : ""}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={currentReport.accessibilityBreakdown.contrast == null ? "text-slate-500" : currentReport.accessibilityBreakdown.contrast >= 85 ? "text-emerald-700" : "text-amber-700"}>
                          {currentReport.accessibilityBreakdown.contrast == null ? "Nie zmierzono (wymaga Lighthouse)" : currentReport.accessibilityBreakdown.contrast >= 85 ? "Wynik Lighthouse: wysoki" : "Niski kontrast elementów"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
  );
}
