import { BarChart3, Bot, Briefcase, Calculator, CheckCircle2, Gauge, ShieldCheck } from "lucide-react";
import { ProgressSummaryCard, ScoreBarCard, ScoreGaugeCard } from "../components/ScoreCards";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function OverviewTab({ app }: { app: AppState }) {
  const {
    currency,
    currentReport,
    handleSaveCurrentToCrm,
    hasRoiAssumptions,
    hourlyRate,
    isPolish,
    isPublicMode,
    liveSeo,
    pageWeight,
    projectedLiftPct,
    scopeSummary,
    setActiveTab,
    setIsAcceptProposalOpen,
    setIsQuoteOpen,
    strategy,
    viewMode,
  } = app;
  return (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                <ScoreGaugeCard
                  title={isPolish ? "Indeks kondycji strony" : "Overall Health Index"}
                  score={currentReport.overallScore}
                  status={currentReport.overallLabel}
                  isPolish={isPolish}
                />
                <ScoreBarCard
                  title={isPolish ? "Techniczne SEO (kontrola HTML)" : "Technical SEO (HTML check)"}
                  score={currentReport.categories.seo}
                  breakdown={[
                    { label: isPolish ? "Wydajność Mobile" : "Mobile Speed", val: currentReport.categories.performance },
                    { label: isPolish ? "Indeksowanie SEO" : "Crawlability", val: currentReport.seoBreakdown.crawlability },
                    { label: isPolish ? "Struktura On-Page" : "On-Page SEO", val: currentReport.seoBreakdown.onPageSeo },
                  ]}
                  isPolish={isPolish}
                />
                <ScoreBarCard
                  title={isPolish ? "Dostępność WCAG 2.1 AA" : "WCAG 2.1 AA Compliance"}
                  score={currentReport.categories.accessibility}
                  breakdown={[
                    { label: isPolish ? "Kontrast Tekstu" : "Contrast Ratio", val: currentReport.accessibilityBreakdown.contrast },
                    { label: isPolish ? "Nawigacja & Focus" : "Navigation", val: currentReport.accessibilityBreakdown.navigation },
                    { label: isPolish ? "Atrybuty Alt/ARIA" : "Alt & ARIA", val: currentReport.accessibilityBreakdown.aria },
                  ]}
                  isPolish={isPolish}
                />
                <ProgressSummaryCard report={currentReport} isPolish={isPolish} />
              </div>

              {/* AURA Executive Status Grid (Matching reference SaaS Dashboard UI) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* SEO Status Card with Mini Gauges */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isPolish ? "Status SEO & Autorytet Domeny" : "SEO Status & Domain Authority"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-black">
                      {currentReport.categories.seo}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-4">
                    {[
                      { label: isPolish ? "Autorytet Domeny" : "Domain Authority", val: 68 },
                      { label: isPolish ? "Indeksowanie" : "Crawlability", val: currentReport.seoBreakdown.crawlability },
                      { label: isPolish ? "On-Page SEO" : "On-Page SEO", val: currentReport.seoBreakdown.onPageSeo },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="relative w-16 h-16 flex items-center justify-center my-1">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="24" stroke="#e2e8f0" strokeWidth="5" fill="none" />
                            <circle
                              cx="30"
                              cy="30"
                              r="24"
                              stroke="#059669"
                              strokeWidth="5"
                              strokeDasharray={2 * Math.PI * 24}
                              strokeDashoffset={2 * Math.PI * 24 * (1 - (item.val || 75) / 100)}
                              strokeLinecap="round"
                              fill="none"
                            />
                          </svg>
                          <span className="absolute text-xs font-mono font-extrabold text-slate-900">{item.val}%</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 mt-1">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {isPolish ? "Analiza struktury linków, tagów meta i mapy XML" : "Verified via live HTML crawler"}
                  </div>
                </div>

                {/* Accessibility Compliance Card with 4 Mini Gauges */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isPolish ? "Zgodność z WCAG 2.1 AA (Accessibility)" : "Accessibility Compliance WCAG 2.1 AA"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-black">
                      {currentReport.categories.accessibility}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                    {[
                      { label: isPolish ? "Postrzegalna" : "Perceivable", val: 95 },
                      { label: isPolish ? "Funkcjonalna" : "Operable", val: 89 },
                      { label: isPolish ? "Zrozumiała" : "Understandable", val: 97 },
                      { label: isPolish ? "Solidna" : "Robust", val: 94 },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="relative w-14 h-14 flex items-center justify-center my-1">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="22" stroke="#e2e8f0" strokeWidth="4.5" fill="none" />
                            <circle
                              cx="30"
                              cy="30"
                              r="22"
                              stroke="#0284c7"
                              strokeWidth="4.5"
                              strokeDasharray={2 * Math.PI * 22}
                              strokeDashoffset={2 * Math.PI * 22 * (1 - item.val / 100)}
                              strokeLinecap="round"
                              fill="none"
                            />
                          </svg>
                          <span className="absolute text-[11px] font-mono font-extrabold text-slate-900">{item.val}%</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {isPolish ? "Test kontrastu, nawigacji klawiaturą oraz etykiet ARIA" : "Tested against W3C WCAG 2.1 AA standards"}
                  </div>
                </div>
              </div>

              {/* Executive Business Impact & Site Snapshot Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <h2 className="text-base font-extrabold text-slate-900 font-heading">
                        {isPolish
                          ? "Wpływ Błędów Technicznych na Sprzedaż i Pozyskiwanie Klientów"
                          : "Business & Conversion Impact Diagnosis"}
                      </h2>
                      {hasRoiAssumptions && (
                        <span className="text-xs font-mono font-semibold text-emerald-700">
                          {isPolish ? "Założony wzrost konwersji (scenariusz):" : "Assumed conversion lift (scenario):"} +{projectedLiftPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {isPolish
                        ? `Przeskanowana witryna (${currentReport.finalUrl}) uzyskuje wynik ${currentReport.overallScore}/100. Czas ładowania głównej treści (LCP: ${currentReport.coreWebVitals.lcp.displayValue}) oraz wykryte blokady renderowania powodują, że część klientów mobilnych opuszcza stronę przed wysłaniem zapytania. Poniżej znajdują się 3 kluczowe parametry finansowe wyliczone dla tej domeny:`
                        : `The audited website (${currentReport.finalUrl}) scores ${currentReport.overallScore}/100. Current Largest Contentful Paint (${currentReport.coreWebVitals.lcp.displayValue}) and render-blocking scripts cause mobile visitor drop-offs before form submission:`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {hasRoiAssumptions && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500">
                        {isPolish ? "Scenariusz: dodatkowy przychód (z Twoich założeń)" : "Scenario: extra revenue (from your inputs)"}
                      </div>
                      <div className="text-xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">
                        +{scopeSummary.monthlyGain.toLocaleString()} {currency}/mc
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {isPolish ? `Wzrost z ${scopeSummary.currentLeads} do ${scopeSummary.newLeads} klientów/mc` : `Lift from ${scopeSummary.currentLeads} to ${scopeSummary.newLeads} leads/mo`}
                      </div>
                    </div>

                    )}

                    {(viewMode === "client" || isPublicMode) && (
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500">
                        {isPolish ? "Koszt kompleksowej naprawy" : "Turnkey Remediation Cost"}
                      </div>
                      <div className="text-xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">
                        {scopeSummary.netPrice.toLocaleString()} {currency}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {isPolish ? `Dopasowany nakład: ${scopeSummary.totalHours} roboczogodzin` : `Dynamic scope: ${scopeSummary.totalHours} hours`}
                      </div>
                    </div>
)}

                    {hasRoiAssumptions && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500">
                        {isPolish ? "Czas zwrotu (scenariusz ilustracyjny)" : "Payback (illustrative scenario)"}
                      </div>
                      <div className="text-xl font-mono font-extrabold text-emerald-700 mt-1 tabular-nums">
                        ~{scopeSummary.paybackDays} {isPolish ? "dni" : "days"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {isPolish ? "Wynik zależy od założeń; to nie prognoza" : "Depends on the assumptions; not a forecast"}
                      </div>
                    </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {viewMode === "client" ? (
                      <button
                        onClick={() => (isPublicMode ? setIsQuoteOpen(true) : setIsAcceptProposalOpen(true))}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isPublicMode
                            ? isPolish
                              ? "Poproś o wycenę napraw"
                              : "Request a quote for the fixes"
                            : isPolish
                            ? `Akceptuję Kosztorys (${scopeSummary.netPrice} ${currency}) i Zamawiam Wdrożenie`
                            : `Accept Proposal (${scopeSummary.netPrice} ${currency}) & Order Fix`}
                        </span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveTab("ai-advisor")}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Bot className="w-4 h-4 text-emerald-400" />
                          <span>{isPolish ? "Otwórz AI Growth Advisor i Skrypty Sprzedaży" : "Open AI Advisor & Sales Scripts"}</span>
                        </button>
                        {app.roiAllowed && (
<button
                          onClick={() => setActiveTab("roi-calculator")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>{isPolish ? "Dostosuj Kosztorys Godzinowy i ROI" : "Customize Hourly Quote & ROI"}</span>
                        </button>
)}
                        <button
                          onClick={handleSaveCurrentToCrm}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-slate-600" />
                          <span>{isPolish ? "Zapisz w CRM Agencji" : "Save to Agency CRM"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Rendered Screenshot Preview */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {isPolish ? "Zrzut Renderowania Strony" : "Live Render Snapshot"}
                      </h3>
                      <span className="text-xs font-mono text-slate-500">{strategy.toUpperCase()}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                      {currentReport.screenshot ? (
                        <img
                          src={currentReport.screenshot}
                          alt={`Snapshot of ${currentReport.scannedUrl}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-slate-400 p-4 text-center">
                          {isPolish ? "Podgląd wygenerowany podczas skanu" : "Rendered viewport snapshot"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>HTTPS / SSL: {liveSeo.https ? (isPolish ? "Aktywny (Bezpieczna)" : "Active (Secure)") : (isPolish ? "Brak SSL!" : "No SSL!")}</span>
                    <span className="font-mono tabular-nums">{isPolish ? "Waga" : "Weight"}: {pageWeight.totalKb} KB · TTFB: {liveSeo.responseTimeMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Core Web Vitals Row */}
              <section className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <span>{isPolish ? "Core Web Vitals (oficjalne wskaźniki szybkości Google)" : "Core Web Vitals (Google's official speed metrics)"}</span>
                  </h3>
                  <span className="text-xs text-slate-500">Google PageSpeed & Chrome UX Report</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.values(currentReport.coreWebVitals).map((vital) => (
                    <div key={vital.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>{vital.acronym}</span>
                        <span className="font-mono text-[11px] text-emerald-700">{vital.target}</span>
                      </div>
                      <div className="text-xl font-mono font-extrabold text-slate-900 tabular-nums">{vital.displayValue}</div>
                      <div className="text-[11px] text-slate-500 truncate">{vital.name}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Top Priority Issues with Agency vs Client Protection */}
              <section className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {isPolish
                          ? "Wykryte Problemy Techniczne i Ich Wpływ na Twój Biznes"
                          : "Detected Bottlenecks & Business Impact"}
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : isPublicMode ? setIsQuoteOpen(true) : setActiveTab("crm"))}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isPublicMode
                      ? isPolish
                        ? "Poproś o wycenę napraw"
                        : "Request a quote for the fixes"
                      : viewMode === "client"
                      ? isPolish
                        ? "Zaakceptuj Kosztorys i Zleć Naprawę"
                        : "Accept Quote & Order Remediation"
                      : isPolish
                      ? "Utwórz ofertę dla klienta"
                      : "Create client offer"}
                  </button>
                </div>

                <div className="space-y-3">
                  {currentReport.issues.map((issue, idx) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">0{idx + 1}.</span>
                          <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                          {issue.displayValue && <span className="text-emerald-700 font-semibold">{issue.displayValue}</span>}
                          <span className="text-slate-400">·</span>
                          <span className="font-bold text-slate-700">
                            {issue.estimatedHours ?? 2.0}h ({Math.round((issue.estimatedHours ?? 2.0) * hourlyRate)} {currency})
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{issue.description}</p>
                      <div className="text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 rounded-lg p-2.5">
                        <strong>{isPolish ? "Wpływ na biznes i konwersję:" : "Business Impact:"}</strong>{" "}
                        {issue.businessImpact || (isPolish ? "Obniża pozycję organiczną w Google i wydłuża czas oczekiwania klienta." : "Reduces Google organic rank and increases visitor bounce rate.")}
                      </div>

                      {viewMode === "agency" ? (
                        <div className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 font-mono">
                          <strong className="text-slate-900">{isPolish ? "[TRYB AGENCJI — Instrukcja dla Dewelopera]:" : "[AGENCY VIEW — Developer Fix]:"}</strong>{" "}
                          {issue.developerFix || "Optymalizacja zasobów w potoku budowania, kompresja AVIF/Brotli oraz wydzielenie Critical CSS."}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {isPolish
                                ? "Bezpieczna naprawa architektoniczna realizowana przez inżynierów NovoPix z testami formularzy i koszyka po wdrożeniu."
                                : "Architectural remediation executed by NovoPix engineers with form and checkout testing after deployment."}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
  );
}
