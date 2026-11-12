import { Activity, Bell, Bot, Briefcase, Package, Calculator, Check, CheckCircle2, Copy, Eye, Layers, LayoutDashboard, ListOrdered, Lock, Scale, Search, Share2, TrendingUp, Zap } from "lucide-react";
import { AgencyClient, AiAdvisorData, AuditReport, DEFAULT_SCOPE_TASKS, EMPTY_AUDIT, EMPTY_LIVE_SEO, LiveSeoInspection, MonitoredDomain, ScopeTaskItem, buildDynamicAuditArtifacts } from "../scannerTypes";
import { AgencyCtx } from "../agencyTypes";
import { copyText } from "../utils/clipboard";
import { localizeDeep } from "../utils/localize";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Parametry startowe z adresu, np. z formularza na novopix.uk: ?url=firma.pl&lang=pl|en&autoscan=1.
// Skan uruchamia ta sama funkcja co przycisk „Skanuj”, więc walidacja adresu i limity po stronie serwera są identyczne.
export function readStartParams(search: string): { lang: "pl" | "en" | null; url: string; autoscan: boolean; clientView: boolean } {
  try {
    const p = new URLSearchParams(search);
    const lang = (p.get("lang") || "").toLowerCase();
    return {
      lang: lang === "pl" || lang === "en" ? lang : null,
      url: (p.get("url") || "").trim().slice(0, 300),
      autoscan: p.get("autoscan") === "1",
      clientView: p.get("clientView") === "1",
    };
  } catch {
    return { lang: null, url: "", autoscan: false, clientView: false };
  }
}

// Tryb aplikacji wpisany przez serwer do HTML (meta app-mode); w trybie deweloperskim brak znacznika, wtedy decyduje /api/config.
function readInitialPublicMode(): boolean {
  try {
    return document.querySelector('meta[name="app-mode"]')?.getAttribute("content") === "public";
  } catch {
    return false;
  }
}

