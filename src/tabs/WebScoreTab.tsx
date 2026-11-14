import React from "react";
import type { AppState } from "../state/useAppState";


export default function WebScoreTab({ app }: { app: AppState }) {
  const {
    currentReport,
    isPolish,
    scanHistory,
    setCurrentReport,
    setTrendRange,
    setUrlInput,
    trendRange,
  } = app;
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                      {isPolish ? "Ewolucja oceny strony i historia skanowania" : "WebScore Evolution & Audit History"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isPolish ? "Wykres zmian kondycji witryny w czasie oraz lista ostatnich audytów zapisanych w pamięci." : "Historical score progression and locally persisted audit runs."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(["7d", "30d", "90d"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTrendRange(r)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          trendRange === r ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-bold text-emerald-400 uppercase">{isPolish ? "Trend kondycji witryny" : "Site health trend"} ({trendRange})</span>
                    <span className="font-mono">{isPolish ? "Aktualny wynik" : "Current score"}: {currentReport.overallScore ?? (isPolish ? "brak pomiaru" : "not measured")}{typeof currentReport.overallScore === "number" ? "/100" : ""}</span>
                  </div>
                  <div className="h-44 flex items-end justify-between gap-4 pt-8 px-4 border-b border-slate-800">
                    {(currentReport.demo?.scoreHistory || []).map((pt, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{pt.overall}</span>
                        <div className="w-full max-w-[64px] bg-emerald-500/30 border-t-2 border-emerald-400 rounded-t-lg" style={{ height: `${pt.overall * 1.25}px` }} />
                        <span className="text-[11px] font-mono text-slate-400">{pt.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPolish ? "Ostatnio Skanowane Domeny (Pamięć Podręczna)" : "Recent Audited Domains"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {scanHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setCurrentReport(item);
                          setUrlInput(item.scannedUrl);
                        }}
                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-bold text-slate-900 font-mono truncate">{item.scannedUrl}</div>
                          <div className="text-[11px] text-slate-500">{new Date(item.scannedAt).toLocaleString()}</div>
                        </div>
                        <div className="text-lg font-mono font-extrabold text-emerald-600 tabular-nums shrink-0">
                          {item.overallScore}/100
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
  );
}
