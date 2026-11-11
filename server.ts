import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import {
  validateSafePublicUrl,
  createAgencySession,
  isValidAgencySession,
  extractTokenFromReq,
  requireAgencyAuth,
  checkRateLimit,
  resetRateLimit,
  initAgencyPin,
  getAgencyPin,
  pinsEqual,
  sessionCookie,
  clearSessionCookie,
} from "./server/security";
import {
  db,
  saveDb,
  LeadRecord,
  AgencyClient,
  MonitoredDomain,
} from "./server/database";
import { performDeepLiveSeoInspection } from "./server/seoCrawler";
import {
  performRealDomainCheck,
  startMonitoringScheduler,
} from "./server/monitoringService";

dotenv.config();
const APP_MODE: "public" | "agency" = process.env.APP_MODE === "public" ? "public" : "agency";
if (APP_MODE === "agency") initAgencyPin();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

// Server-side Gemini AI setup
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "novopix-scanner", timestamp: new Date().toISOString() });
});

// Start real 24/7 background monitoring scheduler
app.get("/api/config", (_req, res) => {
  res.json({ mode: APP_MODE });
});

// --- Public scanner mode: no CRM, no auth, no data. Leads are forwarded to the agency service. ---
async function forwardToAgency(pathname: string, method: "GET" | "POST", body?: unknown) {
  const base = String(process.env.AGENCY_API_URL || "").replace(/\/$/, "");
  const token = String(process.env.INTERNAL_TOKEN || "");
  if (!base || token.length < 24) throw new Error("AGENCY_API_URL / INTERNAL_TOKEN not configured");
  const r = await fetch(base + pathname, {
    method,
    headers: { "content-type": "application/json", "x-internal-token": token },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    signal: AbortSignal.timeout(65000),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

if (APP_MODE === "public") {
  const relay = (path: string, bucket: string, max: number) => async (req: any, res: any) => {
    const limit = checkRateLimit(`${bucket}_${req.ip || "local"}`, max, 10 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." });
    try {
      const out = await forwardToAgency(path, "POST", req.body);
      return res.status(out.status).json(out.data);
    } catch {
      return res.status(502).json({ error: "Nie udało się przekazać zgłoszenia do agencji. Spróbuj ponownie za minutę lub napisz na contact@pepsafe.info." });
    }
  };
  app.post("/api/contact", relay("/api/internal/contact", "contact", 10));
  app.post("/api/crm/accept-proposal", relay("/api/internal/accept-proposal", "accept", 10));
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const id = encodeURIComponent(req.params.id);
      const out = await forwardToAgency(`/api/proposals/${id}`, "GET");
      return res.status(out.status).json(out.data);
    } catch {
      return res.status(502).json({ error: "Raport chwilowo niedostępny." });
    }
  });
  app.get("/api/auth/status", (_req, res) => res.json({ authenticated: false, isDefaultPinWarning: false }));
  app.use(["/api/auth", "/api/settings", "/api/crm", "/api/leads", "/api/monitoring", "/api/proposals", "/api/internal"], (_req, res) =>
    res.status(404).json({ error: "Not available on the public scanner." })
  );
}

if (APP_MODE === "agency") startMonitoringScheduler();

// --- Auth & Security Status Endpoints ---
app.get("/api/auth/status", (req, res) => {
  const token = extractTokenFromReq(req);
  const authenticated = isValidAgencySession(token);
  const actualPin = getAgencyPin();
  const isDefaultPinWarning = false;
  return res.json({
    authenticated,
    isDefaultPinWarning,
    lastSavedAt: db.lastSavedAt,
  });
});

app.post("/api/settings/verify-pin", (req, res) => {
  const clientIp = req.ip || "local";
  const rateKey = `pin_${clientIp}`;
  const limit = checkRateLimit(rateKey, 5, 15 * 60 * 1000); // max 5 attempts per 15 min
  if (!limit.allowed) {
    return res.status(429).json({
      valid: false,
      error: `Zbyt wiele nieudanych prób logowania. Odczekaj ${limit.retryAfterSec} s przed kolejną próbą.`,
    });
  }

  const { pin } = req.body;
  const submitted = String(pin || "").trim();
  const actualPin = getAgencyPin();

  if (pinsEqual(submitted, actualPin)) {
    resetRateLimit(rateKey);
    const session = createAgencySession(clientIp);
    const isDefaultPinWarning = false;
    res.setHeader("Set-Cookie", sessionCookie(session.token));
    return res.json({
      valid: true,
      token: session.token,
      expiresAt: session.expiresAt,
      isDefaultPinWarning,
    });
  }

  return res.status(401).json({
    valid: false,
    error: "Nieprawidłowy kod PIN administratora.",
  });
});

app.post("/api/settings/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.json({ ok: true });
});

app.post("/api/settings/change-pin", requireAgencyAuth, (_req, res) => {
  return res.status(400).json({
    error: "PIN jest ustawiony w zmiennej środowiskowej AGENCY_PIN. Zmień go w ustawieniach hostingu i zrestartuj aplikację.",
  });
});

