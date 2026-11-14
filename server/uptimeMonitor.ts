import fs from "fs";
import path from "path";
import type { Express } from "express";
import { requireAgencyAuth } from "./security";
import { sendMail, smtpConfigured, alertRecipient } from "./mailer";

// Monitoring własnych usług NovoPix: sprawdzenie co 5 min, alert po 2 kolejnych porażkach, mail o odzyskaniu.
// Uwaga: działa wewnątrz panelu, więc nie wykryje awarii całego VPS (patrz docs/monitoring.md).

export interface StatusTarget { id: string; labelPl: string; labelEn: string; url: string }

export const DEFAULT_TARGETS: StatusTarget[] = [
  { id: "site", labelPl: "Strona novopix.uk", labelEn: "novopix.uk website", url: "https://novopix.uk/" },
  { id: "scanner", labelPl: "Skaner", labelEn: "Scanner", url: "https://scanner.novopix.uk/api/health" },
  { id: "panel", labelPl: "Panel", labelEn: "Panel", url: "https://panel.novopix.uk/api/health" },
  { id: "fridgebite", labelPl: "FridgeBite", labelEn: "FridgeBite", url: "https://fridgebite.novopix.uk/api/health" },
  { id: "pantrypal", labelPl: "PantryPal", labelEn: "PantryPal", url: "https://pantrypal.novopix.uk/" },
];

export const FAILS_TO_ALERT = 2;

export interface ServiceState {
  id: string;
  ok: boolean | null; // null = jeszcze nie sprawdzono
  consecutiveFails: number;
  alerting: boolean; // alert wysłany/aktywny (>= 2 porażki)
  lastCheck: string | null;
  lastOk: string | null;
  httpStatus: number;
  responseMs: number;
  error?: string;
  mail?: "sent" | "failed" | "not_configured";
  downSince?: string;
}

const targets = (): StatusTarget[] => {
  if (process.env.STATUS_TARGETS) {
    try {
      const t = JSON.parse(process.env.STATUS_TARGETS);
      if (Array.isArray(t) && t.length) return t;
    } catch {}
  }
  return DEFAULT_TARGETS;
};

const stateFile = () => path.join(process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data"), "status-state.json");
let state: Record<string, ServiceState> = {};
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    state = JSON.parse(fs.readFileSync(stateFile(), "utf-8")) || {};
  } catch {
    state = {};
  }
}
function persist() {
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    const tmp = stateFile() + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, stateFile());
  } catch {}
}

async function probe(url: string): Promise<{ ok: boolean; status: number; ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "user-agent": "NovoPix-StatusCheck/1.0" } });
    await r.arrayBuffer().catch(() => null);
    return { ok: r.status < 400, status: r.status, ms: Date.now() - t0, error: r.status < 400 ? undefined : `HTTP ${r.status}` };
  } catch (e: any) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: String(e?.cause?.code || e?.name || e?.message || e).slice(0, 80) };
  }
}

async function notify(t: StatusTarget, s: ServiceState, kind: "down" | "recovered") {
  const subject = kind === "down" ? `[NovoPix] AWARIA: ${t.labelPl} nie odpowiada` : `[NovoPix] Odzyskano: ${t.labelPl} działa`;
  const text =
    kind === "down"
      ? `Usługa „${t.labelPl}” (${t.url}) nie odpowiada od ${s.downSince} (${FAILS_TO_ALERT} kolejne nieudane sprawdzenia). Ostatni błąd: ${s.error || "brak"}.\n\nService "${t.labelEn}" has been failing since ${s.downSince}.`
      : `Usługa „${t.labelPl}” (${t.url}) znów działa (HTTP ${s.httpStatus}, ${s.responseMs} ms). Awaria trwała od ${s.downSince}.\n\nService "${t.labelEn}" is back up.`;
  if (!smtpConfigured()) {
    s.mail = "not_configured";
    return;
  }
  const r = await sendMail({ to: alertRecipient(), subject, text });
  s.mail = r.ok ? "sent" : "failed";
}

// Jeden obieg sprawdzeń (eksportowany dla testów).
export async function runChecks(): Promise<void> {
  load();
  await Promise.all(
    targets().map(async (t) => {
      const res = await probe(t.url);
      const s: ServiceState = state[t.id] || { id: t.id, ok: null, consecutiveFails: 0, alerting: false, lastCheck: null, lastOk: null, httpStatus: 0, responseMs: 0 };
      s.lastCheck = new Date().toISOString();
      s.httpStatus = res.status;
      s.responseMs = res.ms;
      s.error = res.error;
      if (res.ok) {
        const wasAlerting = s.alerting;
        s.ok = true;
        s.consecutiveFails = 0;
        s.lastOk = s.lastCheck;
        s.alerting = false;
        state[t.id] = s;
        if (wasAlerting) await notify(t, s, "recovered");
        s.downSince = undefined;
        if (!wasAlerting) s.mail = undefined;
      } else {
        s.consecutiveFails += 1;
        if (s.consecutiveFails === 1) s.downSince = s.lastCheck;
        // Pojedyncza porażka nie zmienia statusu na „nie ok” (unika fałszywych alarmów).
        if (s.consecutiveFails >= FAILS_TO_ALERT) {
          s.ok = false;
          if (!s.alerting) {
            s.alerting = true;
            state[t.id] = s;
            await notify(t, s, "down");
          }
        } else if (s.ok === null) {
          s.ok = false;
        }
        state[t.id] = s;
      }
    })
  );
  persist();
}

