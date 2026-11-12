import { AuditIntegrityBanner } from "./components/AuditIntegrityBanner";
import { Calculator, CheckCircle2, CircleHelp, Copy, Download, Eye, Globe, Lock, Monitor, Printer, RefreshCw, Search, Share2, Shield, ShieldCheck, Smartphone, X } from "lucide-react";
import { InfoModal } from "./components/InfoModal";
import { NovoPixAnimatedMark } from "./components/NovoPixAnimatedMark";
import React, { Suspense, lazy, useEffect, useRef } from "react";
import { useAppState } from "./state/useAppState";

// Wszystkie zakładki, lejek i okna modalne ładują się dopiero wtedy, gdy są potrzebne (mniejszy plik startowy).
const loadOverviewTab = () => import("./tabs/OverviewTab");
const loadPublicFunnel = () => import("./components/PublicFunnel");
const OverviewTab = lazy(loadOverviewTab);
const PublicFunnel = lazy(loadPublicFunnel);
const AiAdvisorTab = lazy(() => import("./tabs/AiAdvisorTab"));
const SeoTab = lazy(() => import("./tabs/SeoTab"));
const PerformanceTab = lazy(() => import("./tabs/PerformanceTab"));
const InsightsTab = lazy(() => import("./tabs/InsightsTab"));
const CompareTab = lazy(() => import("./tabs/CompareTab"));
const WebScoreTab = lazy(() => import("./tabs/WebScoreTab"));
const DiagnosticsTab = lazy(() => import("./tabs/DiagnosticsTab"));
const AccessibilityTab = lazy(() => import("./tabs/AccessibilityTab"));
const ChecklistTab = lazy(() => import("./tabs/ChecklistTab"));
const QuoteModal = lazy(() => import("./components/QuoteModal").then((m) => ({ default: m.QuoteModal })));
const AcceptProposalModal = lazy(() => import("./components/AcceptProposalModal").then((m) => ({ default: m.AcceptProposalModal })));
const BulkTab = lazy(() => import("./tabs/BulkTab"));
const PackagesTab = lazy(() => import("./tabs/PackagesTab"));
const RoiCalculatorTab = lazy(() => import("./tabs/RoiCalculatorTab"));
const MonitoringTab = lazy(() => import("./tabs/MonitoringTab"));
const StatusTab = lazy(() => import("./tabs/StatusTab"));
const StatsTab = lazy(() => import("./tabs/StatsTab"));
const CrmTab = lazy(() => import("./tabs/CrmTab"));
const ReportsTab = lazy(() => import("./tabs/ReportsTab"));

function useLatch(value: boolean): boolean {
  const ref = useRef(false);
  if (value) ref.current = true;
  return ref.current;
}

function TabFallback({ isPolish }: { isPolish: boolean }) {
  return <div className="text-xs text-slate-500 p-3">{isPolish ? "Ładowanie…" : "Loading…"}</div>;
}

