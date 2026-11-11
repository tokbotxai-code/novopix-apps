import { db, saveDb, MonitoredDomain, MonitoringAlertEntry } from "./database";
import { performDeepLiveSeoInspection } from "./seoCrawler";

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
  const inspection = await performDeepLiveSeoInspection(dom.domain);

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
    dom.alertsLog!.unshift({
      id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      httpStatus,
      responseTimeMs: inspection.responseTimeMs,
    });
    if (dom.alertsLog!.length > 15) dom.alertsLog!.pop();
  };

  if (!isUp || httpStatus >= 400) {
    pushAlert("downtime", `Brak prawidłowej odpowiedzi HTTP (${httpStatus || "Timeout"}). Sprawdź serwer docelowy.`);
  } else if (inspection.responseTimeMs > 1200) {
    pushAlert("slow_response", `Wysoki czas odpowiedzi serwera TTFB: ${inspection.responseTimeMs} ms.`);
  } else if (nextScore < dom.threshold) {
    pushAlert("score_drop", `Wynik kondycji (${nextScore}/100) spadł poniżej ustalonego progu (${dom.threshold}/100).`);
  } else if (prevStatus === "alert" && dom.status === "healthy") {
    pushAlert("recovered", `Domena wróciła do pełnej sprawności (${nextScore}/100, TTFB ${inspection.responseTimeMs} ms).`);
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
    } catch (e) {
      console.warn("Background monitoring check error:", e);
    } finally {
      isSchedulerRunningCheck = false;
    }
  }, 60 * 1000); // Evaluates due domains every 60 seconds
}