let timer: NodeJS.Timeout | null = null;
export function startUptimeMonitor() {
  if (timer) return;
  const every = Number(process.env.STATUS_INTERVAL_MS) || 5 * 60 * 1000;
  setTimeout(() => void runChecks().catch(() => {}), Math.min(20000, every)).unref?.();
  timer = setInterval(() => void runChecks().catch(() => {}), every);
  timer.unref?.();
}

// Publiczny widok: tylko ok / nie ok i czas ostatniego sprawdzenia, bez adresów i błędów.
export function publicStatus() {
  load();
  const services = targets().map((t) => {
    const s = state[t.id];
    return { id: t.id, labelPl: t.labelPl, labelEn: t.labelEn, ok: s?.ok ?? null, lastCheck: s?.lastCheck ?? null };
  });
  return { services, allOk: services.every((x) => x.ok === true), checkedAt: services.map((x) => x.lastCheck).filter(Boolean).sort().pop() || null };
}

export function detailedStatus() {
  load();
  return {
    smtp: smtpConfigured(),
    services: targets().map((t) => ({ ...t, ...(state[t.id] || { ok: null, consecutiveFails: 0, alerting: false, lastCheck: null }) })),
  };
}

const STATUS_HTML = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Status – NovoPix</title><style>body{font-family:system-ui,sans-serif;background:#f4f8fb;color:#0f2a3a;margin:0;padding:24px}main{max-width:480px;margin:0 auto}
h1{font-size:20px}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #d8e4ec;border-radius:12px;padding:12px 14px;margin:8px 0}
.ok{color:#087f5b;font-weight:700}.bad{color:#c92a2a;font-weight:700}.na{color:#64748b}small{color:#64748b}</style></head><body><main>
<h1 id="t">Status usług NovoPix</h1><ul id="l"></ul><small id="c"></small></main><script>
var en=/^en/i.test(navigator.language||"");var q=new URLSearchParams(location.search).get("lang");if(q)en=q==="en";
document.documentElement.lang=en?"en":"pl";document.title=en?"Status – NovoPix":"Status – NovoPix";
document.getElementById("t").textContent=en?"NovoPix service status":"Status usług NovoPix";
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
fetch("/api/status",{cache:"no-store"}).then(function(r){return r.json()}).then(function(d){
var l=document.getElementById("l");l.innerHTML="";(d.services||[]).forEach(function(s){var li=document.createElement("li");
var st=s.ok===true?'<span class="ok">'+(en?"OK":"OK")+'</span>':s.ok===false?'<span class="bad">'+(en?"Not OK":"Nie OK")+'</span>':'<span class="na">'+(en?"no data":"brak danych")+'</span>';
li.innerHTML="<span>"+esc(en?s.labelEn:s.labelPl)+"</span>"+st;l.appendChild(li)});
if(!(d.services||[]).length)l.innerHTML="<li>"+(en?"No data":"Brak danych")+"</li>";
document.getElementById("c").textContent=(en?"Last check: ":"Ostatnie sprawdzenie: ")+(d.checkedAt?new Date(d.checkedAt).toLocaleString(en?"en-GB":"pl-PL"):"—");
}).catch(function(){document.getElementById("c").textContent=en?"Status temporarily unavailable.":"Status chwilowo niedostępny."});
</script></body></html>`;

export function registerStatusPage(app: Express) {
  app.get("/status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(STATUS_HTML);
  });
}

// Panel: właściwy monitor + publiczne /api/status + szczegóły za PIN-em.
export function registerAgencyStatusRoutes(app: Express) {
  startUptimeMonitor();
  app.get("/api/status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(publicStatus());
  });
  app.get("/api/status/details", requireAgencyAuth, (_req, res) => res.json(detailedStatus()));
  registerStatusPage(app);
}

// Skaner (tryb publiczny): /api/status pobiera dane z panelu, nic nie liczy sam.
export function registerPublicStatusRoutes(app: Express, forward: (p: string, m: "GET") => Promise<{ status: number; data: any }>) {
  app.get("/api/status", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const out = await forward("/api/status", "GET");
      if (out.status === 200 && Array.isArray(out.data?.services)) return res.json({ services: out.data.services, allOk: out.data.allOk, checkedAt: out.data.checkedAt });
    } catch {}
    return res.json({ services: [], allOk: false, checkedAt: null });
  });
  registerStatusPage(app);
}