export default function App() {
  const app = useAppState();
  const {
    activeTab,
    agencyCtx,
    agencyToken,
    clientName,
    currency,
    currentReport,
    getAuthHeaders,
    handleDownloadCrmBackup,
    handleDownloadHtmlReport,
    handleRequestAgencyMode,
    handleRunScan,
    handleSaveAndCopyClientLink,
    handleUnlockWithPin,
    hasScan,
    hourlyRate,
    isAcceptProposalOpen,
    isClientLinkLocked,
    isDefaultPinWarning,
    isHowItWorksOpen,
    isPinModalOpen,
    isPolish,
    isPrivacyOpen,
    isPublicMode,
    isQuoteOpen,
    isScanning,
    liveSeo,
    pinAttempt,
    pinError,
    retainerMonthly,
    scanError,
    scopeSummary,
    setActiveTab,
    setAgencyToken,
    setCrmClients,
    setIsAcceptProposalOpen,
    setIsHowItWorksOpen,
    setIsPinModalOpen,
    setIsPolish,
    setIsPrivacyOpen,
    setIsQuoteOpen,
    setPinAttempt,
    setPinError,
    setStrategy,
    setUrlInput,
    setViewMode,
    showToast,
    shownTab,
    strategy,
    toastMsg,
    unseenAlerts,
    statusDown,
    urlInput,
    viewMode,
    workspaceTabs,
  } = app;
  // Okna modalne: kod pobierany przy pierwszym otwarciu, potem okno zostaje zamontowane (stan formularza jak dotąd).
  const quoteEverOpen = useLatch(isQuoteOpen);
  const acceptEverOpen = useLatch(isAcceptProposalOpen);
  // Gdy rusza skan, pobierz z wyprzedzeniem widok wyników, żeby pojawił się bez opóźnienia.
  useEffect(() => {
    if (!isScanning) return;
    loadOverviewTab().catch(() => {});
    if (isPublicMode) loadPublicFunnel().catch(() => {});
  }, [isScanning, isPublicMode]);
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col lg:flex-row text-slate-800 font-sans selection:bg-emerald-500/30">
      {/* Login status badge (agency panel only) */}
      {!isPublicMode && (
        <div className="fixed bottom-3 left-3 z-50 no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-lg border"
          style={{ background: agencyToken ? "#064e3b" : "#3f2d06", color: agencyToken ? "#a7f3d0" : "#fcd34d", borderColor: agencyToken ? "#10b981" : "#f59e0b" }}>
          <span>{agencyToken ? (isPolish ? "✅ Zalogowano (Agencja)" : "✅ Logged in (Agency)") : (isPolish ? "🔒 Niezalogowany" : "🔒 Not logged in")}</span>
          {agencyToken ? (
            <button type="button" className="underline cursor-pointer"
              onClick={() => {
                fetch("/api/settings/logout", { method: "POST", headers: getAuthHeaders() }).catch(() => {});
                setAgencyToken(null);
                try { sessionStorage.removeItem("novopix_agency_token"); } catch {}
              }}>{isPolish ? "Wyloguj" : "Log out"}</button>
          ) : (
            <button type="button" className="underline cursor-pointer"
              onClick={() => { setActiveTab("crm"); handleRequestAgencyMode(); }}>{isPolish ? "Zaloguj" : "Log in"}</button>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sidebar Navigation — Authentic NovoPix Oceanic Theme (#0b2230 -> #103247) */}
      <aside className="hidden lg:flex w-64 novopix-sidebar-bg text-slate-300 flex-col justify-between shrink-0 min-h-screen border-r border-[#8fd8ff]/15 no-print">
        <div>
          {/* Brand Header — Authentic NovoPix 5x5 Animated Pixel-Grid Logo (N-O-V-O-P-I-X) + Wordmark */}
          <div className="p-6 pb-5 flex items-center gap-3 border-b border-[#8fd8ff]/15">
            <div
              className="w-10 h-10 rounded-xl bg-[#103247] border border-[#8fd8ff]/30 flex items-center justify-center shadow-md shadow-black/30 shrink-0"
              title={isPolish ? "Najedź lub kliknij — animowana matryca 5x5 N-O-V-O-P-I-X" : "Hover or click — animated 5x5 N-O-V-O-P-I-X matrix"}
            >
              <NovoPixAnimatedMark sizeClass="w-6 h-6" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base tracking-tight text-white leading-none">
                <span>Novo</span>
                <span className="novopix-wordmark-pix">Pix</span>
              </div>
              <div className="text-[11px] text-[#bcd6e6] font-medium mt-1">
                {viewMode === "client" && !isPublicMode ? (isPolish ? "Pokój Ofertowy Klienta" : "Client Deal Room") : "Website Growth Scanner"}
              </div>
            </div>
          </div>

          {/* View Mode Switcher in Sidebar (Hidden when locked via external Client Link) */}
          {!isClientLinkLocked && (
            <div className="px-4 pt-4">
              <div className="p-2 rounded-xl bg-[#103247]/80 border border-[#8fd8ff]/20">
                <div className="text-[10px] font-semibold text-[#bcd6e6] px-1 mb-1.5 flex items-center justify-between">
                  <span>{isPolish ? "Tryb Prezentacji Danych" : "Presentation Mode"}</span>
                  <span className="text-[9px] text-[#9af0c8] font-mono">SERVER PIN</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={handleRequestAgencyMode}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "agency" ? "bg-[#3ddc97] text-[#0b2230]" : "text-[#bcd6e6] hover:text-white"
                    }`}
                  >
                    {isPolish ? "Tryb Agencji" : "Agency View"}
                  </button>
                  <button
                    onClick={() => setViewMode("client")}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "client" ? "bg-[#ffc233] text-[#0e2733]" : "text-[#bcd6e6] hover:text-white"
                    }`}
                  >
                    {isPolish ? "Widok Klienta" : "Client Pitch"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Workspace Menu */}
          <div className="px-4 py-3">
            <div className="text-[11px] font-semibold text-[#bcd6e6]/80 px-3 mb-2">
              {viewMode === "client"
                ? isPolish
                  ? "Sekcje Raportu i Kosztorysu"
                  : "Audit & Proposal Sections"
                : isPolish
                ? "Moduły Audytu i Sprzedaży"
                : "Audit & Sales Workspace"}
            </div>
            <nav className="space-y-0.5">
              {workspaceTabs.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#174460] text-white font-bold border border-[#8fd8ff]/25"
                        : "text-[#bcd6e6] hover:text-white hover:bg-[#103247]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-[#4de0ff]" : item.highlight ? "text-[#ffc233]" : "text-[#8fd8ff]/70"}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.id === "status" && statusDown > 0 && <span className="ml-2 w-2.5 h-2.5 rounded-full bg-rose-600" aria-label="status down" />}
                    {item.id === "monitoring" && unseenAlerts.length > 0 && (
                      <span className="ml-2 shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center" aria-label={isPolish ? `Nowe alerty: ${unseenAlerts.length}` : `New alerts: ${unseenAlerts.length}`}>
                        {unseenAlerts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Secondary links */}
          <div className="px-4 py-2 border-t border-[#8fd8ff]/15">
            <nav className="space-y-0.5">
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#bcd6e6] hover:text-white hover:bg-[#103247] transition-all cursor-pointer"
              >
                <CircleHelp className="w-4 h-4 text-[#8fd8ff]" />
                <span>{isPolish ? "Jak to działa?" : "How it works"}</span>
              </button>
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#bcd6e6] hover:text-white hover:bg-[#103247] transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#8fd8ff]" />
                <span>{isPolish ? "Prywatność i Bezpieczeństwo" : "Privacy & API Security"}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Summary */}
        <div className="p-4 border-t border-[#8fd8ff]/15">
          <div className="p-3 rounded-xl bg-[#103247]/90 border border-[#8fd8ff]/20 mb-2">
            {app.roiAllowed && (
            <div className="text-[11px] font-bold text-white mb-0.5">
              {isPolish ? "Bieżąca Wycena Naprawy" : "Current Fix Quote"}
            </div>
            )}
            {!app.roiAllowed ? null : hasScan ? (
              <div className="text-base font-mono font-extrabold text-[#ffc233] tabular-nums">
                {scopeSummary.netPrice} {currency} <span className="text-[10px] font-normal text-[#bcd6e6]">({scopeSummary.totalHours}h)</span>
              </div>
            ) : (
              <div className="text-[11px] text-[#bcd6e6]">{isPolish ? "Wycena pojawi się po skanie strony." : "The quote appears after a website scan."}</div>
            )}
            <button
              onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : isPublicMode ? setIsQuoteOpen(true) : app.roiAllowed ? setActiveTab("roi-calculator") : setIsPinModalOpen(true))}
              className="mt-1.5 text-[11px] font-bold text-[#8fe9ff] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>
                {isPublicMode
                  ? isPolish
                    ? "Poproś o wycenę →"
                    : "Request a quote →"
                  : viewMode === "client"
                  ? isPolish
                    ? "Akceptuj kosztorys online →"
                    : "Accept proposal online →"
                  : !app.roiAllowed
                  ? isPolish
                    ? "Zaloguj się jako agencja →"
                    : "Log in as agency →"
                  : isPolish
                  ? "Otwórz kalkulator ROI →"
                  : "Open ROI Calculator →"}
              </span>
            </button>
          </div>
          <div className="text-[10px] text-[#bcd6e6]/70 text-center">NovoPix · novopix.uk · contact@novopix.uk</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-clip">
        {/* Top Bar Contract: 3 Zones */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20 no-print">
          {/* Zone 1: Single-line Brand Wordmark with Authentic NovoPix 5x5 Animated Grid Mark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg bg-[#0b2230] flex items-center justify-center shrink-0"
              title={isPolish ? "Najedź lub kliknij — animowane logo N-O-V-O-P-I-X" : "Hover or click — animated N-O-V-O-P-I-X logo"}
            >
              <NovoPixAnimatedMark sizeClass="w-5 h-5" />
            </div>
            <span className="text-sm font-heading font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              NovoPix <span className="text-[#103247]">Growth Scanner</span>
            </span>
          </div>

          {/* Zone 2: Concise Single-Line Workspace Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600 overflow-x-auto">
            {(viewMode === "client"
              ? [
                  { id: "overview", label: isPolish ? "Przegląd Audytu" : "Audit Overview" },
                  { id: "seo", label: isPolish ? "Audyt SEO HTML" : "Deep SEO" },
                  { id: "compare", label: isPolish ? "Porównanie z Konkurencją" : "Competitor Compare" },
                ]
              : [
                  { id: "overview", label: isPolish ? "Przegląd audytu" : "Audit overview" },
                  { id: "ai-advisor", label: "AI Advisor" },
                  ...(app.roiAllowed ? [{ id: "roi-calculator", label: isPolish ? "Kalkulator Wyceny & ROI" : "ROI & Pricing" }] : []),
                  { id: "seo", label: isPolish ? "Audyt SEO HTML" : "Deep SEO" },
                  { id: "crm", label: isPolish ? "Panel Agencji CRM" : "Agency CRM" },
                ]
            ).map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === nav.id
                    ? "text-[#0b2230] font-bold underline underline-offset-8 decoration-2 decoration-[#ffc233]"
                    : "hover:text-slate-900"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action + 1-Click Project ZIP & novopix.uk index.html Download */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode === "agency" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("crm");
                    handleRequestAgencyMode();
                  }}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title={isPolish ? "Odblokuj Panel Agencji i CRM" : "Unlock Agency Panel & CRM"}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isPolish ? "🔒 Panel Agencji CRM (PIN)" : "🔒 Agency CRM (PIN)"}</span>
                </button>
              </>
            )}
            <button
              onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : isPublicMode ? setIsQuoteOpen(true) : setActiveTab("crm"))}
              className="px-4 py-2 novopix-gold-btn rounded-lg text-xs font-extrabold transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPublicMode
                ? isPolish
                  ? "Poproś o wycenę"
                  : "Request a quote"
                : viewMode === "client"
                ? isPolish
                  ? "Akceptuję ofertę"
                  : "Accept proposal"
                : isPolish
                ? "Utwórz ofertę"
                : "Create offer"}
            </button>
          </div>
        </header>

        {/* Client Deal Room Banner when active */}
        {isPublicMode && (
          <div className="bg-emerald-950 text-white border-b border-emerald-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <span>
              {isPolish
                ? "Bezpłatny pomiar strony: wyniki pochodzą z Google PageSpeed Insights i kontroli kodu HTML. To nie jest certyfikat ani gwarancja wyniku."
                : "Free website check: results come from Google PageSpeed Insights and an HTML inspection. It is not a certificate or a guarantee of results."}
            </span>
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap"
            >
              {isPolish ? "Poproś o wycenę →" : "Request a quote →"}
            </button>
          </div>
        )}
        {viewMode === "client" && !isPublicMode && (
          <div className="bg-emerald-950 text-white border-b border-emerald-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{isPolish ? `Oficjalny Pokój Ofertowy dla: ${clientName}` : `Official Proposal Deal Room for: ${clientName}`}</strong>{" "}
                —{" "}
                {isPolish
                  ? "Wyniki pomiaru i lista problemów Twojej strony. Wycenę otrzymasz w ofercie od NovoPix."
                  : "Measurement results and the list of issues for your website. You will receive the quote in the offer from NovoPix."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAcceptProposalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap"
              >
                {isPolish ? "Akceptuję Ofertę i Zamawiam Wdrożenie →" : "Accept Proposal & Order Fix →"}
              </button>
            </div>
          </div>
        )}

        {/* Input Bar & Workspace Toolbar */}
        <section className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
                {isPolish
                  ? "Kompleksowy Audyt Szybkości, Technicznego SEO i Konwersji"
                  : "Comprehensive Speed, Technical SEO & Conversion Audit"}
              </h1>
              {hasScan && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate max-w-xs sm:max-w-md font-mono">
                    <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {currentReport.finalUrl || currentReport.scannedUrl}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-emerald-700">
                    {isPolish ? "Kondycja:" : "Health:"}{" "}
                    {currentReport.overallScore === null
                      ? isPolish ? "brak pomiaru ogólnego (pomiar częściowy)" : "no overall score (partial measurement)"
                      : `${currentReport.overallScore}/100 (${currentReport.overallLabel})`}
                  </span>
                  {app.roiAllowed && (
                    <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {isPolish ? "Wstępna wycena:" : "Preliminary quote:"}{" "}
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {scopeSummary.netPrice} {currency} ({scopeSummary.totalHours}h)
                    </strong>
                  </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    {new Date(currentReport.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>

            {/* Utility Controls: Language, Mode, Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setIsPolish(true)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    isPolish ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  PL
                </button>
                <button
                  onClick={() => setIsPolish(false)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    !isPolish ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  EN
                </button>
              </div>

              {!isClientLinkLocked && (
                <button
                  onClick={() => {
                    if (viewMode === "agency") {
                      setViewMode("client");
                    } else {
                      handleRequestAgencyMode();
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{viewMode === "agency" ? (isPolish ? "Pokój Klienta" : "Client Deal Room") : (isPolish ? "Tryb Agencji" : "Agency Mode")}</span>
                </button>
              )}

              {viewMode === "agency" && (
                <button
                  onClick={handleSaveAndCopyClientLink}
                  className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isPolish ? "Kopiuj Link Klienta 1:1" : "Copy 1:1 Client Link"}</span>
                </button>
              )}

              <button
                onClick={handleDownloadHtmlReport}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>{isPolish ? "Pobierz Raport HTML" : "Download HTML"}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{isPolish ? "Drukuj / PDF" : "Print / PDF"}</span>
              </button>
            </div>
          </div>

          {/* Search Form Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunScan();
              }}
              className="flex flex-col sm:flex-row items-stretch gap-2.5"
            >
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={
                    isPolish
                      ? "Wpisz adres strony do zeskanowania (np. firma.pl)"
                      : "Enter the website address to scan (e.g. company.com)"
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                  required
                />
              </div>

              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setStrategy("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    strategy === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    strategy === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isPolish ? "Głębokie Skanowanie..." : "Deep Scanning..."}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{isPolish ? "Skanuj Stronę (PSI + SEO)" : "Run Deep Scan"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Scrollable Workspace Tab Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-100 scrollbar-none">
              {workspaceTabs.map((tab) => {
                const IconComp = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white"
                        : tab.highlight
                        ? "bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${active ? "text-emerald-400" : "text-emerald-600"}`} />
                    <span>{tab.short}</span>
                    {tab.id === "status" && statusDown > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-600" aria-label="status down" />}
                    {tab.id === "monitoring" && unseenAlerts.length > 0 && (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center" aria-label={isPolish ? `Nowe alerty: ${unseenAlerts.length}` : `New alerts: ${unseenAlerts.length}`}>
                        {unseenAlerts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Workspace Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1550px] w-full mx-auto space-y-6">
          <AuditIntegrityBanner
            report={currentReport}
            liveSeo={liveSeo}
            isPolish={isPolish}
            viewMode={viewMode}
            agencyToken={agencyToken}
            isDefaultPinWarning={isDefaultPinWarning}
            scanError={scanError}
            onUnlockWithPin={handleUnlockWithPin}
            onDownloadBackup={handleDownloadCrmBackup}
            onOpenPinSettings={() => setActiveTab("reports")}
          />

          {shownTab === "empty-state" && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4" data-testid="empty-scan-state">
              <Search className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">{isPolish ? "Zeskanuj stronę" : "Scan a website"}</h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                {isPolish
                  ? "Wpisz adres strony w polu powyżej i kliknij „Skanuj”. Wyniki pojawią się dopiero po rzeczywistym pomiarze; do tego czasu nie pokazujemy żadnych liczb."
                  : "Enter a website address in the field above and click “Scan”. Results appear only after a real measurement; until then no numbers are shown."}
              </p>
              <button
                type="button"
                onClick={() => handleRunScan()}
                disabled={isScanning || !urlInput.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (isPolish ? "Skanuję…" : "Scanning…") : isPolish ? "Skanuj stronę" : "Scan website"}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW (AURA EXECUTIVE OVERVIEW)                         */}
          {/* ================================================================= */}
          {shownTab === "overview" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <OverviewTab app={app} />
            </Suspense>
          )}
          {shownTab === "overview" && isPublicMode && (
            <Suspense fallback={null}>
              <PublicFunnel app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 2: AI GROWTH ADVISOR & SALES SCRIPT GENERATOR                 */}
          {/* ================================================================= */}
          {shownTab === "ai-advisor" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <AiAdvisorTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 3: DYNAMIC HOURLY SCOPE & ROI CALCULATOR                      */}
          {/* ================================================================= */}
          {shownTab === "roi-calculator" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <RoiCalculatorTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 4: DEEP TECHNICAL SEO & LIVE HTML INSPECTOR                   */}
          {/* ================================================================= */}
          {shownTab === "seo" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <SeoTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 5: ADVANCED PERFORMANCE & CORE WEB VITALS                     */}
          {/* ================================================================= */}
          {shownTab === "performance" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <PerformanceTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 6: INSIGHTS, RESOURCE PAGE WEIGHT & ISSUE DETECTION           */}
          {/* ================================================================= */}
          {shownTab === "insights" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <InsightsTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 7: COMPETITOR ANALYSIS (HEAD-TO-HEAD 1:1 + DELTA VERDICT)     */}
          {/* ================================================================= */}
          {shownTab === "compare" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <CompareTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 8: 24/7 DOMAIN MONITORING & RETAINER ALERTS (AGENCY ONLY)     */}
          {/* ================================================================= */}
          {shownTab === "monitoring" && viewMode === "agency" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <MonitoringTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 9: AGENCY CRM PANEL (AGENCY ONLY)                             */}
          {/* ================================================================= */}
          {shownTab === "crm" && viewMode === "agency" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <CrmTab app={app} />
            </Suspense>
          )}

          {shownTab === "packages" && viewMode === "agency" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              {agencyToken ? (
                <PackagesTab ctx={agencyCtx} />
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-sm text-slate-700 space-y-3">
                  <p>{isPolish ? "Ta funkcja wymaga zalogowania kodem PIN." : "This feature requires PIN login."}</p>
                  <button type="button" onClick={() => setIsPinModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                    {isPolish ? "Zaloguj" : "Log in"}
                  </button>
                </div>
              )}
            </Suspense>
          )}

          {shownTab === "status" && viewMode === "agency" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              {agencyToken ? <StatusTab ctx={agencyCtx} /> : (
                <button type="button" onClick={() => setIsPinModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                  {isPolish ? "Zaloguj kodem PIN" : "Log in with PIN"}
                </button>
              )}
            </Suspense>
          )}

          {shownTab === "stats" && viewMode === "agency" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              {agencyToken ? <StatsTab ctx={agencyCtx} /> : (
                <button type="button" onClick={() => setIsPinModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                  {isPolish ? "Zaloguj kodem PIN" : "Log in with PIN"}
                </button>
              )}
            </Suspense>
          )}

          {shownTab === "bulk" && viewMode === "agency" && (
            <Suspense fallback={<div className="text-xs text-slate-500 p-3">{isPolish ? "Ładowanie…" : "Loading…"}</div>}>
              {agencyToken ? (
                <BulkTab ctx={agencyCtx} onClientAdded={(c) => setCrmClients((prev) => [c, ...prev.filter((x) => x.id !== c.id)])} />
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-sm text-slate-700 space-y-3">
                  <p>{isPolish ? "Ta funkcja wymaga zalogowania kodem PIN." : "This feature requires PIN login."}</p>
                  <button type="button" onClick={() => setIsPinModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                    {isPolish ? "Zaloguj" : "Log in"}
                  </button>
                </div>
              )}
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 10: WHITE-LABEL REPORTS & INTERACTIVE CLIENT SHARE LINK       */}
          {/* ================================================================= */}
          {shownTab === "reports" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <ReportsTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 11: WEBSCORE EVOLUTION & LOCAL SCAN HISTORY                   */}
          {/* ================================================================= */}
          {shownTab === "webscore" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <WebScoreTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 12: CRAWL DIAGNOSTICS (DYNAMIC ON-PAGE MATRIX)                */}
          {/* ================================================================= */}
          {shownTab === "diagnostics" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <DiagnosticsTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 13: WCAG 2.1 AA ACCESSIBILITY & EAA LEGAL AUDIT               */}
          {/* ================================================================= */}
          {shownTab === "accessibility" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <AccessibilityTab app={app} />
            </Suspense>
          )}

          {/* ================================================================= */}
          {/* TAB 14: INTERACTIVE REMEDIATION CHECKLIST                         */}
          {/* ================================================================= */}
          {shownTab === "checklist" && (
            <Suspense fallback={<TabFallback isPolish={isPolish} />}>
              <ChecklistTab app={app} />
            </Suspense>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 no-print gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-[#0b2230] tracking-wider">NOVOPIX STUDIO</span>
            <span>·</span>
            <span>{isPolish ? "Platforma Audytowa i Sprzedażowa SaaS" : "Enterprise Web Growth & Audit SaaS"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button onClick={() => setIsHowItWorksOpen(true)} className="hover:text-slate-900 transition-colors cursor-pointer">
              {isPolish ? "Jak to działa" : "How it works"}
            </button>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-900 transition-colors cursor-pointer">
              {isPolish ? "Bezpieczeństwo i API" : "Privacy & API"}
            </button>
            <a href="mailto:contact@novopix.uk" className="hover:text-slate-900 font-mono">
              contact@novopix.uk
            </a>
            <a href="https://novopix.uk/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 font-bold">
              novopix.uk ↗
            </a>
          </div>
        </footer>
      </div>

      {/* 1-Click Client Proposal Acceptance Modal (Deal Room Closing) */}
      {acceptEverOpen && (
      <Suspense fallback={null}>
      <AcceptProposalModal
        isOpen={isAcceptProposalOpen}
        onClose={() => setIsAcceptProposalOpen(false)}
        report={currentReport}
        clientNameDefault={clientName}
        netPrice={scopeSummary.netPrice}
        grossPrice={scopeSummary.grossPrice}
        totalHours={scopeSummary.totalHours}
        hourlyRate={hourlyRate}
        retainerFee={retainerMonthly}
        currency={currency}
        selectedTasks={scopeSummary.selectedTasks.map((t) => t.title)}
        isPolish={isPolish}
        onAccepted={(updatedClient) => {
          setCrmClients((prev) => {
            const exists = prev.some((c) => c.id === updatedClient.id);
            const next = exists ? prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)) : [updatedClient, ...prev];
            localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(next));
            return next;
          });
          showToast(isPolish ? "Oferta zaakceptowana! Zaktualizowano status w CRM na Zaakceptowano." : "Proposal accepted! CRM updated.");
        }}
      />
      </Suspense>
      )}

      {/* Quote & Lead Capture Modal */}
      {quoteEverOpen && (
      <Suspense fallback={null}>
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        report={currentReport}
        isPolish={isPolish}
        estimatedBudget={scopeSummary.netPrice}
        currency={currency}
        isPublicMode={isPublicMode}
        onLeadSaved={(newClient) => {
          if (newClient) {
            setCrmClients((prev) => [newClient, ...prev]);
          }
        }}
      />
      </Suspense>
      )}

      {/* Sales & How It Works Modal */}
      {isHowItWorksOpen && (
        <InfoModal
          title={isPolish ? "Jak działa skaner NovoPix" : "How the NovoPix scanner works"}
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          isPolish={isPolish}
        >
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>{isPolish ? "1. Skanowanie hybrydowe (Google PSI + Deep HTML):" : "1. Hybrid scan (Google PSI + Deep HTML):"}</strong>{" "}
              {isPolish
                ? "System pobiera oficjalne metryki Core Web Vitals, wagę zasobów (KB) oraz bezpośrednio bada kod źródłowy HTML strony klienta (Title, Meta, H1-H6, ALT, Schema.org, nagłówki bezpieczeństwa HTTP)."
                : "The system fetches the official Core Web Vitals metrics, resource weight (KB) and directly inspects the page's HTML source (Title, Meta, H1-H6, ALT, Schema.org, HTTP security headers)."}
            </p>
            <p>
              <strong>{isPolish ? "2. Automatyczny kosztorys godzinowy:" : "2. Automatic hourly quote:"}</strong>{" "}
              {isPolish
                ? "Liczba roboczogodzin i zadań dopasowuje się dynamicznie do faktycznej skali błędów wykrytych na badanej stronie."
                : "The number of working hours and tasks adapts to the actual scale of the issues found on the scanned page."}
            </p>
            <p>
              <strong>{isPolish ? "3. Izolowany pokój ofertowy klienta (widok klienta):" : "3. Isolated client deal room (client view):"}</strong>{" "}
              {isPolish ? (
                <>Wysyłając klientowi link <code>?clientView=1</code>, ukrywasz swój wewnętrzny CRM oraz skrypty sprzedażowe, a klient może jednym kliknięciem zaakceptować kosztorys online.</>
              ) : (
                <>By sending the client the link <code>?clientView=1</code> you hide your internal CRM and sales scripts, and the client can accept the quote online with one click.</>
              )}
            </p>
          </div>
        </InfoModal>
      )}

      {/* Privacy & API Modal */}
      {isPrivacyOpen && (
        <InfoModal
          title={isPolish ? "Prywatność, Trwałość Danych i Bezpieczeństwo API" : "Privacy, Persistence & API Security"}
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
          isPolish={isPolish}
        >
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>{isPolish ? "· Wszystkie klucze API (Google PageSpeed Insights oraz Gemini AI) działają wyłącznie po stronie serwera Express i nigdy nie są ujawniane w przeglądarce." : "· All API keys (Google PageSpeed Insights and Gemini AI) are used only on the Express server and are never exposed in the browser."}</p>
            <p>{isPolish ? "· Baza klientów CRM, zaakceptowane oferty, snapshoty wycen oraz monitorowane domeny są trwale zapisywane na serwerze w pliku JSON oraz synchronizowane z LocalStorage." : "· The CRM client base, accepted offers, quote snapshots and monitored domains are stored persistently on the server in a JSON file and synced with LocalStorage."}</p>
          </div>
        </InfoModal>
      )}

      {/* Agency PIN Security Modal (Prevents Clients from Unlocking Agency CRM) */}
      {isPinModalOpen && (
        <InfoModal
          title={isPolish ? "Autoryzacja Audytora — Odblokuj Tryb Agencji" : "Auditor Authorization — Unlock Agency Mode"}
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          isPolish={isPolish}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await handleUnlockWithPin(pinAttempt);
              if (ok) {
                setIsPinModalOpen(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              {isPolish
                ? "Wpisz kod PIN agencji, aby odblokować CRM, oferty, monitoring i skan wielu stron."
                : "Enter the agency PIN to unlock the CRM, offers, monitoring and bulk scan."}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isPolish ? "Kod PIN Agencji" : "Agency PIN"}
              </label>
              <input
                type="password"
                autoFocus
                value={pinAttempt}
                onChange={(e) => {
                  setPinAttempt(e.target.value);
                  setPinError(null);
                }}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center"
              />
            </div>
            {pinError && <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{pinError}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {isPolish ? "Anuluj" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isPolish ? "Odblokuj Tryb Agencji" : "Unlock Agency Mode"}
              </button>
            </div>
          </form>
        </InfoModal>
      )}
    </div>
  );
}
