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

export interface AgencyClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: "lead" | "audit_sent" | "proposal_accepted" | "remediated" | "retainer";
  contractValue: number;
  hourlyRate: number;
  estimatedHours: number;
  retainerFee: number;
  addedAt: string;
  lastScore: number;
  notes: string;
  cmsTech?: string;
  activityLog?: ClientActivityEntry[];
}

export interface MonitoringAlertEntry {
  id: string;
  timestamp: string;
  type: "downtime" | "slow_response" | "score_drop" | "recovered";
  message: string;
  httpStatus?: number;
  responseTimeMs?: number;
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
    title: "Optymalizacja LCP i konwersja zasobów graficznych do AVIF / WebP",
    category: "performance",
    hours: 3.0,
    selected: true,
    businessBenefit: "Szybsze wyświetlenie głównej sekcji oferty na telefonach, mniejsza utrata odwiedzających",
    technicalScope: "Konwersja PNG/JPEG do AVIF/WebP, preload zasobów Hero, fetchpriority='high', rozmiary responsywne srcset.",
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
        ? `Optymalizacja LCP (${report.coreWebVitals.lcp.displayValue}) i kompresja ${imgCount} obrazów do AVIF/WebP${detectedCmsLabel}`
        : `LCP Optimization (${report.coreWebVitals.lcp.displayValue}) & ${imgCount} Images AVIF/WebP Pipeline${detectedCmsLabel}`,
      category: "performance",
      hours: lcpHours,
      selected: true,
      businessBenefit: isPolish
        ? "Szybsze wyświetlenie głównej treści strony na smartfonach, mniejsza utrata odwiedzających"
        : "Faster main content rendering on mobile devices, lower visitor drop-off",
      technicalScope: isPolish
        ? `Konwersja ${imgCount} grafik do AVIF/WebP, preload zasobu LCP, wdrożenie fetchpriority="high" oraz wymiarów responsywnych.`
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
        ? "Wdrożenie kompresji AVIF/WebP i priorytetyzacji ładowania głównego widoku."
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
      impact: `${wcagHours}h · Kryteria WCAG 2.1 AA`,
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
      name: `Struktura Nagłówków (H1: ${seo.headings.h1}, H2: ${seo.headings.h2}, H3: ${seo.headings.h3})`,
      missing: seo.headings.h1 === 0 ? 1 : 0,
      tooShort: 0,
      tooLong: seo.headings.h1 > 1 ? seo.headings.h1 - 1 : 0,
      duplicates: seo.headings.h1 > 1 ? 1 : 0,
      status: seo.headings.status,
    },
    {
      id: "alt-text",
      name: `Atrybuty Obrazów ALT (Razem: ${seo.images.total})`,
      missing: seo.images.missingAlt,
      tooShort: 0,
      tooLong: 0,
      duplicates: 0,
      status: seo.images.status,
    },
    {
      id: "canonical",
      name: "Tagi Canonical & Indeksowanie",
      missing: seo.canonical.url ? 0 : 1,
      tooShort: 0,
      tooLong: 0,
      duplicates: 0,
      status: seo.canonical.status,
    },
    {
      id: "schema",
      name: "Dane Strukturalne Schema.org (JSON-LD)",
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

export const DEFAULT_LIVE_SEO: LiveSeoInspection = {
  url: "https://novopix.uk",
  isLiveFetch: true,
  responseTimeMs: 142,
  redirectCount: 0,
  redirectChain: [],
  htmlSizeKb: 38,
  https: true,
  htmlLang: "en",
  viewport: "width=device-width, initial-scale=1.0",
  cmsTech: "Custom / HTML5",
  techStack: ["Tailwind CSS", "Cloudflare CDN"],
  complexityMultiplier: 1.0,
  scriptStats: {
    totalScripts: 4,
    renderBlockingScripts: 0,
    stylesheets: 2,
  },
  hreflangs: ["pl", "en"],
  title: {
    text: "NovoPix Digital Studio — Web Performance, SEO & Custom Web Apps",
    length: 63,
    pixelWidth: 548,
    status: "good",
  },
  description: {
    text: "Independent digital studio specializing in high-speed web architecture, Core Web Vitals remediation, technical SEO, and WCAG 2.1 AA accessible interfaces.",
    length: 154,
    pixelWidth: 942,
    status: "good",
  },
  headings: {
    h1: 1,
    h2: 6,
    h3: 11,
    h4: 4,
    h5: 0,
    h6: 0,
    h1Texts: ["Make Your Website Faster, Rank Higher & Convert More Clients"],
    h2Texts: [
      "Core Web Vitals & Speed Engineering",
      "Technical SEO & Schema Architecture",
      "WCAG 2.1 AA Accessibility Audits",
      "Transparent Agency Pricing & ROI",
    ],
    status: "good",
  },
  canonical: {
    url: "https://novopix.uk",
    isSelf: true,
    status: "good",
  },
  indexing: {
    robotsMeta: "index, follow",
    hasRobotsTxt: true,
    hasSitemapXml: true,
    status: "good",
  },
  images: {
    total: 14,
    missingAlt: 2,
    lazyLoaded: 11,
    status: "warning",
  },
  links: {
    internal: 26,
    external: 6,
    total: 32,
  },
  social: {
    ogTitle: "NovoPix Digital Studio — Web Growth & Performance",
    ogDescription: "Turn technical website bottlenecks into measurable growth.",
    ogImage: "https://novopix.uk/og-cover.png",
    twitterCard: "summary_large_image",
    schemaJsonLdCount: 2,
    status: "good",
  },
  securityHeaders: {
    https: true,
    hsts: true,
    xFrameOptions: true,
    xContentTypeOptions: true,
    csp: true,
    score: 100,
  },
};

export const SAMPLE_AUDIT: AuditReport = {
  id: "sample-demo-2026",
  isSample: true,
  measurementStatus: "demo_sample",
  measurementNote: "Przykładowy raport referencyjny dla novopix.uk. Wpisz dowolną domenę powyżej i kliknij Skanuj, aby wykonać pomiar na żywo.",
  scannedUrl: "https://novopix.uk",
  finalUrl: "https://novopix.uk",
  scannedAt: new Date().toISOString(),
  overallScore: 91,
  overallLabel: "Healthy",
  categories: {
    performance: 89,
    seo: 92,
    accessibility: 94,
    bestPractices: 88,
  },
  seoBreakdown: {
    crawlability: 90,
    onPageSeo: 92,
    mobileFriendly: 95,
  },
  accessibilityBreakdown: {
    contrast: 91,
    navigation: 94,
    names: 96,
    aria: 93,
  },
  deviceScores: {
    mobile: 89,
    desktop: 98,
    https: true,
  },
  pageWeight: {
    totalKb: 1180,
    requestCount: 34,
    jsKb: 390,
    imagesKb: 480,
    cssKb: 115,
    fontsKb: 95,
    serverResponseMs: 142,
    thirdPartyBlockingMs: 110,
  },
  coreWebVitals: {
    lcp: {
      id: "lcp",
      name: "Largest Contentful Paint",
      acronym: "LCP",
      displayValue: "1.4 s",
      score: 0.94,
      status: "good",
      target: "≤ 2.5 s",
      description: "Measures loading performance of main content.",
      numericVal: 1400,
    },
    inp: {
      id: "inp",
      name: "Interaction to Next Paint",
      acronym: "INP",
      displayValue: "110 ms",
      score: 0.92,
      status: "good",
      target: "≤ 200 ms",
      description: "Assesses page responsiveness to clicks and taps.",
      numericVal: 110,
    },
    cls: {
      id: "cls",
      name: "Cumulative Layout Shift",
      acronym: "CLS",
      displayValue: "0.04",
      score: 0.96,
      status: "good",
      target: "≤ 0.1",
      description: "Visual stability during page load.",
      numericVal: 0.04,
    },
    fcp: {
      id: "fcp",
      name: "First Contentful Paint",
      acronym: "FCP",
      displayValue: "0.9 s",
      score: 0.95,
      status: "good",
      target: "≤ 1.8 s",
      description: "Time when first text or image is rendered.",
      numericVal: 900,
    },
    tbt: {
      id: "tbt",
      name: "Total Blocking Time",
      acronym: "TBT",
      displayValue: "120 ms",
      score: 0.91,
      status: "good",
      target: "≤ 200 ms",
      description: "Sum of time main thread was blocked by long tasks.",
      numericVal: 120,
    },
  },
  auditProgress: {
    completePercent: 91,
    warnings: 4,
    passedChecks: 78,
    criticalIssues: 2,
    totalChecks: 84,
  },
  issues: [
    {
      id: "render-blocking-resources",
      title: "Eliminate render-blocking JS & CSS resources",
      description: "Zewnętrzne arkusze CSS oraz synchroniczne skrypty w sekcji <head> opóźniają pierwsze wyrenderowanie widoku.",
      displayValue: "Oszczędność ~320 ms",
      priority: "high",
      category: "performance",
      savingsMs: 320,
      estimatedHours: 3.0,
      businessImpact: "Opóźnienia w renderowaniu pierwszego widoku powodują utratę niecierpliwych użytkowników mobilnych.",
      developerFix: "Wydziel Critical CSS inline w <head>, a pozostałe style i skrypty załaduj asynchronicznie (defer / media='print' onload).",
    },
    {
      id: "unused-javascript",
      title: "Reduce unused JavaScript bundles",
      description: "Przeglądarka pobiera i parsuje nieużywane moduły JS przed umożliwieniem interakcji z formularzem.",
      displayValue: "Oszczędność ~180 KiB",
      priority: "high",
      category: "performance",
      savingsMs: 240,
      estimatedHours: 2.5,
      businessImpact: "Szybsze działanie przycisków i formularza kontaktowego na telefonach.",
      developerFix: "Zastosuj podział kodu (code-splitting), usuń nieużywane zależności i opóźnij ładowanie skryptów analitycznych.",
    },
    {
      id: "modern-image-formats",
      title: "Serve images in next-gen formats (WebP / AVIF)",
      description: "Grafiki w formatach PNG/JPEG ważą więcej niż ich odpowiedniki w formacie AVIF.",
      displayValue: "Oszczędność ~295 KiB",
      priority: "medium",
      category: "performance",
      savingsMs: 295,
      estimatedHours: 2.0,
      businessImpact: "Szybsze ładowanie galerii i banerów ofertowych przy słabszym zasięgu LTE.",
      developerFix: "Skonfiguruj konwersję obrazów do AVIF/WebP wraz z responsywnymi atrybutami srcset i sizes.",
    },
    {
      id: "image-alt",
      title: "Ensure all image elements have descriptive [alt] attributes",
      description: "Brak tekstów alternatywnych utrudnia korzystanie z czytników ekranowych i obniża widoczność w Google Grafika.",
      displayValue: "2 obrazy bez alt",
      priority: "medium",
      category: "accessibility",
      estimatedHours: 1.5,
      businessImpact: "Zgodność z kryteriami WCAG 2.1 AA oraz lepsza indeksacja w wyszukiwarce grafiki.",
      developerFix: "Uzupełnij precyzyjne opisy zawartości w atrybutach alt dla wszystkich grafik merytorycznych.",
    },
  ],
  recommendedActions: [
    {
      id: "act-1",
      title: "Wdrożenie unikalnych Meta Descriptions i danych Schema.org JSON-LD",
      category: "seo",
      status: "checked",
      priority: "high",
      impact: "On-Page SEO",
      description: "Zapewnij unikalny opis 140-160 znaków oraz strukturę JSON-LD na każdej kluczowej podstronie.",
      estimatedHours: 2.5,
    },
    {
      id: "act-2",
      title: "Eliminacja zasobów blokujących renderowanie (Critical CSS & Defer JS)",
      category: "performance",
      status: "pending",
      priority: "high",
      impact: "-380 ms szybszy start strony",
      description: "Odblokuj główny wątek przeglądarki, aby sekcja Hero pojawiała się szybciej.",
      estimatedHours: 3.0,
    },
    {
      id: "act-3",
      title: "Konwersja zasobów graficznych do formatów AVIF / WebP",
      category: "performance",
      status: "pending",
      priority: "high",
      impact: "-42% mniejsza waga obrazów",
      description: "Zastąp ciężkie pliki JPEG/PNG nowoczesną kompresją AVIF z zachowaniem ostrości.",
      estimatedHours: 2.5,
    },
    {
      id: "act-4",
      title: "Audyt i poprawki zgodne z kryteriami WCAG 2.1 AA (Kontrast + ARIA)",
      category: "accessibility",
      status: "pending",
      priority: "medium",
      impact: "Kryteria WCAG 2.1 AA",
      description: "Uzupełnij atrybuty alt oraz etykiety aria-label dla pełnej obsługi czytników ekranowych.",
      estimatedHours: 1.5,
    },
  ],
  screenshot: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280" fill="none"><rect width="480" height="280" rx="14" fill="%230F172A"/><rect x="1" y="1" width="478" height="34" rx="13" fill="%231E293B"/><circle cx="18" cy="18" r="4.5" fill="%23EF4444"/><circle cx="32" cy="18" r="4.5" fill="%23F59E0B"/><circle cx="46" cy="18" r="4.5" fill="%2310B981"/><rect x="68" y="10" width="280" height="16" rx="5" fill="%23334155"/><text x="80" y="21" fill="%23E2E8F0" font-size="10" font-family="monospace">https://novopix.uk</text><rect x="24" y="54" width="210" height="18" rx="4" fill="%2310B981"/><rect x="24" y="82" width="290" height="10" rx="3" fill="%23475569"/><rect x="24" y="100" width="220" height="10" rx="3" fill="%23334155"/><rect x="24" y="135" width="95" height="75" rx="8" fill="%231E293B" stroke="%23334155"/><rect x="132" y="135" width="95" height="75" rx="8" fill="%231E293B" stroke="%23334155"/><rect x="240" y="135" width="95" height="75" rx="8" fill="%231E293B" stroke="%23334155"/><circle cx="405" cy="125" r="44" stroke="%2310B981" stroke-width="7" fill="%231E293B"/><text x="405" y="132" text-anchor="middle" fill="%23F8FAFC" font-size="22" font-weight="bold" font-family="sans-serif">91</text><text x="24" y="245" fill="%2394A3B8" font-size="10" font-family="sans-serif">NOVOPIX DIGITAL STUDIO · VERIFIED SNAPSHOT</text></svg>`,
  demo: {
    crawledPages: {
      totalPages: 184,
      healthy: 167,
      redirects: 10,
      warnings: 5,
      siteIssues: 0,
      pagesWithErrors: 2,
    },
    onPageSeoAnalysis: [
      { id: "titles", name: "Title Tags (<title>)", missing: 0, tooShort: 2, tooLong: 3, duplicates: 1, status: "good" },
      { id: "meta-desc", name: "Meta Descriptions", missing: 2, tooShort: 4, tooLong: 1, duplicates: 0, status: "warning" },
      { id: "headings", name: "Heading Structure (H1-H6)", missing: 1, tooShort: 0, tooLong: 0, duplicates: 2, status: "good" },
      { id: "alt-text", name: "Image Alt Attributes", missing: 4, tooShort: 0, tooLong: 0, duplicates: 0, status: "warning" },
      { id: "canonical", name: "Canonical Links", missing: 0, tooShort: 0, tooLong: 0, duplicates: 0, status: "good" },
      { id: "schema", name: "Schema.org JSON-LD", missing: 1, tooShort: 0, tooLong: 0, duplicates: 0, status: "good" },
    ],
    scoreHistory: [
      { date: "01 Oct", overall: 74, performance: 68, seo: 80, accessibility: 84 },
      { date: "10 Oct", overall: 79, performance: 74, seo: 84, accessibility: 88 },
      { date: "20 Oct", overall: 84, performance: 80, seo: 88, accessibility: 91 },
      { date: "01 Nov", overall: 88, performance: 85, seo: 90, accessibility: 93 },
      { date: "09 Nov", overall: 91, performance: 89, seo: 92, accessibility: 94 },
    ],
  },
};
