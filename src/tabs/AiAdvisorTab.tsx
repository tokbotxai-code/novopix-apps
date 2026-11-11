import { Bot, Copy, Phone, RefreshCw } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function AiAdvisorTab({ app }: { app: AppState }) {
  const {
    activeScriptTab,
    aiAdvisor,
    handleCopyText,
    handleRunAiAdvisor,
    isAiLoading,
    isPolish,
    setActiveScriptTab,
    strategy,
    viewMode,
  } = app;
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-600" />
                    <span>
                      {viewMode === "client"
                        ? isPolish
                          ? "Strategiczny Plan Naprawczy AI dla Twojej Strony"
                          : "AI Executive Growth Roadmap"
                        : isPolish
                        ? "AI Growth Advisor & Generator Skryptów Sprzedażowych (Gemini 3.8)"
                        : "AI Growth Advisor & Sales Pitch Generator"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {viewMode === "client"
                      ? isPolish
                        ? "Szkic planu poprawy wskaźników przygotowany przez AI na podstawie zmierzonych danych (do weryfikacji przez człowieka)."
                        : "A draft improvement plan prepared by AI from the measured data (to be reviewed by a person)."
                      : isPolish
                      ? "Sztuczna inteligencja analizuje błędy strony i tworzy gotową strategię naprawczą oraz teksty rozmów handlowych, które pomagają uzasadnić wycenę w rozmowie z klientem."
                      : "AI analyzes site bottlenecks to generate an executive strategy and ready-to-use sales scripts that help explain your pricing to the client."}
                  </p>
                </div>
                <button
                  onClick={() => handleRunAiAdvisor()}
                  disabled={isAiLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isAiLoading ? "animate-spin" : ""}`} />
                  <span>{isAiLoading ? (isPolish ? "Analizowanie AI..." : "Generating AI Strategy...") : (isPolish ? "Odśwież Analizę AI" : "Regenerate AI Strategy")}</span>
                </button>
              </div>

              {!aiAdvisor ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                  <Bot className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPolish ? "Gotowy do wygenerowania strategii AI dla tej domeny" : "Ready to generate AI Growth Strategy"}
                  </h3>
                  <button
                    onClick={() => handleRunAiAdvisor()}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    {isPolish ? "Uruchom AI Growth Advisor Teraz" : "Launch AI Growth Advisor Now"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Executive Summary & Business Loss */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isPolish ? "Podsumowanie Strategiczne dla Zarządu Klienta" : "Executive Summary for Client"}
                      </h3>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">{aiAdvisor.summary}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs font-bold text-emerald-700">
                        {isPolish ? "Wpływ biznesowy wymaga pomiaru po wdrożeniu." : "Business impact requires measurement after deployment."}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                      <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                        {isPolish ? "Diagnoza Strat Biznesowych (Dlaczego Klient Traci Pieniądze)" : "Business Revenue Loss Diagnosis"}
                      </h3>
                      <p className="text-sm text-slate-800 leading-relaxed">{aiAdvisor.businessLossAnalysis}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                        {isPolish
                          ? "Eliminacja wąskich gardeł bezpośrednio obniża koszt kliknięcia w Google Ads i zwiększa liczbę zapytań z ruchu organicznego."
                          : "Eliminating rendering bottlenecks directly lowers Google Ads CPC and boosts organic conversion."}
                      </div>
                    </div>
                  </div>

                  {/* Top Opportunities Grid */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPolish ? "Kluczowe Dźwignie Wzrostu Wyznaczone przez AI" : "AI-Prioritized Growth Levers"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiAdvisor.topOpportunities.map((opp, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">0{i + 1}. {opp.title}</span>
                            <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">{opp.roiLift}</span>
                          </div>
                          <p className="text-xs text-slate-600">{opp.impact}</p>
                          {viewMode === "agency" && (
                            <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/70">
                              {isPolish ? "Działanie inżynieryjne:" : "Engineering action:"} {opp.action} ({opp.estimatedHours || 2.5}h)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3-Phase Roadmap */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPolish ? "3-Etapowy Harmonogram Wdrożeniowy" : "3-Phase Implementation Roadmap"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiAdvisor.remediationPlan.map((phase) => (
                        <div key={phase.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1.5">
                          <div className="text-xs font-mono font-bold text-emerald-700">ETAP 0{phase.step}</div>
                          <div className="text-xs font-bold text-slate-900">{phase.title}</div>
                          <p className="text-xs text-slate-600 leading-relaxed">{phase.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agency Sales Scripts & Objection Handler (Strictly Agency View Only) */}
                  {viewMode === "agency" && (
                    <div className="bg-[#111A2E] text-white rounded-2xl p-6 border border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="text-sm font-extrabold text-white">
                            {isPolish
                              ? "Gotowe szkice wiadomości i argumenty do rozmowy"
                              : "Ready-made message drafts and talking points"}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {isPolish
                              ? "Skopiuj gotową wiadomość dopasowaną do wyników tej strony lub odpowiedź na obiekcję „zrobię to sam / konkurencja zrobi za 500 zł”."
                              : "Copy tailored outreach scripts or the exact response when a prospect says they can hire someone cheaper."}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#1C2A47] p-1 rounded-xl">
                          <button
                            onClick={() => setActiveScriptTab("coldEmail")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                              activeScriptTab === "coldEmail" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {isPolish ? "1. E-mail Ofertowy" : "1. Cold Email"}
                          </button>
                          <button
                            onClick={() => setActiveScriptTab("phonePitch")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                              activeScriptTab === "phonePitch" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {isPolish ? "2. Skrypt Rozmowy Tel." : "2. Phone Pitch"}
                          </button>
                          <button
                            onClick={() => setActiveScriptTab("objectionHandler")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                              activeScriptTab === "objectionHandler" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {isPolish ? "3. Odpowiedź na zastrzeżenie o cenie" : "3. Handling a price objection"}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#16223A] border border-[#24375B] text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                        {aiAdvisor.salesScripts?.[activeScriptTab] || aiAdvisor.clientPitch}
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            handleCopyText(
                              aiAdvisor.salesScripts?.[activeScriptTab] || aiAdvisor.clientPitch,
                              isPolish ? "Skrypt sprzedażowy" : "Sales script"
                            )
                          }
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isPolish ? "Kopiuj Skrypt do Schowka" : "Copy Script to Clipboard"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
  );
}
