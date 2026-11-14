export interface CoreWebVitalMetric {
  id: string;
  name: string;
  acronym: string;
  target: string;
  description: string;
  displayValue: string;
  score: number | null;
  status: "good" | "needs-improvement" | "poor" | "unavailable";
  numericVal: number | null;
}

export interface IssueItem {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  priority: "high" | "medium" | "low";
  category: "performance" | "seo" | "accessibility" | "best-practices";
  savings?: string;
  savingsMs?: number;
  estimatedHours?: number;
  businessImpact?: string;
  developerFix?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  category: string;
  status: "pending" | "checked";
  priority: "high" | "medium" | "low";
  impact: string;
  description: string;
  estimatedHours?: number;
}

export interface LiveSeoInspection {
  url: string;
  isLiveFetch?: boolean;
  error?: string;
  responseTimeMs: number;
  redirectCount?: number;
  redirectChain?: string[];
  htmlSizeKb: number;
  https: boolean;
  htmlLang: string | null;
  viewport: string | null;
  cmsTech?: string;
  techStack?: string[];
  complexityMultiplier?: number;
  scriptStats?: {
    totalScripts: number;
    renderBlockingScripts: number;
    stylesheets: number;
  };
  hreflangs?: string[];
  title: {
    text: string | null;
    length: number;
    pixelWidth: number;
    status: "good" | "warning" | "error";
  };
  description: {
    text: string | null;
    length: number;
    pixelWidth: number;
    status: "good" | "warning" | "error";
  };
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    h1Texts: string[];
    h2Texts: string[];
    status: "good" | "warning" | "error";
  };
  canonical: {
    url: string | null;
    isSelf: boolean;
    status: "good" | "warning" | "error";
  };
  indexing: {
    robotsMeta: string;
    hasRobotsTxt: boolean;
    hasSitemapXml: boolean;
    status: "good" | "warning" | "error";
  };
  images: {
    total: number;
    missingAlt: number;
    lazyLoaded: number;
    status: "good" | "warning" | "error";
  };
  links: {
    internal: number;
    external: number;
    total: number;
  };
  social: {
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterCard: string | null;
    schemaJsonLdCount: number;
    status: "good" | "warning" | "error";
  };
  securityHeaders: {
    https: boolean;
    hsts: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    csp: boolean;
    score: number;
  };
  discoveredSubpages?: Array<{
    url: string;
    status: number;
    source: "html" | "sitemap";
    responseTimeMs?: number;
    redirected?: boolean;
  }>;
}

export interface AiAdvisorData {
  summary: string;
  businessLossAnalysis: string;
  topOpportunities: Array<{
    title: string;
    impact: string;
    action: string;
    estimatedHours: number;
    roiLift: string;
  }>;
  remediationPlan: Array<{
    step: number;
    title: string;
    desc: string;
  }>;
  salesScripts: {
    coldEmail: string;
    phonePitch: string;
    objectionHandler: string;
  };
  clientPitch: string;
  estimatedRoi: string;
}

export interface ScopeTaskItem {
  id: string;
  title: string;
  category: "performance" | "seo" | "accessibility" | "security";
  hours: number;
  selected: boolean;
  businessBenefit: string;
  technicalScope: string;
}

export interface ClientActivityEntry {
  id: string;
  timestamp: string;
  type: "audit" | "proposal_sent" | "proposal_accepted" | "status_change" | "note";
  summary: string;
}

import type { ClientStage, ScanSnapshot } from "./agencyTypes";

export interface AgencyClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStage;
  lastScan?: ScanSnapshot;
  source?: string;
  contractValue: number;
  hourlyRate: number;
  estimatedHours: number;
  retainerFee: number;
  addedAt: string;
  lastScore: number;
  notes: string;
  cmsTech?: string;
  activityLog?: ClientActivityEntry[];
  language?: "pl" | "en";
  leadLang?: "pl" | "en";
  beforeAfter?: { status: "draft" | "approved"; language?: "pl" | "en"; approvedBy?: string; approvedAt?: string; sentAt?: string; sentTo?: string };
}

