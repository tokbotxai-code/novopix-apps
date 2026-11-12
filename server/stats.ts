// Prywatne liczniki odwiedzin i użycia: bez ciasteczek, bez zapisywania adresów IP i identyfikatorów.
// Na dysku są wyłącznie dzienne sumy (odsłony, unikalni, źródła, język, zdarzenia). Retencja: 400 dni.
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import { db, saveDb } from "./database";
import { checkRateLimit, requireAgencyAuth } from "./security";

export interface StatsDay {
  pages: Record<string, { v: number; u: number }>;
  refs: Record<string, number>;
  langs: Record<string, number>;
  events: Record<string, number>;
}
export interface HitInput { host: string; path: string; ref: string; lang: string; unique: boolean }

export const ALLOWED_ORIGINS = ["https://novopix.uk", "https://www.novopix.uk", "https://fridgebite.novopix.uk", "https://pantrypal.novopix.uk", "https://scanner.novopix.uk"];
const RETENTION_DAYS = 400;
const BOT_UA = /bot|crawl|spider|slurp|bing|google|yandex|duckduck|baidu|facebookexternalhit|preview|lighthouse|headless|pagespeed|curl|wget|python|monitor|uptime/i;
export const EVENT_NAMES = ["scan_public_full", "scan_public_partial", "scan_public_failed", "scan_panel_full", "scan_panel_partial", "scan_panel_failed", "report_request", "share_link", "offer_approved", "offer_sent"];

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

// Ścieżka bez query i fragmentu, maks. 120 znaków, tylko bezpieczne znaki; inaczej null (trafienie odrzucone).
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let p = raw.split("#")[0].split("?")[0].trim().toLowerCase();
  if (!p.startsWith("/")) return null;
  p = p.replace(/\/{2,}/g, "/").replace(/\/index\.html$/, "/");
  if (p.length > 120 || !/^[a-z0-9/_.\-]+$/.test(p) || p.includes("..")) return null;
  return p;
}
// Źródło wejścia sprowadzone do samej domeny; brak = „direct”, własny host = „internal”.
export function normalizeRef(raw: unknown, ownHost: string): string {
  if (typeof raw !== "string" || !raw.trim()) return "direct";
  try {
    const h = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    if (!/^[a-z0-9.-]{1,80}$/.test(h)) return "other";
    return h === ownHost.replace(/^www\./, "") ? "internal" : h;
  } catch {
    return "other";
  }
}
export const normalizeLang = (raw: unknown): string => {
  const l = typeof raw === "string" ? raw.slice(0, 2).toLowerCase() : "";
  return ["pl", "en", "es"].includes(l) ? l : "other";
};

function day(key = dayKey()): StatsDay {
  const all = ((db as any).stats ||= {}) as Record<string, StatsDay>;
  return (all[key] ||= { pages: {}, refs: {}, langs: {}, events: {} });
}
let saveTimer: NodeJS.Timeout | null = null;
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    pruneStats();
    saveDb();
  }, 5000);
  saveTimer.unref?.();
}
export function pruneStats(now = new Date()) {
  const all = ((db as any).stats ||= {}) as Record<string, StatsDay>;
  const cutoff = dayKey(new Date(now.getTime() - RETENTION_DAYS * 86400000));
  for (const k of Object.keys(all)) if (k < cutoff) delete all[k];
}
export function recordHit(h: HitInput) {
  const d = day();
  const key = (h.host + h.path).slice(0, 200);
  if (Object.keys(d.pages).length >= 2000 && !d.pages[key]) return; // twardy limit wierszy na dobę
  const row = (d.pages[key] ||= { v: 0, u: 0 });
  row.v++;
  if (h.unique) row.u++;
  if (h.ref !== "internal") d.refs[h.ref] = (d.refs[h.ref] || 0) + 1;
  d.langs[h.lang] = (d.langs[h.lang] || 0) + 1;
  saveSoon();
}
export function recordEvent(name: string) {
  if (!EVENT_NAMES.includes(name)) return;
  const d = day();
  d.events[name] = (d.events[name] || 0) + 1;
  saveSoon();
}

// Zdarzenia serwerowe: w panelu zapis od razu, w skanerze publicznym przekazanie do panelu (ustawiane w server.ts).
let eventSink: (name: string) => void = recordEvent;
export const setEventSink = (fn: (name: string) => void) => { eventSink = fn; };
export function trackEvent(name: string) {
  try { eventSink(name); } catch {}
}
export const scanEventName = (mode: "public" | "panel", status: unknown) =>
  `scan_${mode}_${status === "live_lighthouse" ? "full" : status === "partial_html" ? "partial" : "failed"}`;

// „Unikalni dziennie”: skrót IP+UA z solą losowaną co dobę, trzymany tylko w pamięci procesu i kasowany o północy (UTC).
let salt = crypto.randomBytes(16).toString("hex");
let saltDay = dayKey();
let seen = new Set<string>();
function isUnique(ip: string, ua: string, scope: string): boolean {
  const today = dayKey();
  if (today !== saltDay) {
    salt = crypto.randomBytes(16).toString("hex");
    saltDay = today;
    seen = new Set();
  }
  const k = crypto.createHash("sha256").update(salt + ip + "|" + ua).digest("hex").slice(0, 24) + "|" + scope;
  if (seen.has(k)) return false;
  if (seen.size < 200000) seen.add(k);
  return true;
}

