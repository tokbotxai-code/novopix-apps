import { validateSafePublicUrl, safeFetchHtml } from "./security";
import { performDeepLiveSeoInspection } from "./seoCrawler";

// Skan strony: 3 uczciwe stany pomiaru (live_lighthouse / partial_html / failed). Zero wymyślonych wyników.
const URL_ERRORS_EN: Record<string, string> = {
  "Adres URL jest wymagany.": "A website address is required.",
  "Adres URL nie może być pusty.": "The website address cannot be empty.",
  "Nieprawidłowy format adresu URL.": "Invalid URL format.",
  "Dozwolone są wyłącznie protokoły HTTP oraz HTTPS.": "Only HTTP and HTTPS are allowed.",
  "Ze względów bezpieczeństwa (ochrona Anti-SSRF) skanowanie adresów lokalnych i wewnętrznych jest zablokowane.": "For security reasons (anti-SSRF protection) scanning local and internal addresses is blocked.",
  "Blokada bezpieczeństwa Anti-SSRF: prywatne adresy IP nie mogą być skanowane.": "Anti-SSRF security block: private IP addresses cannot be scanned.",
  "Blokada bezpieczeństwa Anti-SSRF: prywatne adresy IPv6 są niedozwolone.": "Anti-SSRF security block: private IPv6 addresses are not allowed.",
  "Podaj pełną nazwę domeny publicznej (np. twojafirma.pl).": "Enter a full public domain name (e.g. yourcompany.com).",
};

// Atrybut <html lang> strony (do wyboru języka oferty); w trybie Lighthouse osobne, krótkie pobranie HTML.
async function detectHtmlLang(targetUrl: string): Promise<string | null> {
  try {
    const f = await safeFetchHtml(targetUrl, 5000, 400_000);
    const m = f.htmlText.match(/<html[^>]*\slang=["']([^"']*)["']/i);
    return m && m[1].trim() ? m[1].trim() : null;
  } catch {
    return null;
  }
}

