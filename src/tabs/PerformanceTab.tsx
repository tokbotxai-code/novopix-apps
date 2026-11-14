import { Monitor, Smartphone } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function PerformanceTab({ app }: { app: AppState }) {
  const {
    currentReport,
    isPolish,
  } = app;
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                  {isPolish ? "Zaawansowany Skaner Wydajności (Mobile vs Desktop & Core Web Vitals)" : "Advanced Performance & Core Web Vitals Scanner"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>{isPolish ? "Wynik na Smartfonach (Mobile 4G/5G)" : "Mobile Performance Score"}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isPolish ? "Kluczowy wskaźnik dla indeksowania Mobile-First w Google." : "Primary metric for Google Mobile-First indexing."}
                      </p>
                    </div>
                    <div className="text-3xl font-mono font-extrabold text-emerald-600 tabular-nums">
                      {currentReport.deviceScores.mobile}/100
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                        <Monitor className="w-4 h-4 text-slate-700" />
                        <span>{isPolish ? "Wynik na Komputerach (Desktop)" : "Desktop Performance Score"}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isPolish ? "Wydajność na łączu światłowodowym i dużym ekranie." : "Performance on broadband desktop viewports."}
                      </p>
                    </div>
                    <div className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums">
                      {currentReport.deviceScores.desktop}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed CWV Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(currentReport.coreWebVitals).map((metric) => (
                  <div key={metric.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">{metric.name} ({metric.acronym})</span>
                      <span className="text-xs font-mono font-semibold text-emerald-700">{isPolish ? "Cel:" : "Target:"} {metric.target}</span>
                    </div>
                    <div className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums">{metric.displayValue}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
  );
}