// POST /api/hit (skaner publiczny i panel): przyjmuje {path, ref, lang}; host bierze z nagłówka Origin.
export function registerHitEndpoint(app: Express, sink: (h: HitInput) => void) {
  const cors = (req: Request, res: Response): string | null => {
    const origin = String(req.headers.origin || "");
    if (!ALLOWED_ORIGINS.includes(origin)) return null;
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    return origin;
  };
  app.options("/api/hit", (req, res) => {
    if (!cors(req, res)) return res.status(403).end();
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
  });
  app.post("/api/hit", express.text({ type: ["text/plain", "application/json"], limit: "2kb" }), (req, res) => {
    const origin = cors(req, res);
    if (!origin) return res.status(403).json({ error: "Origin not allowed" });
    const ip = req.ip || "local";
    const limit = checkRateLimit(`hit_${ip}`, 60, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: "Too many requests" });
    const ua = String(req.headers["user-agent"] || "");
    // Boty, Do Not Track i Global Privacy Control: nie liczymy.
    if (!ua || BOT_UA.test(ua) || req.headers.dnt === "1" || req.headers["sec-gpc"] === "1") return res.status(204).end();
    let body: any = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    const path = normalizePath(body?.path);
    if (!path) return res.status(400).json({ error: "Invalid path" });
    const host = new URL(origin).hostname.replace(/^www\./, "");
    sink({ host, path, ref: normalizeRef(body?.ref, host), lang: normalizeLang(body?.lang), unique: isUnique(ip, ua, host + path) });
    res.status(204).end();
  });
}

export function statsSummary(days: number, now = new Date()) {
  const n = [7, 30, 90].includes(days) ? days : 30;
  const all = ((db as any).stats || {}) as Record<string, StatsDay>;
  const series: Array<{ date: string; views: number; uniques: number; scans: number }> = [];
  const pages: Record<string, { v: number; u: number }> = {};
  const refs: Record<string, number> = {};
  const langs: Record<string, number> = {};
  const events: Record<string, number> = {};
  for (let i = n - 1; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * 86400000));
    const d = all[key];
    let views = 0, uniques = 0, scans = 0;
    if (d) {
      for (const [k, r] of Object.entries(d.pages)) { views += r.v; uniques += r.u; const p = (pages[k] ||= { v: 0, u: 0 }); p.v += r.v; p.u += r.u; }
      for (const [k, v] of Object.entries(d.refs)) refs[k] = (refs[k] || 0) + v;
      for (const [k, v] of Object.entries(d.langs)) langs[k] = (langs[k] || 0) + v;
      for (const [k, v] of Object.entries(d.events)) { events[k] = (events[k] || 0) + v; if (k.startsWith("scan_")) scans += v; }
    }
    series.push({ date: key, views, uniques, scans });
  }
  const top = <T,>(o: Record<string, T>, val: (x: T) => number, max: number) => Object.entries(o).sort((a, b) => val(b[1]) - val(a[1])).slice(0, max);
  return {
    days: n,
    series,
    totals: { views: series.reduce((a, x) => a + x.views, 0), uniques: series.reduce((a, x) => a + x.uniques, 0), scans: series.reduce((a, x) => a + x.scans, 0) },
    pages: top(pages, (x) => x.v, 25).map(([page, r]) => ({ page, views: r.v, uniques: r.u })),
    refs: top(refs, (x) => x, 15).map(([ref, count]) => ({ ref, count })),
    langs: top(langs, (x) => x, 5).map(([lang, count]) => ({ lang, count })),
    events,
  };
}

export function registerStatsRoutes(app: Express, requireInternal: any) {
  // Skaner publiczny przekazuje tu trafienia i zdarzenia (sieć wewnętrzna, token).
  app.post("/api/internal/stats", requireInternal, (req, res) => {
    const b = req.body || {};
    if (typeof b.event === "string") recordEvent(b.event);
    if (b.hit && typeof b.hit === "object") {
      const path = normalizePath(b.hit.path);
      const host = String(b.hit.host || "").toLowerCase();
      if (path && ALLOWED_ORIGINS.some((o) => new URL(o).hostname.replace(/^www\./, "") === host)) {
        recordHit({ host, path, ref: String(b.hit.ref || "direct").slice(0, 80), lang: normalizeLang(b.hit.lang), unique: !!b.hit.unique });
      }
    }
    res.json({ success: true });
  });
  app.get("/api/stats", requireAgencyAuth, (req, res) => res.json(statsSummary(Number(req.query.days))));
  app.get("/api/stats.csv", requireAgencyAuth, (req, res) => {
    const s = statsSummary(Number(req.query.days));
    const q = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ["section,key,views_or_count,uniques"];
    for (const d of s.series) lines.push(["day", q(d.date), d.views, d.uniques].join(","), ["scans", q(d.date), d.scans, ""].join(","));
    for (const p of s.pages) lines.push(["page", q(p.page), p.views, p.uniques].join(","));
    for (const r of s.refs) lines.push(["source", q(r.ref), r.count, ""].join(","));
    for (const l of s.langs) lines.push(["language", q(l.lang), l.count, ""].join(","));
    for (const [k, v] of Object.entries(s.events)) lines.push(["event", q(k), v, ""].join(","));
    res.type("text/csv").set("Content-Disposition", `attachment; filename="novopix-stats-${s.days}d.csv"`).send(lines.join("\n") + "\n");
  });
}