export interface MonitoringAlertEntry {
  id: string;
  timestamp: string;
  type: "downtime" | "slow_response" | "score_drop" | "psi_drop" | "recovered";
  message: string;
  httpStatus?: number;
  responseTimeMs?: number;
  seen?: boolean;
  emailed?: "sent" | "not_configured" | "failed";
}

export interface MonitoredDomain {
  id: string;
  domain: string;
  clientName: string;
  interval: "5m" | "15m" | "60m" | "daily" | "weekly";
  threshold: number;
  lastCheck: string;
  lastScore: number;
  performanceScore: number;
  seoScore: number;
  uptimePercent: number;
  responseTimeMs: number;
  httpStatus?: number;
  totalChecks?: number;
  successfulChecks?: number;
  status: "healthy" | "warning" | "alert";
  history: Array<{ date: string; score: number; responseMs: number; httpStatus?: number; ok?: boolean }>;
  alertsLog?: MonitoringAlertEntry[];
  psi?: {
    at: string;
    status: "live_lighthouse" | "unavailable";
    overall: number | null;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    error?: string;
  };
  clientId?: string;
}

export interface PageWeightBreakdown {
  totalKb: number;
  requestCount: number;
  jsKb: number;
  imagesKb: number;
  cssKb: number;
  fontsKb: number;
  serverResponseMs: number;
  thirdPartyBlockingMs: number;
}

export interface AuditReport {
  id: string;
  i18n?: Record<string, string>;
  // Identyfikator wyniku zmierzonego przez serwer (powiązanie zgłoszeń, raportu PDF i linku publicznego).
  scanId?: string;
  isSample: boolean;
  scannedUrl: string;
  finalUrl: string;
  scannedAt: string;
  cachedAt?: number;
  measurementStatus?: "live_lighthouse" | "partial_html" | "demo_sample" | "failed";
  measurementNote?: string;
  livePsiVerified?: boolean;
  overallScore: number | null;
  overallLabel: string;
  categories: {
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
  };
  seoBreakdown: {
    crawlability: number | null;
    onPageSeo: number | null;
    mobileFriendly: number | null;
  };
  accessibilityBreakdown: {
    contrast: number | null;
    navigation: number | null;
    names: number | null;
    aria: number | null;
  };
  deviceScores: {
    mobile: number | null;
    desktop: number | null;
    https: boolean;
  };
  pageWeight?: PageWeightBreakdown;
  coreWebVitals: {
    lcp: CoreWebVitalMetric;
    inp: CoreWebVitalMetric;
    cls: CoreWebVitalMetric;
    fcp: CoreWebVitalMetric;
    tbt: CoreWebVitalMetric;
  };
  auditProgress: {
    completePercent: number;
    warnings: number;
    passedChecks: number;
    criticalIssues: number;
    totalChecks: number;
  };
  issues: IssueItem[];
  recommendedActions: ActionItem[];
  screenshot?: string;
  visual?: import("./utils/visualTypes").VisualData | null;
  demo?: {
    crawledPages: {
      totalPages: number;
      healthy: number;
      redirects: number;
      warnings: number;
      siteIssues: number;
      pagesWithErrors: number;
    };
    onPageSeoAnalysis: Array<{
      id: string;
      name: string;
      missing: number;
      tooShort: number;
      tooLong: number;
      duplicates: number;
      status: "good" | "warning" | "error";
    }>;
    scoreHistory: Array<{ date: string; overall: number; performance: number; seo: number; accessibility: number }>;
  };
}

