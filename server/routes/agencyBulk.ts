import crypto from "crypto";
import type { Express } from "express";
import { requireAgencyAuth, validateSafePublicUrl, checkRateLimit } from "../security";
import { db, saveDb, logActivity, BulkScanJob, BulkScanRow, AgencyClient } from "../database";
import { performScan } from "../scanService";
import { snapshotFromScan } from "../scanSnapshot";

export const BULK_MAX_URLS = 20;
export const BULK_CONCURRENCY = 2;

const jobsList = () => (db.bulkScans ||= []);

// Po restarcie serwera niedokończone zadania nie mogą wisieć w stanie "w toku".
export function recoverBulkJobs() {
  for (const job of jobsList()) {
    if (!job.finishedAt) {
      for (const r of job.rows) {
        if (r.status === "queued" || r.status === "running") {
          r.status = "failed";
          r.error = "Przerwano (restart serwera).";
        }
      }
      job.finishedAt = new Date().toISOString();
    }
  }
}

// Ranking „najsłabsze najpierw”: wynik ogólny, a gdy go brak (pomiar częściowy) – średnia znanych kategorii. Brak danych = null.
function rankOf(snap: BulkScanRow["snapshot"]): number | null {
  if (!snap) return null;
  if (typeof snap.overallScore === "number") return snap.overallScore;
  const known = Object.values(snap.categories).filter((v): v is number => typeof v === "number");
  return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
}

async function runJob(job: BulkScanJob) {
  let next = 0;
  const worker = async () => {
    while (true) {
      const idx = next++;
      if (idx >= job.rows.length) return;
      const row = job.rows[idx];
      row.status = "running";
      try {
        const out = await performScan(row.url, job.strategy);
        const snap = snapshotFromScan(out.body, job.strategy, row.url);
        if (!snap) {
          row.status = "failed";
          row.measurementStatus = "failed";
          row.error = String(out.body?.error || "Strona nie odpowiada lub pomiar się nie powiódł.").slice(0, 240);
        } else {
          row.status = "done";
          row.measurementStatus = snap.measurementStatus;
          row.overallScore = snap.overallScore;
          row.performance = snap.categories.performance;
          row.seo = snap.categories.seo;
          row.accessibility = snap.categories.accessibility;
          row.bestPractices = snap.categories.bestPractices;
          row.issuesCount = snap.issues.length;
          row.rankScore = rankOf(snap);
          row.snapshot = snap;
        }
      } catch (e: any) {
        row.status = "failed";
        row.error = String(e?.message || e).slice(0, 240);
      }
    }
  };
  await Promise.all(Array.from({ length: BULK_CONCURRENCY }, worker));
  job.finishedAt = new Date().toISOString();
  saveDb();
}

export function parseUrlList(input: unknown): string[] {
  const raw = Array.isArray(input) ? input.map(String) : String(input || "").split(/[\s,;]+/);
  return raw.map((s) => s.trim()).filter(Boolean);
}