// --- AI Growth Advisor & Sales Pitch Endpoint (Legally Safe Engineering Claims) ---
app.post("/api/ai-advisor", async (req, res) => {
  // Ochrona klucza AI: limit na IP (8 / 10 min) i dzienny limit całkowity (300).
  const advisorIp = req.ip || "local";
  const perIp = checkRateLimit(`advisor_${advisorIp}`, 8, 10 * 60 * 1000);
  const total = checkRateLimit("advisor_total", 300, 24 * 60 * 60 * 1000);
  if (!perIp.allowed || !total.allowed) {
    const wait = !perIp.allowed ? perIp.retryAfterSec : total.retryAfterSec;
    return res.status(429).json({ error: `Limit zapytań AI Advisor. Spróbuj ponownie za ${wait} s.` });
  }
  try {
    const {
      website,
      overallScore,
      categories,
      coreWebVitals,
      opportunities,
      seoData,
      hourlyRate = 150,
      currency = "PLN",
      language = "pl",
    } = req.body;

    const isPl = language === "pl";
    const score = overallScore ?? 65;
    const totalHours = 8;
    const suggestedPrice = totalHours * Number(hourlyRate || 150);

    const buildFallbackAdvisor = () => ({
      summary: isPl
        ? `Audyt techniczny domeny ${website || "klienta"} wykazał ogólny wskaźnik kondycji na poziomie ${score}/100 (Wydajność: ${categories?.performance ?? "N/A"}/100, SEO: ${categories?.seo ?? "N/A"}/100). Główne wąskie gardła to opóźnienia w renderowaniu największego elementu (LCP: ${coreWebVitals?.lcp?.displayValue || "do poprawy"}) oraz braki w semantycznej strukturze meta-tagów i nagłówków. Wdrożenie planu naprawczego skróci czas ładowania na urządzeniach mobilnych i poprawi widoczność w bezpłatnych wynikach wyszukiwania.`
        : `The technical audit of ${website || "the client website"} revealed an overall health index of ${score}/100 (Performance: ${categories?.performance ?? "N/A"}/100, SEO: ${categories?.seo ?? "N/A"}/100). Primary bottlenecks include Largest Contentful Paint delays (LCP: ${coreWebVitals?.lcp?.displayValue || "needs work"}) and gaps in semantic meta tags and heading hierarchy. Implementing this remediation plan will improve mobile loading speed and organic search visibility.`,
      businessLossAnalysis: isPl
        ? `Strony ładujące się wolniej na smartfonach częściej tracą niecierpliwych użytkowników przed wyświetleniem oferty. Ponadto algorytmy Google uwzględniają wskaźniki Core Web Vitals przy ocenie jakości strony, co wpływa na pozycje organiczne oraz koszt kliknięcia w kampaniach Google Ads.`
        : `Websites with slower mobile rendering typically lose more visitors before the offer loads. Additionally, Google algorithms factor Core Web Vitals into page experience signals, affecting organic rankings and Google Ads Quality Scores.`,
      topOpportunities: [
        {
          title: isPl ? "Optymalizacja ścieżki krytycznej LCP i kompresja AVIF/WebP" : "Critical Rendering Path & AVIF/WebP Compression",
          impact: isPl ? "Szybsze wyświetlenie głównej sekcji oferty na telefonach" : "Faster Hero section rendering on mobile devices",
          action: isPl ? "Wdrożenie priorytetyzacji fetchpriority='high' dla sekcji Hero, konwersja zasobów graficznych do AVIF oraz preload kluczowych czcionek." : "Implement fetchpriority='high' on Hero assets, convert images to AVIF, and preload critical fonts.",
          estimatedHours: 3.5,
          roiLift: "LCP ≤ 2.5s",
        },
        {
          title: isPl ? "Eliminacja blokujących zasobów JS/CSS i redukcja TBT" : "Eliminate Render-Blocking JS/CSS & Reduce TBT",
          impact: isPl ? "Płynniejsza reakcja formularzy i przycisków na dotyk" : "Smoother interactivity for forms and navigation",
          action: isPl ? "Wydzielenie krytycznego CSS (Critical CSS), odroczenie skryptów analitycznych (defer/async) i usunięcie nieużywanych pakietów JS." : "Extract Critical CSS, defer analytics scripts, and tree-shake unused JavaScript bundles.",
          estimatedHours: 3.0,
          roiLift: "TBT ≤ 200ms",
        },
        {
          title: isPl ? "Architektura Technicznego SEO (H1-H6, Meta, Schema.org)" : "Technical SEO Architecture (H1-H6, Meta, Schema.org)",
          impact: isPl ? "Lepsza indeksacja i czytelniejsza prezentacja w Google SERP" : "Improved crawlability and richer Google SERP snippets",
          action: isPl ? "Uporządkowanie hierarchii nagłówków H1-H3, wdrożenie danych strukturalnych JSON-LD (LocalBusiness/Product) oraz kanonicznych URL." : "Standardize H1-H3 hierarchy, deploy JSON-LD structured data, and enforce self-referencing canonical tags.",
          estimatedHours: 2.5,
          roiLift: "On-Page SEO",
        },
        {
          title: isPl ? "Audyt i poprawki dostępności zgodnie z kryteriami WCAG 2.1 AA" : "WCAG 2.1 AA Accessibility Remediation & Security Headers",
          impact: isPl ? "Lepsza dostępność dla czytników ekranu i wyższe bezpieczeństwo HTTP" : "Improved screen-reader accessibility and HTTP security posture",
          action: isPl ? "Korekta kontrastu tekstów, uzupełnienie atrybutów alt i ARIA oraz wdrożenie nagłówków HSTS, X-Frame-Options i CSP." : "Fix contrast ratios, populate missing alt/ARIA attributes, and configure HSTS & CSP security headers.",
          estimatedHours: 2.0,
          roiLift: "WCAG 2.1 AA",
        },
      ],
      remediationPlan: [
        {
          step: 1,
          title: isPl ? "Etap 1: Optymalizacja Wydajności i Zasobów (Dni 1–2)" : "Phase 1: Speed & Asset Optimization (Days 1–2)",
          desc: isPl ? "Kompresja obrazów do AVIF/WebP, konfiguracja pamięci podręcznej (Cache-Control, Brotli/Gzip) oraz odblokowanie głównego wątku przeglądarki." : "Convert media to AVIF/WebP, configure Brotli/Cache-Control headers, and unblock the main browser thread.",
        },
        {
          step: 2,
          title: isPl ? "Etap 2: Techniczne SEO, Schema.org i Kryteria WCAG 2.1 AA (Dni 3–5)" : "Phase 2: Technical SEO, Schema & WCAG 2.1 AA (Days 3–5)",
          desc: isPl ? "Przebudowa znaczników Title/Description, naprawa drzewa H1-H6, wdrożenie mapy witryny, danych JSON-LD oraz poprawek dostępności." : "Optimize Title/Description tags, restructure H1-H6 tree, deploy JSON-LD schema, and resolve WCAG 2.1 AA issues.",
        },
        {
          step: 3,
          title: isPl ? "Etap 3: Testy Regresji, Pomiar Przed/Po i Monitoring (Dzień 6+)" : "Phase 3: Regression QA, Before/After Report & Watchlist (Day 6+)",
          desc: isPl ? "Porównawczy raport pomiarowy przed i po wdrożeniu, zgłoszenie mapy witryny w Google Search Console i uruchomienie monitoringu." : "Comparative before/after benchmark report, sitemap submission in Search Console, and continuous monitoring.",
        },
      ],
      salesScripts: {
        coldEmail: isPl
          ? `Temat: Audyt techniczny strony ${website} – wykryte rezerwy szybkości i SEO\n\nDzień dobry,\n\nPrzeprowadziłem dziś audyt techniczny Państwa witryny ${website} w narzędziu diagnostycznym NovoPix Growth Scanner.\n\nObecny wynik techniczny strony wynosi ${score}/100 (czas ładowania głównej treści LCP: ${coreWebVitals?.lcp?.displayValue || "wymaga poprawy"}). Strona, która ładuje się wolniej na telefonach, zwykle traci część odwiedzających jeszcze przed wyświetleniem oferty, a błędy w strukturze nagłówków H1-H6 i meta tagach utrudniają budowanie pozycji w Google.\n\nPrzygotowałem szczegółowy raport z listą naprawczą oraz kosztorys prac inżynieryjnych (celujemy w wynik 90+ i raportujemy dokładne pomiary przed i po wdrożeniu; wycena zakresu prac to ${suggestedPrice} ${currency} netto).\n\nCzy mogę przesłać Państwu bezpłatny link do pełnego raportu?\n\nPozdrawiam serdecznie,\nNovoPix Digital Studio`
          : `Subject: Technical audit of ${website} – speed & SEO bottlenecks identified\n\nHi there,\n\nI ran a technical audit on ${website} today using the NovoPix Growth Scanner.\n\nYour site currently scores ${score}/100 (LCP: ${coreWebVitals?.lcp?.displayValue || "needs improvement"}). Sites that load slowly on mobile devices typically lose visitors before they see the offer, while missing meta and heading structures limit Google visibility.\n\nI've prepared a full remediation report and engineering quote (targeting 90+ scores with documented before/after measurements; turnkey scope is ${suggestedPrice} ${currency}).\n\nMay I send over your interactive report link?\n\nBest regards,\nNovoPix Digital Studio`,
        phonePitch: isPl
          ? `„Dzień dobry! Dzwonię, ponieważ wykonaliśmy techniczny przegląd Państwa strony ${website} pod kątem wskaźników Google Core Web Vitals oraz SEO. Obecny wynik to ${score} na 100 punktów. Zidentyfikowaliśmy konkretne elementy — m.in. nieskompresowane zasoby i blokujące skrypty — które spowalniają działanie strony na telefonach. Mamy rozpisany plan naprawczy na około ${totalHours} roboczogodzin, w którym celujemy w wynik 90+ i przekazujemy pełny raport pomiarowy przed i po wdrożeniu.”`
          : `“Hello! I'm calling because we audited ${website} against Google's Core Web Vitals and technical SEO criteria. Your site currently scores ${score} out of 100. We identified specific bottlenecks slowing down mobile loading and prepared an engineering remediation plan of roughly ${totalHours} hours, targeting 90+ scores with documented before-and-after measurements.”`,
        objectionHandler: isPl
          ? `Gdy klient mówi: „Mam już raport, mój informatyk albo tańszy wykonawca zrobi to za 500 zł”:\n\n„Oczywiście, raport pokazuje diagnozę techniczną — dokładnie tak jak badanie diagnostyczne pokazuje przyczyny problemu. Różnica polega na tym, że doraźna poprawka za 500 zł często ogranicza się do instalacji gotowej wtyczki cachującej, co bywa przyczyną błędów w formularzach lub koszyku. W naszym kosztorysie (${suggestedPrice} ${currency}) inżynierowie optymalizują kod źródłowy, obrazy AVIF/WebP, strukturę H1-H6, dane Schema.org oraz wykonują testy regresji wraz z raportem porównawczym przed i po wdrożeniu.”`
          : `When the client says: “I have the report now, I'll hire someone cheaper to install a plugin”:\n\n“Absolutely—our report provides the technical diagnosis. However, a cheap quick-fix usually relies on a generic caching plugin that can break forms or scripts without resolving the underlying DOM and asset bottlenecks. For ${suggestedPrice} ${currency}, we refactor the critical rendering path, media formats, and technical SEO schema with full regression testing and a documented before/after report.”`,
      },
      clientPitch: isPl
        ? `„Przeprowadziliśmy szczegółową analizę techniczną strony ${website || ""}. Aktualny wskaźnik kondycji wynosi ${score}/100. Przygotowaliśmy konkretny zakres prac inżynieryjnych z pomiarem przed i po wdrożeniu.”`
        : `“We completed a technical audit of ${website || "your website"}. Your current health score is ${score}/100. We have prepared a structured engineering scope with documented before-and-after measurements.”`,
      estimatedRoi: isPl
        ? `Krótszy czas ładowania i uporządkowane techniczne SEO zmniejszają współczynnik odrzuceń na urządzeniach mobilnych`
        : `Faster load times and clean technical SEO reduce mobile bounce rates and improve search crawlability`,
    });

    if (!ai) {
      return res.json({ advisor: buildFallbackAdvisor() });
    }

    const prompt = `You are a Principal Web Performance & Technical SEO Agency Strategist at NovoPix Digital Studio.
Analyze this audited website and generate a factual, legally compliant agency strategy and sales pitch kit.
IMPORTANT LEGAL & ETHICAL RULES:
1. NEVER promise guaranteed specific financial revenue numbers or fixed conversion lift percentages as a certainty. Instead, explain that faster websites typically lose fewer visitors and improve user experience.
2. NEVER promise a "written guarantee of 90+ score" ("pisemna gwarancja wyniku 90+"). Instead say "celujemy w wynik 90+ i raportujemy zmiany przed i po wdrożeniu" ("we target 90+ and provide before/after measurement reports").
3. NEVER use the phrase "WCAG certification" ("certyfikacja WCAG"). Instead say "audyt i poprawki zgodne z kryteriami WCAG 2.1 AA" ("audit and remediation aligned with WCAG 2.1 AA criteria").

Website: ${website}
Overall Score: ${score}/100
Categories: Performance ${categories?.performance}/100, SEO ${categories?.seo}/100, Accessibility ${categories?.accessibility}/100, Best Practices ${categories?.bestPractices}/100
Core Web Vitals: LCP ${coreWebVitals?.lcp?.displayValue}, INP ${coreWebVitals?.inp?.displayValue}, CLS ${coreWebVitals?.cls?.displayValue}, FCP ${coreWebVitals?.fcp?.displayValue}
Detected Issues: ${JSON.stringify(opportunities || [])}
Live SEO HTML Inspection: ${JSON.stringify(seoData || {})}
Agency Hourly Rate: ${hourlyRate} ${currency}
Language: ${isPl ? "Polish (Polski)" : "English"}

Respond strictly in JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            businessLossAnalysis: { type: Type.STRING },
            topOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  action: { type: Type.STRING },
                  estimatedHours: { type: Type.NUMBER },
                  roiLift: { type: Type.STRING },
                },
                required: ["title", "impact", "action", "estimatedHours", "roiLift"],
              },
            },
            remediationPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                },
                required: ["step", "title", "desc"],
              },
            },
            salesScripts: {
              type: Type.OBJECT,
              properties: {
                coldEmail: { type: Type.STRING },
                phonePitch: { type: Type.STRING },
                objectionHandler: { type: Type.STRING },
              },
              required: ["coldEmail", "phonePitch", "objectionHandler"],
            },
            clientPitch: { type: Type.STRING },
            estimatedRoi: { type: Type.STRING },
          },
          required: [
            "summary",
            "businessLossAnalysis",
            "topOpportunities",
            "remediationPlan",
            "salesScripts",
            "clientPitch",
            "estimatedRoi",
          ],
        },
      },
    });

    const jsonStr = (response.text ?? "{}").trim();
    const advisorData = JSON.parse(jsonStr);
    return res.json({ advisor: advisorData });
  } catch (err: any) {
    console.warn("AI Advisor fallback used:", err?.message);
    return res.json({
      advisor: {
        summary: `Audyt techniczny domeny ${req.body?.website || ""} wykazał wynik ${req.body?.overallScore || 65}/100. Optymalizacja wskaźników Core Web Vitals oraz uporządkowanie struktury H1-H6 i meta tagów poprawi szybkość ładowania na urządzeniach mobilnych oraz czytelność dla robotów Google.`,
        businessLossAnalysis:
          "Strony ładujące się wolniej na urządzeniach mobilnych częściej tracą odwiedzających przed zapoznaniem się z ofertą.",
        topOpportunities: [
          {
            title: "Optymalizacja LCP i wdrożenie formatów AVIF/WebP",
            impact: "Krótszy czas renderowania głównej sekcji strony",
            action: "Kompresja grafik Hero i dodanie priorytetu fetchpriority='high'.",
            estimatedHours: 3.5,
            roiLift: "LCP ≤ 2.5s",
          },
          {
            title: "Odblokowanie wątku głównego JS/CSS",
            impact: "Szybsza interaktywność formularzy i przycisków",
            action: "Zastosowanie atrybutów defer/async oraz wydzielenie Critical CSS.",
            estimatedHours: 3.0,
            roiLift: "TBT ≤ 200ms",
          },
          {
            title: "Struktura SEO H1-H6, Meta & Schema.org",
            impact: "Lepsze dopasowanie do wymogów indeksacji Google",
            action: "Uzupełnienie unikalnych meta opisów, nagłówków H1 i danych JSON-LD.",
            estimatedHours: 2.5,
            roiLift: "On-Page SEO",
          },
        ],
        remediationPlan: [
          { step: 1, title: "Etap 1: Optymalizacja Szybkości (Dni 1-2)", desc: "Kompresja zasobów, wdrożenie AVIF i odroczenie skryptów blokujących." },
          { step: 2, title: "Etap 2: Techniczne SEO & Kryteria WCAG 2.1 AA (Dni 3-5)", desc: "Uporządkowanie nagłówków H1-H6, meta tagów, Schema.org i kontrastu AA." },
          { step: 3, title: "Etap 3: Raport Pomiarowy Przed i Po + Monitoring", desc: "Weryfikacja wyników przed i po wdrożeniu oraz uruchomienie monitoringu." },
        ],
        salesScripts: {
          coldEmail: `Dzień dobry,\n\nWykonaliśmy audyt techniczny strony ${req.body?.website || ""} (wynik: ${req.body?.overallScore || 65}/100). Przygotowaliśmy listę naprawczą ukierunkowaną na wynik 90+ z raportem pomiarowym przed i po wdrożeniu.`,
          phonePitch: `„Państwa strona uzyskała ${req.body?.overallScore || 65}/100 pkt w teście technicznym. Przygotowaliśmy plan naprawczy z pomiarem przed i po wdrożeniu.”`,
          objectionHandler: `„Nasz kosztorys obejmuje przebudowę zasobów w kodzie oraz testy regresji i raport przed/po, a nie tylko instalację automatycznej wtyczki.”`,
        },
        clientPitch: `Optymalizacja inżynieryjna strony ${req.body?.website || ""} ukierunkowana na wynik 90+ z raportem przed i po wdrożeniu.`,
        estimatedRoi: "Mniejsza utrata odwiedzających na telefonach i lepsza indeksacja w Google",
      },
    });
  }
});

// --- Deep Live HTML, Technical SEO, CMS Detection & Subpage Crawler (POST /api/seo-check) ---
app.post("/api/seo-check", async (req, res) => {
  const clientIp = req.ip || "local";
  const limit = checkRateLimit(`seocheck_${clientIp}`, 35, 5 * 60 * 1000);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Przekroczono limit zapytań skanera. Odczekaj ${limit.retryAfterSec} s.`,
    });
  }

  const check = validateSafePublicUrl(req.body?.url);
  if (!check.valid || !check.normalizedUrl) {
    return res.status(400).json({
      error: check.error || "Nieprawidłowy lub zablokowany adres URL.",
    });
  }

  const inspection = await performDeepLiveSeoInspection(check.normalizedUrl);
  return res.json(inspection);
});

