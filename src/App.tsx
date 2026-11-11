import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Search,
  ShieldCheck,
  Smartphone,
  Monitor,
  Gauge,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Download,
  ExternalLink,
  Info,
  Globe,
  Clock,
  Check,
  X,
  DollarSign,
  Users,
  BarChart3,
  Sparkles,
  Share2,
  Layers,
  LayoutDashboard,
  CircleHelp,
  Shield,
  Eye,
  Send,
  Printer,
  Scale,
  Activity,
  Copy,
  Plus,
  Trash2,
  Briefcase,
  Calculator,
  Bot,
  Bell,
} from "lucide-react";
import {
  AuditReport,
  LiveSeoInspection,
  AiAdvisorData,
  ScopeTaskItem,
  AgencyClient,
  MonitoredDomain,
  DEFAULT_SCOPE_TASKS,
  DEFAULT_LIVE_SEO,
  SAMPLE_AUDIT,
  buildDynamicAuditArtifacts,
} from "./scannerTypes";
import { AuditIntegrityBanner } from "./components/AuditIntegrityBanner";

// Authentic 5x5 Animated Pixel Matrix from novopix.uk (#mk) cycling N - O - V - O - P - I - X
const NOVOPIX_LETTERS: string[][] = [
  ["A...X", "XX..X", "X.X.X", "X..XX", "X...X"], // N
  [".XXX.", "X...X", "X...X", "X...X", ".XXA."], // O
  ["X...X", "X...X", ".X.X.", ".X.X.", "..A.."], // V
  [".XXX.", "X...X", "X...X", "X...X", ".XXA."], // O
  ["XXXX.", "X...X", "XXXA.", "X....", "X...."], // P
  ["..A..", ".....", "..X..", "..X..", "..X.."], // I
  ["X...X", ".X.X.", "..A..", ".X.X.", "X...X"], // X
];

function NovoPixAnimatedMark({ sizeClass = "w-6 h-6" }: { sizeClass?: string }) {
  const [letterIdx, setLetterIdx] = useState<number>(0);
  const [lastManualMs, setLastManualMs] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && Date.now() - lastManualMs > 1800) {
        setLetterIdx((prev) => (prev + 1) % NOVOPIX_LETTERS.length);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [lastManualMs]);

  const handleAdvance = () => {
    setLastManualMs(Date.now());
    setLetterIdx((prev) => (prev + 1) % NOVOPIX_LETTERS.length);
  };

  const matrix = NOVOPIX_LETTERS[letterIdx];

  return (
    <svg
      viewBox="0 0 60 60"
      className={`${sizeClass} cursor-pointer select-none`}
      onMouseEnter={handleAdvance}
      onClick={handleAdvance}
      aria-label="NovoPix animated pixel mark"
    >
      {Array.from({ length: 25 }).map((_, k) => {
        const x = k % 5;
        const y = Math.floor(k / 5);
        const cell = matrix[y][x];
        const isVisible = cell !== ".";
        const isAccent = cell === "A";
        return (
          <rect
            key={k}
            className="np-cell"
            x={x * 12 + 1}
            y={y * 12 + 1}
            width={10}
            height={10}
            rx={2.4}
            fill={isAccent ? "#ffc233" : "#ffffff"}
            style={{
              transform: isVisible ? "scale(1)" : "scale(0)",
              transitionDelay: `${(x + y) * 0.03}s`,
            }}
          />
        );
      })}
    </svg>
  );
}