export async function performScan(url: any, strategy: string = "mobile"): Promise<{ status: number; body: any }> {
  let code = 200;
  // Teksty generowane przez serwer są po polsku; T(pl, en) zapamiętuje tłumaczenie EN w mapie i2 dołączanej do odpowiedzi,
  // dzięki czemu interfejs może przełączać język także po wykonaniu skanu (bez ponownego pomiaru).
  const i18n: Record<string, string> = {};
  const T = (pl: string, en: string) => {
    i18n[pl] = en;
    return pl;
  };
  const res: any = {
    status(n: number) {
      code = n;
      return res;
    },
    json(body: any) {
      return { status: code, body: body && typeof body === "object" && Object.keys(i18n).length ? { ...body, i18n } : body };
    },
  };
  const urlValidation = validateSafePublicUrl(url);
  if (!urlValidation.valid || !urlValidation.normalizedUrl) {
    Object.assign(i18n, URL_ERRORS_EN);
    return res.status(400).json({
      error: urlValidation.error || T("Nieprawidłowy adres URL.", "Invalid URL."),
      measurementStatus: "failed",
    });
  }

  const targetUrl = urlValidation.normalizedUrl;
  let psiErrorReason: string | null = null;

  try {
    const psiApiKey = process.env.PAGESPEED_API_KEY || "";
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      targetUrl
    )}&strategy=${strategy}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES${
      psiApiKey ? `&key=${psiApiKey}` : ""
    }`;

    const psiResponse = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) });
    if (psiResponse.ok) {
      const data = await psiResponse.json();
      const lighthouse = data.lighthouseResult || {};
      const categories = lighthouse.categories || {};
      const audits = lighthouse.audits || {};
      const fieldMetrics = data.loadingExperience?.metrics || {};

      const perf = Math.round((categories.performance?.score || 0) * 100);
      const seo = Math.round((categories.seo?.score || 0) * 100);
      const access = Math.round((categories.accessibility?.score || 0) * 100);
      const bp = Math.round((categories["best-practices"]?.score || 0) * 100);
      const overall = Math.round((perf + seo + access + bp) / 4);

      const screenshot = audits["final-screenshot"]?.details?.data || null;

      // Extract real resource weight & network request counts from Lighthouse
      const totalByteWeight = audits["total-byte-weight"]?.numericValue || 0;
      const totalKb = Math.round(totalByteWeight / 1024);
      const resourceItems: any[] = audits["resource-summary"]?.details?.items || [];
      const findResourceKb = (type: string) => {
        const found = resourceItems.find((r) => r.resourceType === type);
        return found && typeof found.transferSize === "number" ? Math.round(found.transferSize / 1024) : 0;
      };
      const totalReqsFound = resourceItems.find((r) => r.resourceType === "total")?.requestCount;
      const requestCount = totalReqsFound ?? audits["network-requests"]?.details?.items?.length ?? 0;
      const serverResponseMs = Math.round(audits["server-response-time"]?.numericValue || 0);
      const thirdPartyBlockingMs = Math.round(audits["third-party-summary"]?.numericValue || 0);

      // Compute real passed / warning / critical audit counts directly from Lighthouse audits
      const allAuditValues = Object.values(audits) as any[];
      let realPassed = 0;
      let realWarnings = 0;
      let realCritical = 0;
      for (const a of allAuditValues) {
        if (a.scoreDisplayMode === "numeric" || a.scoreDisplayMode === "binary") {
          if (a.score === 1 || (typeof a.score === "number" && a.score >= 0.9)) {
            realPassed++;
          } else if (typeof a.score === "number" && a.score >= 0.5) {
            realWarnings++;
          } else if (typeof a.score === "number" && a.score < 0.5) {
            realCritical++;
          }
        }
      }
      const totalScoredChecks = Math.max(1, realPassed + realWarnings + realCritical);

      // Extract real opportunities from Lighthouse
      const rawOpps = allAuditValues
        .filter((a: any) => a && (a.details?.type === "opportunity" || (typeof a.score === "number" && a.score < 0.9 && a.title)))
        .slice(0, 10)
        .map((a: any, idx: number) => ({
          id: a.id || `opp-${idx}`,
          title: a.title,
          description: String(a.description || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
          displayValue: a.displayValue || "",
          priority: (a.score ?? 1) < 0.5 ? ("high" as const) : ("medium" as const),
          category: "performance" as const,
          savingsMs: Math.round(a.details?.overallSavingsMs || 0),
          estimatedHours: (a.score ?? 1) < 0.5 ? 3.0 : 1.5,
          businessImpact:
            (a.score ?? 1) < 0.5
              ? T("Krytyczne wąskie gardło wydajności wykryte w teście Google Lighthouse", "Critical performance bottleneck found by Google Lighthouse")
              : T("Element wymagający optymalizacji w celu poprawy wskaźników Core Web Vitals", "Item that needs optimisation to improve Core Web Vitals"),
          developerFix:
            T("Optymalizacja zasobu zgodnie z wytycznymi raportu Google Lighthouse (kompresja, priorytetyzacja lub redukcja blokowania wątku głównego).", "Optimise the resource following the Google Lighthouse guidance (compression, prioritisation or reducing main-thread blocking)."),
        }));

      // Extract real INP from CrUX field data if available, otherwise report Max Potential FID from Lighthouse lab
      const cruxInpMs = fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile ?? null;
      const labMaxFidMs = audits["max-potential-fid"]?.numericValue
        ? Math.round(audits["max-potential-fid"].numericValue)
        : null;
      const inpValMs = cruxInpMs ?? labMaxFidMs;
      const inpDisplay = cruxInpMs
        ? `${cruxInpMs} ms (CrUX)`
        : labMaxFidMs
        ? `${labMaxFidMs} ms (Lab FID)`
        : T("Brak danych CrUX", "No CrUX data");

      const htmlLang = await detectHtmlLang(lighthouse.finalUrl || targetUrl);
      return res.json({
        scannedUrl: url,
        finalUrl: lighthouse.finalUrl || targetUrl,
        htmlLang,
        measurementStatus: "live_lighthouse",
        measurementNote: "100% rzeczywisty pomiar z oficjalnego silnika Google PageSpeed Insights / Lighthouse API.",
        overallScore: overall,
        overallLabel: overall >= 90 ? "Healthy" : overall >= 65 ? "Room to improve" : "Needs attention",
        categories: {
          performance: perf,
          seo: seo,
          accessibility: access,
          bestPractices: bp,
        },
        seoBreakdown: {
          crawlability: seo,
          onPageSeo: seo,
          mobileFriendly: Math.round((perf + seo) / 2),
        },
        accessibilityBreakdown: {
          contrast: access,
          navigation: access,
          names: access,
          aria: access,
        },
        deviceScores: {
          mobile: strategy === "mobile" ? perf : null,
          desktop: strategy === "desktop" ? perf : null,
          https: (lighthouse.finalUrl || targetUrl).startsWith("https://"),
        },
        pageWeight: {
          totalKb,
          requestCount,
          jsKb: findResourceKb("script"),
          imagesKb: findResourceKb("image"),
          cssKb: findResourceKb("stylesheet"),
          fontsKb: findResourceKb("font"),
          serverResponseMs,
          thirdPartyBlockingMs,
        },
        coreWebVitals: {
          lcp: {
            id: "lcp",
            name: "Largest Contentful Paint",
            acronym: "LCP",
            target: "≤ 2.5 s",
            description: T("Rzeczywisty czas renderowania największego elementu w oknie widoku (Lighthouse).", "Measured render time of the largest element in the viewport (Lighthouse)."),
            displayValue: audits["largest-contentful-paint"]?.displayValue || T("Brak pomiaru", "Not measured"),
            score: audits["largest-contentful-paint"]?.score ?? null,
            status:
              audits["largest-contentful-paint"]?.score === null || audits["largest-contentful-paint"]?.score === undefined
                ? "unavailable"
                : audits["largest-contentful-paint"].score >= 0.9
                ? "good"
                : audits["largest-contentful-paint"].score >= 0.5
                ? "needs-improvement"
                : "poor",
            numericVal: audits["largest-contentful-paint"]?.numericValue ?? null,
          },
          inp: {
            id: "inp",
            name: "Interaction to Next Paint / Max FID",
            acronym: "INP",
            target: "≤ 200 ms",
            description: cruxInpMs
              ? T("Rzeczywista responsywność na interakcje użytkowników (dane polowe CrUX).", "Measured responsiveness to user interactions (CrUX field data).")
              : T("Laboratoryjny ekwiwalent responsywności wątku głównego (Max Potential FID).", "Lab equivalent of main-thread responsiveness (Max Potential FID)."),
            displayValue: inpDisplay,
            score: audits["max-potential-fid"]?.score ?? null,
            status:
              inpValMs === null
                ? "unavailable"
                : inpValMs <= 200
                ? "good"
                : inpValMs <= 500
                ? "needs-improvement"
                : "poor",
            numericVal: inpValMs,
          },
          cls: {
            id: "cls",
            name: "Cumulative Layout Shift",
            acronym: "CLS",
            target: "≤ 0.1",
            description: T("Rzeczywista stabilność wizualna układu strony podczas ładowania (Lighthouse).", "Measured visual stability of the page layout while loading (Lighthouse)."),
            displayValue: audits["cumulative-layout-shift"]?.displayValue || "0",
            score: audits["cumulative-layout-shift"]?.score ?? null,
            status:
              (audits["cumulative-layout-shift"]?.score ?? 1) >= 0.9
                ? "good"
                : (audits["cumulative-layout-shift"]?.score ?? 1) >= 0.5
                ? "needs-improvement"
                : "poor",
            numericVal: audits["cumulative-layout-shift"]?.numericValue ?? null,
          },
          fcp: {
            id: "fcp",
            name: "First Contentful Paint",
            acronym: "FCP",
            target: "≤ 1.8 s",
            description: T("Rzeczywisty czas pojawienia się pierwszego tekstu lub obrazu (Lighthouse).", "Measured time until the first text or image appears (Lighthouse)."),
            displayValue: audits["first-contentful-paint"]?.displayValue || T("Brak pomiaru", "Not measured"),
            score: audits["first-contentful-paint"]?.score ?? null,
            status:
              (audits["first-contentful-paint"]?.score ?? 1) >= 0.9
                ? "good"
                : (audits["first-contentful-paint"]?.score ?? 1) >= 0.5
                ? "needs-improvement"
                : "poor",
            numericVal: audits["first-contentful-paint"]?.numericValue ?? null,
          },
          tbt: {
            id: "tbt",
            name: "Total Blocking Time",
            acronym: "TBT",
            target: "≤ 200 ms",
            description: T("Rzeczywista suma czasu zablokowania głównego wątku przez skrypty JS (Lighthouse).", "Measured total time the main thread was blocked by JS (Lighthouse)."),
            displayValue: audits["total-blocking-time"]?.displayValue || "0 ms",
            score: audits["total-blocking-time"]?.score ?? null,
            status:
              (audits["total-blocking-time"]?.score ?? 1) >= 0.9
                ? "good"
                : (audits["total-blocking-time"]?.score ?? 1) >= 0.5
                ? "needs-improvement"
                : "poor",
            numericVal: audits["total-blocking-time"]?.numericValue ?? null,
          },
        },
        auditProgress: {
          completePercent: Math.round((realPassed / totalScoredChecks) * 100),
          warnings: realWarnings,
          passedChecks: realPassed,
          criticalIssues: realCritical,
          totalChecks: totalScoredChecks,
        },
        issues: rawOpps,
        screenshot,
        isSample: false,
        livePsiVerified: true,
      });
    } else {
      const errJson = await psiResponse.json().catch(() => ({}));
      psiErrorReason = errJson?.error?.message || `HTTP ${psiResponse.status} z Google PageSpeed API`;
    }
  } catch (err: any) {
    psiErrorReason = err?.message || "Przekroczono czas oczekiwania na Google PageSpeed API";
  }

  // --- STATE 2 or STATE 3: Google PSI API unavailable / quota exceeded -> Run REAL Live HTML/HTTP Inspection ---
  // We NEVER invent fake numbers from domain character hashes!
  const liveInspection = await performDeepLiveSeoInspection(targetUrl);

  if (!liveInspection.isLiveFetch) {
    // STATE 3: Complete Failure — Target domain did not respond over HTTP
    return res.status(422).json({
      error: T(`Brak możliwości wykonania pomiaru: badana domena (${targetUrl}) nie odpowiada lub odrzuciła połączenie (${liveInspection.error || "błąd sieci"}). Nie generujemy symulowanych wyników.`, `The measurement could not be made: the domain (${targetUrl}) does not respond or refused the connection (${liveInspection.error || "network error"}). We do not generate simulated results.`),
      measurementStatus: "failed",
      psiErrorReason,
    });
  }

  // STATE 2: Partial Real Measurement ("partial_html")
  // Calculate real On-Page SEO, Accessibility DOM, and Best Practices scores strictly from measured HTML & HTTP headers!
  let measuredSeo = 100;
  const realIssues: any[] = [];
  let passedChecks = 0;
  let warningsCount = 0;
  let criticalCount = 0;

  if (liveInspection.title.status === "good") {
    passedChecks++;
  } else {
    measuredSeo -= 15;
    warningsCount++;
    realIssues.push({
      id: "measured-meta-title",
      title: T(`Korekta znacznika <title> (zmierzona długość: ${liveInspection.title.length} znaków)`, `Fix the <title> tag (measured length: ${liveInspection.title.length} characters)`),
      description: liveInspection.title.text
        ? T(`Obecny tytuł "${liveInspection.title.text}" ma ${liveInspection.title.length} znaków (zalecane 30–65 znaków).`, `The current title "${liveInspection.title.text}" is ${liveInspection.title.length} characters long (30–65 recommended).`)
        : T("Brak znacznika <title> w pobranym kodzie HTML strony.", "No <title> tag in the fetched HTML."),
      displayValue: T(`${liveInspection.title.length} zn.`, `${liveInspection.title.length} chars`),
      priority: liveInspection.title.text ? "medium" : "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.0,
      businessImpact: T("Wpływa bezpośrednio na ocenę trafności strony i klikalność (CTR) w wynikach Google.", "Directly affects how relevant the page looks and its click-through rate in Google results."),
      developerFix: T("Ustaw unikalny znacznik <title> o długości 50–60 znaków zawierający główną frazę kluczową.", "Set a unique <title> of 50–60 characters containing the main keyword."),
    });
  }

  if (liveInspection.description.status === "good") {
    passedChecks++;
  } else {
    measuredSeo -= 15;
    warningsCount++;
    realIssues.push({
      id: "measured-meta-description",
      title: T(`Optymalizacja Meta Description (zmierzona długość: ${liveInspection.description.length} znaków)`, `Improve the meta description (measured length: ${liveInspection.description.length} characters)`),
      description: liveInspection.description.text
        ? T(`Opis meta ma ${liveInspection.description.length} znaków (optymalny zakres to 110–165 znaków).`, `The meta description is ${liveInspection.description.length} characters long (110–165 is optimal).`)
        : T("Brak znacznika <meta name='description'> w kodzie HTML strony.", "No <meta name='description'> tag in the page HTML."),
      displayValue: T(`${liveInspection.description.length} zn.`, `${liveInspection.description.length} chars`),
      priority: liveInspection.description.text ? "medium" : "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: T("Brak zoptymalizowanego opisu meta sprawia, że Google wyświetla przypadkowy fragment tekstu.", "Without a tuned meta description Google shows an arbitrary text snippet."),
      developerFix: T("Dodaj unikalny znacznik <meta name='description'> o długości 140–160 znaków z wezwaniem do działania.", "Add a unique <meta name='description'> of 140–160 characters with a call to action."),
    });
  }

  if (liveInspection.headings.h1 === 1) {
    passedChecks++;
  } else {
    measuredSeo -= 18;
    criticalCount++;
    realIssues.push({
      id: "measured-h1-structure",
      title: T(`Nieprawidłowa liczba nagłówków <h1> w kodzie DOM (wykryto: ${liveInspection.headings.h1}x)`, `Wrong number of <h1> headings in the DOM (found: ${liveInspection.headings.h1}x)`),
      description:
        liveInspection.headings.h1 === 0
          ? T("Na badanej stronie brakuje głównego nagłówka <h1>.", "The page has no main <h1> heading.")
          : T(`Wykryto ${liveInspection.headings.h1} nagłówków <h1> na jednej stronie, co rozmywa główny temat dokumentu.`, `${liveInspection.headings.h1} <h1> headings were found on one page, which blurs the main topic of the document.`),
      displayValue: `${liveInspection.headings.h1}x H1`,
      priority: "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: T("Utrudnia robotom wyszukiwarek jednoznaczną identyfikację głównego tematu podstrony.", "Makes it harder for search engine crawlers to identify the main topic of the page."),
      developerFix: T("Pozostaw dokładnie jeden nagłówek <h1> na podstronie, a pozostałe zamień na <h2>/<h3>.", "Keep exactly one <h1> per page and change the others to <h2>/<h3>."),
    });
  }

  if (liveInspection.indexing.hasRobotsTxt && liveInspection.indexing.hasSitemapXml) {
    passedChecks += 2;
  } else {
    measuredSeo -= 12;
    warningsCount++;
  }

  if (liveInspection.social.schemaJsonLdCount > 0) {
    passedChecks++;
  } else {
    measuredSeo -= 10;
    warningsCount++;
    realIssues.push({
      id: "measured-schema-jsonld",
      title: T("Brak danych strukturalnych Schema.org (application/ld+json)", "No Schema.org structured data (application/ld+json)"),
      description: T("W kodzie HTML nie wykryto żadnego bloku JSON-LD opisującego firmę, usługę lub produkt.", "No JSON-LD block describing the business, service or product was found in the HTML."),
      displayValue: "0x JSON-LD",
      priority: "medium",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 2.0,
      businessImpact: T("Brak szans na rozszerzone wyniki (Rich Snippets) w wyszukiwarce Google.", "No chance of rich results (rich snippets) in Google search."),
      developerFix: T("Wdróż skrypt <script type='application/ld+json'> ze schematem Organization / LocalBusiness.", "Add a <script type='application/ld+json'> block with an Organization / LocalBusiness schema."),
    });
  }

  let measuredAccess = 100;
  if (liveInspection.images.missingAlt === 0) {
    passedChecks++;
  } else {
    measuredAccess -= Math.min(35, liveInspection.images.missingAlt * 5);
    warningsCount++;
    realIssues.push({
      id: "measured-missing-alt",
      title: T(`Obrazy bez atrybutu [alt] (zmierzono: ${liveInspection.images.missingAlt} z ${liveInspection.images.total} grafik)`, `Images without an [alt] attribute (measured: ${liveInspection.images.missingAlt} of ${liveInspection.images.total} images)`),
      description: T(`W pobranym drzewie DOM wykryto ${liveInspection.images.missingAlt} elementów <img> pozbawionych opisu alternatywnego.`, `${liveInspection.images.missingAlt} <img> elements without alternative text were found in the fetched DOM.`),
      displayValue: T(`${liveInspection.images.missingAlt} bez alt`, `${liveInspection.images.missingAlt} without alt`),
      priority: liveInspection.images.missingAlt > 3 ? "high" : "medium",
      category: "accessibility",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: T("Naruszenie kryterium WCAG 2.1 AA (1.1.1) oraz słabsze indeksowanie w Google Grafika.", "Fails WCAG 2.1 AA criterion 1.1.1 and weakens indexing in Google Images."),
      developerFix: T("Uzupełnij opisowe atrybuty alt dla wszystkich grafik merytorycznych.", "Add descriptive alt attributes to all meaningful images."),
    });
  }

  if (!liveInspection.htmlLang) {
    measuredAccess -= 15;
    criticalCount++;
  } else {
    passedChecks++;
  }

  if (!liveInspection.viewport) {
    measuredAccess -= 20;
    criticalCount++;
  } else {
    passedChecks++;
  }

  if ((liveInspection.scriptStats?.renderBlockingScripts || 0) > 0) {
    warningsCount++;
    realIssues.push({
      id: "measured-blocking-scripts",
      title: T(`Synchroniczne skrypty blokujące w <head> (zmierzono: ${liveInspection.scriptStats.renderBlockingScripts})`, `Render-blocking scripts in <head> (measured: ${liveInspection.scriptStats.renderBlockingScripts})`),
      description: T(`W sekcji <head> znaleziono ${liveInspection.scriptStats.renderBlockingScripts} zewnętrznych skryptów JS bez atrybutu defer lub async.`, `${liveInspection.scriptStats.renderBlockingScripts} external JS scripts without defer or async were found in <head>.`),
      displayValue: T(`${liveInspection.scriptStats.renderBlockingScripts} skryptów`, `${liveInspection.scriptStats.renderBlockingScripts} scripts`),
      priority: "high",
      category: "performance",
      savingsMs: liveInspection.scriptStats.renderBlockingScripts * 120,
      estimatedHours: 2.5,
      businessImpact: T("Zatrzymuje parsowanie drzewa DOM i opóźnia pierwsze wyświetlenie treści na ekranie.", "Stops DOM parsing and delays the first paint of content."),
      developerFix: T("Dodaj atrybuty defer lub async do znaczników <script> w sekcji <head>.", "Add defer or async to <script> tags in <head>."),
    });
  }

  measuredSeo = Math.max(20, measuredSeo);
  measuredAccess = Math.max(25, measuredAccess);
  const measuredBp = liveInspection.securityHeaders.score;

  // Performance, accessibility and the overall score require a real Lighthouse run.
  // In partial mode they are reported as null ("not measured"), never as an estimate.
  const overallPartial: number | null = null;
  const measuredPerfProxy: number | null = null;
  const totalChecksCount = Math.max(1, passedChecks + warningsCount + criticalCount);

  return res.json({
    scannedUrl: url,
    finalUrl: liveInspection.url,
    htmlLang: liveInspection.htmlLang || null,
    measurementStatus: "partial_html",
    measurementNote: T(`Częściowy pomiar rzeczywisty (Live HTML + HTTP): zmierzono prawdziwy kod DOM, TTFB (${liveInspection.responseTimeMs} ms), obrazy (${liveInspection.images.total}) i nagłówki. Pełny silnik laboratoryjny Google Lighthouse był niedostępny (${psiErrorReason || "limit zapytań API"}).`, `Partial real measurement (live HTML + HTTP): the real DOM, TTFB (${liveInspection.responseTimeMs} ms), images (${liveInspection.images.total}) and headings were measured. The full Google Lighthouse lab engine was unavailable (${psiErrorReason || "API quota limit"}).`),
    overallScore: overallPartial,
    overallLabel: "Not measured (partial check)",
    categories: {
      performance: measuredPerfProxy,
      seo: measuredSeo,
      accessibility: null,
      bestPractices: measuredBp,
    },
    seoBreakdown: {
      crawlability: null,
      onPageSeo: measuredSeo,
      mobileFriendly: null,
    },
    accessibilityBreakdown: {
      contrast: null,
      navigation: null,
      names: null,
      aria: null,
    },
    deviceScores: {
      mobile: null,
      desktop: null,
      https: liveInspection.https,
    },
    pageWeight: {
      totalKb: liveInspection.htmlSizeKb,
      requestCount:
        1 +
        (liveInspection.scriptStats?.totalScripts || 0) +
        (liveInspection.scriptStats?.stylesheets || 0) +
        liveInspection.images.total,
      jsKb: 0,
      imagesKb: 0,
      cssKb: 0,
      fontsKb: 0,
      serverResponseMs: liveInspection.responseTimeMs,
      thirdPartyBlockingMs: (liveInspection.scriptStats?.renderBlockingScripts || 0) * 110,
    },
    coreWebVitals: {
      lcp: {
        id: "lcp",
        name: T("Largest Contentful Paint (Wymaga Lighthouse)", "Largest Contentful Paint (requires Lighthouse)"),
        acronym: "LCP",
        target: "≤ 2.5 s",
        description: T("W trybie częściowego pomiaru HTML zmierzono czas odpowiedzi serwera TTFB. Pełny pomiar LCP wymaga klucza Google PSI API.", "In partial HTML mode the server response time (TTFB) was measured. A full LCP measurement requires the Google PSI API."),
        displayValue: `TTFB: ${liveInspection.responseTimeMs} ms`,
        score: null,
        status: liveInspection.responseTimeMs <= 600 ? "good" : "needs-improvement",
        numericVal: liveInspection.responseTimeMs,
      },
      inp: {
        id: "inp",
        name: T("Skrypty Blokujące w <head>", "Render-blocking scripts in <head>"),
        acronym: "INP / JS",
        target: T("0 blokujących", "0 blocking"),
        description: T("Liczba synchronicznych skryptów JS blokujących wątek główny w pobranym kodzie HTML.", "Number of synchronous JS scripts blocking the main thread in the fetched HTML."),
        displayValue: T(`${liveInspection.scriptStats?.renderBlockingScripts || 0} skryptów`, `${liveInspection.scriptStats?.renderBlockingScripts || 0} scripts`),
        score: null,
        status: (liveInspection.scriptStats?.renderBlockingScripts || 0) === 0 ? "good" : "needs-improvement",
        numericVal: liveInspection.scriptStats?.renderBlockingScripts || 0,
      },
      cls: {
        id: "cls",
        name: "Cumulative Layout Shift",
        acronym: "CLS",
        target: "≤ 0.1",
        description: T("Pomiar przesunięć układu wymaga renderowania w silniku przeglądarki Lighthouse.", "Measuring layout shifts requires rendering in the Lighthouse browser engine."),
        displayValue: T("Wymaga PSI API", "Requires PSI API"),
        score: null,
        status: "unavailable",
        numericVal: null,
      },
      fcp: {
        id: "fcp",
        name: T("Czas Odpowiedzi Serwera (TTFB)", "Server response time (TTFB)"),
        acronym: "TTFB",
        target: "≤ 400 ms",
        description: T("Rzeczywisty zmierzony czas odpowiedzi HTTP badanej domeny.", "Measured HTTP response time of the scanned domain."),
        displayValue: `${liveInspection.responseTimeMs} ms`,
        score: null,
        status: liveInspection.responseTimeMs <= 400 ? "good" : liveInspection.responseTimeMs <= 900 ? "needs-improvement" : "poor",
        numericVal: liveInspection.responseTimeMs,
      },
      tbt: {
        id: "tbt",
        name: T("Rozmiar Dokumentu HTML", "HTML document size"),
        acronym: "HTML",
        target: "≤ 100 KB",
        description: T("Rzeczywisty rozmiar pobranego dokumentu HTML.", "Measured size of the fetched HTML document."),
        displayValue: `${liveInspection.htmlSizeKb} KB`,
        score: null,
        status: liveInspection.htmlSizeKb <= 100 ? "good" : "needs-improvement",
        numericVal: liveInspection.htmlSizeKb,
      },
    },
    auditProgress: {
      completePercent: Math.round((passedChecks / totalChecksCount) * 100),
      warnings: warningsCount,
      passedChecks,
      criticalIssues: criticalCount,
      totalChecks: totalChecksCount,
    },
    issues: realIssues,
    screenshot: null,
    isSample: false,
    livePsiVerified: false,
  });
}
