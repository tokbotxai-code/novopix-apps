import { db, saveDb, MonitoredDomain, MonitoringAlertEntry } from "./database";
import { performDeepLiveSeoInspection } from "./seoCrawler";
import { sendMail, smtpConfigured, ALERT_RECIPIENT } from "./mailer";

const ALERT_REPEAT_MS = 6 * 60 * 60 * 1000; // ten sam typ alertu dla domeny nie częściej niż co 6 h
const today = () => new Date().toISOString().slice(0, 10);

function intervalToMs(interval: MonitoredDomain["interval"]): number {
  switch (interval) {
    case "5m":
      return 5 * 60 * 1000;
    case "15m":
      return 15 * 60 * 1000;
    case "60m":
      return 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "daily":
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export async function performRealDomainCheck(dom: MonitoredDomain): Promise<MonitoredDomain> {
  let inspection = await performDeepLiveSeoInspection(dom.domain);
  if (!inspection.isLiveFetch) {
    // Jedna ponowna próba po chwili, żeby chwilowy błąd sieci nie dawał fałszywego alarmu.
    await new Promise((r) => setTimeout(r, 3000));
    inspection = await performDeepLiveSeoInspection(dom.domain);
  }

  const isUp = inspection.isLiveFetch && inspection.responseTimeMs > 0;
  const totalChecks = (dom.totalChecks || 0) + 1;
  const successfulChecks = (dom.successfulChecks || 0) + (isUp ? 1 : 0);
  const uptimePercent = Number(((successfulChecks / totalChecks) * 100).toFixed(2));

  // Compute deterministic, real health score from live HTML + TTFB + Security headers (zero Math.random!)
  let realSeoScore = 100;
  if (!inspection.isLiveFetch) {
    realSeoScore = 0;
  } else {
    if (inspection.title.status !== "good") realSeoScore -= 12;
    if (inspection.description.status !== "good") realSeoScore -= 12;
    if (inspection.headings.h1 !== 1) realSeoScore -= 14;
    if (inspection.images.missingAlt > 0) realSeoScore -= Math.min(18, inspection.images.missingAlt * 3);
    if (!inspection.indexing.hasRobotsTxt) realSeoScore -= 6;
    if (!inspection.indexing.hasSitemapXml) realSeoScore -= 8;
    if (inspection.social.schemaJsonLdCount === 0) realSeoScore -= 8;
    realSeoScore = Math.max(20, realSeoScore);
  }

  let realPerfEstimate = 100;
  if (!inspection.isLiveFetch) {
    realPerfEstimate = 0;
  } else {
    const ttfbPenalty = Math.max(0, Math.round((inspection.responseTimeMs - 180) / 35));
    const blockingPenalty = (inspection.scriptStats?.renderBlockingScripts || 0) * 5;
    const sizePenalty = Math.max(0, Math.round((inspection.htmlSizeKb - 60) / 15));
    realPerfEstimate = Math.max(20, Math.min(99, 98 - ttfbPenalty - blockingPenalty - sizePenalty));
  }

  const nextScore = isUp ? Math.round((realPerfEstimate + realSeoScore + inspection.securityHeaders.score) / 3) : 0;
  const httpStatus = inspection.discoveredSubpages?.[0]?.status || (isUp ? 200 : 0);

  const prevStatus = dom.status;
  dom.totalChecks = totalChecks;
  dom.successfulChecks = successfulChecks;
  dom.uptimePercent = uptimePercent;
  dom.responseTimeMs = inspection.responseTimeMs;
  dom.httpStatus = httpStatus;
  dom.lastScore = nextScore;
  dom.performanceScore = realPerfEstimate;
  dom.seoScore = realSeoScore;
  dom.lastCheck = new Date().toISOString();

  if (!isUp || httpStatus >= 400) {
    dom.status = "alert";
  } else if (nextScore < dom.threshold) {
    dom.status = nextScore < dom.threshold - 10 ? "alert" : "warning";
  } else if (dom.psi?.status === "live_lighthouse" && dom.psi.overall !== null && dom.psi.overall < dom.threshold) {
    dom.status = dom.psi.overall < dom.threshold - 10 ? "alert" : "warning";
  } else {
    dom.status = "healthy";
  }

  const timeLabel = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  dom.history.push({
    date: timeLabel,
    score: nextScore,
    responseMs: inspection.responseTimeMs,
    httpStatus,
    ok: isUp,
  });
  if (dom.history.length > 10) dom.history.shift();

  if (!Array.isArray(dom.alertsLog)) {
    dom.alertsLog = [];
  }

  const pushAlert = (type: MonitoringAlertEntry["type"], message: string) => {
    const last = dom.alertsLog![0];
    // Bez powtarzania tego samego alarmu przy każdym pomiarze (np. co 5 min).
    if (last && last.type === type && Date.now() - new Date(last.timestamp).getTime() < ALERT_REPEAT_MS) return;
    const entry: MonitoringAlertEntry = {
      id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      httpStatus,
      responseTimeMs: inspection.responseTimeMs,
      seen: type === "recovered",
      emailed: smtpConfigured() ? undefined : "not_configured",
    };
    dom.alertsLog!.unshift(entry);
    if (dom.alertsLog!.length > 30) dom.alertsLog!.pop();
    void mailAlert(dom, entry);
  };

  if (!isUp || httpStatus >= 400) {
    pushAlert("downtime", `Strona nie odpowiada prawidłowo (HTTP ${httpStatus || "brak odpowiedzi / timeout"}).`);
  } else if (nextScore < dom.threshold) {
    pushAlert("score_drop", `Wynik kondycji (${nextScore}/100) spadł poniżej progu alertu (${dom.threshold}/100).`);
  } else if (inspection.responseTimeMs > 1200) {
    pushAlert("slow_response", `Wysoki czas odpowiedzi serwera (TTFB): ${inspection.responseTimeMs} ms.`);
  } else if (prevStatus === "alert" && dom.status === "healthy") {
    pushAlert("recovered", `Domena wróciła do normy (${nextScore}/100, TTFB ${inspection.responseTimeMs} ms).`);
  }

  saveDb();
  return dom;
}

let schedulerTimer: NodeJS.Timeout | null = null;
let isSchedulerRunningCheck = false;

export function startMonitoringScheduler() {
  if (schedulerTimer) return;

  schedulerTimer = setInterval(async () => {
    if (isSchedulerRunningCheck) return;
    isSchedulerRunningCheck = true;
    try {
      const now = Date.now();
      for (const dom of db.monitoredDomains) {
        const lastMs = dom.lastCheck ? new Date(dom.lastCheck).getTime() : 0;
        const dueMs = intervalToMs(dom.interval);
        if (now - lastMs >= dueMs) {
          await performRealDomainCheck(dom);
        }
      }
      // Dzienny pomiar PageSpeed: jedna domena na obieg (limit 1/dzień/domena), żeby nie przeciążać API.
      const needPsi = db.monitoredDomains.find((d) => d.psiAttemptDay !== today());
      if (needPsi) await runPsiOncePerDay(needPsi);
    } catch (e) {
      console.warn("Background monitoring check error:", e);
    } finally {
      isSchedulerRunningCheck = false;
    }
  }, 60 * 1000); // Evaluates due domains every 60 seconds
}


const ALERT_LABEL: Record<MonitoringAlertEntry["type"], string> = {
  downtime: "STRONA NIE ODPOWIADA",
  slow_response: "Wolna odpowiedź",
  score_drop: "Spadek wyniku poniżej progu",
  psi_drop: "Spadek wyniku Google PageSpeed poniżej progu",
  recovered: "Powrót do normy",
};

async function mailAlert(dom: MonitoredDomain, entry: MonitoringAlertEntry) {
  if (!smtpConfigured()) {
    entry.emailed = "not_configured";
    return;
  }
  const out = await sendMail({
    to: ALERT_RECIPIENT,
    subject: `[NovoPix monitoring] ${ALERT_LABEL[entry.type]}: ${dom.domain}`,
    text: `${ALERT_LABEL[entry.type]}\n\nDomena: ${dom.domain}\nKlient: ${dom.clientName}\nCzas: ${entry.timestamp}\n\n${entry.message}\n\nPróg alertu: ${dom.threshold}/100\nOstatni wynik kondycji: ${dom.lastScore}/100\nUptime: ${dom.uptimePercent}%\n\nWiadomość automatyczna z panelu NovoPix (wstępna kontrola automatyczna, nie certyfikat).`,
  });
  entry.emailed = out.ok ? "sent" : "failed";
  saveDb();
}

// --- Google PageSpeed: najwyżej 1 próba na domenę dziennie; błąd = uczciwe "brak pomiaru" (zero wymyślonych liczb) ---
export async function runPsiOncePerDay(dom: MonitoredDomain, force = false): Promise<"ran" | "limit"> {
  if (!force && dom.psiAttemptDay === today()) return "limit";
  dom.psiAttemptDay = today();
  const key = process.env.PAGESPEED_API_KEY || "";
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(dom.domain)}&strategy=mobile&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES${key ? `&key=${key}` : ""}`;
  const at = new Date().toISOString();
  try {
    const r = await fetch(api, { signal: AbortSignal.timeout(60000) });
    if (!r.ok) {
      const body: any = await r.json().catch(() => ({}));
      dom.psi = { at, status: "unavailable", overall: null, performance: null, seo: null, accessibility: null, bestPractices: null, error: String(body?.error?.message || `HTTP ${r.status}`).slice(0, 200) };
    } else {
      const data: any = await r.json();
      const c = data.lighthouseResult?.categories || {};
      const pct = (k: string) => (typeof c[k]?.score === "number" ? Math.round(c[k].score * 100) : null);
      const parts = [pct("performance"), pct("seo"), pct("accessibility"), pct("best-practices")];
      const have = parts.filter((v): v is number => v !== null);
      dom.psi = {
        at,
        status: have.length === 4 ? "live_lighthouse" : "unavailable",
        overall: have.length === 4 ? Math.round(have.reduce((a, b) => a + b, 0) / 4) : null,
        performance: parts[0],
        seo: parts[1],
        accessibility: parts[2],
        bestPractices: parts[3],
        error: have.length === 4 ? undefined : "Niepełna odpowiedź Lighthouse",
      };
    }
  } catch (e: any) {
    dom.psi = { at, status: "unavailable", overall: null, performance: null, seo: null, accessibility: null, bestPractices: null, error: String(e?.message || e).slice(0, 200) };
  }

  if (!Array.isArray(dom.alertsLog)) dom.alertsLog = [];
  if (dom.psi.status === "live_lighthouse" && dom.psi.overall !== null && dom.psi.overall < dom.threshold) {
    const last = dom.alertsLog[0];
    if (!(last && last.type === "psi_drop" && Date.now() - new Date(last.timestamp).getTime() < ALERT_REPEAT_MS)) {
      const entry: MonitoringAlertEntry = {
        id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: at,
        type: "psi_drop",
        message: `Wynik Google PageSpeed (${dom.psi.overall}/100, telefon) jest poniżej progu alertu (${dom.threshold}/100).`,
        seen: false,
        emailed: smtpConfigured() ? undefined : "not_configured",
      };
      dom.alertsLog.unshift(entry);
      if (dom.alertsLog.length > 30) dom.alertsLog.pop();
      if (dom.status === "healthy") dom.status = dom.psi.overall < dom.threshold - 10 ? "alert" : "warning";
      void mailAlert(dom, entry);
    }
  }
  saveDb();
  return "ran";
}