export const DEFAULT_SCOPE_TASKS: ScopeTaskItem[] = [
  {
    id: "task-lcp",
    title: "Optymalizacja LCP i konwersja obrazów do nowoczesnego formatu WebP",
    category: "performance",
    hours: 3.0,
    selected: true,
    businessBenefit: "Szybsze wyświetlenie głównej sekcji oferty na telefonach, mniejsza utrata odwiedzających",
    technicalScope: "Konwersja PNG/JPEG do formatu WebP, preload zasobów Hero, fetchpriority='high', rozmiary responsywne srcset.",
  },
  {
    id: "task-js",
    title: "Odblokowanie wątku głównego JS/CSS i redukcja TBT",
    category: "performance",
    hours: 3.0,
    selected: true,
    businessBenefit: "Płynne działanie formularzy i koszyka, szybsza reakcja interfejsu na kliknięcia",
    technicalScope: "Wydzielenie Critical CSS, odroczenie skryptów zewnętrznych (defer/async), usunięcie nieużywanych bibliotek JS.",
  },
  {
    id: "task-seo",
    title: "Przebudowa struktury H1-H6, Meta Tagów i Schema.org JSON-LD",
    category: "seo",
    hours: 2.5,
    selected: true,
    businessBenefit: "Poprawa indeksowalności i czytelniejsza prezentacja w wynikach wyszukiwania Google (Rich Snippets)",
    technicalScope: "Unikalne Title (50-60 zn.) i Meta Description (140-160 zn.), hierarchia H1-H3, dane strukturalne JSON-LD, canonical.",
  },
  {
    id: "task-wcag",
    title: "Audyt i poprawki dostępności zgodnie z kryteriami WCAG 2.1 AA",
    category: "accessibility",
    hours: 1.5,
    selected: true,
    businessBenefit: "Poprawa dostępności dla czytników ekranu oraz lepsza indeksacja w Google Grafika",
    technicalScope: "Poprawa kontrastu tekstów do min. 4.5:1, uzupełnienie atrybutów alt na grafikach oraz aria-label na przyciskach.",
  },
  {
    id: "task-sec",
    title: "Konfiguracja nagłówków bezpieczeństwa HTTP (HSTS, CSP, X-Frame) i Cache",
    category: "security",
    hours: 1.5,
    selected: false,
    businessBenefit: "Ochrona przed atakami XSS/Clickjacking oraz testy regresji przed i po wdrożeniu",
    technicalScope: "Wdrożenie nagłówków Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options oraz Brotli/Cache-Control.",
  },
];

