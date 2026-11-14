// Pełny przegląd domeny (tylko panel agencji): strony z linków i mapy strony, podstrony, linki wewnętrzne i zewnętrzne,
// popularne subdomeny (DNS) oraz poczta domeny. Tylko publicznie dostępne dane, z ochroną przed adresami wewnętrznymi.
import dns from "node:dns/promises";
import crypto from "crypto";
import type { Express } from "express";
import { requireAgencyAuth, checkRateLimit, safeFetchHtml, validateSafePublicUrl } from "./security";
import { checkDomainHealth } from "./domainHealth";

type PageRow = { url: string; status: number; ms: number; title: string; description: boolean; h1: number; imgNoAlt: number; noindex: boolean };
type Job = { id: string; startedAt: number; done: boolean; error?: string; progress: string; result?: any };
const jobs = new Map<string, Job>();

const MAX_PAGES = 40;
const SUBS = ["www", "mail", "webmail", "smtp", "imap", "ftp", "panel", "app", "api", "blog", "shop", "store", "dev", "staging", "test", "admin", "cdn", "static", "docs", "status", "scanner", "autodiscover", "vpn", "intranet", "portal"];

const abs = (href: string, base: string): string | null => {
  try {
    const u = new URL(href.trim(), base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
};

function analyse(html: string) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const description = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+/i.test(html);
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgNoAlt = imgs.filter((t) => !/\balt\s*=/.test(t)).length;
  const noindex = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html);
  const links = [...html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/gi)].map((m) => m[1]);
  return { title, description, h1, imgNoAlt, noindex, links };
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

