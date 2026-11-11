import React from "react";
import type { AppState } from "../state/useAppState";


export default function InsightsTab({ app }: { app: AppState }) {
  const {
    currency,
    filteredIssues,
    hourlyRate,
    isPolish,
    issueFilter,
    pageWeight,
    setIssueFilter,
    viewMode,
  } = app;
  return (
            <div className="space-y-6">
              {/* Real Lighthouse Resource Page Weight Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Rzeczywista Waga Zasobów Strony i Obciążenie Sieciowe (Lighthouse)" : "Live Resource Page Weight & Network Payload"}
                  </h2>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {isPolish ? "Liczba żądań HTTP:" : "HTTP Requests:"} {pageWeight.requestCount} · TTFB: {pageWeight.serverResponseMs} ms
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">{isPolish ? "Całkowita Waga" : "Total Weight"}</div>
                    <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">{pageWeight.totalKb} KB</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">{isPolish ? "Obrazy (Grafika)" : "Images"}</div>
                    <div className="text-lg font-mono font-extrabold text-amber-700 mt-0.5 tabular-nums">{pageWeight.imagesKb} KB</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">JavaScript (JS)</div>
                    <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">{pageWeight.jsKb} KB</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">Arkusze Stylów (CSS)</div>
                    <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">{pageWeight.cssKb} KB</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">{isPolish ? "Czcionki Webowe" : "Web Fonts"}</div>
                    <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">{pageWeight.fontsKb} KB</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">{isPolish ? "Blokady 3rd-Party" : "3rd-Party Block"}</div>
                    <div className="text-lg font-mono font-extrabold text-rose-700 mt-0.5 tabular-nums">{pageWeight.thirdPartyBlockingMs} ms</div>
                  </div>
                </div>
              </div>

              {/* Detected Issues Filterable List */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                      {isPolish ? "Automatyczne Wykrywanie Problemów i Wycena Czasowa" : "Automated Issue Detection & Time Breakdown"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isPolish ? "Każdy problem zawiera priorytet, wpływ na konwersję oraz szacowany czas pracy inżyniera." : "Every issue includes priority, conversion impact, and estimated engineering hours."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: "all", label: isPolish ? "Wszystkie" : "All" },
                      { id: "high", label: isPolish ? "Krytyczne" : "High Priority" },
                      { id: "performance", label: isPolish ? "Wydajność" : "Speed" },
                      { id: "seo", label: "SEO" },
                      { id: "accessibility", label: "WCAG" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setIssueFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          issueFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredIssues.map((issue) => (
                    <div key={issue.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{issue.title}</span>
                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                          <span className={issue.priority === "high" ? "text-rose-700 font-bold uppercase" : "text-amber-700 font-bold uppercase"}>
                            {issue.priority}
                          </span>
                          <span>·</span>
                          <span className="font-bold text-slate-800">
                            {issue.estimatedHours ?? 2}h ({Math.round((issue.estimatedHours ?? 2) * hourlyRate)} {currency})
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{issue.description}</p>
                      <div className="text-xs text-emerald-800 font-medium">
                        <strong>{isPolish ? "Wpływ na biznes:" : "Business Impact:"}</strong> {issue.businessImpact || "Poprawa szybkości ładowania i wyższa konwersja zapytań."}
                      </div>
                      {viewMode === "agency" && (
                        <div className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                          <strong>[Instrukcja Inżynieryjna]:</strong> {issue.developerFix || "Optymalizacja zasobów statycznych i ścieżki krytycznej DOM."}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
  );
}