// Dynamically calculates scope tasks, checklist, and on-page diagnostics from actual scanned domain data
// Incorporates CMS complexity, image count, JS payload, subpages, and QA testing hours
export function buildDynamicAuditArtifacts(
  report: AuditReport,
  seo: LiveSeoInspection,
  isPolish: boolean
): {
  dynamicScopeTasks: ScopeTaskItem[];
  dynamicActions: ActionItem[];
  dynamicOnPageMatrix: NonNullable<AuditReport["demo"]>["onPageSeoAnalysis"];
  dynamicCrawledPages: NonNullable<AuditReport["demo"]>["crawledPages"];
} {
  const perf = report.categories.performance ?? 72;
  const accessScore = report.categories.accessibility ?? 82;
  const cmsMultiplier = seo.complexityMultiplier ?? 1.0;
  const imgCount = seo.images.total || 0;
  const blockingScripts = seo.scriptStats?.renderBlockingScripts ?? 0;
  const jsWeightKb = report.pageWeight?.jsKb ?? 0;

  // Multi-factor engineering hours calculation (CMS + Image volume + JS weight + Issue count + QA)
  const baseLcpHours = perf < 60 ? 3.5 : perf < 82 ? 2.5 : 1.5;
  const imgVolumeBonus = imgCount > 25 ? 1.5 : imgCount > 12 ? 0.5 : 0;
  const lcpHours = Math.round((baseLcpHours + imgVolumeBonus) * cmsMultiplier * 2) / 2;

  const baseJsHours = perf < 60 ? 3.5 : perf < 82 ? 2.0 : 1.0;
  const jsComplexityBonus = (blockingScripts > 3 ? 1.0 : 0) + (jsWeightKb > 450 ? 1.0 : 0);
  const jsHours = Math.round((baseJsHours + jsComplexityBonus) * cmsMultiplier * 2) / 2;

  const baseSeoHours =
    seo.headings.h1 !== 1 || seo.description.status !== "good" || seo.social.schemaJsonLdCount === 0 ? 2.5 : 1.5;
  const subpageBonus = (seo.links.internal || 0) > 20 ? 1.0 : 0;
  const seoHours = Math.round((baseSeoHours + subpageBonus) * 2) / 2;

  const wcagHours =
    Math.round(((seo.images.missingAlt > 3 || accessScore < 85 ? 2.0 : 1.0) + (seo.images.missingAlt > 10 ? 1.0 : 0)) * 2) / 2;

  const secAndQaHours = seo.securityHeaders.score < 85 ? 2.0 : 1.5;

  const detectedCmsLabel = seo.cmsTech ? ` [${seo.cmsTech}]` : "";

  const dynamicScopeTasks: ScopeTaskItem[] = [
    {
      id: "task-lcp",
      title: isPolish
        ? `Optymalizacja LCP (${report.coreWebVitals.lcp.displayValue}) i kompresja ${imgCount} obrazów do formatu WebP${detectedCmsLabel}`
        : `LCP Optimization (${report.coreWebVitals.lcp.displayValue}) & ${imgCount} Images AVIF/WebP Pipeline${detectedCmsLabel}`,
      category: "performance",
      hours: lcpHours,
      selected: true,
      businessBenefit: isPolish
        ? "Szybsze wyświetlenie głównej treści strony na smartfonach, mniejsza utrata odwiedzających"
        : "Faster main content rendering on mobile devices, lower visitor drop-off",
      technicalScope: isPolish
        ? `Konwersja ${imgCount} grafik do formatu WebP, preload zasobu LCP, wdrożenie fetchpriority="high" oraz wymiarów responsywnych.`
        : `Convert ${imgCount} images to AVIF/WebP, preload LCP asset, add fetchpriority="high" and responsive dimensions.`,
    },
    {
      id: "task-js",
      title: isPolish
        ? `Odblokowanie wątku głównego JS/CSS (TBT: ${report.coreWebVitals.tbt.displayValue}, blokujące skrypty: ${blockingScripts})`
        : `Main-Thread JS/CSS Unblocking (TBT: ${report.coreWebVitals.tbt.displayValue}, blocking scripts: ${blockingScripts})`,
      category: "performance",
      hours: jsHours,
      selected: true,
      businessBenefit: isPolish
        ? "Płynniejsza interakcja formularzy i przycisków na urządzeniach mobilnych"
        : "Smoother form and button responsiveness on mobile devices",
      technicalScope: isPolish
        ? "Wydzielenie Critical CSS inline, odroczenie skryptów zewnętrznych (defer/async) i redukcja nieużywanego kodu JS."
        : "Extract inline Critical CSS, defer third-party scripts, and tree-shake unused JS bundles.",
    },
    {
      id: "task-seo",
      title: isPolish
        ? `Techniczne SEO: Nagłówki H1–H6 (H1: ${seo.headings.h1}x), Meta & Schema.org`
        : `Technical SEO: H1–H6 Hierarchy (H1: ${seo.headings.h1}x), Meta & Schema.org`,
      category: "seo",
      hours: seoHours,
      selected: true,
      businessBenefit: isPolish
        ? "Poprawa indeksowalności podstron i czytelniejsza prezentacja w wynikach Google"
        : "Improved page crawlability and clearer Google SERP snippets",
      technicalScope: isPolish
        ? `Korekta Title (${seo.title.length} zn.), Meta Description (${seo.description.length} zn.), struktury H1-H3 oraz wdrożenie JSON-LD.`
        : `Optimize Title (${seo.title.length} chars), Meta Description (${seo.description.length} chars), H1-H3 tree, and JSON-LD.`,
    },
    {
      id: "task-wcag",
      title: isPolish
        ? `Lista naprawcza zgodna z kryteriami WCAG 2.1 AA i uzupełnienie ${seo.images.missingAlt} opisów ALT`
        : `WCAG 2.1 AA Remediation List & Fix ${seo.images.missingAlt} Missing Image ALTs`,
      category: "accessibility",
      hours: wcagHours,
      selected: seo.images.missingAlt > 0 || accessScore < 90,
      businessBenefit: isPolish
        ? "Wsparcie dla czytników ekranu oraz lepsze indeksowanie obrazów w Google Grafika"
        : "Screen-reader compatibility and better Google Images indexing",
      technicalScope: isPolish
        ? `Uzupełnienie ${seo.images.missingAlt} atrybutów alt, poprawa kontrastu (min. 4.5:1) oraz etykiet ARIA.`
        : `Add ${seo.images.missingAlt} descriptive alt tags, enforce 4.5:1 contrast ratio, and fix ARIA labels.`,
    },
    {
      id: "task-sec",
      title: isPolish
        ? `Nagłówki bezpieczeństwa HTTP (${seo.securityHeaders.score}/100), testy regresji i raport przed/po`
        : `HTTP Security Headers (${seo.securityHeaders.score}/100), Regression QA & Before/After Report`,
      category: "security",
      hours: secAndQaHours,
      selected: true,
      businessBenefit: isPolish
        ? "Ochrona HTTP, brak błędów regresji po wdrożeniu oraz udokumentowany pomiar przed i po"
        : "HTTP security hardening, zero regression bugs, and documented before/after measurements",
      technicalScope: isPolish
        ? "Wdrożenie HSTS, Content-Security-Policy (CSP), X-Frame-Options oraz wykonanie pomiarów kontrolnych przed i po."
        : "Configure Strict-Transport-Security, CSP, X-Frame-Options, and run before/after verification benchmarks.",
    },
  ];

  const dynamicActions: ActionItem[] = [
    {
      id: "dyn-act-1",
      title: isPolish
        ? `Optymalizacja zasobu LCP (${report.coreWebVitals.lcp.displayValue} → cel ≤ 2.5 s)`
        : `Optimize LCP Resource (${report.coreWebVitals.lcp.displayValue} → target ≤ 2.5 s)`,
      category: "performance",
      status: perf >= 90 ? "checked" : "pending",
      priority: "high",
      impact: `${lcpHours}h · Core Web Vitals`,
      description: isPolish
        ? "Wdrożenie kompresji obrazów (WebP) i priorytetyzacji ładowania głównego widoku."
        : "Deploy AVIF/WebP compression and fetchpriority='high' on Hero assets.",
      estimatedHours: lcpHours,
    },
    {
      id: "dyn-act-2",
      title: isPolish
        ? `Korekta znaczników Meta Title (${seo.title.length} zn.) i Description (${seo.description.length} zn.)`
        : `Optimize Meta Title (${seo.title.length} chars) & Description (${seo.description.length} chars)`,
      category: "seo",
      status: seo.title.status === "good" && seo.description.status === "good" ? "checked" : "pending",
      priority: "high",
      impact: `${seoHours}h · On-Page SEO`,
      description: isPolish
        ? "Dopasowanie długości znaczników do standardu SERP (Title 50-60 zn., Description 140-160 zn.)."
        : "Align meta tags with Google SERP pixel limits.",
      estimatedHours: seoHours,
    },
    {
      id: "dyn-act-3",
      title: isPolish
        ? `Uzupełnienie opisów alternatywnych ALT (${seo.images.missingAlt} brakujących na ${seo.images.total} grafik)`
        : `Fix Missing Image Alt Attributes (${seo.images.missingAlt} missing of ${seo.images.total})`,
      category: "accessibility",
      status: seo.images.missingAlt === 0 ? "checked" : "pending",
      priority: "medium",
      impact: `${wcagHours}h · ${isPolish ? "Kryteria WCAG 2.1 AA" : "WCAG 2.1 AA criteria"}`,
      description: isPolish
        ? "Zapewnienie opisów alternatywnych dla czytników ekranowych i indeksacji w Google Grafika."
        : "Ensure screen reader accessibility and image search indexing.",
      estimatedHours: wcagHours,
    },
    {
      id: "dyn-act-4",
      title: isPolish
        ? `Wdrożenie nagłówków bezpieczeństwa HTTP (HSTS, CSP, X-Frame-Options) i testy regresji`
        : `Deploy HTTP Security Headers (HSTS, CSP, X-Frame-Options) & Regression QA`,
      category: "security",
      status: seo.securityHeaders.score >= 90 ? "checked" : "pending",
      priority: "medium",
      impact: `${secAndQaHours}h · Security ${seo.securityHeaders.score}/100`,
      description: isPolish
        ? "Zabezpieczenie witryny oraz porównawczy pomiar przed i po wdrożeniu."
        : "Protect site against framing/XSS and document before/after measurements.",
      estimatedHours: secAndQaHours,
    },
  ];

  // Calculate real subpage status counts from verified discoveredSubpages
  const subpages = seo.discoveredSubpages || [];
  const verifiedHealthy = subpages.filter((s) => s.status >= 200 && s.status < 300).length;
  const verifiedRedirects = subpages.filter((s) => (s.status >= 300 && s.status < 400) || s.redirected).length;
  const verifiedErrors = subpages.filter((s) => s.status >= 400 || s.status === 0).length;

  const totalLinks = Math.max(subpages.length, seo.links.total || 1);
  const dynamicCrawledPages = {
    totalPages: totalLinks,
    healthy: subpages.length > 0 ? verifiedHealthy : Math.max(1, totalLinks - verifiedErrors),
    redirects: verifiedRedirects + (seo.redirectCount || 0),
    warnings: (seo.title.status !== "good" ? 1 : 0) + (seo.description.status !== "good" ? 1 : 0) + seo.images.missingAlt,
    siteIssues: (seo.headings.h1 !== 1 ? 1 : 0) + (seo.scriptStats?.renderBlockingScripts || 0),
    pagesWithErrors: verifiedErrors + (!seo.indexing.hasRobotsTxt || !seo.indexing.hasSitemapXml ? 1 : 0),
  };

  const dynamicOnPageMatrix: NonNullable<AuditReport["demo"]>["onPageSeoAnalysis"] = [
    {
      id: "titles",
      name: "Title Tags (<title>)",
      missing: seo.title.text ? 0 : 1,
      tooShort: seo.title.length > 0 && seo.title.length < 30 ? 1 : 0,
      tooLong: seo.title.length > 65 ? 1 : 0,
      duplicates: 0,
      status: seo.title.status,
    },
    {
      id: "meta-desc",
      name: "Meta Descriptions",
      missing: seo.description.text ? 0 : 1,
      tooShort: seo.description.length > 0 && seo.description.length < 110 ? 1 : 0,
      tooLong: seo.description.length > 165 ? 1 : 0,
      duplicates: 0,
      status: seo.description.status,
    },
    {
      id: "headings",
      name: `${isPolish ? "Struktura nagłówków" : "Heading structure"} (H1: ${seo.headings.h1}, H2: ${seo.headings.h2}, H3: ${seo.headings.h3})`,
      missing: seo.headings.h1 === 0 ? 1 : 0,
      tooShort: 0,
      tooLong: seo.headings.h1 > 1 ? seo.headings.h1 - 1 : 0,
      duplicates: seo.headings.h1 > 1 ? 1 : 0,
      status: seo.headings.status,
    },
    {
      id: "alt-text",
      name: `${isPolish ? "Atrybuty obrazów ALT" : "Image ALT attributes"} (${isPolish ? "razem" : "total"}: ${seo.images.total})`,
      missing: seo.images.missingAlt,
      tooShort: 0,
      tooLong: 0,
      duplicates: 0,
      status: seo.images.status,
    },
    {
      id: "canonical",
      name: isPolish ? "Tagi Canonical i indeksowanie" : "Canonical tags & indexing",
      missing: seo.canonical.url ? 0 : 1,
      tooShort: 0,
      tooLong: 0,
      duplicates: 0,
      status: seo.canonical.status,
    },
    {
      id: "schema",
      name: isPolish ? "Dane strukturalne Schema.org (JSON-LD)" : "Schema.org structured data (JSON-LD)",
      missing: seo.social.schemaJsonLdCount === 0 ? 1 : 0,
      tooShort: 0,
      tooLong: 0,
      duplicates: 0,
      status: seo.social.schemaJsonLdCount > 0 ? "good" : "warning",
    },
  ];

  return {
    dynamicScopeTasks,
    dynamicActions,
    dynamicOnPageMatrix,
    dynamicCrawledPages,
  };
}

