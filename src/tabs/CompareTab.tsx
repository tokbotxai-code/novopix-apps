import React from "react";
import { Scale } from "lucide-react";
import type { AppState } from "../state/useAppState";


export default function CompareTab({ app }: { app: AppState }) {
  const {
    competitorReport,
    competitorUrl,
    currentReport,
    handleCompareCompetitor,
    isComparing,
    isPolish,
    scopeSummary,
    setActiveTab,
    setCompetitorUrl,
  } = app;
  return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Porównanie 1:1 z Konkurencją (Benchmarking Rynkowy)" : "Head-to-Head Competitor Analysis"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isPolish
                      ? "Wpisz domenę głównego rywala Twojego klienta — zestawienie przewagi punktowej natychmiast uruchamia decyzję zakupową."
                      : "Compare your client's domain against their main rival to trigger immediate buying urgency."}
                  </p>
                </div>

                <form onSubmit={handleCompareCompetitor} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    placeholder="np. konkurencja.pl"
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isComparing}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isComparing ? (isPolish ? "Skanowanie..." : "Scanning...") : (isPolish ? "Porównaj Teraz" : "Compare Now")}</span>
                  </button>
                </form>
              </div>

              {(() => {
                if (!competitorReport) {
                  return (
                    <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      {isPolish ? "Wpisz adres konkurenta powyżej i uruchom porównanie. Wyniki pojawią się dopiero po prawdziwym pomiarze." : "Enter a competitor URL above and run the comparison. Results appear only after a real measurement."}
                    </p>
                  );
                }
                if (competitorReport.overallScore == null || currentReport.overallScore == null) {
                  return (
                    <p className="text-sm text-amber-800 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      {isPolish ? "Porównanie wymaga pełnego pomiaru Google Lighthouse dla obu stron. Przy pomiarze częściowym wyniku łącznego nie podajemy." : "Comparison needs a full Google Lighthouse measurement for both sites. No overall score is given for partial measurements."}
                    </p>
                  );
                }
                const compScore = competitorReport.overallScore;
                const compPerf = competitorReport.categories.performance ?? 0;
                const compSeo = competitorReport.categories.seo ?? 0;
                const compAcc = competitorReport.categories.accessibility ?? 0;
                const compLcp = competitorReport.coreWebVitals.lcp.displayValue;
                const compCls = competitorReport.coreWebVitals.cls.displayValue;
                const myScore = currentReport.overallScore;
                const delta = myScore - compScore;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Audited Site Card */}
                      <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            {isPolish ? "Badana Strona Klienta" : "Audited Client Website"}
                          </span>
                          <span className={`text-xs font-mono font-bold ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {delta >= 0 ? `+${delta} pkt przewagi` : `${delta} pkt straty do rywala`}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 font-mono truncate">{currentReport.scannedUrl}</div>
                        <div className="text-4xl font-mono font-extrabold text-emerald-600 tabular-nums">
                          {myScore}/100
                        </div>
                        <div className="space-y-2 text-xs pt-2 border-t border-slate-200 tabular-nums">
                          <div className="flex justify-between"><span>Performance:</span><strong className="font-mono">{currentReport.categories.performance}/100</strong></div>
                          <div className="flex justify-between"><span>Technical SEO:</span><strong className="font-mono">{currentReport.categories.seo}/100</strong></div>
                          <div className="flex justify-between"><span>WCAG Accessibility:</span><strong className="font-mono">{currentReport.categories.accessibility}/100</strong></div>
                          <div className="flex justify-between"><span>LCP (Szybkość Główna):</span><strong className="font-mono">{currentReport.coreWebVitals.lcp.displayValue}</strong></div>
                          <div className="flex justify-between"><span>CLS (Stabilność):</span><strong className="font-mono">{currentReport.coreWebVitals.cls.displayValue}</strong></div>
                        </div>
                      </div>

                      {/* Competitor Site Card */}
                      <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            {isPolish ? "Strona Konkurenta" : "Competitor Website"}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {competitorReport ? (isPolish ? "Skan na żywo" : "Live scan") : (isPolish ? "Benchmark branżowy" : "Industry benchmark")}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 font-mono truncate">
                          {competitorReport ? competitorReport.scannedUrl : competitorUrl}
                        </div>
                        <div className="text-4xl font-mono font-extrabold text-slate-900 tabular-nums">
                          {compScore}/100
                        </div>
                        <div className="space-y-2 text-xs pt-2 border-t border-slate-200 tabular-nums">
                          <div className="flex justify-between"><span>Performance:</span><strong className="font-mono">{compPerf}/100</strong></div>
                          <div className="flex justify-between"><span>Technical SEO:</span><strong className="font-mono">{compSeo}/100</strong></div>
                          <div className="flex justify-between"><span>WCAG Accessibility:</span><strong className="font-mono">{compAcc}/100</strong></div>
                          <div className="flex justify-between"><span>LCP (Szybkość Główna):</span><strong className="font-mono">{compLcp}</strong></div>
                          <div className="flex justify-between"><span>CLS (Stabilność):</span><strong className="font-mono">{compCls}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Competitive Verdict Banner */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-400 uppercase">
                          {isPolish ? "Werdykt Konkurencyjny Google SERP" : "Competitive SERP Verdict"}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {delta < 0
                            ? isPolish
                              ? `Strona konkurenta wyprzedza badaną witrynę o ${Math.abs(delta)} punktów w tym pomiarze. Lista problemów pokazuje, co warto poprawić w pierwszej kolejności.`
                              : `The competitor leads by ${Math.abs(delta)} points in this measurement. The issue list shows what to fix first.`
                            : isPolish
                            ? `Badana witryna ma obecnie przewagę +${delta} pkt, ale dalsza optymalizacja LCP i Schema.org pozwoli trwale zablokować konkurencję na pozycjach TOP 3.`
                            : `Your site currently leads by +${delta} pts; optimizing LCP and Schema.org will lock in TOP 3 rankings.`}
                        </p>
                      </div>
                      {app.roiAllowed && (
<button
                        onClick={() => setActiveTab("roi-calculator")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        {isPolish ? "Zobacz Kosztorys Wyprzedzenia Konkurencji →" : "View Remediation Quote →"}
                      </button>
)}
                    </div>
                  </>
                );
              })()}
            </div>
  );
}