// --- Public Lead Submission (POST /api/contact) ---
async function handleContact(req: any, res: any, internal = false) {
  try {
    const clientIp = req.ip || "local";
    const limit = internal ? { allowed: true } : checkRateLimit(`contact_${clientIp}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return res.status(429).json({ error: "Zbyt wiele wysłanych formularzy. Spróbuj ponownie za chwilę." });
    }

    const { name, email, phone, website, details, overallScore, scores, cwv, isSample, hp, estimatedBudget } = req.body;

    if (hp && String(hp).trim().length > 0) {
      return res.status(200).json({ success: true, ignored: true });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
      return res.status(400).json({ error: "Podaj prawidłowy adres e-mail." });
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const record: LeadRecord = {
      id: leadId,
      timestamp,
      name: name ? String(name).trim() : null,
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      website: website || "N/A",
      details: details ? String(details).trim() : "",
      overallScore: overallScore ?? null,
      scores: scores || {},
      cwv: cwv || {},
      isSample: !!isSample,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    };

    db.leads.unshift(record);

    const newClient: AgencyClient = {
      id: `cli_${Date.now()}`,
      name: record.name || "Klient ze Skanera",
      company: (record.website || "Domena").replace(/^https?:\/\//, "").split("/")[0],
      email: record.email,
      phone: record.phone || "-",
      website: record.website,
      status: "lead",
      contractValue: Number(estimatedBudget) || 1200,
      hourlyRate: 150,
      estimatedHours: 8,
      retainerFee: 300,
      addedAt: timestamp,
      lastScore: record.overallScore || 0,
      notes: record.details || "Nowe zapytanie ofertowe z formularza audytu.",
      activityLog: [
        {
          id: `act_${Date.now()}`,
          timestamp,
          type: "audit",
          summary: `Klient wysłał formularz zapytania (wynik: ${record.overallScore ?? "N/A"}/100, budżet: ${Number(estimatedBudget) || 1200})`,
        },
      ],
    };

    db.agencyClients.unshift(newClient);
    saveDb();

    return res.status(200).json({ success: true, leadId });
  } catch (err: any) {
    return res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
  }
}

// --- Protected Agency CRM Endpoints (Require Valid Agency Session Token) ---
app.get("/api/crm/clients", requireAgencyAuth, (_req, res) => {
  res.json({ clients: db.agencyClients, total: db.agencyClients.length });
});

app.post("/api/crm/clients", requireAgencyAuth, (req, res) => {
  const { name, company, email, phone, website, contractValue, hourlyRate, estimatedHours, retainerFee, lastScore, notes, cmsTech } = req.body;
  const hrs = Number(estimatedHours) || 8;
  const rate = Number(hourlyRate) || 150;
  const now = new Date().toISOString();
  const newClient: AgencyClient = {
    id: `cli_${Date.now()}`,
    name: name || "Nowy Klient",
    company: company || (website ? String(website).replace(/^https?:\/\//, "").split("/")[0] : "Firma"),
    email: email || "kontakt@firma.pl",
    phone: phone || "-",
    website: website || "https://example.com",
    status: "lead",
    contractValue: Number(contractValue) || hrs * rate,
    hourlyRate: rate,
    estimatedHours: hrs,
    retainerFee: Number(retainerFee) || 300,
    addedAt: now,
    lastScore: Number(lastScore) || 0,
    cmsTech: cmsTech || "Wykrywanie...",
    notes: notes || "",
    activityLog: [
      {
        id: `act_${Date.now()}`,
        timestamp: now,
        type: "note",
        summary: `Utworzono kartę klienta w CRM (wycena: ${Number(contractValue) || hrs * rate} netto, ${hrs} rbh)`,
      },
    ],
  };
  db.agencyClients.unshift(newClient);
  saveDb();
  res.json({ success: true, client: newClient });
});

app.put("/api/crm/clients/:id", requireAgencyAuth, (req, res) => {
  const { id } = req.params;
  const { status, notes, contractValue, hourlyRate, estimatedHours, retainerFee, lastScore, activityNote } = req.body;
  const client = db.agencyClients.find((c) => c.id === id);
  if (client) {
    if (!Array.isArray(client.activityLog)) {
      client.activityLog = [];
    }
    if (status && status !== client.status) {
      client.activityLog.unshift({
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "status_change",
        summary: `Zmiana etapu lejka: ${client.status} → ${status}`,
      });
      client.status = status;
    }
    if (activityNote && String(activityNote).trim()) {
      client.activityLog.unshift({
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "note",
        summary: String(activityNote).trim(),
      });
    }
    if (notes !== undefined) client.notes = notes;
    if (contractValue !== undefined) client.contractValue = Number(contractValue);
    if (hourlyRate !== undefined) client.hourlyRate = Number(hourlyRate);
    if (estimatedHours !== undefined) client.estimatedHours = Number(estimatedHours);
    if (retainerFee !== undefined) client.retainerFee = Number(retainerFee);
    if (lastScore !== undefined) client.lastScore = Number(lastScore);
    saveDb();
    return res.json({ success: true, client });
  }
  return res.status(404).json({ error: "Client not found" });
});

app.delete("/api/crm/clients/:id", requireAgencyAuth, (req, res) => {
  const { id } = req.params;
  const idx = db.agencyClients.findIndex((c) => c.id === id);
  if (idx !== -1) {
    db.agencyClients.splice(idx, 1);
    saveDb();
    return res.json({ success: true });
  }
  return res.status(404).json({ error: "Client not found" });
});

// Download full atomic JSON backup of CRM & Monitoring database (Agency Auth Required)
app.get("/api/crm/backup", requireAgencyAuth, (_req, res) => {
  saveDb(true);
  const safeExport = {
    exportedAt: new Date().toISOString(),
    leads: db.leads,
    agencyClients: db.agencyClients,
    monitoredDomains: db.monitoredDomains,
    proposalsCount: Object.keys(db.proposals).length,
  };
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="novopix-crm-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return res.send(JSON.stringify(safeExport, null, 2));
});

app.get("/api/leads", requireAgencyAuth, (_req, res) => {
  res.json({ leads: db.leads, total: db.leads.length });
});

// --- Public 1-Click Client Proposal Acceptance (POST /api/crm/accept-proposal) ---
function handleAcceptProposal(req: any, res: any, internal = false) {
  const clientIp = req.ip || "local";
  const limit = internal ? { allowed: true } : checkRateLimit(`accept_${clientIp}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return res.status(429).json({ error: "Zbyt wiele żądań. Odczekaj chwilę." });
  }

  const { name, company, email, phone, website, contractValue, hourlyRate, estimatedHours, retainerFee, lastScore, selectedTasks } = req.body;
  const cleanWeb = String(website || "https://example.com").trim();
  const existing = db.agencyClients.find((c) => c.website.replace(/\/$/, "") === cleanWeb.replace(/\/$/, ""));

  const taskSummary = Array.isArray(selectedTasks) && selectedTasks.length > 0 ? ` Zakres: ${selectedTasks.join(", ")}.` : "";
  const now = new Date().toISOString();

  if (existing) {
    existing.status = "proposal_accepted";
    if (name) existing.name = name;
    if (company) existing.company = company;
    if (email) existing.email = email;
    if (phone) existing.phone = phone;
    if (contractValue) existing.contractValue = Number(contractValue);
    if (hourlyRate) existing.hourlyRate = Number(hourlyRate);
    if (estimatedHours) existing.estimatedHours = Number(estimatedHours);
    if (retainerFee !== undefined) existing.retainerFee = Number(retainerFee);
    existing.notes = `[OFERTA ZAAKCEPTOWANA PRZEZ KLIENTA ONLINE] Kwota: ${contractValue} (${estimatedHours}h).${taskSummary}`;
    if (!Array.isArray(existing.activityLog)) existing.activityLog = [];
    existing.activityLog.unshift({
      id: `act_${Date.now()}`,
      timestamp: now,
      type: "proposal_accepted",
      summary: `Klient zaakceptował ofertę online (${contractValue} netto, ${estimatedHours} rbh)`,
    });
    saveDb(true);
    return res.json({ success: true });
  }

  const acceptedClient: AgencyClient = {
    id: `cli_${Date.now()}`,
    name: name || "Klient (Akceptacja Online)",
    company: company || cleanWeb.replace(/^https?:\/\//, "").split("/")[0].toUpperCase(),
    email: email || "akceptacja@klient.pl",
    phone: phone || "-",
    website: cleanWeb,
    status: "proposal_accepted",
    contractValue: Number(contractValue) || 1350,
    hourlyRate: Number(hourlyRate) || 150,
    estimatedHours: Number(estimatedHours) || 9,
    retainerFee: Number(retainerFee) || 300,
    addedAt: now,
    lastScore: Number(lastScore) || 0,
    notes: `[OFERTA ZAAKCEPTOWANA PRZEZ KLIENTA ONLINE] Kwota: ${contractValue} (${estimatedHours}h).${taskSummary}`,
    activityLog: [
      {
        id: `act_${Date.now()}`,
        timestamp: now,
        type: "proposal_accepted",
        summary: `Klient zaakceptował ofertę w Client Deal Room (${contractValue} netto, ${estimatedHours} rbh)`,
      },
    ],
  };

  db.agencyClients.unshift(acceptedClient);
  saveDb(true);
  return res.json({ success: true });
}

function requireInternal(req: any, res: any, next: any) {
  const expected = String(process.env.INTERNAL_TOKEN || "");
  const got = String(req.headers["x-internal-token"] || "");
  if (expected.length < 24 || !pinsEqual(got, expected)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

if (APP_MODE === "agency") {
  app.post("/api/contact", (req, res) => handleContact(req, res));
  app.post("/api/crm/accept-proposal", (req, res) => handleAcceptProposal(req, res));
  app.post("/api/internal/contact", requireInternal, (req, res) => handleContact(req, res, true));
  app.post("/api/internal/accept-proposal", requireInternal, (req, res) => handleAcceptProposal(req, res, true));
}

// --- 1:1 Client Proposal Snapshot Storage (POST & GET /api/proposals) ---
// --- Proposals with human review: draft -> approved (only approved ones are visible to clients) ---
function proposalFingerprint(p: any): string {
  return crypto.createHash("sha256").update(JSON.stringify({ r: p.report, t: p.scopeTasks, h: p.hourlyRate, c: p.currency, n: p.customOfferNote })).digest("hex").slice(0, 16);
}

app.post("/api/proposals", requireAgencyAuth, (req, res) => {
  try {
    const snapshot = req.body || {};
    const existing = typeof snapshot.id === "string" ? db.proposals[snapshot.id] : undefined;
    const id = existing ? snapshot.id : `prop_${crypto.randomBytes(12).toString("hex")}`;
    const { status: _s, approvedBy: _a, approvedAt: _t, reviewLog: _l, ...content } = snapshot;
    const next: any = {
      ...content,
      id,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      reviewLog: [...(existing?.reviewLog || []), { at: new Date().toISOString(), action: "saved_draft" }],
    };
    // Any change of content after approval requires a new review.
    if (existing?.status === "approved" && proposalFingerprint(existing) === proposalFingerprint(next)) {
      next.status = "approved";
      next.approvedBy = existing.approvedBy;
      next.approvedAt = existing.approvedAt;
    }
    db.proposals[id] = next;
    saveDb();
    return res.json({ success: true, id, status: next.status });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to save proposal snapshot" });
  }
});

app.post("/api/proposals/:id/approve", requireAgencyAuth, (req, res) => {
  const found = db.proposals[req.params.id];
  if (!found) return res.status(404).json({ error: "Nie znaleziono oferty." });
  const reviewer = String(req.body?.reviewer || "").trim();
  if (reviewer.length < 3 || reviewer.length > 80) {
    return res.status(400).json({ error: "Podaj imię i nazwisko osoby zatwierdzającej (min. 3 znaki)." });
  }
  found.status = "approved";
  found.approvedBy = reviewer;
  found.approvedAt = new Date().toISOString();
  found.reviewLog = [...(found.reviewLog || []), { at: found.approvedAt, action: "approved", by: reviewer, fingerprint: proposalFingerprint(found) }];
  saveDb(true);
  return res.json({ success: true, id: found.id, status: "approved", approvedBy: reviewer, approvedAt: found.approvedAt });
});

app.get("/api/proposals/:id", (req, res) => {
  const found = db.proposals[req.params.id];
  if (!found) {
    return res.status(404).json({ error: "Proposal snapshot not found" });
  }
  const isAgency = isValidAgencySession(extractTokenFromReq(req));
  if (found.status !== "approved" && !isAgency) {
    return res.status(403).json({ error: "Ten raport nie został jeszcze zatwierdzony przez agencję.", code: "NOT_APPROVED" });
  }
  const { reviewLog: _log, ...publicView } = found;
  return res.json({ proposal: isAgency ? found : publicView });
});

// --- Protected 24/7 Domain Monitoring Watchlist Endpoints ---
app.get("/api/monitoring", requireAgencyAuth, (_req, res) => {
  res.json({
    domains: db.monitoredDomains,
    total: db.monitoredDomains.length,
    schedulerActive: true,
  });
});

app.post("/api/monitoring/add", requireAgencyAuth, async (req, res) => {
  const { domain, clientName, interval = "daily", threshold = 80 } = req.body;
  const check = validateSafePublicUrl(domain);
  if (!check.valid || !check.normalizedUrl) {
    return res.status(400).json({ error: check.error || "Podaj prawidłową domenę publiczną." });
  }

  const target = check.normalizedUrl;
  const thr = Number(threshold) || 80;

  const newMonitored: MonitoredDomain = {
    id: `dom_${Date.now()}`,
    domain: target,
    clientName: clientName || target.replace(/^https?:\/\//, "").split("/")[0],
    interval,
    threshold: thr,
    lastCheck: new Date().toISOString(),
    lastScore: 0,
    performanceScore: 0,
    seoScore: 0,
    uptimePercent: 100,
    responseTimeMs: 0,
    httpStatus: 200,
    totalChecks: 0,
    successfulChecks: 0,
    status: "healthy",
    history: [],
    alertsLog: [],
  };

  // Run an immediate REAL check before adding so initial metrics are 100% real!
  await performRealDomainCheck(newMonitored);

  db.monitoredDomains.unshift(newMonitored);
  saveDb();
  res.json({ success: true, domain: newMonitored });
});

app.post("/api/monitoring/check/:id", requireAgencyAuth, async (req, res) => {
  const { id } = req.params;
  const dom = db.monitoredDomains.find((d) => d.id === id);
  if (!dom) return res.status(404).json({ error: "Monitored domain not found" });

  const updated = await performRealDomainCheck(dom);
  return res.json({ success: true, domain: updated });
});

app.delete("/api/monitoring/:id", requireAgencyAuth, (req, res) => {
  const { id } = req.params;
  const idx = db.monitoredDomains.findIndex((d) => d.id === id);
  if (idx !== -1) {
    db.monitoredDomains.splice(idx, 1);
    saveDb();
    return res.json({ success: true });
  }
  return res.status(404).json({ error: "Not found" });
});

// --- Live Scan Endpoint with 3 Authentic Measurement States (POST /api/scan) ---
// State 1: "live_lighthouse" — Full Google PageSpeed Insights Lighthouse lab + field data
// State 2: "partial_html"   — Live HTTP/HTML DOM measurement when PSI API quota/WAF blocks Lighthouse
// State 3: "failed"         — Target domain unreachable (zero fabricated/hash scores!)
app.post("/api/scan", async (req, res) => {
  const clientIp = req.ip || "local";
  const limit = checkRateLimit(`scan_${clientIp}`, 30, 5 * 60 * 1000);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Przekroczono limit skanowania. Odczekaj ${limit.retryAfterSec} s.`,
    });
  }

  const { url, strategy = "mobile" } = req.body;
  const urlValidation = validateSafePublicUrl(url);
  if (!urlValidation.valid || !urlValidation.normalizedUrl) {
    return res.status(400).json({
      error: urlValidation.error || "Nieprawidłowy adres URL.",
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
              ? "Krytyczne wąskie gardło wydajności wykryte w teście Google Lighthouse"
              : "Element wymagający optymalizacji w celu poprawy wskaźników Core Web Vitals",
          developerFix:
            "Optymalizacja zasobu zgodnie z wytycznymi raportu Google Lighthouse (kompresja, priorytetyzacja lub redukcja blokowania wątku głównego).",
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
        : "Brak danych CrUX";

      return res.json({
        scannedUrl: url,
        finalUrl: lighthouse.finalUrl || targetUrl,
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
            description: "Rzeczywisty czas renderowania największego elementu w oknie widoku (Lighthouse).",
            displayValue: audits["largest-contentful-paint"]?.displayValue || "Brak pomiaru",
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
              ? "Rzeczywista responsywność na interakcje użytkowników (dane polowe CrUX)."
              : "Laboratoryjny ekwiwalent responsywności wątku głównego (Max Potential FID).",
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
            description: "Rzeczywista stabilność wizualna układu strony podczas ładowania (Lighthouse).",
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
            description: "Rzeczywisty czas pojawienia się pierwszego tekstu lub obrazu (Lighthouse).",
            displayValue: audits["first-contentful-paint"]?.displayValue || "Brak pomiaru",
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
            description: "Rzeczywista suma czasu zablokowania głównego wątku przez skrypty JS (Lighthouse).",
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
      error: `Brak możliwości wykonania pomiaru: badana domena (${targetUrl}) nie odpowiada lub odrzuciła połączenie (${liveInspection.error || "błąd sieci"}). Nie generujemy symulowanych wyników.`,
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
      title: `Korekta znacznika <title> (zmierzona długość: ${liveInspection.title.length} znaków)`,
      description: liveInspection.title.text
        ? `Obecny tytuł "${liveInspection.title.text}" ma ${liveInspection.title.length} znaków (zalecane 30–65 znaków).`
        : "Brak znacznika <title> w pobranym kodzie HTML strony.",
      displayValue: `${liveInspection.title.length} zn.`,
      priority: liveInspection.title.text ? "medium" : "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.0,
      businessImpact: "Wpływa bezpośrednio na ocenę trafności strony i klikalność (CTR) w wynikach Google.",
      developerFix: "Ustaw unikalny znacznik <title> o długości 50–60 znaków zawierający główną frazę kluczową.",
    });
  }

  if (liveInspection.description.status === "good") {
    passedChecks++;
  } else {
    measuredSeo -= 15;
    warningsCount++;
    realIssues.push({
      id: "measured-meta-description",
      title: `Optymalizacja Meta Description (zmierzona długość: ${liveInspection.description.length} znaków)`,
      description: liveInspection.description.text
        ? `Opis meta ma ${liveInspection.description.length} znaków (optymalny zakres to 110–165 znaków).`
        : "Brak znacznika <meta name='description'> w kodzie HTML strony.",
      displayValue: `${liveInspection.description.length} zn.`,
      priority: liveInspection.description.text ? "medium" : "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: "Brak zoptymalizowanego opisu meta sprawia, że Google wyświetla przypadkowy fragment tekstu.",
      developerFix: "Dodaj unikalny znacznik <meta name='description'> o długości 140–160 znaków z wezwaniem do działania.",
    });
  }

  if (liveInspection.headings.h1 === 1) {
    passedChecks++;
  } else {
    measuredSeo -= 18;
    criticalCount++;
    realIssues.push({
      id: "measured-h1-structure",
      title: `Nieprawidłowa liczba nagłówków <h1> w kodzie DOM (wykryto: ${liveInspection.headings.h1}x)`,
      description:
        liveInspection.headings.h1 === 0
          ? "Na badanej stronie brakuje głównego nagłówka <h1>."
          : `Wykryto ${liveInspection.headings.h1} nagłówków <h1> na jednej stronie, co rozmywa główny temat dokumentu.`,
      displayValue: `${liveInspection.headings.h1}x H1`,
      priority: "high",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: "Utrudnia robotom wyszukiwarek jednoznaczną identyfikację głównego tematu podstrony.",
      developerFix: "Pozostaw dokładnie jeden nagłówek <h1> na podstronie, a pozostałe zamień na <h2>/<h3>.",
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
      title: "Brak danych strukturalnych Schema.org (application/ld+json)",
      description: "W kodzie HTML nie wykryto żadnego bloku JSON-LD opisującego firmę, usługę lub produkt.",
      displayValue: "0x JSON-LD",
      priority: "medium",
      category: "seo",
      savingsMs: 0,
      estimatedHours: 2.0,
      businessImpact: "Brak szans na rozszerzone wyniki (Rich Snippets) w wyszukiwarce Google.",
      developerFix: "Wdróż skrypt <script type='application/ld+json'> ze schematem Organization / LocalBusiness.",
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
      title: `Obrazy bez atrybutu [alt] (zmierzono: ${liveInspection.images.missingAlt} z ${liveInspection.images.total} grafik)`,
      description: `W pobranym drzewie DOM wykryto ${liveInspection.images.missingAlt} elementów <img> pozbawionych opisu alternatywnego.`,
      displayValue: `${liveInspection.images.missingAlt} bez alt`,
      priority: liveInspection.images.missingAlt > 3 ? "high" : "medium",
      category: "accessibility",
      savingsMs: 0,
      estimatedHours: 1.5,
      businessImpact: "Naruszenie kryterium WCAG 2.1 AA (1.1.1) oraz słabsze indeksowanie w Google Grafika.",
      developerFix: "Uzupełnij opisowe atrybuty alt dla wszystkich grafik merytorycznych.",
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
      title: `Synchroniczne skrypty blokujące w <head> (zmierzono: ${liveInspection.scriptStats.renderBlockingScripts})`,
      description: `W sekcji <head> znaleziono ${liveInspection.scriptStats.renderBlockingScripts} zewnętrznych skryptów JS bez atrybutu defer lub async.`,
      displayValue: `${liveInspection.scriptStats.renderBlockingScripts} skryptów`,
      priority: "high",
      category: "performance",
      savingsMs: liveInspection.scriptStats.renderBlockingScripts * 120,
      estimatedHours: 2.5,
      businessImpact: "Zatrzymuje parsowanie drzewa DOM i opóźnia pierwsze wyświetlenie treści na ekranie.",
      developerFix: "Dodaj atrybuty defer lub async do znaczników <script> w sekcji <head>.",
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
    measurementStatus: "partial_html",
    measurementNote: `Częściowy pomiar rzeczywisty (Live HTML + HTTP): zmierzono prawdziwy kod DOM, TTFB (${liveInspection.responseTimeMs} ms), obrazy (${liveInspection.images.total}) i nagłówki. Pełny silnik laboratoryjny Google Lighthouse był niedostępny (${psiErrorReason || "limit zapytań API"}).`,
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
        name: "Largest Contentful Paint (Wymaga Lighthouse)",
        acronym: "LCP",
        target: "≤ 2.5 s",
        description: "W trybie częściowego pomiaru HTML zmierzono czas odpowiedzi serwera TTFB. Pełny pomiar LCP wymaga klucza Google PSI API.",
        displayValue: `TTFB: ${liveInspection.responseTimeMs} ms`,
        score: null,
        status: liveInspection.responseTimeMs <= 600 ? "good" : "needs-improvement",
        numericVal: liveInspection.responseTimeMs,
      },
      inp: {
        id: "inp",
        name: "Skrypty Blokujące w <head>",
        acronym: "INP / JS",
        target: "0 blokujących",
        description: "Liczba synchronicznych skryptów JS blokujących wątek główny w pobranym kodzie HTML.",
        displayValue: `${liveInspection.scriptStats?.renderBlockingScripts || 0} skryptów`,
        score: null,
        status: (liveInspection.scriptStats?.renderBlockingScripts || 0) === 0 ? "good" : "needs-improvement",
        numericVal: liveInspection.scriptStats?.renderBlockingScripts || 0,
      },
      cls: {
        id: "cls",
        name: "Cumulative Layout Shift",
        acronym: "CLS",
        target: "≤ 0.1",
        description: "Pomiar przesunięć układu wymaga renderowania w silniku przeglądarki Lighthouse.",
        displayValue: "Wymaga PSI API",
        score: null,
        status: "unavailable",
        numericVal: null,
      },
      fcp: {
        id: "fcp",
        name: "Czas Odpowiedzi Serwera (TTFB)",
        acronym: "TTFB",
        target: "≤ 400 ms",
        description: "Rzeczywisty zmierzony czas odpowiedzi HTTP badanej domeny.",
        displayValue: `${liveInspection.responseTimeMs} ms`,
        score: null,
        status: liveInspection.responseTimeMs <= 400 ? "good" : liveInspection.responseTimeMs <= 900 ? "needs-improvement" : "poor",
        numericVal: liveInspection.responseTimeMs,
      },
      tbt: {
        id: "tbt",
        name: "Rozmiar Dokumentu HTML",
        acronym: "HTML",
        target: "≤ 100 KB",
        description: "Rzeczywisty rozmiar pobranego dokumentu HTML.",
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
});


// Mount Vite in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 NovoPix Growth Scanner SaaS running on http://localhost:${PORT}`);
  });
}

startServer();