// Stan pusty (przed pierwszym skanem): żadnych przykładowych liczb – wszystkie wartości to „brak pomiaru”.
export const EMPTY_LIVE_SEO: LiveSeoInspection = {
  url: "",
  isLiveFetch: false,
  responseTimeMs: 0,
  redirectCount: 0,
  redirectChain: [],
  htmlSizeKb: 0,
  https: false,
  htmlLang: null,
  viewport: null,
  cmsTech: "",
  techStack: [],
  complexityMultiplier: 1.0,
  scriptStats: { totalScripts: 0, renderBlockingScripts: 0, stylesheets: 0 },
  hreflangs: [],
  title: { text: null, length: 0, pixelWidth: 0, status: "warning" },
  description: { text: null, length: 0, pixelWidth: 0, status: "warning" },
  headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h1Texts: [], h2Texts: [], status: "warning" },
  canonical: { url: null, isSelf: false, status: "warning" },
  indexing: { robotsMeta: "", hasRobotsTxt: false, hasSitemapXml: false, status: "warning" },
  images: { total: 0, missingAlt: 0, lazyLoaded: 0, status: "warning" },
  links: { internal: 0, external: 0, total: 0 },
  social: { ogTitle: null, ogDescription: null, ogImage: null, twitterCard: null, schemaJsonLdCount: 0, status: "warning" },
  securityHeaders: { https: false, hsts: false, xFrameOptions: false, xContentTypeOptions: false, csp: false, score: 0 },
};