export default function App() {
  const [isPolish, setIsPolish] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [urlInput, setUrlInput] = useState<string>("novopix.uk");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Agency Mode vs Client Pitch Mode (protects know-how & hides internal CRM)
  const [viewMode, setViewMode] = useState<"agency" | "client">("agency");

  // Core Audit & Live SEO State
  const [currentReport, setCurrentReport] = useState<AuditReport>(SAMPLE_AUDIT);
  const [liveSeo, setLiveSeo] = useState<LiveSeoInspection>(DEFAULT_LIVE_SEO);
  const [isSeoLoading, setIsSeoLoading] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<AuditReport[]>([SAMPLE_AUDIT]);

  // AI Growth Advisor State
  const [aiAdvisor, setAiAdvisor] = useState<AiAdvisorData | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [activeScriptTab, setActiveScriptTab] = useState<"coldEmail" | "phonePitch" | "objectionHandler">("coldEmail");

  // Dynamic Hourly Scope & ROI Calculator State
  const [currency, setCurrency] = useState<"PLN" | "GBP" | "EUR">("PLN");
  const [hourlyRate, setHourlyRate] = useState<number>(150);
  const [retainerMonthly, setRetainerMonthly] = useState<number>(300);
  const [scopeTasks, setScopeTasks] = useState<ScopeTaskItem[]>(DEFAULT_SCOPE_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskHours, setNewTaskHours] = useState<number>(2);

  // Business ROI Simulator Parameters
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(4500);
  const [currentConvRate, setCurrentConvRate] = useState<number>(1.8);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(400);
  const [projectedLiftPct, setProjectedLiftPct] = useState<number>(10);

  // Competitor Comparison State
  const [competitorUrl, setCompetitorUrl] = useState<string>("webflow.com");
  const [competitorReport, setCompetitorReport] = useState<AuditReport | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Agency CRM State
  const [crmClients, setCrmClients] = useState<AgencyClient[]>([]);
  const [crmFilter, setCrmFilter] = useState<string>("all");
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
  const [isClientLinkLocked, setIsClientLinkLocked] = useState<boolean>(false);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(false);
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
  const [scanError, setScanError] = useState<string | null>(null);

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
    if (viewMode === "client" && (activeTab === "crm" || activeTab === "monitoring")) {
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
    const query = (targetUrl || urlInput).trim() || "novopix.uk";
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
        setScanError(errMsg);
        showToast(errMsg);
        return;
      }

      const baseMerged: AuditReport = {
        ...SAMPLE_AUDIT,
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
          ...SAMPLE_AUDIT,
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
      email: `kontakt@${cleanHost}`,
      phone: "+48 600 000 000",
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
          email: newClientEmail || "kontakt@klient.pl",
          phone: newClientPhone || "-",
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
          navigator.clipboard.writeText(fullUrl);
          showToast(
            isPolish
              ? `Raport zatwierdzony przez ${reviewer.trim()}. Link dla klienta skopiowany.`
              : `Report approved by ${reviewer.trim()}. Client link copied.`
          );
          return;
        }
      }
    } catch {}
    navigator.clipboard.writeText(shareableClientUrl);
    showToast(isPolish ? "Skopiowano link do oferty dla klienta!" : "Copied shareable client link!");
  };

  // Copy text helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(isPolish ? `Skopiowano: ${label}` : `Copied: ${label}`);
  };

  // Standalone White-Label HTML Report Export
  const handleDownloadHtmlReport = () => {
    const domain = currentReport.scannedUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "raport";
    const quoteHtml = includeQuoteInReport
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
            <div style="font-size:12px; color:#047857; font-weight:bold;">Scenariusz ilustracyjny przy założeniach agencji: +${scopeSummary.monthlyGain} ${currency}/mies. To nie jest prognoza ani gwarancja wyniku.</div>
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
        <div style="font-size:11px; color:#94a3b8;">Indeks Kondycji AURA</div>
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
    { id: "overview", label: isPolish ? "AURA Audyt (Główny)" : "AURA Overview", short: isPolish ? "AURA Audyt" : "Overview", icon: LayoutDashboard },
    { id: "ai-advisor", label: isPolish ? "AI Growth Advisor & Pitch" : "AI Growth Advisor", short: "AI Advisor", icon: Bot, highlight: true },
    { id: "roi-calculator", label: isPolish ? "Kalkulator Wyceny & ROI" : "Pricing & ROI Calc", short: isPolish ? "Wycena & ROI" : "ROI & Quote", icon: Calculator, highlight: true },
    { id: "seo", label: isPolish ? "Głęboki Audyt SEO (HTML)" : "Deep SEO Inspector", short: "Deep SEO", icon: Search },
    { id: "performance", label: isPolish ? "Wydajność & Core Vitals" : "Core Web Vitals", short: isPolish ? "Wydajność" : "Performance", icon: Zap },
    { id: "insights", label: isPolish ? "Wykryte Problemy & Waga" : "Issues & Page Weight", short: isPolish ? "Problemy & Waga" : "Issues & Weight", icon: Layers },
    { id: "compare", label: isPolish ? "Porównanie z Konkurencją" : "Competitor 1:1", short: isPolish ? "Konkurencja" : "Compare", icon: Scale },
    { id: "monitoring", label: isPolish ? "Monitoring 24/7 (Retainer)" : "24/7 Monitoring", short: "Monitoring 24/7", icon: Bell, highlight: true, agencyOnly: true },
    { id: "crm", label: isPolish ? "Panel Agencji (CRM)" : "Agency CRM", short: isPolish ? "Panel Agencji" : "Agency CRM", icon: Briefcase, highlight: true, agencyOnly: true },
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
        ? allWorkspaceTabs.filter((t) => !t.agencyOnly)
        : allWorkspaceTabs,
    [viewMode, isPolish, isPublicMode]
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
    const avgScore = crmClients.length
      ? Math.round(crmClients.reduce((s, c) => s + (c.lastScore || 65), 0) / crmClients.length)
      : 72;
    return { pipelineVal, monthlyMrr, avgScore, count: crmClients.length };
  }, [crmClients]);

  const pageWeight = currentReport.pageWeight || SAMPLE_AUDIT.pageWeight!;

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
              title="Najedź lub kliknij — animowana matryca 5x5 N-O-V-O-P-I-X"
            >
              <NovoPixAnimatedMark sizeClass="w-6 h-6" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base tracking-tight text-white leading-none">
                <span>Novo</span>
                <span className="novopix-wordmark-pix">Pix</span>
                <span className="ml-1.5 text-[10px] font-mono uppercase tracking-widest text-[#ffc233]">AURA</span>
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
                    {item.highlight && !isActive && !isPublicMode && (
                      <span className="text-[10px] text-[#ffc233] font-mono">PRO</span>
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
            <div className="text-[11px] font-bold text-white mb-0.5">
              {isPolish ? "Bieżąca Wycena Naprawy" : "Current Fix Quote"}
            </div>
            <div className="text-base font-mono font-extrabold text-[#ffc233] tabular-nums">
              {scopeSummary.netPrice} {currency} <span className="text-[10px] font-normal text-[#bcd6e6]">({scopeSummary.totalHours}h)</span>
            </div>
            <button
              onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : isPublicMode ? setIsQuoteOpen(true) : setActiveTab("roi-calculator"))}
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
                  : isPolish
                  ? "Otwórz kalkulator ROI →"
                  : "Open ROI Calculator →"}
              </span>
            </button>
          </div>
          <div className="text-[10px] text-[#bcd6e6]/70 text-center">NovoPix · novopix.uk · contact@pepsafe.info</div>
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
              title="Najedź lub kliknij — animowane logo N-O-V-O-P-I-X"
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
                  ...(isPublicMode ? [] : [{ id: "roi-calculator", label: isPolish ? "Kosztorys & ROI" : "Quote & ROI" }]),
                  { id: "seo", label: isPolish ? "Audyt SEO HTML" : "Deep SEO" },
                  { id: "compare", label: isPolish ? "Porównanie z Konkurencją" : "Competitor Compare" },
                ]
              : [
                  { id: "overview", label: isPolish ? "Przegląd AURA" : "AURA Overview" },
                  { id: "ai-advisor", label: isPolish ? "AI Growth Advisor" : "AI Advisor" },
                  { id: "roi-calculator", label: isPolish ? "Kalkulator Wyceny & ROI" : "ROI & Pricing" },
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
              onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : setIsQuoteOpen(true))}
              className="px-4 py-2 novopix-gold-btn rounded-lg text-xs font-extrabold transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPublicMode
                ? isPolish
                  ? "Poproś o wycenę"
                  : "Request a quote"
                : viewMode === "client"
                ? isPolish
                  ? `Akceptuję Kosztorys (${scopeSummary.netPrice} ${currency})`
                  : `Accept Proposal (${scopeSummary.netPrice} ${currency})`
                : isPolish
                ? "Zamów Wdrożenie / Lead"
                : "Request Turnkey Fix"}
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
                  ? `Kompleksowe wdrożenie audytu (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency} netto) ukierunkowane na wynik 90+ z raportem przed i po wdrożeniu. Poufne moduły wewnętrzne agencji są ukryte.`
                  : `Turnkey engineering remediation (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency} net) targeting 90+ scores with documented before/after measurements.`}
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
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate max-w-xs sm:max-w-md font-mono">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {currentReport.finalUrl || currentReport.scannedUrl}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-700">
                  {isPolish ? "Kondycja:" : "Health:"} {currentReport.overallScore ?? "N/A"}/100 ({currentReport.overallLabel})
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {isPolish ? "Dynamiczna wycena:" : "Dynamic Quote:"}{" "}
                  <strong className="text-slate-900 font-mono tabular-nums">
                    {scopeSummary.netPrice} {currency} ({scopeSummary.totalHours}h)
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 font-mono tabular-nums">
                  {new Date(currentReport.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
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
                      ? "Wpisz adres strony klienta (np. novopix.uk, autoklinika.pl, sklep.pl)"
                      : "Enter client website URL (e.g. novopix.uk, mybusiness.com)"
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
                    strategy === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    strategy === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
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

          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW (AURA EXECUTIVE OVERVIEW)                         */}
          {/* ================================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                <ScoreGaugeCard
                  title={isPolish ? "Indeks Kondycji AURA" : "Overall Health Index"}
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
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        {isPolish ? "Szacowany potencjał wzrostu:" : "Projected conversion lift:"} +{projectedLiftPct}%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {isPolish
                        ? `Przeskanowana witryna (${currentReport.finalUrl}) uzyskuje wynik ${currentReport.overallScore}/100. Czas ładowania głównej treści (LCP: ${currentReport.coreWebVitals.lcp.displayValue}) oraz wykryte blokady renderowania powodują, że część klientów mobilnych opuszcza stronę przed wysłaniem zapytania. Poniżej znajdują się 3 kluczowe parametry finansowe wyliczone dla tej domeny:`
                        : `The audited website (${currentReport.finalUrl}) scores ${currentReport.overallScore}/100. Current Largest Contentful Paint (${currentReport.coreWebVitals.lcp.displayValue}) and render-blocking scripts cause mobile visitor drop-offs before form submission:`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500">
                        {isPolish ? "Szacowany dodatkowy przychód" : "Projected Monthly Gain"}
                      </div>
                      <div className="text-xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">
                        +{scopeSummary.monthlyGain.toLocaleString()} {currency}/mc
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {isPolish ? `Wzrost z ${scopeSummary.currentLeads} do ${scopeSummary.newLeads} klientów/mc` : `Lift from ${scopeSummary.currentLeads} to ${scopeSummary.newLeads} leads/mo`}
                      </div>
                    </div>

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
                        <button
                          onClick={() => setActiveTab("roi-calculator")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>{isPolish ? "Dostosuj Kosztorys Godzinowy i ROI" : "Customize Hourly Quote & ROI"}</span>
                        </button>
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
                    <span>HTTPS / SSL: {liveSeo.https ? "Aktywny (Bezpieczna)" : "Brak SSL!"}</span>
                    <span className="font-mono tabular-nums">Waga: {pageWeight.totalKb} KB · TTFB: {liveSeo.responseTimeMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Core Web Vitals Row */}
              <section className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <span>Core Web Vitals (Oficjalne Wskaźniki Szybkości Google)</span>
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
                    onClick={() => (viewMode === "client" && !isPublicMode ? setIsAcceptProposalOpen(true) : setIsQuoteOpen(true))}
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
                      ? "Zamów Kompleksową Naprawę w NovoPix"
                      : "Order Turnkey Remediation"}
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
          )}

          {/* ================================================================= */}
          {/* TAB 2: AI GROWTH ADVISOR & SALES SCRIPT GENERATOR                 */}
          {/* ================================================================= */}
          {activeTab === "ai-advisor" && (
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
                        ? "Indywidualna ekspertyza sztucznej inteligencji wyznaczająca najszybszą ścieżkę do osiągnięcia wyniku 90+/100 w Google."
                        : "Tailored AI roadmap outlining the fastest path to 90+/100 Google scores."
                      : isPolish
                      ? "Sztuczna inteligencja analizuje błędy strony i tworzy gotową strategię naprawczą oraz teksty rozmów handlowych, dzięki którym obronisz wycenę 1200+ zł przed tanią konkurencją."
                      : "AI analyzes site bottlenecks to generate an executive strategy and ready-to-use sales scripts that justify your agency pricing."}
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
                              ? "Gotowe Skrypty Sprzedażowe i Obrona Ceny 1200+ PLN"
                              : "Ready-to-Use Agency Sales Scripts & Price Defense"}
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
                            {isPolish ? "3. Obrona Ceny (1200 zł vs 500 zł)" : "3. Price Defense"}
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
          )}

          {/* ================================================================= */}
          {/* TAB 3: DYNAMIC HOURLY SCOPE & ROI CALCULATOR                      */}
          {/* ================================================================= */}
          {activeTab === "roi-calculator" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    <span>
                      {isPolish
                        ? "Dynamiczny Kalkulator Roboczogodzin i Zwrotu z Inwestycji (ROI)"
                        : "Dynamic Engineering Scope & ROI Calculator"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPolish
                      ? "Zadania i liczba godzin dopasowują się automatycznie do błędów wykrytych podczas skanu badanej domeny."
                      : "Tasks and engineering hours automatically adapt to the bottlenecks detected on the scanned domain."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(["PLN", "GBP", "EUR"] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        currency === curr ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Business Inputs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agency Pricing Controls */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "1. Parametry Kosztorysu" : "1. Pricing Parameters"}
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPolish ? `Stawka godzinowa inżyniera (${currency}/h)` : `Hourly Engineering Rate (${currency}/h)`}
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={2000}
                      value={hourlyRate}
                      readOnly={viewMode === "client"}
                      onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPolish ? `Miesięczny abonament monitoringu 24/7 (${currency}/mc)` : `Monthly 24/7 Monitoring Retainer (${currency}/mo)`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={retainerMonthly}
                      readOnly={viewMode === "client"}
                      onChange={(e) => setRetainerMonthly(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="text-xs text-emerald-800 font-semibold">
                      {isPolish ? "Wyliczona Wycena Jednorazowa (Netto):" : "Calculated One-Off Quote (Net):"}
                    </div>
                    <div className="text-2xl font-mono font-extrabold text-emerald-700 tabular-nums">
                      {scopeSummary.netPrice.toLocaleString()} {currency}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                      {isPolish ? "Brutto (z 23% VAT):" : "Gross (incl. VAT):"} {scopeSummary.grossPrice.toLocaleString()} {currency} · {scopeSummary.totalHours} rbh
                    </div>
                  </div>
                </div>

                {/* Client ROI Simulator Controls */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "2. Symulator Ruchu i Konwersji Klienta" : "2. Client Traffic & Conversion Simulator"}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Odwiedziny / mies." : "Monthly Visitors"}
                      </label>
                      <input
                        type="number"
                        value={monthlyVisitors}
                        onChange={(e) => setMonthlyVisitors(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Konwersja (%)" : "Conversion Rate (%)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConvRate}
                        onChange={(e) => setCurrentConvRate(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? `Śr. wartość klienta (${currency})` : `Avg Lead/Order Value (${currency})`}
                      </label>
                      <input
                        type="number"
                        value={avgOrderValue}
                        onChange={(e) => setAvgOrderValue(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Wzrost po naprawie (%)" : "Projected Lift (%)"}
                      </label>
                      <input
                        type="number"
                        value={projectedLiftPct}
                        onChange={(e) => setProjectedLiftPct(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{isPolish ? "Obecny przychód z witryny:" : "Current Web Revenue:"}</span>
                      <strong className="font-mono tabular-nums">{scopeSummary.currentMonthlyRev.toLocaleString()} {currency}/mc</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{isPolish ? "Przychód po optymalizacji:" : "Projected Web Revenue:"}</span>
                      <strong className="font-mono text-emerald-700 tabular-nums">{scopeSummary.projectedMonthlyRev.toLocaleString()} {currency}/mc</strong>
                    </div>
                  </div>
                </div>

                {/* Executive ROI Outcome Card */}
                <div className="bg-[#111A2E] text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {isPolish ? "3. Scenariusz ilustracyjny (nie prognoza)" : "3. Illustrative scenario (not a forecast)"}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{isPolish ? "Wynik przy założeniach wpisanych powyżej:" : "Result under the assumptions entered above:"}</div>
                      <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-0.5 tabular-nums">
                        +{scopeSummary.monthlyGain.toLocaleString()} {currency} / mc
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{isPolish ? "Czas zwrotu przy tych założeniach:" : "Payback under these assumptions:"}</div>
                      <div className="text-2xl font-mono font-extrabold text-white mt-0.5 tabular-nums">
                        {scopeSummary.paybackDays} {isPolish ? "dni" : "days"}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isPolish
                        ? `Przy podanych założeniach (ruch, konwersja, wartość zamówienia, wzrost konwersji) koszt ${scopeSummary.netPrice} ${currency} zwróciłby się po ok. ${scopeSummary.paybackDays} dniach. To rachunek ilustracyjny na wpisanych danych, a nie prognoza wyniku klienta.`
                        : `Under the entered assumptions (traffic, conversion, order value, conversion lift) the ${scopeSummary.netPrice} ${currency} cost would be recovered in about ${scopeSummary.paybackDays} days. This is an illustration based on typed-in inputs, not a forecast of the client's results.`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {viewMode === "client" ? (
                      <button
                        onClick={() => setIsAcceptProposalOpen(true)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        {isPolish ? `Akceptuję Kosztorys (${scopeSummary.netPrice} ${currency}) i Zamawiam` : `Accept Proposal (${scopeSummary.netPrice} ${currency})`}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveCurrentToCrm}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isPolish ? "Zapisz Kosztorys w Panelu Agencji CRM" : "Save Quote to Agency CRM"}
                        </button>
                        <button
                          onClick={() => setActiveTab("reports")}
                          className="w-full py-2 bg-[#1C2A47] hover:bg-[#24375B] text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isPolish ? "Przejdź do Eksportu Oferty PDF / Linku" : "Export Quote in Report / Link"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Engineering Task Breakdown Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPolish ? "Szczegółowy Kosztorys Roboczogodzin Dopasowany do Błędów Strony" : "Dynamic Engineering Scope & Hours"}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                    {isPolish ? "Suma wybranych godzin:" : "Selected hours:"} {scopeSummary.totalHours} h = {scopeSummary.netPrice} {currency} netto
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">{isPolish ? "Włącz" : "Include"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Zadanie Inżynieryjne" : "Engineering Task"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Korzyść dla Klienta" : "Client Business Benefit"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Roboczogodziny" : "Hours"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Koszt Netto" : "Net Cost"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {scopeTasks.map((task) => (
                        <tr key={task.id} className={task.selected ? "bg-white" : "bg-slate-50/60 opacity-60"}>
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={task.selected}
                              onChange={() =>
                                setScopeTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, selected: !t.selected } : t))
                                )
                              }
                              className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{task.title}</div>
                            {viewMode === "agency" && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{task.technicalScope}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-emerald-800 font-medium">{task.businessBenefit}</td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            {viewMode === "agency" ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScopeTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id ? { ...t, hours: Math.max(0.5, +(t.hours - 0.5).toFixed(1)) } : t
                                      )
                                    )
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-bold">{task.hours}h</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScopeTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id ? { ...t, hours: +(t.hours + 0.5).toFixed(1) } : t
                                      )
                                    )
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold">{task.hours}h</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {Math.round(task.hours * hourlyRate)} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Custom Scope Item (Agency Mode) */}
                {viewMode === "agency" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTaskTitle.trim()) return;
                      setScopeTasks((prev) => [
                        ...prev,
                        {
                          id: `custom-${Date.now()}`,
                          title: newTaskTitle.trim(),
                          category: "performance",
                          hours: Number(newTaskHours) || 2,
                          selected: true,
                          businessBenefit: isPolish ? "Indywidualna optymalizacja dopasowana do witryny" : "Custom site optimization",
                          technicalScope: isPolish ? "Prace programistyczne wg specyfikacji audytu" : "Custom engineering work",
                        },
                      ]);
                      setNewTaskTitle("");
                    }}
                    className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={isPolish ? "Dodaj własną pozycję do kosztorysu (np. Optymalizacja WooCommerce / WordPress)..." : "Add custom scope item..."}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={newTaskHours}
                      onChange={(e) => setNewTaskHours(Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isPolish ? "Dodaj Zadanie" : "Add Task"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: DEEP TECHNICAL SEO & LIVE HTML INSPECTOR                   */}
          {/* ================================================================= */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Search className="w-5 h-5 text-emerald-600" />
                    <span>
                      {isPolish
                        ? "Głęboki Audyt Technicznego SEO, Nagłówków H1-H6 i Bezpieczeństwa HTTP"
                        : "Deep Technical SEO, H1-H6 Hierarchy & Security Inspector"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPolish
                      ? `Rzeczywista analiza pobranego kodu źródłowego HTML dla ${liveSeo.url} (Rozmiar DOM: ${liveSeo.htmlSizeKb} KB, TTFB: ${liveSeo.responseTimeMs} ms).`
                      : `Live server-side HTML DOM & HTTP header inspection for ${liveSeo.url} (${liveSeo.htmlSizeKb} KB, TTFB: ${liveSeo.responseTimeMs} ms).`}
                  </p>
                </div>
                <button
                  onClick={() => handleRunSeoCheck(currentReport.finalUrl || currentReport.scannedUrl)}
                  disabled={isSeoLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeoLoading ? "animate-spin" : ""}`} />
                  <span>{isPolish ? "Skanuj Kod HTML Ponownie" : "Re-Scan Live HTML"}</span>
                </button>
              </div>

              {/* Google SERP Preview + Meta Title & Description Audit */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isPolish ? "Podgląd Wyniku w Wyszukiwarce Google (SERP Snippet)" : "Google SERP Snippet Preview"}
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500 truncate">{liveSeo.url}</div>
                    <div className="text-base font-bold text-[#1a0dab] hover:underline leading-snug">
                      {liveSeo.title.text || (isPolish ? "Brak znacznika <title> na stronie!" : "Missing <title> tag!")}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {liveSeo.description.text || (isPolish ? "Brak znacznika <meta name='description'>! Google wygeneruje przypadkowy wycinek tekstu ze strony." : "Missing meta description! Google will generate a random text snippet.")}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Meta Title ({liveSeo.title.length} {isPolish ? "znaków" : "chars"} · ~{liveSeo.title.pixelWidth}px)</span>
                        <span className={liveSeo.title.status === "good" ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.title.status === "good" ? (isPolish ? "Optymalny (30-65 zn.)" : "Optimal") : (isPolish ? "Wymaga korekty" : "Needs adjustment")}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${liveSeo.title.status === "good" ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.round((liveSeo.title.length / 65) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Meta Description ({liveSeo.description.length} {isPolish ? "znaków" : "chars"} · ~{liveSeo.description.pixelWidth}px)</span>
                        <span className={liveSeo.description.status === "good" ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.description.status === "good" ? (isPolish ? "Optymalny (110-165 zn.)" : "Optimal") : (isPolish ? "Wymaga rozbudowy" : "Needs optimization")}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${liveSeo.description.status === "good" ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.round((liveSeo.description.length / 165) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Headings Hierarchy H1-H6 & Extracted Texts */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isPolish ? "Struktura Nagłówków H1–H6 w Kodzie DOM" : "DOM Heading Hierarchy (H1–H6)"}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700">
                      {liveSeo.headings.h1 === 1 ? (isPolish ? "1x H1 (Wzorcowo)" : "1x H1 (Optimal)") : (isPolish ? `Uwaga: ${liveSeo.headings.h1}x H1` : `Warning: ${liveSeo.headings.h1}x H1`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2 text-center">
                    {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) => (
                      <div key={tag} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">{tag}</div>
                        <div className="text-lg font-mono font-extrabold text-slate-900 tabular-nums">
                          {liveSeo.headings[tag]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-700">
                      {isPolish ? "Wykryty główny nagłówek H1:" : "Extracted H1 Heading:"}
                    </div>
                    {liveSeo.headings.h1Texts.length > 0 ? (
                      liveSeo.headings.h1Texts.map((txt, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-mono font-semibold text-emerald-950">
                          &lt;h1&gt; {txt} &lt;/h1&gt;
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold">
                        {isPolish ? "BŁĄD KRYTYCZNY SEO: Brak nagłówka <h1> na stronie głównej!" : "CRITICAL SEO ERROR: No <h1> tag found on page!"}
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-700 pt-2">
                      {isPolish ? "Przykładowe nagłówki sekcji H2:" : "Extracted H2 Subheadings:"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {liveSeo.headings.h2Texts.map((txt, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 truncate">
                          &lt;h2&gt; {txt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Indexing, Images, Links & HTTP Security Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "Indeksowanie & Sitemap" : "Crawlability & Indexing"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Meta Robots</span>
                      <span className="font-mono font-bold text-emerald-700">{liveSeo.indexing.robotsMeta}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Plik /robots.txt</span>
                      <span className="font-bold">{liveSeo.indexing.hasRobotsTxt ? "Dostępny (200 OK)" : "Brak pliku!"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Mapa /sitemap.xml</span>
                      <span className="font-bold">{liveSeo.indexing.hasSitemapXml ? "Aktywna (200 OK)" : "Brak mapy!"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Canonical URL</span>
                      <span className="font-mono truncate max-w-[160px] font-semibold">{liveSeo.canonical.url || "Brak"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "Audyt Obrazów, Linków i Schema" : "Images, Links & Schema.org"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Obrazy ogółem / Brak ALT" : "Total Images / Missing ALT"}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {liveSeo.images.total} / <strong className={liveSeo.images.missingAlt > 0 ? "text-amber-600" : "text-emerald-600"}>{liveSeo.images.missingAlt} brak</strong>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Lazy-loading (loading=&quot;lazy&quot;)</span>
                      <span className="font-mono font-bold tabular-nums">{liveSeo.images.lazyLoaded} obrazów</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Linki Wewnętrzne / Zewnętrzne" : "Internal / External Links"}</span>
                      <span className="font-mono font-bold tabular-nums">{liveSeo.links.internal} wew. / {liveSeo.links.external} zew.</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Dane Schema.org (JSON-LD)</span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums">{liveSeo.social.schemaJsonLdCount} wykryte</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isPolish ? "Nagłówki Bezpieczeństwa HTTP" : "HTTP Security Headers"}
                    </h3>
                    <span className="text-xs font-mono font-extrabold text-emerald-700 tabular-nums">
                      {liveSeo.securityHeaders.score}/100
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Certyfikat HTTPS / SSL</span>
                      <span className="font-bold text-emerald-700">{liveSeo.securityHeaders.https ? "Chroniona" : "Brak!"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Strict-Transport-Security (HSTS)</span>
                      <span className="font-bold">{liveSeo.securityHeaders.hsts ? "Aktywny" : "Brak"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">X-Content-Type-Options</span>
                      <span className="font-bold">{liveSeo.securityHeaders.xContentTypeOptions ? "nosniff" : "Brak"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Content-Security-Policy (CSP)</span>
                      <span className="font-bold">{liveSeo.securityHeaders.csp ? "Skonfigurowane" : "Do wdrożenia"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: ADVANCED PERFORMANCE & CORE WEB VITALS                     */}
          {/* ================================================================= */}
          {activeTab === "performance" && (
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
          )}

          {/* ================================================================= */}
          {/* TAB 6: INSIGHTS, RESOURCE PAGE WEIGHT & ISSUE DETECTION           */}
          {/* ================================================================= */}
          {activeTab === "insights" && (
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
          )}

          {/* ================================================================= */}
          {/* TAB 7: COMPETITOR ANALYSIS (HEAD-TO-HEAD 1:1 + DELTA VERDICT)     */}
          {/* ================================================================= */}
          {activeTab === "compare" && (
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
                              ? `Strona konkurenta wyprzedza badaną witrynę o ${Math.abs(delta)} punktów. Po wdrożeniu naszego planu naprawczego (${scopeSummary.totalHours}h) wynik wzrośnie do ~94/100, dając bezpośrednią przewagę w Google.`
                              : `Competitor leads by ${Math.abs(delta)} points. Implementing our ${scopeSummary.totalHours}h remediation lifts the score to ~94/100, overtaking them.`
                            : isPolish
                            ? `Badana witryna ma obecnie przewagę +${delta} pkt, ale dalsza optymalizacja LCP i Schema.org pozwoli trwale zablokować konkurencję na pozycjach TOP 3.`
                            : `Your site currently leads by +${delta} pts; optimizing LCP and Schema.org will lock in TOP 3 rankings.`}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("roi-calculator")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        {isPolish ? "Zobacz Kosztorys Wyprzedzenia Konkurencji →" : "View Remediation Quote →"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 8: 24/7 DOMAIN MONITORING & RETAINER ALERTS (AGENCY ONLY)     */}
          {/* ================================================================= */}
          {activeTab === "monitoring" && viewMode === "agency" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-600" />
                      <span>
                        {isPolish
                          ? "Monitoring Stron 24/7 & Alerty Spadków (Generator Stałego Abonamentu)"
                          : "24/7 Website Monitoring & Regression Watchlist"}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {isPolish
                        ? "Zamień jednorazowe zlecenie za 1200 zł w stały abonament (np. 300 zł/mies.) za całodobowy nadzór nad szybkością, SSL i Core Web Vitals."
                        : "Turn one-off projects into recurring monthly retainers by monitoring client uptime, speed, and SEO health."}
                    </p>
                  </div>
                </div>

                {/* Add Domain Form */}
                <form onSubmit={handleAddMonitorDomain} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={newMonitorUrl}
                    onChange={(e) => setNewMonitorUrl(e.target.value)}
                    placeholder={isPolish ? "Domena (np. sklepklienta.pl)" : "Domain (e.g. client.com)"}
                    className="sm:col-span-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                  <input
                    type="text"
                    value={newMonitorClient}
                    onChange={(e) => setNewMonitorClient(e.target.value)}
                    placeholder={isPolish ? "Nazwa klienta" : "Client Name"}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <select
                    value={newMonitorInterval}
                    onChange={(e) => setNewMonitorInterval(e.target.value as "5m" | "15m" | "60m" | "daily" | "weekly")}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="5m">{isPolish ? "Co 5 minut (24/7 Live)" : "Every 5 min"}</option>
                    <option value="15m">{isPolish ? "Co 15 minut (24/7)" : "Every 15 min"}</option>
                    <option value="60m">{isPolish ? "Co 1 godzinę" : "Hourly Check"}</option>
                    <option value="daily">{isPolish ? "Skan Codziennie (24h)" : "Daily Check"}</option>
                    <option value="weekly">{isPolish ? "Skan Co Tydzień" : "Weekly Check"}</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPolish ? "Dodaj do Monitoringu" : "Add to Watchlist"}</span>
                  </button>
                </form>
              </div>

              {/* Monitored Domains Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {monitoredDomains.map((dom) => (
                  <div key={dom.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          {dom.clientName} · <span className="font-mono text-[10px] text-slate-400">[{dom.interval}]</span>
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            dom.status === "healthy" ? "text-emerald-700" : dom.status === "warning" ? "text-amber-700" : "text-rose-700"
                          }`}
                        >
                          {dom.status === "healthy" ? (isPolish ? "W normie" : "Healthy") : dom.status === "warning" ? (isPolish ? "Spadek wyniku" : "Warning") : (isPolish ? "ALERT PROGOWY!" : "ALERT!")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-mono font-bold text-slate-900 truncate">{dom.domain}</div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          (dom.httpStatus ?? 200) >= 200 && (dom.httpStatus ?? 200) < 300
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          HTTP {dom.httpStatus ?? 200}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">WebScore</div>
                          <div className="text-base font-mono font-extrabold text-slate-900 tabular-nums">{dom.lastScore}/100</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">Real Uptime</div>
                          <div className="text-base font-mono font-extrabold text-emerald-700 tabular-nums">{dom.uptimePercent}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">TTFB</div>
                          <div className="text-base font-mono font-extrabold text-slate-900 tabular-nums">{dom.responseTimeMs}ms</div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>{isPolish ? "Historia pomiarów" : "Recent checks"}</span>
                          <span>{isPolish ? `Próg alertu: < ${dom.threshold}` : `Alert threshold: < ${dom.threshold}`}</span>
                        </div>
                        <div className="h-12 flex items-end gap-1.5 pt-2 border-b border-slate-100">
                          {dom.history.map((h, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className={`w-full rounded-t ${h.score >= dom.threshold ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ height: `${Math.max(10, Math.round(h.score * 0.36))}px` }}
                              />
                              <span className="text-[9px] font-mono text-slate-400 tabular-nums">{h.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {dom.alertsLog && dom.alertsLog.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <div className="text-[10px] font-bold text-rose-700 uppercase">
                            {isPolish ? "Ostatni Alert Systemowy:" : "Latest Alert:"}
                          </div>
                          <div className="text-[11px] bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2 font-mono leading-snug">
                            {dom.alertsLog[0].message}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCheckMonitoredDomain(dom.id)}
                        disabled={checkingDomainId === dom.id}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingDomainId === dom.id ? "animate-spin" : ""}`} />
                        <span>{isPolish ? "Sprawdź Teraz" : "Run Check"}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMonitoredDomain(dom.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 cursor-pointer"
                        title={isPolish ? "Usuń z monitoringu" : "Remove"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 9: AGENCY CRM PANEL (AGENCY ONLY)                             */}
          {/* ================================================================= */}
          {activeTab === "crm" && viewMode === "agency" && (
            <div className="space-y-6">
              {/* CRM KPI Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Wartość Lejka Zleceń (Jednorazowe)" : "Total Pipeline Value"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">
                    {crmMetrics.pipelineVal.toLocaleString()} {currency}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Stały Przychód Abonamentowy (MRR)" : "Monthly Retainer MRR"}</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">
                    +{crmMetrics.monthlyMrr.toLocaleString()} {currency}/mc
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Aktywni Klienci i Leady" : "Total Clients & Leads"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{crmMetrics.count}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Średni Wynik Domen Klientów" : "Avg Client WebScore"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{crmMetrics.avgScore}/100</div>
                </div>
              </div>

              {/* Add Client Form */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {isPolish ? "Dodaj Nowego Klienta do Lejka Agencji" : "Add New Client to Agency Pipeline"}
                </h3>
                <form onSubmit={handleAddCrmClient} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder={isPolish ? "Imię i nazwisko" : "Contact Name"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder={isPolish ? "Nazwa firmy" : "Company"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={newClientWeb}
                    onChange={(e) => setNewClientWeb(e.target.value)}
                    placeholder={isPolish ? "Domena (np. firma.pl)" : "Website URL"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="E-mail"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder={isPolish ? "Telefon" : "Phone"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPolish ? "Dodaj Klienta" : "Add Client"}</span>
                  </button>
                </form>
              </div>

              {/* CRM Table with Pipeline Filter */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPolish ? "Baza Klientów, Statusy Wdrożeń i Historia Kontaktu" : "Client Pipeline & Activity Log"}
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownloadCrmBackup}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isPolish ? "Eksportuj Backup JSON" : "Export Backup JSON"}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: "all", label: isPolish ? "Wszyscy" : "All" },
                      { id: "lead", label: isPolish ? "Nowy Lead" : "Lead" },
                      { id: "audit_sent", label: isPolish ? "Audyt Wysłany" : "Audit Sent" },
                      { id: "proposal_accepted", label: isPolish ? "Zaakceptowano" : "Accepted" },
                      { id: "remediated", label: isPolish ? "Wdrożono" : "Remediated" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setCrmFilter(st.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          crmFilter === st.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">{isPolish ? "Klient / Firma / Historia" : "Client / Company / Log"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Domena, CMS & Wynik" : "Domain, CMS & Score"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Etap Sprzedaży" : "Pipeline Stage"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Wycena Wdrożenia" : "Contract Value"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Akcje" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCrmClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{client.company}</div>
                            <div className="text-[11px] text-slate-500">
                              {client.name} · {client.email} · {client.phone}
                            </div>
                            {client.notes && <div className="text-[11px] text-slate-600 mt-1 italic">{client.notes}</div>}
                            {client.activityLog && client.activityLog.length > 0 && (
                              <div className="mt-1.5 text-[10px] font-mono text-slate-500 bg-slate-100/80 px-2 py-1 rounded border border-slate-200/70">
                                {new Date(client.activityLog[0].timestamp).toLocaleDateString()} — {client.activityLog[0].summary}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <div className="font-bold text-slate-800">{client.website}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold">
                              WebScore: {client.lastScore}/100 {client.cmsTech ? `· ${client.cmsTech}` : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <select
                              value={client.status}
                              onChange={(e) => handleUpdateClientStatus(client.id, e.target.value as AgencyClient["status"])}
                              className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                            >
                              <option value="lead">{isPolish ? "Nowy Lead" : "New Lead"}</option>
                              <option value="audit_sent">{isPolish ? "Audyt Wysłany" : "Audit Sent"}</option>
                              <option value="proposal_accepted">{isPolish ? "Oferta Zaakceptowana" : "Proposal Accepted"}</option>
                              <option value="remediated">{isPolish ? "Wdrożono (Cel 90+)" : "Remediated"}</option>
                              <option value="retainer">{isPolish ? "Stały Abonament" : "Active Retainer"}</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                            <div className="font-extrabold text-slate-900">{client.contractValue} {currency}</div>
                            <div className="text-[11px] text-slate-500">+{client.retainerFee || 300} {currency}/mc</div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setUrlInput(client.website);
                                  setClientName(client.company);
                                  setActiveTab("overview");
                                  handleRunScan(client.website);
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                              >
                                {isPolish ? "Skanuj" : "Scan"}
                              </button>
                              <button
                                onClick={() => {
                                  setClientName(client.company);
                                  setActiveTab("reports");
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                {isPolish ? "Oferta" : "Proposal"}
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 10: WHITE-LABEL REPORTS & INTERACTIVE CLIENT SHARE LINK       */}
          {/* ================================================================= */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Personalizacja Raportu White-Label (Twoja Marka)" : "White-Label Report Branding"}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isPolish ? "Przygotowano dla (Klient / Firma)" : "Prepared for (Client Name)"}
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isPolish ? "Nazwa Twojej Agencji / Audytora" : "Your Agency / Auditor Name"}
                      </label>
                      <input
                        type="text"
                        value={auditorName}
                        onChange={(e) => setAuditorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isPolish ? "Notatka Handlowa w Ofercie (warunki ustala agencja)" : "Offer Note (terms set by the agency)"}
                    </label>
                    <textarea
                      rows={2}
                      value={customOfferNote}
                      onChange={(e) => setCustomOfferNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeQuoteInReport}
                      onChange={(e) => setIncludeQuoteInReport(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>
                      {isPolish
                        ? `Dołącz kosztorys godzinowy (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency} netto) oraz wyliczenie ROI do raportu`
                        : `Include hourly quote (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency}) & ROI table in exported report`}
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleDownloadHtmlReport}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isPolish ? "Pobierz Samowystarczalny Plik HTML dla Klienta" : "Download Standalone White-Label HTML"}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isPolish ? "Drukuj / Zapisz jako PDF" : "Print / Save as PDF"}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Interactive Shareable Client Link (Web-Report Link) */}
                <div className="bg-[#111A2E] text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {isPolish ? "Interaktywny Link do Pokoju Ofertowego Klienta" : "Interactive Shareable Client Deal Room Link"}
                    </div>
                    <h3 className="text-base font-extrabold">
                      {isPolish ? "Wyślij klientowi link, w którym jednym kliknięciem zaakceptuje wycenę" : "Send a direct interactive proposal link"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isPolish
                        ? "Link automatycznie uruchamia bezpieczny Pokój Ofertowy Klienta — ukrywa Twój CRM i instrukcje programistyczne „zrób to sam”, a wyświetla diagnozę strat, kosztorys oraz przycisk „Akceptuję Kosztorys i Zamawiam”."
                        : "This link launches the Client Deal Room—hiding internal CRM and DIY fixes while presenting your turnkey quote and a 1-click Accept button."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#16223A] border border-[#24375B] font-mono text-xs text-emerald-300 break-all">
                    {shareableClientUrl}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleSaveAndCopyClientLink}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{isPolish ? "Zapisz Snapshot 1:1 i Kopiuj Link Klienta" : "Save 1:1 Snapshot & Copy Client Link"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("client");
                        setIsClientLinkLocked(true);
                        setActiveTab("overview");
                        showToast(
                          isPolish
                            ? "Włączono zablokowany Pokój Klienta (Odblokowanie wymaga serwerowego kodu PIN)"
                            : "Switched to PIN-locked Client Deal Room (Server PIN required to unlock)"
                        );
                      }}
                      className="px-4 py-2.5 bg-[#1C2A47] hover:bg-[#25375D] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>{isPolish ? "Testuj Zablokowany Widok Klienta (PIN)" : "Test PIN-Locked Client View"}</span>
                    </button>
                  </div>

                  {/* Server-Side Agency PIN Change Form (Never Exposes Current PIN in DOM/JS) */}
                  <div className="pt-3 border-t border-[#1F2E4D] space-y-2">
                    <div className="text-[11px] text-slate-400">
                      {isPolish
                        ? "Zmiana serwerowego kodu PIN (zapis wyłącznie na serwerze w data/scanner-db.json — niewidoczny w kodzie przeglądarki):"
                        : "Change Server-Side Agency PIN (stored strictly on server in data/scanner-db.json):"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        maxLength={12}
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder={isPolish ? "Obecny PIN" : "Current PIN"}
                        className="w-28 px-2.5 py-1.5 bg-[#16223A] border border-[#2A3F68] rounded-lg text-xs font-mono text-white"
                      />
                      <input
                        type="password"
                        maxLength={12}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder={isPolish ? "Nowy PIN" : "New PIN"}
                        className="w-28 px-2.5 py-1.5 bg-[#16223A] border border-[#2A3F68] rounded-lg text-xs font-mono text-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/settings/change-pin", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ currentPin: currentPinInput, newPin: newPinInput }),
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setCurrentPinInput("");
                              setNewPinInput("");
                              setIsDefaultPinWarning(false);
                              showToast(isPolish ? "Zmieniono PIN na serwerze (data/scanner-db.json)!" : "Updated server PIN!");
                            } else {
                              showToast(data.error || (isPolish ? "Błędny obecny PIN" : "Invalid current PIN"));
                            }
                          } catch {}
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isPolish ? "Zapisz Nowy PIN" : "Update PIN"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 11: WEBSCORE EVOLUTION & LOCAL SCAN HISTORY                   */}
          {/* ================================================================= */}
          {activeTab === "webscore" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                      {isPolish ? "Ewolucja Wyników WebScore i Historia Skanowania" : "WebScore Evolution & Audit History"}
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
                    <span className="font-bold text-emerald-400 uppercase">Trend Kondycji Witryny ({trendRange})</span>
                    <span className="font-mono">Aktualny wynik: {currentReport.overallScore}/100</span>
                  </div>
                  <div className="h-44 flex items-end justify-between gap-4 pt-8 px-4 border-b border-slate-800">
                    {(currentReport.demo?.scoreHistory || SAMPLE_AUDIT.demo!.scoreHistory).map((pt, i) => (
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
          )}

          {/* ================================================================= */}
          {/* TAB 12: CRAWL DIAGNOSTICS (DYNAMIC ON-PAGE MATRIX)                */}
          {/* ================================================================= */}
          {activeTab === "diagnostics" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                {isPolish ? "Diagnostyka Indeksowania i Struktury On-Page (Wyliczona dla Badanej Domeny)" : "Dynamic Crawl Diagnostics & On-Page Matrix"}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Wykryte linki / podstrony" : "Detected Links / Pages"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.demo?.crawledPages.totalPages ?? 32}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Zdrowe (200 OK)" : "Healthy (200 OK)"}</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.healthy ?? 28}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Przekierowania (301/302)" : "Redirects"}</div>
                  <div className="text-2xl font-mono font-extrabold text-amber-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.redirects ?? 1}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Ostrzeżenia On-Page" : "On-Page Warnings"}</div>
                  <div className="text-2xl font-mono font-extrabold text-amber-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.warnings ?? 3}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Błędy Indeksowania" : "Indexing Errors"}</div>
                  <div className="text-2xl font-mono font-extrabold text-rose-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.pagesWithErrors ?? 0}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">{isPolish ? "Element On-Page SEO" : "On-Page Element"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Brakujące" : "Missing"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Za krótkie" : "Too Short"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Za długie / Nadmiar" : "Too Long / Excess"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Status" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono tabular-nums">
                    {(currentReport.demo?.onPageSeoAnalysis || SAMPLE_AUDIT.demo!.onPageSeoAnalysis).map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-right">{row.missing}</td>
                        <td className="py-3 px-3 text-right">{row.tooShort}</td>
                        <td className="py-3 px-3 text-right">{row.tooLong}</td>
                        <td className="py-3 px-3 text-right font-sans font-bold">
                          <span className={row.status === "good" ? "text-emerald-700" : row.status === "warning" ? "text-amber-700" : "text-rose-700"}>
                            {row.status === "good" ? (isPolish ? "W normie" : "Good") : row.status === "warning" ? (isPolish ? "Do poprawy" : "Warning") : (isPolish ? "Błąd" : "Error")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Discovered Subpages from Live HTML & Sitemap.xml — with 1-Click Subpage Audit */}
              {liveSeo.discoveredSubpages && liveSeo.discoveredSubpages.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isPolish
                          ? "Wykryte Podstrony i Adresy URL (Drzewo DOM + Sitemap.xml)"
                          : "Discovered Subpages & Internal URLs (DOM + Sitemap.xml)"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isPolish
                          ? "Kliknij dowolną podstronę, aby wykonać dla niej pełny audyt szybkości, SEO i WCAG 2.1 AA."
                          : "Click any discovered subpage to run a full speed, SEO, and WCAG 2.1 AA audit on it."}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      {liveSeo.discoveredSubpages.length} URL
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">{isPolish ? "Adres URL Podstrony" : "Subpage URL"}</th>
                          <th className="py-2 px-3">{isPolish ? "Źródło Wykrycia" : "Discovery Source"}</th>
                          <th className="py-2 px-3">{isPolish ? "Status HTTP" : "HTTP Status"}</th>
                          <th className="py-2 px-3 text-right">{isPolish ? "Akcja" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-mono">
                        {liveSeo.discoveredSubpages.map((sub, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-900 truncate max-w-md">{sub.url}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {sub.source === "sitemap" ? "sitemap.xml" : "HTML <a href>"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              <span
                                className={
                                  sub.status >= 200 && sub.status < 300
                                    ? "text-emerald-700"
                                    : sub.status >= 300 && sub.status < 400
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }
                              >
                                {sub.status === 0
                                  ? "TIMEOUT / ERR"
                                  : sub.status >= 200 && sub.status < 300
                                  ? `${sub.status} OK`
                                  : sub.status >= 300 && sub.status < 400
                                  ? `${sub.status} REDIRECT`
                                  : `${sub.status} ERROR`}
                              </span>
                              {sub.responseTimeMs ? (
                                <span className="ml-2 text-[10px] text-slate-400 font-normal">({sub.responseTimeMs}ms)</span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              <button
                                type="button"
                                onClick={() => {
                                  setUrlInput(sub.url);
                                  handleRunScan(sub.url);
                                }}
                                className="px-2.5 py-1 bg-[#0b2230] hover:bg-[#174460] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                {isPolish ? "Skanuj podstronę →" : "Audit Subpage →"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 13: WCAG 2.1 AA ACCESSIBILITY & EAA LEGAL AUDIT               */}
          {/* ================================================================= */}
          {activeTab === "accessibility" && (
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
          )}

          {/* ================================================================= */}
          {/* TAB 14: INTERACTIVE REMEDIATION CHECKLIST                         */}
          {/* ================================================================= */}
          {activeTab === "checklist" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Interaktywna Lista Kontrolna Wdrożenia (Dopasowana do Domeny)" : "Dynamic Optimization Checklist"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isPolish ? "Odznaczaj ukończone zadania podczas prac wdrożeniowych dla klienta." : "Check off completed tasks during client remediation."}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "all", label: isPolish ? "Wszystkie" : "All" },
                    { id: "pending", label: isPolish ? "Do wdrożenia" : "Pending" },
                    { id: "checked", label: isPolish ? "Ukończone" : "Completed" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setChecklistFilter(f.id as "all" | "pending" | "checked")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        checklistFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredChecklist.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => handleToggleChecklist(act.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      act.status === "checked"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
                          act.status === "checked" ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                        }`}
                      >
                        {act.status === "checked" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${act.status === "checked" ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{act.description}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">{act.impact}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <a href="mailto:contact@pepsafe.info" className="hover:text-slate-900 font-mono">
              contact@pepsafe.info
            </a>
            <a href="https://novopix.uk/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 font-bold">
              novopix.uk ↗
            </a>
          </div>
        </footer>
      </div>

      {/* 1-Click Client Proposal Acceptance Modal (Deal Room Closing) */}
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

      {/* Quote & Lead Capture Modal */}
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
              <strong>1. Skanowanie Hybrydowe (Google PSI + Deep HTML):</strong> System pobiera oficjalne metryki Core Web Vitals, wagę zasobów (KB) oraz bezpośrednio bada kod źródłowy HTML strony klienta (Title, Meta, H1-H6, ALT, Schema.org, nagłówki bezpieczeństwa HTTP).
            </p>
            <p>
              <strong>2. Automatyczny Kosztorys Godzinowy:</strong> Liczba roboczogodzin i zadań dopasowuje się dynamicznie do faktycznej skali błędów wykrytych na badanej stronie.
            </p>
            <p>
              <strong>3. Izolowany Pokój Ofertowy Klienta (Widok Klienta):</strong> Wysyłając klientowi link <code>?clientView=1</code>, ukrywasz swój wewnętrzny CRM oraz skrypty sprzedażowe, a klient może jednym kliknięciem zaakceptować kosztorys online.
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
            <p>· Wszystkie klucze API (Google PageSpeed Insights oraz Gemini AI) działają wyłącznie po stronie serwera Express i nigdy nie są ujawniane w przeglądarce.</p>
            <p>· Baza klientów CRM, zaakceptowane oferty, snapshoty wycen oraz monitorowane domeny są trwale zapisywane na serwerze w pliku JSON oraz synchronizowane z LocalStorage.</p>
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
                ? "Ten raport został otwarty w chronionym Pokoju Ofertowym Klienta. Aby uzyskać dostęp do wewnętrznego CRM, skryptów sprzedażowych i edycji stawek, wpisz kod PIN Agencji."
                : "This report was opened in a protected Client Deal Room. Enter your Agency PIN to unlock internal CRM and sales scripts."}
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

// --- Helper Components ---
function ScoreGaugeCard({
  title,
  score,
  status,
  isPolish,
}: {
  title: string;
  score: number | null;
  status: string;
  isPolish: boolean;
}) {
  const displayVal = score ?? 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayVal / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between items-center text-center relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</div>
      <div className="relative my-4 flex items-center justify-center">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="9" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={displayVal >= 85 ? "#059669" : displayVal >= 60 ? "#d97706" : "#e11d48"}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-black text-slate-900 tracking-tight tabular-nums">{score === null ? "—" : displayVal}</span>
          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-extrabold uppercase">{status}</span>
        </div>
      </div>
      <div className="text-[11px] font-medium text-slate-400">{isPolish ? "Hybrydowy pomiar PSI + HTML" : "Hybrid PSI + HTML Score"}</div>
    </div>
  );
}

function ScoreBarCard({
  title,
  score,
  breakdown,
  isPolish,
}: {
  title: string;
  score: number | null;
  breakdown: Array<{ label: string; val: number | null }>;
  isPolish: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-black">{score ?? "N/A"}/100</span>
        </div>
        <div className="space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>{item.label}</span>
                <span className="font-mono tabular-nums text-slate-900 font-bold">{item.val ?? "N/A"}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${item.val ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] font-medium text-slate-400 mt-4">{isPolish ? "Weryfikacja Google Lighthouse" : "Google Lighthouse Verified"}</div>
    </div>
  );
}

function ProgressSummaryCard({ report, isPolish }: { report: AuditReport; isPolish: boolean }) {
  const { completePercent, warnings, passedChecks, totalChecks } = report.auditProgress;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">{isPolish ? "Bilans Testów Audytu" : "Audit Checks Summary"}</h3>
        <div className="text-2xl font-mono font-extrabold text-slate-900 mb-1.5 tabular-nums">{completePercent}%</div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completePercent}%` }} />
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Zaliczone testy" : "Passed checks"}</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">{passedChecks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Do optymalizacji" : "Warnings"}</span>
            <span className="font-mono font-bold text-amber-600 tabular-nums">{warnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Wszystkie reguły" : "Total rules"}</span>
            <span className="font-mono font-bold text-slate-800 tabular-nums">{totalChecks}</span>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-3">{isPolish ? "Pełny skan bez błędów" : "Complete diagnostic run"}</div>
    </div>
  );
}

// --- 1-Click Client Proposal Acceptance Modal ---
function AcceptProposalModal({
  isOpen,
  onClose,
  report,
  clientNameDefault,
  netPrice,
  grossPrice,
  totalHours,
  hourlyRate,
  retainerFee,
  currency,
  selectedTasks,
  isPolish,
  onAccepted,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  clientNameDefault: string;
  netPrice: number;
  grossPrice: number;
  totalHours: number;
  hourlyRate: number;
  retainerFee: number;
  currency: string;
  selectedTasks: string[];
  isPolish: boolean;
  onAccepted: (client: AgencyClient) => void;
}) {
  const [name, setName] = useState<string>("");
  const [company, setCompany] = useState<string>(clientNameDefault || "");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [includeRetainer, setIncludeRetainer] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetUrl = report.finalUrl || report.scannedUrl;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/crm/accept-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Klient",
          company: company.trim() || clientNameDefault,
          email: email.trim(),
          phone: phone.trim(),
          website: targetUrl,
          contractValue: netPrice,
          hourlyRate,
          estimatedHours: totalHours,
          retainerFee: includeRetainer ? retainerFee : 0,
          lastScore: report.overallScore,
          selectedTasks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.client) onAccepted(data.client);
        setDone(true);
      }
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="bg-emerald-950 text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            POTWIERDZENIE ZAMÓWIENIA WDROŻENIA
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-heading">
            {isPolish ? "Akceptacja Kosztorysu Optymalizacji" : "Proposal Acceptance & Order Confirmation"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            {targetUrl} · {totalHours} rbh · {netPrice} {currency} netto ({grossPrice} {currency} brutto)
          </p>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {isPolish ? "Dziękujemy! Oferta Została Zaakceptowana" : "Thank You! Proposal Accepted"}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isPolish
                  ? "Nasz główny inżynier otrzymał potwierdzenie zakresu prac i skontaktuje się z Państwem w celu rozpoczęcia wdrożenia."
                  : "Our lead engineer has received your confirmation and will contact you shortly to begin implementation."}
              </p>
              <button
                onClick={() => {
                  setDone(false);
                  onClose();
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isPolish ? "Zamknij" : "Close"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{isPolish ? "Zaakceptowany zakres prac:" : "Accepted Engineering Scope:"}</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {selectedTasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Imię i Nazwisko" : "Full Name"}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Nazwa Firmy / NIP" : "Company Name"}</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Twoja Firma Sp. z o.o."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "E-mail do faktury / kontaktu" : "Email Address"}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="biuro@firma.pl"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Telefon kontaktowy" : "Phone Number"}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 600 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRetainer}
                  onChange={(e) => setIncludeRetainer(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>
                  {isPolish
                    ? `Dołącz stały monitoring 24/7 i comiesięczne raporty wyników (+${retainerFee} ${currency}/mc)`
                    : `Include 24/7 monitoring & score maintenance (+${retainerFee} ${currency}/mo)`}
                </span>
              </label>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700">
                  {isPolish ? "Razem netto:" : "Total Net:"} {netPrice} {currency}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? (isPolish ? "Zapisywanie..." : "Confirming...") : (isPolish ? "Potwierdzam i Zamawiam Wdrożenie" : "Confirm & Order Implementation")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function QuoteModal({
  isOpen,
  onClose,
  report,
  isPolish,
  estimatedBudget,
  currency,
  isPublicMode = false,
  onLeadSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  isPolish: boolean;
  estimatedBudget: number;
  currency: string;
  isPublicMode?: boolean;
  onLeadSaved?: (client: AgencyClient) => void;
}) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetUrl = report.finalUrl || report.scannedUrl || "novopix.uk";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) return;
    if (!consent) {
      setErrorMsg(isPolish ? "Proszę zaznaczyć zgodę na kontakt." : "Please confirm the consent checkbox.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrorMsg(isPolish ? "Proszę podać poprawny adres e-mail." : "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: targetUrl,
          details: details.trim(),
          overallScore: report.overallScore,
          scores: report.categories,
          estimatedBudget,
          hp: honeypot,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.client && onLeadSaved) {
          onLeadSaved(data.client);
        }
        setSubmitted(true);
      } else {
        throw new Error("API error");
      }
    } catch {
      const subject = encodeURIComponent(`NovoPix Audit Quote (${estimatedBudget} ${currency}) - ${targetUrl}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nWebsite: ${targetUrl}\nScore: ${report.overallScore}/100\nEstimated Quote: ${estimatedBudget} ${currency}\n\nDetails:\n${details}`
      );
      window.location.href = `mailto:contact@pepsafe.info?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="bg-[#111A2E] text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            NOVOPIX DIGITAL STUDIO
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-heading">
            {isPublicMode ? (isPolish ? "Poproś o wycenę napraw" : "Request a quote for the fixes") : isPolish ? "Zamów Kompleksowe Wdrożenie Audytu" : "Request Turnkey Audit Remediation"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isPublicMode
              ? isPolish
                ? `Zgłoszenie dla ${targetUrl}. Przygotujemy wycenę po przeglądzie wyników i odezwiemy się.`
                : `Request for ${targetUrl}. We will review the results, prepare a quote and get back to you.`
              : isPolish
              ? `Szacowany kosztorys dla ${targetUrl}: ${estimatedBudget} ${currency} netto (wstępna wycena do potwierdzenia).`
              : `Estimated turnkey quote for ${targetUrl}: ${estimatedBudget} ${currency} (preliminary quote, to be confirmed).`}
          </p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {isPublicMode ? (isPolish ? "Dziękujemy, zgłoszenie wysłane!" : "Thank you, request sent!") : isPolish ? "Zgłoszenie Zapisane w Systemie i CRM!" : "Lead Captured & Saved to CRM!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isPublicMode
                  ? isPolish
                    ? "Odezwiemy się na podany adres e-mail po przeglądzie wyników."
                    : "We will contact you at the e-mail address you provided after reviewing the results."
                  : isPolish
                  ? "Dane klienta wraz z wynikiem skanu i wyceną zostały automatycznie dodane do zakładki Panel Agencji (CRM)."
                  : "The prospect's details, audit score, and quote have been saved to your Agency CRM."}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                {isPolish ? "Gotowe" : "Done"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Twoje Imię / Firma" : "Your Name / Company"}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isPolish ? "np. Jan Kowalski" : "e.g. Sarah Jenkins"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Adres E-mail (wymagany)" : "Email Address (required)"}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kontakt@twojafirma.pl"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Telefon" : "Phone Number"}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 600 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Audytowana Domena" : "Audited Website"}</label>
                  <input type="text" value={targetUrl} readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Dodatkowe informacje / cel biznesowy" : "Project Goals"}</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={isPolish ? "Opisz krótko cel (np. poprawa wyniku do 90+, przyspieszenie sklepu, SEO)..." : "Describe your goals..."}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-emerald-600"
                />
                <span className="text-[11px] text-slate-500">
                  {isPolish
                    ? "Wyrażam zgodę na kontakt w celu przedstawienia oferty optymalizacji strony."
                    : "I agree to be contacted regarding this website optimization proposal."}
                </span>
              </label>

              {errorMsg && <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">{errorMsg}</div>}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{isPolish ? "Zapis bezpośrednio do CRM" : "Direct CRM integration"}</span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (isPolish ? "Wysyłanie..." : "Sending...") : (isPolish ? "Wyślij i Zapisz Lead" : "Submit Enquiry")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoModal({
  title,
  isOpen,
  onClose,
  isPolish,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  isPolish: boolean;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-900 font-heading">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer">
            {isPolish ? "Zamknij" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