const csvCell = (v: unknown) => {
  const t = v === null || v === undefined ? "" : String(v);
  // Ochrona przed wstrzyknięciem formuł w arkuszach (=, +, -, @).
  const safe = /^[=+\-@]/.test(t) ? `'${t}` : t;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function registerAgencyBulkRoutes(app: Express) {
  recoverBulkJobs();

  app.post("/api/bulk-scan", requireAgencyAuth, (req, res) => {
    const limit = checkRateLimit("bulk_jobs", 12, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: `Limit zadań masowych na godzinę. Spróbuj za ${limit.retryAfterSec} s.` });
    if (jobsList().some((j) => !j.finishedAt)) return res.status(409).json({ error: "Poprzednie skanowanie masowe jeszcze trwa. Poczekaj na jego zakończenie.", code: "JOB_RUNNING" });

    const all = parseUrlList(req.body?.urls);
    if (!all.length) return res.status(400).json({ error: "Podaj co najmniej jeden adres." });
    const rows: BulkScanRow[] = [];
    const seen = new Set<string>();
    const skipped: string[] = [];
    for (const u of all) {
      const v = validateSafePublicUrl(u);
      if (!v.valid || !v.normalizedUrl || !v.parsed) {
        skipped.push(`${u}: ${v.error || "nieprawidłowy adres"}`);
        continue;
      }
      const key = v.parsed.hostname.replace(/^www\./, "");
      if (seen.has(key)) continue;
      seen.add(key);
      if (rows.length >= BULK_MAX_URLS) {
        skipped.push(`${u}: ponad limit ${BULK_MAX_URLS} adresów`);
        continue;
      }
      rows.push({ url: v.normalizedUrl, status: "queued", overallScore: null, performance: null, seo: null, accessibility: null, bestPractices: null, issuesCount: null });
    }
    if (!rows.length) return res.status(400).json({ error: "Żaden z adresów nie jest prawidłowym, publicznym adresem.", skipped });
    const job: BulkScanJob = {
      id: `bulk_${crypto.randomBytes(6).toString("hex")}`,
      createdAt: new Date().toISOString(),
      strategy: req.body?.strategy === "desktop" ? "desktop" : "mobile",
      rows,
    };
    jobsList().unshift(job);
    if (jobsList().length > 5) jobsList().length = 5;
    saveDb();
    void runJob(job);
    return res.json({ success: true, jobId: job.id, total: rows.length, skipped });
  });

  const strip = (job: BulkScanJob) => ({ ...job, rows: job.rows.map(({ snapshot: _s, ...r }) => r) });

  app.get("/api/bulk-scan", requireAgencyAuth, (_req, res) => res.json({ jobs: jobsList().map(strip), limits: { maxUrls: BULK_MAX_URLS, concurrency: BULK_CONCURRENCY } }));

  app.get("/api/bulk-scan/:id", requireAgencyAuth, (req, res) => {
    const job = jobsList().find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Nie znaleziono zadania." });
    return res.json({ job: strip(job) });
  });

  app.get("/api/bulk-scan/:id/csv", requireAgencyAuth, (req, res) => {
    const job = jobsList().find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Nie znaleziono zadania." });
    const head = ["Adres", "Status", "Rodzaj pomiaru", "Wynik ogólny", "Wydajność", "SEO", "Dostępność", "Dobre praktyki", "Liczba problemów", "Wskaźnik rankingu", "Błąd"];
    const lines = [head.map(csvCell).join(";")];
    const sorted = [...job.rows].sort((a, b) => (a.rankScore ?? 999) - (b.rankScore ?? 999));
    for (const r of sorted) {
      lines.push(
        [r.url, r.status === "done" ? "zmierzono" : r.status === "failed" ? "błąd" : r.status, r.measurementStatus === "live_lighthouse" ? "Lighthouse" : r.measurementStatus === "partial_html" ? "częściowy (HTML)" : "", r.overallScore, r.performance, r.seo, r.accessibility, r.bestPractices, r.issuesCount, r.rankScore, r.error]
          .map(csvCell)
          .join(";")
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="novopix-skan-wielu-stron-${job.createdAt.slice(0, 10)}.csv"`);
    return res.send("﻿" + lines.join("\r\n") + "\r\n");
  });

  // Dodanie wyniku do CRM jako lead (z zapisanym pomiarem, etap „skan wykonany”). Brak e-maila: uzupełnia się ręcznie.
  app.post("/api/bulk-scan/:id/add-to-crm", requireAgencyAuth, (req, res) => {
    const job = jobsList().find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Nie znaleziono zadania." });
    const row = job.rows.find((r) => r.url === req.body?.url);
    if (!row || row.status !== "done" || !row.snapshot) return res.status(400).json({ error: "Dla tego adresu nie ma zapisanego pomiaru." });
    const host = row.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const dup = db.agencyClients.find((c) => c.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") === host);
    if (dup) {
      row.addedToCrm = dup.id;
      saveDb();
      return res.status(409).json({ error: "Ta domena już jest w CRM.", client: dup, code: "DUPLICATE" });
    }
    const now = new Date().toISOString();
    const client: AgencyClient = {
      id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: "",
      company: host,
      email: "",
      phone: "",
      website: row.url,
      status: "scanned",
      contractValue: 1200,
      hourlyRate: 150,
      estimatedHours: 8,
      retainerFee: 300,
      addedAt: now,
      lastScore: typeof row.rankScore === "number" ? row.rankScore : 0,
      notes: "Dodano z listy leadów (skan masowy). Uzupełnij dane kontaktowe przed wysyłką oferty.",
      lastScan: row.snapshot,
      source: "bulk-scan",
      activityLog: [{ id: `act_${Date.now()}`, timestamp: now, type: "audit", summary: `Dodano z listy leadów; skan: ${row.rankScore ?? "brak"}/100 (${row.measurementStatus === "live_lighthouse" ? "Lighthouse" : "pomiar częściowy HTML"})` }],
    };
    db.agencyClients.unshift(client);
    row.addedToCrm = client.id;
    saveDb(true);
    return res.json({ success: true, client });
  });
}