const emptyMetric = (id: string, name: string, acronym: string, target: string): CoreWebVitalMetric => ({
  id,
  name,
  acronym,
  target,
  description: "",
  displayValue: "Brak pomiaru",
  score: null,
  status: "unavailable",
  numericVal: null,
});

export const EMPTY_AUDIT: AuditReport = {
  id: "empty",
  isSample: false,
  scannedUrl: "",
  finalUrl: "",
  scannedAt: "",
  overallScore: null,
  overallLabel: "",
  categories: { performance: null, seo: null, accessibility: null, bestPractices: null },
  seoBreakdown: { crawlability: null, onPageSeo: null, mobileFriendly: null },
  accessibilityBreakdown: { contrast: null, navigation: null, names: null, aria: null },
  deviceScores: { mobile: null, desktop: null, https: false },
  coreWebVitals: {
    lcp: emptyMetric("lcp", "Largest Contentful Paint", "LCP", "≤ 2.5 s"),
    inp: emptyMetric("inp", "Interaction to Next Paint", "INP", "≤ 200 ms"),
    cls: emptyMetric("cls", "Cumulative Layout Shift", "CLS", "≤ 0.1"),
    fcp: emptyMetric("fcp", "First Contentful Paint", "FCP", "≤ 1.8 s"),
    tbt: emptyMetric("tbt", "Total Blocking Time", "TBT", "≤ 200 ms"),
  },
  auditProgress: { completePercent: 0, warnings: 0, passedChecks: 0, criticalIssues: 0, totalChecks: 0 },
  issues: [],
  recommendedActions: [],
  demo: {
    crawledPages: { totalPages: 0, healthy: 0, redirects: 0, warnings: 0, siteIssues: 0, pagesWithErrors: 0 },
    onPageSeoAnalysis: [],
    scoreHistory: [],
  },
};
