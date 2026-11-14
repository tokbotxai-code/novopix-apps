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
                    {isPolish ? "Zautomatyzowane kontrole dostępności (kryteria WCAG 2.1 AA)" : "Automated accessibility checks (WCAG 2.1 AA criteria)"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isPolish
                      ? "Wyniki kontroli automatycznych z Lighthouse i naszej analizy kodu strony. Nie zastępują testów ręcznych i nie są oceną prawną ani certyfikatem."
                      : "Results of automated checks from Lighthouse and our analysis of the page code. They do not replace manual testing and are not a legal assessment or a certificate."}
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
                      <th className="py-2.5 px-3">{isPolish ? "Kryterium WCAG 2.1 AA (sprawdzane automatem)" : "WCAG 2.1 AA criterion (automated check)"}</th>
                      <th className="py-2.5 px-3">{isPolish ? "Wynik Inspekcji DOM" : "Live DOM Result"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Wynik kontroli" : "Check result"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">{isPolish ? "1.1.1 Tekst alternatywny dla grafik (img[alt])" : "1.1.1 Text alternatives for images (img[alt])"}</td>
                      <td className="py-3 px-3 font-mono">
                        {liveSeo.images.missingAlt === 0
                          ? (isPolish ? `Wszystkie ${liveSeo.images.total} obrazów posiada atrybut alt` : `All ${liveSeo.images.total} images have an alt attribute`)
                          : (isPolish ? `Wykryto ${liveSeo.images.missingAlt} obrazów bez atrybutu alt (na ${liveSeo.images.total} ogółem)` : `${liveSeo.images.missingAlt} images without an alt attribute (of ${liveSeo.images.total} total)`)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.images.missingAlt === 0 ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.images.missingAlt === 0 ? (isPolish ? "Zaliczone (automat)" : "Passed (automated)") : (isPolish ? "Wymaga uzupełnienia" : "Needs completing")}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">{isPolish ? "3.1.1 Język strony w znaczniku &lt;html lang&gt;" : "3.1.1 Page language in the &lt;html lang&gt; tag"}</td>
                      <td className="py-3 px-3 font-mono">{liveSeo.htmlLang ? `lang="${liveSeo.htmlLang}"` : (isPolish ? "Brak zdefiniowanego języka!" : "No language defined!")}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.htmlLang ? "text-emerald-700" : "text-rose-700"}>
                          {liveSeo.htmlLang ? (isPolish ? "Zaliczone (automat)" : "Passed (automated)") : (isPolish ? "Błąd czytników ekranu" : "Screen reader issue")}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">{isPolish ? "1.4.4 Skalowanie tekstu i responsywność Viewport" : "1.4.4 Text resize and responsive viewport"}</td>
                      <td className="py-3 px-3 font-mono truncate max-w-xs">{liveSeo.viewport || (isPolish ? "Brak meta viewport" : "No meta viewport")}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.viewport ? "text-emerald-700" : "text-rose-700"}>
                          {liveSeo.viewport ? (isPolish ? "Zaliczone (automat)" : "Passed (automated)") : (isPolish ? "Brak responsywności" : "Not responsive")}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">{isPolish ? "1.3.1 Hierarchia nagłówków dla osób niewidomych (H1–H6)" : "1.3.1 Heading hierarchy for blind users (H1–H6)"}</td>
                      <td className="py-3 px-3 font-mono">H1: {liveSeo.headings.h1} · H2: {liveSeo.headings.h2} · H3: {liveSeo.headings.h3}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={liveSeo.headings.h1 === 1 ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.headings.h1 === 1 ? (isPolish ? "Zaliczone (automat)" : "Passed (automated)") : (isPolish ? "Wymaga korekty H1" : "H1 needs fixing")}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900">{isPolish ? "1.4.3 Kontrast kolorystyczny (min. 4.5:1)" : "1.4.3 Colour contrast (min. 4.5:1)"}</td>
                      <td className="py-3 px-3 font-mono">{isPolish ? "Wskaźnik kontrastu Lighthouse" : "Lighthouse contrast score"}: {currentReport.accessibilityBreakdown.contrast ?? (isPolish ? "nie zmierzono" : "not measured")}{currentReport.accessibilityBreakdown.contrast != null ? "%" : ""}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={currentReport.accessibilityBreakdown.contrast == null ? "text-slate-500" : currentReport.accessibilityBreakdown.contrast >= 85 ? "text-emerald-700" : "text-amber-700"}>
                          {currentReport.accessibilityBreakdown.contrast == null ? (isPolish ? "Nie zmierzono (wymaga Lighthouse)" : "Not measured (requires Lighthouse)") : currentReport.accessibilityBreakdown.contrast >= 85 ? (isPolish ? "Wynik Lighthouse: wysoki" : "Lighthouse score: high") : (isPolish ? "Niski kontrast elementów" : "Low element contrast")}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
  );
}