async function run(job: Job, rawUrl: string) {
  const v = validateSafePublicUrl(rawUrl);
  if (!v.valid || !v.parsed) throw new Error(v.error || "Invalid URL");
  const host = v.parsed.hostname.toLowerCase();
  const base = host.replace(/^www\./, "");
  const sameHost = (u: string) => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h === host || h === base || h === `www.${base}`;
    } catch {
      return false;
    }
  };

  job.progress = "pages";
  const start = `https://${host}/`;
  const queue: string[] = [start];
  const seen = new Set<string>([start]);
  // mapa strony
  try {
    const sm = await safeFetchHtml(`https://${host}/sitemap.xml`, 7000, 800000);
    if (sm.ok) for (const m of sm.htmlText.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
      const u = abs(m[1], start);
      if (u && sameHost(u) && !seen.has(u) && !/\.xml$/i.test(u)) { seen.add(u); queue.push(u); }
    }
  } catch {}
  const pages: PageRow[] = [];
  const external = new Set<string>();
  const linkedFrom = new Map<string, string>();
  let cursor = 0;
  while (cursor < queue.length && pages.length < MAX_PAGES) {
    const batch = queue.slice(cursor, cursor + 5).slice(0, MAX_PAGES - pages.length);
    cursor += batch.length;
    const rows = await pool(batch, 5, async (u) => {
      const r = await safeFetchHtml(u, 8000, 700000).catch(() => null);
      if (!r) return { row: { url: u, status: 0, ms: 0, title: "", description: false, h1: 0, imgNoAlt: 0, noindex: false } as PageRow, links: [] as string[] };
      const isHtml = /text\/html|application\/xhtml/i.test(r.headers.get("content-type") || "") || !r.headers.get("content-type");
      const a = r.ok && isHtml ? analyse(r.htmlText) : { title: "", description: false, h1: 0, imgNoAlt: 0, noindex: false, links: [] as string[] };
      return { row: { url: r.finalUrl || u, status: r.status, ms: r.responseTimeMs, title: a.title, description: a.description, h1: a.h1, imgNoAlt: a.imgNoAlt, noindex: a.noindex } as PageRow, links: a.links.map((h) => abs(h, u)).filter((x): x is string => !!x) };
    });
    for (const { row, links } of rows) {
      pages.push(row);
      for (const l of links) {
        if (sameHost(l)) {
          if (!seen.has(l) && !/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|css|js|ico|mp4|woff2?)(\?|$)/i.test(l) && seen.size < 400) { seen.add(l); queue.push(l); linkedFrom.set(l, row.url); }
        } else external.add(l);
      }
    }
    job.progress = `pages ${pages.length}`;
  }
  const broken = pages.filter((p) => p.status === 0 || p.status >= 400).map((p) => ({ url: p.url, status: p.status, from: linkedFrom.get(p.url) || "" }));

  job.progress = "external";
  const ext = [...external].slice(0, 30);
  const extRows = await pool(ext, 6, async (u) => {
    const r = await safeFetchHtml(u, 6000, 60000).catch(() => null);
    return { url: u, status: r ? r.status : 0 };
  });
  const brokenExternal = extRows.filter((e) => e.status === 0 || e.status >= 400);

  job.progress = "subdomains";
  const subs = await pool(SUBS, 8, async (s) => {
    const name = `${s}.${base}`;
    try {
      const addrs = await dns.resolve4(name);
      const r = await safeFetchHtml(`https://${name}/`, 6000, 60000).catch(() => null);
      return { name, resolves: true, ip: addrs[0], status: r ? r.status : 0 };
    } catch {
      return { name, resolves: false, ip: "", status: 0 };
    }
  });

  job.progress = "mail";
  const health = await checkDomainHealth(start).catch(() => ({ status: 500, body: null }));

  const titles = new Map<string, number>();
  pages.forEach((p) => p.title && titles.set(p.title, (titles.get(p.title) || 0) + 1));
  job.result = {
    domain: base,
    scannedAt: new Date().toISOString(),
    limits: { maxPages: MAX_PAGES, note: "Strony znalezione z linków i mapy strony (do " + MAX_PAGES + "). Subdomeny: popularne nazwy sprawdzane przez DNS, to nie jest pełna lista." },
    summary: {
      pages: pages.length,
      ok: pages.filter((p) => p.status >= 200 && p.status < 400).length,
      broken: broken.length,
      noTitle: pages.filter((p) => p.status === 200 && !p.title).length,
      noDescription: pages.filter((p) => p.status === 200 && !p.description).length,
      noH1: pages.filter((p) => p.status === 200 && p.h1 === 0).length,
      imgNoAlt: pages.reduce((a, p) => a + p.imgNoAlt, 0),
      duplicateTitles: [...titles.values()].filter((n) => n > 1).length,
      externalChecked: extRows.length,
      brokenExternal: brokenExternal.length,
      subdomainsFound: subs.filter((s) => s.resolves).length,
    },
    pages,
    broken,
    brokenExternal,
    subdomains: subs.filter((s) => s.resolves),
    domainHealth: health.body,
  };
}

export function registerFullReview(app: Express) {
  app.post("/api/agency/full-review", requireAgencyAuth, (req, res) => {
    const limit = checkRateLimit(`fullreview_${req.ip || "local"}`, 6, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: "Zbyt wiele przeglądów. Spróbuj za chwilę." });
    const v = validateSafePublicUrl(req.body?.url);
    if (!v.valid) return res.status(400).json({ error: v.error || "Nieprawidłowy adres." });
    for (const [k, j] of jobs) if (Date.now() - j.startedAt > 60 * 60 * 1000) jobs.delete(k);
    const job: Job = { id: crypto.randomBytes(8).toString("hex"), startedAt: Date.now(), done: false, progress: "start" };
    jobs.set(job.id, job);
    run(job, String(req.body.url))
      .catch((e) => { job.error = String(e?.message || e); })
      .finally(() => { job.done = true; });
    return res.json({ jobId: job.id });
  });
  app.get("/api/agency/full-review/:id", requireAgencyAuth, (req, res) => {
    const j = jobs.get(req.params.id);
    if (!j) return res.status(404).json({ error: "Nie znaleziono przeglądu." });
    return res.json({ done: j.done, progress: j.progress, error: j.error, result: j.done ? j.result : undefined });
  });
}