export function useAppState() {
  const startParams = useRef(readStartParams(typeof window !== "undefined" ? window.location.search : "")).current;
  const initialPublic = useRef(readInitialPublicMode()).current;
  const [isPolish, setIsPolish] = useState<boolean>(startParams.lang ? startParams.lang === "pl" : true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [urlInput, setUrlInput] = useState<string>(startParams.clientView ? "" : startParams.url);
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Agency Mode vs Client Pitch Mode (protects know-how & hides internal CRM)
  const [viewMode, setViewMode] = useState<"agency" | "client">(initialPublic ? "client" : "agency");

  // Core Audit & Live SEO State
  const [rawReport, setCurrentReport] = useState<AuditReport>(EMPTY_AUDIT);
  const [liveSeo, setLiveSeo] = useState<LiveSeoInspection>(EMPTY_LIVE_SEO);
  const [isSeoLoading, setIsSeoLoading] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<AuditReport[]>([]);

  // AI Growth Advisor State
  const [aiAdvisor, setAiAdvisor] = useState<AiAdvisorData | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [activeScriptTab, setActiveScriptTab] = useState<"coldEmail" | "phonePitch" | "objectionHandler">("coldEmail");

  // Dynamic Hourly Scope & ROI Calculator State
  // Domyślne stawki zależą od języka (PL: PLN, 150/h; EN: GBP, 30/h), dopóki użytkownik albo link/oferta nie ustawią własnych wartości.
  const ratesLocked = useRef(false);
  const [currency, setCurrencyRaw] = useState<"PLN" | "GBP" | "EUR">("PLN");
  const [hourlyRate, setHourlyRateRaw] = useState<number>(150);
  const [retainerMonthly, setRetainerMonthlyRaw] = useState<number>(300);
  const setCurrency = (v: "PLN" | "GBP" | "EUR") => { ratesLocked.current = true; setCurrencyRaw(v); };
  const setHourlyRate = (v: number) => { ratesLocked.current = true; setHourlyRateRaw(v); };
  const setRetainerMonthly = (v: number) => { ratesLocked.current = true; setRetainerMonthlyRaw(v); };
  const [scopeTasks, setScopeTasks] = useState<ScopeTaskItem[]>(DEFAULT_SCOPE_TASKS);
  // Zakładka Kosztorys & ROI jest pusta, dopóki agencja sama nie doda zadań albo nie wczyta ich ze skanu.
  const [roiStarted, setRoiStarted] = useState<boolean>(false);
  useEffect(() => {
    if (ratesLocked.current) return;
    setCurrencyRaw(isPolish ? "PLN" : "GBP");
    setHourlyRateRaw(isPolish ? 150 : 30);
    setRetainerMonthlyRaw(isPolish ? 300 : 49);
  }, [isPolish]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskHours, setNewTaskHours] = useState<number>(2);

  // Business ROI Simulator Parameters
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(0);
  const [currentConvRate, setCurrentConvRate] = useState<number>(0);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(0);
  const [projectedLiftPct, setProjectedLiftPct] = useState<number>(0);

  // Competitor Comparison State
  const [competitorUrl, setCompetitorUrl] = useState<string>("webflow.com");
  const [rawCompetitorReport, setCompetitorReport] = useState<AuditReport | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Agency CRM State
  const [crmClients, setCrmClients] = useState<AgencyClient[]>([]);
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState<string>("");
  const [newClientCompany, setNewClientCompany] = useState<string>("");
  const [newClientEmail, setNewClientEmail] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");
  const [newClientWeb, setNewClientWeb] = useState<string>("");

  // 24/7 Monitoring State
  const [monitoredDomains, setMonitoredDomains] = useState<MonitoredDomain[]>([]);
  const [newMonitorUrl, setNewMonitorUrl] = useState<string>("");
  const [newMonitorClient, setNewMonitorClient] = useState<string>("");
  const [newMonitorThreshold, setNewMonitorThreshold] = useState<number>(80);
  const [newMonitorInterval, setNewMonitorInterval] = useState<MonitoredDomain["interval"]>("60m");
  const [checkingDomainId, setCheckingDomainId] = useState<string | null>(null);

  // White-Label Reports & Share Link Branding
  const [clientName, setClientName] = useState<string>("Zarząd Firmy");
  const [auditorName, setAuditorName] = useState<string>("NovoPix Digital Studio");
  const [agencyWebsite, setAgencyWebsite] = useState<string>("https://novopix.uk");
  const [customOfferNote, setCustomOfferNote] = useState<string>(
    "Optymalizacja inżynieryjna ukierunkowana na wynik 90+/100 w Google PageSpeed Insights (raport z pomiarem przed i po wdrożeniu)."
  );
  const [includeQuoteInReport, setIncludeQuoteInReport] = useState<boolean>(true);

  // Filters & Sub-states
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [checklistFilter, setChecklistFilter] = useState<"all" | "pending" | "checked">("all");
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "90d">("30d");

  // Modals & Server-Side Agency PIN / Bearer Token Security Lock
  const [isQuoteOpen, setIsQuoteOpen] = useState<boolean>(false);
  const [isAcceptProposalOpen, setIsAcceptProposalOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isClientLinkLocked, setIsClientLinkLocked] = useState<boolean>(initialPublic);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(initialPublic);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinAttempt, setPinAttempt] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [currentPinInput, setCurrentPinInput] = useState<string>("");
  const [newPinInput, setNewPinInput] = useState<string>("");
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);

  // Server-Side Session Token & Scan Integrity State
  const [agencyToken, setAgencyToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("novopix_agency_token");
    } catch {
      return null;
    }
  });
  const [isDefaultPinWarning, setIsDefaultPinWarning] = useState<boolean>(false);
  const [scanErrorObj, setScanErrorObj] = useState<{ msg: string; i18n?: Record<string, string> } | null>(null);
  const setScanError = (msg: string | null, i18n?: Record<string, string>) => setScanErrorObj(msg ? { msg, i18n } : null);
  const scanError = scanErrorObj ? localizeDeep(scanErrorObj.msg, scanErrorObj.i18n, !isPolish) : null;

  // Teksty z serwera (po polsku) są tłumaczone na EN mapą i18n dołączoną do wyniku skanu.
  const currentReport = useMemo(() => localizeDeep(rawReport, rawReport.i18n, !isPolish), [rawReport, isPolish]);
  const competitorReport = useMemo(() => (rawCompetitorReport ? localizeDeep(rawCompetitorReport, rawCompetitorReport.i18n, !isPolish) : null), [rawCompetitorReport, isPolish]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const getAuthHeaders = (tokenOverride?: string | null): Record<string, string> => {
    const tok = tokenOverride !== undefined ? tokenOverride : agencyToken;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tok) {
      headers["Authorization"] = `Bearer ${tok}`;
    }
    return headers;
  };

  const agencyCtx: AgencyCtx = {
    isPolish,
    token: agencyToken,
    authHeaders: () => getAuthHeaders(),
    showToast,
    requestLogin: () => setIsPinModalOpen(true),
    onUnauthorized: () => {
      setAgencyToken(null);
      try {
        sessionStorage.removeItem("novopix_agency_token");
      } catch {}
      setIsPinModalOpen(true);
    },
  };

  const updateClientLocal = (c: AgencyClient) => {
    setCrmClients((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  };

  const loadProtectedCrmAndMonitoring = async (tok: string | null) => {
    if (!tok) return;
    try {
      const [crmRes, monRes] = await Promise.all([
        fetch("/api/crm/clients", { headers: getAuthHeaders(tok) }),
        fetch("/api/monitoring", { headers: getAuthHeaders(tok) }),
      ]);
      if (crmRes.status === 401) {
        setAgencyToken(null);
        try {
          sessionStorage.removeItem("novopix_agency_token");
        } catch {}
        return;
      }
      if (crmRes.ok) {
        const crmData = await crmRes.json();
        if (Array.isArray(crmData.clients)) {
          setCrmClients(crmData.clients);
          try {
            localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(crmData.clients));
          } catch {}
        }
      }
      if (monRes.ok) {
        const monData = await monRes.json();
        if (Array.isArray(monData.domains)) {
          setMonitoredDomains(monData.domains);
          try {
            localStorage.setItem("novopix_monitored_v2", JSON.stringify(monData.domains));
          } catch {}
        }
      }
    } catch {}
  };

  const handleUnlockWithPin = async (pinToVerify: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid && data.token) {
        setAgencyToken(data.token);
        setIsDefaultPinWarning(!!data.isDefaultPinWarning);
        try {
          sessionStorage.setItem("novopix_agency_token", data.token);
        } catch {}
        setIsClientLinkLocked(false);
        setViewMode("agency");
        await loadProtectedCrmAndMonitoring(data.token);
        showToast(
          isPolish
            ? "Autoryzacja serwerowa zakończona sukcesem! Sesja CRM aktywna."
            : "Server authentication succeeded! CRM session active."
        );
        return true;
      } else {
        setPinError(data.error || (isPolish ? "Nieprawidłowy kod PIN." : "Invalid PIN."));
        return false;
      }
    } catch {
      setPinError(isPolish ? "Błąd połączenia z serwerem autoryzacji." : "Server verification error.");
      return false;
    }
  };

  const handleDownloadCrmBackup = async () => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/crm/backup", {
        headers: getAuthHeaders(agencyToken),
      });
      if (!res.ok) {
        showToast(isPolish ? "Zaloguj się kodem PIN, aby pobrać kopię bazy." : "Authenticate with PIN to download backup.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `novopix-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(isPolish ? "Pobrano kopię zapasową bazy CRM i Monitoringu (.json)" : "Downloaded CRM & Monitoring backup (.json)");
    } catch {}
  };

  const handleRequestAgencyMode = () => {
    if (isClientLinkLocked || !agencyToken) {
      setPinAttempt("");
      setPinError(null);
      setIsPinModalOpen(true);
    } else {
      setViewMode("agency");
    }
  };

  // Public scanner deployment: no agency features at all (config comes from the server).
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c?.mode === "public") {
          setIsPublicMode(true);
          setViewMode("client");
          setIsClientLinkLocked(true);
        }
      })
      .catch(() => {});
  }, []);

  // Prevent client view from staying on internal agency tabs
  useEffect(() => {
    if (viewMode === "client" && (activeTab === "crm" || activeTab === "monitoring" || activeTab === "bulk" || activeTab === "packages" || activeTab === "status" || activeTab === "stats")) {
      setActiveTab("overview");
    }
  }, [viewMode, activeTab]);

  // Check URL query params for Shared Client Proposal View (?clientView=1&url=...&proposalId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("clientView") === "1") {
      setViewMode("client");
      setIsClientLinkLocked(true);

      const propId = params.get("proposalId");
      const sharedUrl = params.get("url");
      const sharedClient = params.get("client");
      const sharedRate = params.get("rate");
      const sharedCurr = params.get("curr") as "PLN" | "GBP" | "EUR" | null;
      const sharedRetainer = params.get("retainer");
      const sharedVisitors = params.get("visitors");
      const sharedConv = params.get("conv");
      const sharedAov = params.get("aov");
      const sharedLift = params.get("lift");
      const sharedTasks = params.get("tasks");

      if (sharedClient) setClientName(sharedClient);
      if (sharedRate && !isNaN(Number(sharedRate))) setHourlyRate(Number(sharedRate));
      if (sharedCurr && ["PLN", "GBP", "EUR"].includes(sharedCurr)) setCurrency(sharedCurr);
      if (sharedRetainer && !isNaN(Number(sharedRetainer))) setRetainerMonthly(Number(sharedRetainer));
      if (sharedVisitors && !isNaN(Number(sharedVisitors))) setMonthlyVisitors(Number(sharedVisitors));
      if (sharedConv && !isNaN(Number(sharedConv))) setCurrentConvRate(Number(sharedConv));
      if (sharedAov && !isNaN(Number(sharedAov))) setAvgOrderValue(Number(sharedAov));
      if (sharedLift && !isNaN(Number(sharedLift))) setProjectedLiftPct(Number(sharedLift));

      if (sharedTasks) {
        const taskMap = new Map<string, { hours: number; selected: boolean }>();
        sharedTasks.split(",").forEach((part) => {
          const [id, hrs, sel] = part.split(":");
          if (id && !isNaN(Number(hrs))) {
            taskMap.set(id, { hours: Number(hrs), selected: sel === "1" });
          }
        });
        if (taskMap.size > 0) {
          setScopeTasks((prev) =>
            prev.map((t) => (taskMap.has(t.id) ? { ...t, ...taskMap.get(t.id)! } : t))
          );
        }
      }

      if (propId) {
        fetch(`/api/proposals/${propId}`)
          .then((r) => {
            if (r.status === 403) {
              setScanError(
                "Ten raport nie został jeszcze zatwierdzony przez agencję. Skontaktuj się z NovoPix. / This report has not been approved by the agency yet."
              );
              return { blocked: true } as any;
            }
            return r.ok ? r.json() : null;
          })
          .then((data) => {
            if (data?.blocked) return;
            if (data?.proposal) {
              const p = data.proposal;
              if (p.report) setCurrentReport(p.report);
              if (p.liveSeo) setLiveSeo(p.liveSeo);
              if (p.scopeTasks) setScopeTasks(p.scopeTasks);
              if (p.hourlyRate) setHourlyRate(Number(p.hourlyRate));
              if (p.currency) setCurrency(p.currency);
              if (p.retainerMonthly !== undefined) setRetainerMonthly(Number(p.retainerMonthly));
              if (p.clientName) setClientName(p.clientName);
              if (p.auditorName) setAuditorName(p.auditorName);
              if (p.customOfferNote) setCustomOfferNote(p.customOfferNote);
              if (p.monthlyVisitors) setMonthlyVisitors(Number(p.monthlyVisitors));
              if (p.currentConvRate) setCurrentConvRate(Number(p.currentConvRate));
              if (p.avgOrderValue) setAvgOrderValue(Number(p.avgOrderValue));
              if (p.projectedLiftPct) setProjectedLiftPct(Number(p.projectedLiftPct));
              if (p.aiAdvisor) setAiAdvisor(p.aiAdvisor);
            } else if (sharedUrl) {
              setUrlInput(sharedUrl);
              handleRunScan(sharedUrl, true);
            }
          })
          .catch(() => {
            if (sharedUrl) {
              setUrlInput(sharedUrl);
              handleRunScan(sharedUrl, true);
            }
          });
      } else if (sharedUrl) {
        setUrlInput(sharedUrl);
        handleRunScan(sharedUrl, true);
      }
    }
  }, []);

  // Start z adresu (?url=...&autoscan=1): skan rusza po pierwszym renderze, tą samą ścieżką co przycisk „Skanuj”.
  const [autoscanPending, setAutoscanPending] = useState<boolean>(false);
  useEffect(() => {
    if (!startParams.clientView && startParams.url && startParams.autoscan) setAutoscanPending(true);
  }, []);
  useEffect(() => {
    if (!autoscanPending) return;
    setAutoscanPending(false);
    // Usuń autoscan z adresu, żeby odświeżenie strony nie uruchamiało skanu drugi raz.
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("autoscan");
      const q = u.searchParams.toString();
      window.history.replaceState(null, "", u.pathname + (q ? "?" + q : "") + u.hash);
    } catch {}
    handleRunScan(startParams.url);
  }, [autoscanPending]);

  // Load saved history and check server-side session token status on mount
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem("novopix_scan_history_v2");
      if (savedHist) {
        const parsed = JSON.parse(savedHist);
        if (Array.isArray(parsed) && parsed.length > 0) setScanHistory(parsed);
      }
    } catch {}

    fetch("/api/auth/status", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((statusData) => {
        if (statusData) {
          setIsDefaultPinWarning(!!statusData.isDefaultPinWarning);
          if (statusData.authenticated && agencyToken) {
            loadProtectedCrmAndMonitoring(agencyToken);
          } else {
            setAgencyToken(null);
            try {
              sessionStorage.removeItem("novopix_agency_token");
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, []);

  // Persist history to LocalStorage
  useEffect(() => {
    if (scanHistory.length > 0) {
      try {
        localStorage.setItem("novopix_scan_history_v2", JSON.stringify(scanHistory.slice(0, 20)));
      } catch {}
    }
  }, [scanHistory]);

  // Sync HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = isPolish ? "pl" : "en";
  }, [isPolish]);

  // Calculate Scope & ROI Math
  const scopeSummary = useMemo(() => {
    const selectedTasks = scopeTasks.filter((t) => t.selected);
    const totalHours = selectedTasks.reduce((sum, t) => sum + t.hours, 0);
    const netPrice = Math.round(totalHours * hourlyRate);
    const grossPrice = Math.round(netPrice * 1.23);

    const currentLeads = monthlyVisitors * (currentConvRate / 100);
    const currentMonthlyRev = Math.round(currentLeads * avgOrderValue);
    const newConvRate = +(currentConvRate * (1 + projectedLiftPct / 100)).toFixed(2);
    const newLeads = monthlyVisitors * (newConvRate / 100);
    const projectedMonthlyRev = Math.round(newLeads * avgOrderValue);
    const monthlyGain = Math.max(0, projectedMonthlyRev - currentMonthlyRev);
    const paybackDays = monthlyGain > 0 ? Math.max(1, Math.round((netPrice / monthlyGain) * 30)) : 0;

    return {
      selectedTasks,
      totalHours,
      netPrice,
      grossPrice,
      currentLeads: Math.round(currentLeads),
      newLeads: Math.round(newLeads),
      currentMonthlyRev,
      projectedMonthlyRev,
      monthlyGain,
      paybackDays,
    };
  }, [scopeTasks, hourlyRate, monthlyVisitors, currentConvRate, avgOrderValue, projectedLiftPct]);

  // Run Deep HTML SEO Check
  const handleRunSeoCheck = async (targetUrl: string): Promise<LiveSeoInspection> => {
    setIsSeoLoading(true);
    try {
      const res = await fetch("/api/seo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSeo(data);
        return data;
      }
    } catch {} finally {
      setIsSeoLoading(false);
    }
    return liveSeo;
  };

  // Run AI Growth Advisor
  const handleRunAiAdvisor = async (reportToAnalyze?: AuditReport, seoToAnalyze?: LiveSeoInspection) => {
    const rep = reportToAnalyze || currentReport;
    const seo = seoToAnalyze || liveSeo;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: rep.finalUrl || rep.scannedUrl,
          overallScore: rep.overallScore,
          categories: rep.categories,
          coreWebVitals: rep.coreWebVitals,
          opportunities: rep.issues,
          seoData: seo,
          hourlyRate,
          currency,
          language: isPolish ? "pl" : "en",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.advisor) {
          setAiAdvisor(data.advisor);
        }
      }
    } catch {} finally {
      setIsAiLoading(false);
    }
  };

  // Run Full Hybrid Scan (3 Authentic Measurement States — Never fabricates scores)
  const handleRunScan = async (targetUrl?: string, preserveCustomScope = false) => {
    const query = (targetUrl || urlInput).trim();
    if (!query) {
      showToast(isPolish ? "Wpisz adres strony do zeskanowania." : "Enter a website address to scan.");
      return;
    }
    setIsScanning(true);
    setScanError(null);

    try {
      const [scanRes, freshSeo] = await Promise.all([
        fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: query, strategy }),
        }),
        handleRunSeoCheck(query),
      ]);

      const data = await scanRes.json().catch(() => ({}));

      if (!scanRes.ok || data.measurementStatus === "failed") {
        const errMsg =
          data.error ||
          (isPolish
            ? `Nie udało się wykonać pomiaru dla "${query}". Sprawdź poprawność domeny.`
            : `Could not measure "${query}". Please verify the domain.`);
        setScanError(errMsg, data.i18n);
        showToast(isPolish ? errMsg : (data.i18n?.[errMsg] ?? errMsg));
        return;
      }

      const baseMerged: AuditReport = {
        ...EMPTY_AUDIT,
        ...data,
        id: `scan-${Date.now()}`,
        isSample: false,
        scannedAt: new Date().toISOString(),
        issues: Array.isArray(data.issues) ? data.issues : [],
      };

      // Dynamically build Scope Tasks, Checklist Actions, and Diagnostics Matrix from real findings!
      const { dynamicScopeTasks, dynamicActions, dynamicOnPageMatrix, dynamicCrawledPages } =
        buildDynamicAuditArtifacts(baseMerged, freshSeo, isPolish);

      // Build history strictly from real previous scans of this domain + current scan
      const previousRunsForDomain = scanHistory
        .filter((r) => !r.isSample && r.scannedUrl.replace(/^https?:\/\//, "") === query.replace(/^https?:\/\//, ""))
        .slice(0, 4)
        .reverse()
        .map((r) => ({
          date: new Date(r.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          overall: r.overallScore || 0,
          performance: r.categories.performance || 0,
          seo: r.categories.seo || 0,
          accessibility: r.categories.accessibility || 0,
        }));

      const finalReport: AuditReport = {
        ...baseMerged,
        recommendedActions: dynamicActions,
        demo: {
          crawledPages: dynamicCrawledPages,
          onPageSeoAnalysis: dynamicOnPageMatrix,
          scoreHistory: [
            ...previousRunsForDomain,
            {
              date: isPolish ? "Teraz" : "Now",
              overall: data.overallScore || 0,
              performance: data.categories?.performance || 0,
              seo: data.categories?.seo || 0,
              accessibility: data.categories?.accessibility || 0,
            },
          ],
        },
      };

      if (!preserveCustomScope) {
        setScopeTasks(dynamicScopeTasks);
      }
      setCurrentReport(finalReport);
      setScanHistory((prev) => [finalReport, ...prev.filter((r) => r.scannedUrl !== finalReport.scannedUrl)].slice(0, 20));
      handleRunAiAdvisor(finalReport, freshSeo);
      showToast(
        data.measurementStatus === "live_lighthouse"
          ? isPolish
            ? `Zakończono pełny pomiar Google Lighthouse: ${query}`
            : `Completed live Google Lighthouse scan: ${query}`
          : isPolish
          ? `Zakończono pomiar techniczny HTML/HTTP: ${query}`
          : `Completed live HTML/HTTP inspection: ${query}`
      );
    } catch {
      setScanError(
        isPolish
          ? "Błąd komunikacji z serwerem skanującym. Nie wygenerowano sztucznych wyników."
          : "Scanner network error. No synthetic scores were generated."
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Po zmianie języka przebudowujemy teksty generowane lokalnie z wyniku skanu (checklista, macierz SEO, zakres prac),
  // zachowując zaznaczenia użytkownika (status checklisty, godziny i wybór zadań).
  const prevLangRef = React.useRef(isPolish);
  useEffect(() => {
    if (prevLangRef.current === isPolish) return;
    prevLangRef.current = isPolish;
    if (rawReport.id === "empty" || rawReport.isSample) return;
    const art = buildDynamicAuditArtifacts(rawReport, liveSeo, isPolish);
    setCurrentReport((prev) => {
      const prevStatus = new Map(prev.recommendedActions.map((x) => [x.id, x.status]));
      const hist = prev.demo?.scoreHistory || [];
      return {
        ...prev,
        recommendedActions: art.dynamicActions.map((x) => ({ ...x, status: prevStatus.get(x.id) ?? x.status })),
        demo: {
          ...prev.demo!,
          crawledPages: art.dynamicCrawledPages,
          onPageSeoAnalysis: art.dynamicOnPageMatrix,
          scoreHistory: hist.map((pt, i) => (i === hist.length - 1 ? { ...pt, date: isPolish ? "Teraz" : "Now" } : pt)),
        },
      };
    });
    const fresh = new Map(art.dynamicScopeTasks.map((t) => [t.id, t]));
    setScopeTasks((prev) => prev.map((t) => (fresh.has(t.id) ? { ...t, title: fresh.get(t.id)!.title, businessBenefit: fresh.get(t.id)!.businessBenefit, technicalScope: fresh.get(t.id)!.technicalScope } : t)));
  }, [isPolish]);

  // Run Competitor 1:1 Scan
  const handleCompareCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) return;
    setIsComparing(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: competitorUrl.trim(), strategy }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.measurementStatus !== "failed") {
        setCompetitorReport({
          ...EMPTY_AUDIT,
          ...data,
          id: `comp-${Date.now()}`,
          isSample: false,
          scannedAt: new Date().toISOString(),
        });
        showToast(isPolish ? `Porównano z domeną: ${competitorUrl}` : `Compared with: ${competitorUrl}`);
      } else {
        showToast(data.error || (isPolish ? "Nie udało się przeskanować domeny konkurenta" : "Could not scan competitor"));
      }
    } catch {} finally {
      setIsComparing(false);
    }
  };

  // Toggle Checklist Action Item
  const handleToggleChecklist = (id: string) => {
    setCurrentReport((prev) => ({
      ...prev,
      recommendedActions: prev.recommendedActions.map((a) =>
        a.id === id ? { ...a, status: a.status === "checked" ? "pending" : "checked" } : a
      ),
    }));
  };

  // Add Current Audited Site + Quote to Agency CRM (Requires Agency Token)
  const handleSaveCurrentToCrm = async () => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      showToast(isPolish ? "Podaj kod PIN Agencji, aby zapisać klienta w CRM." : "Enter Agency PIN to save to CRM.");
      return;
    }
    const cleanHost = (currentReport.finalUrl || currentReport.scannedUrl).replace(/^https?:\/\//, "").split("/")[0];
    const payload = {
      name: clientName || "Klient Audytu",
      company: cleanHost.toUpperCase(),
      email: "",
      phone: "",
      website: currentReport.finalUrl || currentReport.scannedUrl,
      contractValue: scopeSummary.netPrice,
      hourlyRate,
      estimatedHours: scopeSummary.totalHours,
      retainerFee: retainerMonthly,
      lastScore: currentReport.overallScore || 0,
      cmsTech: liveSeo.cmsTech || "HTML5",
      notes: `Wycena z kalkulatora: ${scopeSummary.totalHours}h (${scopeSummary.netPrice} ${currency} netto). Technologia: ${liveSeo.cmsTech || "Standard"}.`,
    };

    try {
      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        setIsPinModalOpen(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const updated = [data.client, ...crmClients];
        setCrmClients(updated);
        localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(updated));
        showToast(isPolish ? "Zapisano klienta i wycenę w Panelu Agencji CRM!" : "Saved client & quote to Agency CRM!");
        setActiveTab("crm");
      }
    } catch {}
  };

  // Add New Client from CRM Form
  const handleAddCrmClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientWeb.trim()) return;
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newClientName || "Klient",
          company: newClientCompany || newClientWeb,
          email: newClientEmail,
          phone: newClientPhone,
          website: newClientWeb,
          contractValue: scopeSummary.netPrice,
          hourlyRate,
          estimatedHours: scopeSummary.totalHours,
          retainerFee: retainerMonthly,
          lastScore: 0,
          notes: "Dodano ręcznie w Panelu Agencji.",
        }),
      });
      if (res.status === 401) {
        setIsPinModalOpen(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const updated = [data.client, ...crmClients];
        setCrmClients(updated);
        localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(updated));
        setNewClientName("");
        setNewClientCompany("");
        setNewClientEmail("");
        setNewClientPhone("");
        setNewClientWeb("");
        showToast(isPolish ? "Dodano nowego klienta do CRM" : "Added new client to CRM");
      }
    } catch {}
  };

  // Update CRM Client Status
  const handleUpdateClientStatus = async (id: string, status: AgencyClient["status"]) => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/crm/clients/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = crmClients.map((c) => (c.id === id ? data.client || { ...c, status } : c));
        setCrmClients(updated);
        localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(updated));
        showToast(isPolish ? "Zaktualizowano status klienta w lejku" : "Updated client pipeline status");
      }
    } catch {}
  };

  // Delete CRM Client
  const handleDeleteClient = async (id: string) => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/crm/clients/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const updated = crmClients.filter((c) => c.id !== id);
        setCrmClients(updated);
        localStorage.setItem("novopix_crm_clients_v2", JSON.stringify(updated));
      }
    } catch {}
  };

  // Add Monitored Domain
  const handleAddMonitorDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonitorUrl.trim()) return;
    if (!agencyToken) {
      setIsPinModalOpen(true);
      showToast(isPolish ? "Zaloguj się kodem PIN, aby zarządzać monitoringiem." : "Authenticate with PIN to manage monitoring.");
      return;
    }
    try {
      const res = await fetch("/api/monitoring/add", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          domain: newMonitorUrl.trim(),
          clientName: newMonitorClient.trim() || undefined,
          threshold: newMonitorThreshold,
          interval: newMonitorInterval,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.domain) {
        const updated = [data.domain, ...monitoredDomains];
        setMonitoredDomains(updated);
        localStorage.setItem("novopix_monitored_v2", JSON.stringify(updated));
        setNewMonitorUrl("");
        setNewMonitorClient("");
        showToast(isPolish ? "Wykonano pierwszy pomiar i dodano domenę do harmonogramu 24/7" : "Measured & added domain to 24/7 scheduler");
      } else {
        showToast(data.error || (isPolish ? "Błąd dodawania domeny" : "Error adding domain"));
      }
    } catch {}
  };

  // Trigger Live Check on Monitored Domain
  const handleCheckMonitoredDomain = async (id: string) => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    setCheckingDomainId(id);
    try {
      const res = await fetch(`/api/monitoring/check/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = monitoredDomains.map((d) => (d.id === id ? data.domain : d));
        setMonitoredDomains(updated);
        localStorage.setItem("novopix_monitored_v2", JSON.stringify(updated));
        showToast(isPolish ? "Wykonano rzeczywisty pomiar HTTP/DOM na żywo!" : "Live HTTP/DOM check completed!");
      }
    } catch {} finally {
      setCheckingDomainId(null);
    }
  };

  // Remove Monitored Domain
  const handleDeleteMonitoredDomain = async (id: string) => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/monitoring/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const updated = monitoredDomains.filter((d) => d.id !== id);
        setMonitoredDomains(updated);
        localStorage.setItem("novopix_monitored_v2", JSON.stringify(updated));
      }
    } catch {}
  };

  // Generate Interactive Shareable Client Link (with full pricing, ROI, and task parameters encoded)
  const shareableClientUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    const tasksCompact = scopeTasks.map((t) => `${t.id}:${t.hours}:${t.selected ? 1 : 0}`).join(",");
    const params = new URLSearchParams({
      clientView: "1",
      url: currentReport.finalUrl || currentReport.scannedUrl,
      client: clientName || "Klient",
      rate: String(hourlyRate),
      curr: currency,
      retainer: String(retainerMonthly),
      visitors: String(monthlyVisitors),
      conv: String(currentConvRate),
      aov: String(avgOrderValue),
      lift: String(projectedLiftPct),
      tasks: tasksCompact,
    });
    if (savedProposalId) {
      params.set("proposalId", savedProposalId);
    }
    return `${base}?${params.toString()}`;
  }, [
    currentReport.finalUrl,
    currentReport.scannedUrl,
    clientName,
    hourlyRate,
    currency,
    retainerMonthly,
    monthlyVisitors,
    currentConvRate,
    avgOrderValue,
    projectedLiftPct,
    scopeTasks,
    savedProposalId,
  ]);

  // Save 1:1 Proposal Snapshot to Backend & Copy Link
  const handleSaveAndCopyClientLink = async () => {
    if (!agencyToken) {
      setIsPinModalOpen(true);
      showToast(isPolish ? "Zaloguj się jako agencja, aby zapisać i zatwierdzić raport." : "Log in as the agency to save and approve the report.");
      return;
    }
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          id: savedProposalId || undefined,
          report: currentReport,
          liveSeo,
          scopeTasks,
          hourlyRate,
          currency,
          retainerMonthly,
          clientName,
          auditorName,
          customOfferNote,
          monthlyVisitors,
          currentConvRate,
          avgOrderValue,
          projectedLiftPct,
          aiAdvisor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setSavedProposalId(data.id);
          const base = window.location.origin + window.location.pathname;
          const tasksCompact = scopeTasks.map((t) => `${t.id}:${t.hours}:${t.selected ? 1 : 0}`).join(",");
          const params = new URLSearchParams({
            clientView: "1",
            proposalId: data.id,
            url: currentReport.finalUrl || currentReport.scannedUrl,
            client: clientName || "Klient",
            rate: String(hourlyRate),
            curr: currency,
            retainer: String(retainerMonthly),
            visitors: String(monthlyVisitors),
            conv: String(currentConvRate),
            aov: String(avgOrderValue),
            lift: String(projectedLiftPct),
            tasks: tasksCompact,
          });
          const fullUrl = `${base}?${params.toString()}`;
          const reviewer = window.prompt(
            isPolish
              ? "Raport zostaje szkicem, dopóki człowiek go nie zatwierdzi. Potwierdzam, że sprawdziłem raport i ofertę. Podaj imię i nazwisko zatwierdzającego (Anuluj = zostaje szkicem):"
              : "The report stays a draft until a person approves it. I confirm I have reviewed the report and offer. Enter the approver's full name (Cancel = stays a draft):",
            auditorName || ""
          );
          if (!reviewer || reviewer.trim().length < 3) {
            showToast(isPolish ? "Zapisano jako SZKIC. Klient go nie zobaczy, dopóki go nie zatwierdzisz." : "Saved as DRAFT. The client cannot see it until approved.");
            return;
          }
          const ap = await fetch(`/api/proposals/${data.id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ reviewer: reviewer.trim() }),
          });
          if (!ap.ok) {
            showToast(isPolish ? "Nie udało się zatwierdzić raportu." : "Could not approve the report.");
            return;
          }
          const copied = await copyText(fullUrl);
          showToast(
            isPolish
              ? `Raport zatwierdzony przez ${reviewer.trim()}. ${copied ? "Link dla klienta skopiowany." : "Nie udało się skopiować linku – skopiuj go ręcznie z paska adresu po otwarciu raportu."}`
              : `Report approved by ${reviewer.trim()}. ${copied ? "Client link copied." : "Could not copy the link – copy it manually."}`
          );
          return;
        }
      }
    } catch {}
    const copiedShare = await copyText(shareableClientUrl);
    showToast(copiedShare ? (isPolish ? "Skopiowano link do oferty dla klienta!" : "Copied shareable client link!") : isPolish ? "Nie udało się skopiować linku." : "Could not copy the link.");
  };

  // Copy text helper
  const handleCopyText = async (text: string, label: string) => {
    const ok = await copyText(text);
    showToast(ok ? (isPolish ? `Skopiowano: ${label}` : `Copied: ${label}`) : isPolish ? "Nie udało się skopiować." : "Copy failed.");
  };

  // Standalone White-Label HTML Report Export
  const handleDownloadHtmlReport = () => {
    const domain = currentReport.scannedUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "raport";
    // Kosztorys w eksporcie HTML tylko dla zalogowanej agencji (klient i tryb publiczny nie dostają kwot ani godzin).
    const quoteHtml = includeQuoteInReport && !isPublicMode && viewMode === "agency" && !!agencyToken
      ? `
      <div class="card" style="border: 2px solid #10b981; background: #f0fdf4;">
        <h2 style="margin-top:0; color:#065f46;">Kosztorys Wdrożenia & Prognoza Zwrotu z Inwestycji (ROI)</h2>
        <p style="font-size:13px; color:#334155;">${customOfferNote}</p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0; background:white; border-radius:8px; overflow:hidden;">
          <thead>
            <tr style="background:#0f172a; color:white; text-align:left; font-size:12px;">
              <th style="padding:10px;">Zakres prac inżynieryjnych</th>
              <th style="padding:10px;">Korzyść biznesowa</th>
              <th style="padding:10px; text-align:right;">Czas (rbh)</th>
            </tr>
          </thead>
          <tbody>
            ${scopeSummary.selectedTasks
              .map(
                (t) => `
              <tr style="border-bottom:1px solid #e2e8f0; font-size:13px;">
                <td style="padding:10px; font-weight:bold;">${t.title}</td>
                <td style="padding:10px; color:#047857;">${t.businessBenefit}</td>
                <td style="padding:10px; text-align:right; font-family:monospace;">${t.hours} h</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:8px;">
          <div>
            <div style="font-size:12px; color:#475569;">Łączny nakład pracy: <strong>${scopeSummary.totalHours} roboczogodzin</strong> (${hourlyRate} ${currency}/h)</div>
            ${hasRoiAssumptions ? `<div style="font-size:12px; color:#047857; font-weight:bold;">Scenariusz ilustracyjny przy założeniach agencji: +${scopeSummary.monthlyGain} ${currency}/mies. To nie jest prognoza ani gwarancja wyniku.</div>` : ""}
          </div>
          <div style="font-size:22px; font-weight:900; color:#0f172a;">Inwestycja: ${scopeSummary.netPrice} ${currency} netto</div>
        </div>
      </div>`
      : "";

    const htmlContent = `<!DOCTYPE html>
<html lang="${isPolish ? "pl" : "en"}">
<head>
  <meta charset="UTF-8">
  <title>Ekspertyza Techniczna i Audyt SEO — ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; line-height: 1.5; }
    .container { max-width: 920px; margin: 0 auto; }
    .header { background: #111A2E; color: white; padding: 28px; border-radius: 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center; }
    .card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 6px 0; }
    h2 { font-size: 18px; font-weight: 800; margin-top: 0; color: #0f172a; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center; }
    .stat-val { font-size: 26px; font-weight: 900; color: #059669; font-family: monospace; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .issue { padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 10px; font-size: 13px; border-radius: 10px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div style="font-size:11px; color:#34d399; font-weight:bold; letter-spacing:1px;">OFICJALNA EKSPERTYZA TECHNICZNA & AUDYT WZROSTU</div>
        <h1>${currentReport.scannedUrl}</h1>
        <div style="font-size:13px; color:#cbd5e1;">Przygotowano dla: <strong>${clientName || domain}</strong> · Audytor: <strong>${auditorName}</strong></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:36px; font-weight:900; color:#34d399;">${currentReport.overallScore ?? "N/A"}/100</div>
        <div style="font-size:11px; color:#94a3b8;">Indeks kondycji strony</div>
      </div>
    </div>

    <div class="grid">
      <div class="stat"><div style="font-size:11px; color:#64748b;">Wydajność</div><div class="stat-val">${currentReport.categories.performance}/100</div></div>
      <div class="stat"><div style="font-size:11px; color:#64748b;">Techniczne SEO</div><div class="stat-val">${currentReport.categories.seo}/100</div></div>
      <div class="stat"><div style="font-size:11px; color:#64748b;">Dostępność WCAG</div><div class="stat-val">${currentReport.categories.accessibility}/100</div></div>
      <div class="stat"><div style="font-size:11px; color:#64748b;">Dobre Praktyki</div><div class="stat-val">${currentReport.categories.bestPractices}/100</div></div>
    </div>

    <div class="card">
      <h2>Parametry Core Web Vitals & Inspekcja SEO</h2>
      <div class="metric"><span>Largest Contentful Paint (LCP — docelowo ≤ 2.5 s)</span><strong>${currentReport.coreWebVitals.lcp.displayValue}</strong></div>
      <div class="metric"><span>Interaction to Next Paint (INP — docelowo ≤ 200 ms)</span><strong>${currentReport.coreWebVitals.inp.displayValue}</strong></div>
      <div class="metric"><span>Cumulative Layout Shift (CLS — docelowo ≤ 0.1)</span><strong>${currentReport.coreWebVitals.cls.displayValue}</strong></div>
      <div class="metric"><span>Znacznik Title (${liveSeo.title.length} znaków)</span><strong>${liveSeo.title.text || "Brak"}</strong></div>
      <div class="metric"><span>Struktura nagłówków H1 / H2 / H3</span><strong>H1: ${liveSeo.headings.h1} · H2: ${liveSeo.headings.h2} · H3: ${liveSeo.headings.h3}</strong></div>
      <div class="metric"><span>Obrazy bez atrybutu ALT / Bezpieczeństwo HTTPS</span><strong>Brakujące ALT: ${liveSeo.images.missingAlt} · HTTPS: ${liveSeo.https ? "Tak" : "Nie"}</strong></div>
    </div>

    <div class="card">
      <h2>Zdiagnozowane Bariery Wzrostu i Konwersji</h2>
      ${currentReport.issues
        .map(
          (i) => `
        <div class="issue">
          <div style="display:flex; justify-content:space-between; font-weight:bold; color:#0f172a;">
            <span>${i.title}</span>
            <span style="color:#d97706;">Priorytet: ${i.priority.toUpperCase()}</span>
          </div>
          <div style="margin-top:4px; color:#475569;">${i.description}</div>
          <div style="margin-top:6px; font-weight:bold; color:#047857;">Wpływ na biznes: ${i.businessImpact || "Ogranicza widoczność w Google i konwersję mobilną."}</div>
        </div>`
        )
        .join("")}
    </div>

    ${quoteHtml}

    <div class="footer">Raport wygenerowany w systemie ${auditorName} · ${agencyWebsite} · Kontakt: contact@novopix.uk</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ekspertyza-novopix-${domain}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(isPolish ? "Pobrano obrandowany raport HTML dla klienta!" : "Downloaded white-label HTML report!");
  };

  // All 14 Navigation Workspace Items (filtered when in Client Deal Room viewMode === "client")
  const allWorkspaceTabs = [
    { id: "overview", label: isPolish ? "Przegląd audytu" : "Audit overview", short: isPolish ? "Przegląd" : "Overview", icon: LayoutDashboard },
    { id: "ai-advisor", label: "AI Advisor", short: "AI Advisor", icon: Bot, highlight: true },
    { id: "roi-calculator", label: isPolish ? "Kalkulator Wyceny & ROI" : "Pricing & ROI Calc", short: isPolish ? "Wycena & ROI" : "ROI & Quote", icon: Calculator, highlight: true },
    { id: "seo", label: isPolish ? "Głęboki Audyt SEO (HTML)" : "Deep SEO Inspector", short: "Deep SEO", icon: Search },
    { id: "performance", label: isPolish ? "Wydajność & Core Vitals" : "Core Web Vitals", short: isPolish ? "Wydajność" : "Performance", icon: Zap },
    { id: "insights", label: isPolish ? "Wykryte Problemy & Waga" : "Issues & Page Weight", short: isPolish ? "Problemy & Waga" : "Issues & Weight", icon: Layers },
    { id: "compare", label: isPolish ? "Porównanie z Konkurencją" : "Competitor 1:1", short: isPolish ? "Konkurencja" : "Compare", icon: Scale },
    { id: "monitoring", label: isPolish ? "Monitoring 24/7 (Retainer)" : "24/7 Monitoring", short: "Monitoring 24/7", icon: Bell, highlight: true, agencyOnly: true },
    { id: "status", label: isPolish ? "Status usług" : "Service status", short: isPolish ? "Status usług" : "Status", icon: Activity, agencyOnly: true },
    { id: "stats", label: isPolish ? "Statystyki odwiedzin" : "Visit statistics", short: isPolish ? "Statystyki" : "Statistics", icon: TrendingUp, agencyOnly: true },
    { id: "crm", label: isPolish ? "Panel Agencji (CRM)" : "Agency CRM", short: isPolish ? "Panel Agencji" : "Agency CRM", icon: Briefcase, highlight: true, agencyOnly: true },
    { id: "bulk", label: isPolish ? "Skan wielu stron i leady" : "Bulk scan & leads", short: isPolish ? "Leady" : "Leads", icon: ListOrdered, highlight: true, agencyOnly: true },
    { id: "packages", label: isPolish ? "Pakiety i skaner publiczny" : "Packages & public scanner", short: isPolish ? "Pakiety" : "Packages", icon: Package, highlight: true, agencyOnly: true },
    { id: "reports", label: isPolish ? "Raporty PDF & Link Klienta" : "Reports & Share Link", short: isPolish ? "Raporty & Link" : "Reports & Share", icon: Share2, highlight: true },
    { id: "webscore", label: isPolish ? "Trend WebScore i Historia" : "WebScore & History", short: "WebScore", icon: TrendingUp },
    { id: "diagnostics", label: isPolish ? "Diagnostyka Indeksowania" : "Crawl Diagnostics", short: isPolish ? "Diagnostyka" : "Diagnostics", icon: Activity },
    { id: "accessibility", label: isPolish ? "Dostępność WCAG 2.1 AA" : "WCAG 2.1 AA", short: "WCAG 2.1", icon: Eye },
    { id: "checklist", label: isPolish ? "Lista Kontrolna Wdrożenia" : "Action Checklist", short: isPolish ? "Checklista" : "Checklist", icon: CheckCircle2 },
  ];

  const workspaceTabs = useMemo(
    () =>
      isPublicMode
        ? allWorkspaceTabs.filter((t) => !t.agencyOnly && t.id !== "roi-calculator" && t.id !== "reports")
        : viewMode === "client"
        ? allWorkspaceTabs.filter((t) => !t.agencyOnly && t.id !== "roi-calculator")
        : agencyToken
        ? allWorkspaceTabs
        : allWorkspaceTabs.filter((t) => t.id !== "roi-calculator"),
    [viewMode, isPolish, isPublicMode, agencyToken]
  );

  // Filtered Issues & Checklist
  const filteredIssues = useMemo(() => {
    if (issueFilter === "all") return currentReport.issues;
    if (issueFilter === "high") return currentReport.issues.filter((i) => i.priority === "high");
    return currentReport.issues.filter((i) => i.category === issueFilter);
  }, [currentReport.issues, issueFilter]);

  const filteredChecklist = useMemo(() => {
    if (checklistFilter === "all") return currentReport.recommendedActions;
    return currentReport.recommendedActions.filter((a) => a.status === checklistFilter);
  }, [currentReport.recommendedActions, checklistFilter]);

  const filteredCrmClients = useMemo(() => {
    if (crmFilter === "all") return crmClients;
    return crmClients.filter((c) => c.status === crmFilter);
  }, [crmClients, crmFilter]);

  const crmMetrics = useMemo(() => {
    const pipelineVal = crmClients.reduce((s, c) => s + (c.contractValue || 0), 0);
    const monthlyMrr = crmClients
      .filter((c) => c.status === "remediated" || c.status === "retainer" || c.status === "proposal_accepted")
      .reduce((s, c) => s + (c.retainerFee || 300), 0);
    const scored = crmClients.filter((c) => typeof c.lastScore === "number" && c.lastScore > 0);
    const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + c.lastScore, 0) / scored.length) : null;
    return { pipelineVal, monthlyMrr, avgScore, count: crmClients.length };
  }, [crmClients]);

  const unseenAlerts = useMemo(
    () =>
      monitoredDomains.flatMap((d) =>
        (d.alertsLog || []).filter((a) => a.seen === false && a.type !== "recovered").map((a) => ({ ...a, domain: d.domain }))
      ),
    [monitoredDomains]
  );

  // Odświeżanie monitoringu co minutę po zalogowaniu (alerty z cyklicznych pomiarów pojawiają się bez przeładowania).
  useEffect(() => {
    if (!agencyToken || isPublicMode) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/monitoring", { headers: getAuthHeaders() });
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.domains)) setMonitoredDomains(d.domains);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(t);
  }, [agencyToken, isPublicMode]);

  // Czerwony znacznik przy zakładce „Status usług” (odświeżany co minutę po zalogowaniu).
  const [statusDown, setStatusDown] = useState(0);
  useEffect(() => {
    if (!agencyToken || isPublicMode) return;
    const poll = async () => {
      try {
        const r = await fetch("/api/status/details", { headers: getAuthHeaders() });
        if (r.ok) {
          const d = await r.json();
          setStatusDown((d.services || []).filter((x: any) => x.ok === false).length);
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 60000);
    return () => clearInterval(t);
  }, [agencyToken, isPublicMode]);

  const handleMarkAlertsSeen = async () => {
    const r = await fetch("/api/monitoring/alerts/seen", { method: "POST", headers: getAuthHeaders() }).catch(() => null);
    if (r && r.ok) {
      const d = await r.json();
      if (Array.isArray(d.domains)) setMonitoredDomains(d.domains);
    }
  };

  const handleRunPsi = async (id: string) => {
    setCheckingDomainId(id);
    try {
      const r = await fetch(`/api/monitoring/psi/${id}`, { method: "POST", headers: getAuthHeaders() });
      const d = await r.json().catch(() => ({}));
      if (d.domain) setMonitoredDomains((prev) => prev.map((x) => (x.id === id ? d.domain : x)));
      showToast(r.ok ? (isPolish ? "Zakończono pomiar Google PageSpeed." : "Google PageSpeed measurement finished.") : d.error || "Error");
    } catch {} finally {
      setCheckingDomainId(null);
    }
  };

  const hasScan = currentReport.id !== "empty";
  // Scenariusz przychodowy pokazujemy tylko, gdy ktoś sam wpisał założenia (ruch, konwersja, wartość zamówienia, wzrost).
  const hasRoiAssumptions = monthlyVisitors > 0 && currentConvRate > 0 && avgOrderValue > 0 && projectedLiftPct > 0;
  // Kosztorys & ROI: tylko zalogowana agencja (PIN); klient, tryb publiczny i adres/stan z parametrów go nie otworzą.
  const roiAllowed = !isPublicMode && viewMode === "agency" && !!agencyToken;
  const effectiveTab = activeTab === "roi-calculator" && !roiAllowed ? "overview" : activeTab;
  const shownTab = !hasScan && !["roi-calculator", "monitoring", "crm", "bulk", "packages", "status", "stats"].includes(effectiveTab) ? "empty-state" : effectiveTab;

  const pageWeight = currentReport.pageWeight || { totalKb: 0, requestCount: 0, jsKb: 0, imagesKb: 0, cssKb: 0, fontsKb: 0, serverResponseMs: 0, thirdPartyBlockingMs: 0 };

  return {
    isPolish,
    setIsPolish,
    activeTab,
    setActiveTab,
    urlInput,
    setUrlInput,
    strategy,
    setStrategy,
    isScanning,
    setIsScanning,
    toastMsg,
    setToastMsg,
    viewMode,
    setViewMode,
    currentReport,
    setCurrentReport,
    liveSeo,
    setLiveSeo,
    isSeoLoading,
    setIsSeoLoading,
    scanHistory,
    setScanHistory,
    aiAdvisor,
    setAiAdvisor,
    isAiLoading,
    setIsAiLoading,
    activeScriptTab,
    setActiveScriptTab,
    currency,
    setCurrency,
    hourlyRate,
    setHourlyRate,
    retainerMonthly,
    setRetainerMonthly,
    scopeTasks,
    setScopeTasks,
    roiStarted,
    setRoiStarted,
    roiAllowed,
    newTaskTitle,
    setNewTaskTitle,
    newTaskHours,
    setNewTaskHours,
    monthlyVisitors,
    setMonthlyVisitors,
    currentConvRate,
    setCurrentConvRate,
    avgOrderValue,
    setAvgOrderValue,
    projectedLiftPct,
    setProjectedLiftPct,
    competitorUrl,
    setCompetitorUrl,
    competitorReport,
    setCompetitorReport,
    isComparing,
    setIsComparing,
    crmClients,
    setCrmClients,
    crmFilter,
    setCrmFilter,
    expandedClientId,
    setExpandedClientId,
    newClientName,
    setNewClientName,
    newClientCompany,
    setNewClientCompany,
    newClientEmail,
    setNewClientEmail,
    newClientPhone,
    setNewClientPhone,
    newClientWeb,
    setNewClientWeb,
    monitoredDomains,
    setMonitoredDomains,
    newMonitorUrl,
    setNewMonitorUrl,
    newMonitorClient,
    setNewMonitorClient,
    newMonitorThreshold,
    setNewMonitorThreshold,
    newMonitorInterval,
    setNewMonitorInterval,
    checkingDomainId,
    setCheckingDomainId,
    clientName,
    setClientName,
    auditorName,
    setAuditorName,
    agencyWebsite,
    setAgencyWebsite,
    customOfferNote,
    setCustomOfferNote,
    includeQuoteInReport,
    setIncludeQuoteInReport,
    issueFilter,
    setIssueFilter,
    checklistFilter,
    setChecklistFilter,
    trendRange,
    setTrendRange,
    isQuoteOpen,
    setIsQuoteOpen,
    isAcceptProposalOpen,
    setIsAcceptProposalOpen,
    isHowItWorksOpen,
    setIsHowItWorksOpen,
    isPrivacyOpen,
    setIsPrivacyOpen,
    isClientLinkLocked,
    setIsClientLinkLocked,
    isPublicMode,
    setIsPublicMode,
    isPinModalOpen,
    setIsPinModalOpen,
    pinAttempt,
    setPinAttempt,
    pinError,
    setPinError,
    currentPinInput,
    setCurrentPinInput,
    newPinInput,
    setNewPinInput,
    savedProposalId,
    setSavedProposalId,
    agencyToken,
    setAgencyToken,
    isDefaultPinWarning,
    setIsDefaultPinWarning,
    scanError,
    setScanError,
    showToast,
    getAuthHeaders,
    agencyCtx,
    updateClientLocal,
    loadProtectedCrmAndMonitoring,
    handleUnlockWithPin,
    handleDownloadCrmBackup,
    handleRequestAgencyMode,
    scopeSummary,
    handleRunSeoCheck,
    handleRunAiAdvisor,
    handleRunScan,
    handleCompareCompetitor,
    handleToggleChecklist,
    handleSaveCurrentToCrm,
    handleAddCrmClient,
    handleUpdateClientStatus,
    handleDeleteClient,
    handleAddMonitorDomain,
    handleCheckMonitoredDomain,
    handleDeleteMonitoredDomain,
    shareableClientUrl,
    handleSaveAndCopyClientLink,
    handleCopyText,
    handleDownloadHtmlReport,
    allWorkspaceTabs,
    workspaceTabs,
    filteredIssues,
    filteredChecklist,
    filteredCrmClients,
    crmMetrics,
    unseenAlerts,
    statusDown,
    handleMarkAlertsSeen,
    handleRunPsi,
    hasScan,
    hasRoiAssumptions,
    shownTab,
    pageWeight,
  };
}

export type AppState = ReturnType<typeof useAppState>;
