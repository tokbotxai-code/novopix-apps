import { trackEvent } from "./stats";
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { db, saveDb, logActivity, advanceStage, AgencyClient, LeadRecord, ScanSnapshot, SharedResult } from "./database";
import { requireAgencyAuth, checkRateLimit } from "./security";
import { smtpConfigured, smtpFrom, sendMail, alertRecipient } from "./mailer";
import { buildReportPdf } from "./pdfReport";
import { recallScan } from "./scanCache";
import { performScan } from "./scanService";
import { snapshotFromScan } from "./scanSnapshot";
import { normalizeFormLang, effectiveLanguage, Lang } from "./language";
import { esc, hostOf, renderResultPage, renderOgImage, ogImageAvailable } from "./resultPage";

export const POLICY_URL = "https://novopix.uk/privacy/";
export const CONSENT_TEXT: Record<Lang, string> = {
  pl: "Wyrażam zgodę na otrzymanie raportu PDF na podany adres e-mail oraz informacji o usługach NovoPix.",
  en: "I agree to receive the PDF report at the e-mail address provided and information about NovoPix services.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_RESULTS = 3000;

const sha = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const validSnapshot = (s: any): s is ScanSnapshot => !!s && typeof s === "object" && (s.measurementStatus === "live_lighthouse" || s.measurementStatus === "partial_html") && typeof s.finalUrl === "string";
const hostKey = (w: string) => String(w || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

// ===================== PANEL (APP_MODE=agency): zapis danych w wolumenie =====================

function reportMail(lang: Lang, host: string, snap: ScanSnapshot) {
  const date = new Date(snap.scannedAt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { timeZone: "Europe/Warsaw" });
  if (lang === "pl") {
    return {
      subject: `Raport PDF z kontroli strony ${host}`,
      text: `Dzień dobry,\n\nw załączniku przesyłamy raport PDF z wstępnej, automatycznej kontroli strony ${host} wykonanej w skanerze NovoPix (${date}).\n\nRaport nie jest certyfikatem, audytem zgodności ani gwarancją wyniku; wartości mogą różnić się między pomiarami.\n\nOtrzymują Państwo tę wiadomość, ponieważ w formularzu skanera wyrażono zgodę na raport i informacje o usługach NovoPix. Jeśli nie chcą Państwo otrzymywać od nas wiadomości, wystarczy odpowiedzieć „rezygnuję”. Polityka prywatności: ${POLICY_URL}\n\nZespół NovoPix\ncontact@novopix.uk · novopix.uk`,
    };
  }
  return {
    subject: `PDF report for ${host}`,
    text: `Hello,\n\nattached is the PDF report from the preliminary automated check of ${host} run in the NovoPix scanner (${date}).\n\nThe report is not a certificate, a compliance audit or a guarantee of any outcome; values may differ between measurements.\n\nYou receive this message because consent to the report and to information about NovoPix services was given in the scanner form. If you would rather not hear from us, simply reply "unsubscribe". Privacy policy: ${POLICY_URL}\n\nNovoPix team\ncontact@novopix.uk · novopix.uk`,
  };
}

export function stubClient(lead: LeadRecord, snap: ScanSnapshot): AgencyClient {
  const c = lead.clientId ? db.agencyClients.find((x) => x.id === lead.clientId) : undefined;
  return c || ({ id: "-", name: "", company: hostOf(snap), email: lead.email, phone: "", website: snap.finalUrl, status: "lead", contractValue: 0, hourlyRate: 0, estimatedHours: 0, retainerFee: 0, addedAt: lead.timestamp, lastScore: 0, notes: "" } as AgencyClient);
}

export async function sendLeadReport(lead: LeadRecord, auto: boolean): Promise<{ ok: boolean; code?: string; error?: string }> {
  const rep = lead.report;
  const snap = rep?.snapshot;
  if (!rep || !snap) return { ok: false, code: "NO_SNAPSHOT", error: "Brak zapisanego wyniku skanu." };
  if (!smtpConfigured()) return { ok: false, code: "SMTP_NOT_CONFIGURED" };
  const lang: Lang = lead.lang === "en" ? "en" : "pl";
  const client = stubClient(lead, snap);
  const pdf = await buildReportPdf(client, snap, lang);
  const mail = reportMail(lang, hostOf(snap), snap);
  const out = await sendMail({
    to: lead.email,
    subject: mail.subject,
    text: mail.text,
    replyTo: smtpFrom(),
    attachments: [{ filename: `NovoPix-${lang === "pl" ? "raport" : "report"}-${hostOf(snap).replace(/[^\w.-]+/g, "_")}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  const now = new Date().toISOString();
  rep.log = [...(rep.log || [])];
  if (!out.ok) {
    rep.log.push({ at: now, action: "send_failed", detail: out.error || out.reason });
    saveDb();
    return { ok: false, code: "SEND_FAILED", error: out.error || out.reason };
  }
  rep.status = "sent";
  rep.sentAt = now;
  rep.sentTo = lead.email;
  rep.auto = auto;
  rep.log.push({ at: now, action: auto ? "sent_auto" : "sent", detail: lead.email });
  const c = lead.clientId ? db.agencyClients.find((x) => x.id === lead.clientId) : undefined;
  if (c) logActivity(c, "email_sent", auto ? `Raport PDF wysłany automatycznie na ${lead.email}` : `Raport PDF wysłany na ${lead.email} (zatwierdził: ${rep.approvedBy})`);
  saveDb(true);
  return { ok: true };
}

export function createReportLead(body: any): { status: number; data: any } {
  const lang: Lang = normalizeFormLang(body?.lang) || "pl";
  const pl = lang === "pl";
  const email = String(body?.email || "").trim();
  if (!EMAIL_RE.test(email) || email.length > 120) return { status: 400, data: { error: pl ? "Podaj prawidłowy adres e-mail." : "Please enter a valid email address." } };
  if (body?.consent !== true) return { status: 400, data: { error: pl ? "Zgoda jest wymagana, aby wysłać raport." : "Consent is required to send the report." } };
  const snap = body?.snapshot;
  if (!validSnapshot(snap)) return { status: 410, data: { error: pl ? "Wynik skanu wygasł – zeskanuj stronę ponownie." : "The scan result has expired – please scan the website again.", code: "SCAN_EXPIRED" } };
  const since = Date.now() - 24 * 60 * 60 * 1000;
  if (db.leads.filter((l) => l.kind === "report" && l.email.toLowerCase() === email.toLowerCase() && Date.parse(l.timestamp) > since).length >= 3) {
    return { status: 429, data: { error: lang === "pl" ? "Na ten adres wysłano już kilka próśb dzisiaj. Spróbuj jutro." : "Several requests were already made for this address today. Try again tomorrow." } };
  }
  const now = new Date().toISOString();
  const host = hostOf(snap);
  let client = db.agencyClients.find((c) => hostKey(c.website) === hostKey(snap.finalUrl) && c.email.toLowerCase() === email.toLowerCase());
  if (!client) {
    client = {
      id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: "Klient ze Skanera (raport PDF)",
      company: host,
      email,
      phone: "",
      website: snap.finalUrl,
      status: "scanned",
      contractValue: 0,
      hourlyRate: 150,
      estimatedHours: 8,
      retainerFee: 300,
      addedAt: now,
      lastScore: snap.overallScore ?? 0,
      source: "scanner-report",
      leadLang: lang,
      lastScan: snap,
      notes: "Prośba o raport PDF ze skanera publicznego (zgoda zapisana).",
      activityLog: [],
    };
    db.agencyClients.unshift(client);
  } else {
    client.leadLang = lang;
    if (!client.lastScan || Date.parse(client.lastScan.scannedAt) < Date.parse(snap.scannedAt)) client.lastScan = snap;
  }
  const lead: LeadRecord = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
    name: null,
    email,
    phone: null,
    website: snap.finalUrl,
    details: "Prośba o pełny raport PDF (skaner publiczny)",
    overallScore: snap.overallScore,
    scores: { performance: snap.categories.performance ?? -1, seo: snap.categories.seo ?? -1, accessibility: snap.categories.accessibility ?? -1, bestPractices: snap.categories.bestPractices ?? -1 },
    cwv: {},
    isSample: false,
    kind: "report",
    lang,
    clientId: client.id,
    consent: { reportAndInfo: true, at: now, text: CONSENT_TEXT[lang], policyUrl: POLICY_URL },
    report: { status: "pending", requestedAt: now, snapshot: snap, log: [{ at: now, action: "requested", detail: lang }] },
  };
  db.leads.unshift(lead);
  logActivity(client, "audit", `Prośba o raport PDF ze skanera (${lang.toUpperCase()}, zgoda zapisana) – czeka na zatwierdzenie`);
  saveDb(true);
  return { status: 200, data: { success: true, leadId: lead.id, client } };
}

export function registerPanelFunnel(app: Express, requireInternal: (req: any, res: any, next: any) => void) {
  const leads = () => db.leads;
  const results = () => (db.sharedResults ||= {});

  // --- Raport PDF na e-mail ---
  app.post("/api/internal/report-request", requireInternal, async (req, res) => {
    const out = createReportLead(req.body);
    if (out.status !== 200) return res.status(out.status).json(out.data);
    trackEvent("report_request");
    const lead = leads().find((l) => l.id === out.data.leadId)!;
    let autoSent = false;
    if (db.settings?.autoSendReport && smtpConfigured()) {
      const r = await sendLeadReport(lead, true);
      autoSent = r.ok;
    }
    void sendMail({
      to: alertRecipient(),
      subject: `[NovoPix] Prośba o raport PDF: ${hostOf(lead.report!.snapshot!)}`,
      text: autoSent
        ? `Raport PDF wysłano automatycznie (tryb automatyczny włączony).\n\nStrona: ${lead.website}\nE-mail: ${lead.email}\nJęzyk: ${lead.lang}\nZgoda: zapisana (${lead.consent?.at})`
        : `Nowa prośba o raport PDF – raport czeka na zatwierdzenie w panelu.\n\nStrona: ${lead.website}\nE-mail: ${lead.email}\nJęzyk: ${lead.lang}\nZgoda: zapisana (${lead.consent?.at})\n\nOtwórz panel agencji → CRM → „Skaner publiczny”.`,
      replyTo: lead.email,
    }).catch(() => {});
    return res.json({ success: true, autoSent });
  });

  app.get("/api/report-requests", requireAgencyAuth, (_req, res) => {
    const list = leads()
      .filter((l) => l.kind === "report" && l.report)
      .map((l) => ({
        id: l.id,
        email: l.email,
        website: l.website,
        lang: l.lang || "pl",
        timestamp: l.timestamp,
        clientId: l.clientId,
        overallScore: l.report!.snapshot?.overallScore ?? null,
        measurementStatus: l.report!.snapshot?.measurementStatus,
        consentAt: l.consent?.at,
        status: l.report!.status,
        approvedBy: l.report!.approvedBy,
        sentAt: l.report!.sentAt,
        auto: l.report!.auto,
      }));
    res.json({ requests: list, autoSendReport: !!db.settings?.autoSendReport, smtp: smtpConfigured() });
  });

  const findReq = (req: Request, res: Response) => {
    const lead = leads().find((l) => l.id === req.params.id && l.kind === "report" && l.report);
    if (!lead) {
      res.status(404).json({ error: "Nie znaleziono zgłoszenia." });
      return null;
    }
    return lead;
  };

  app.get("/api/report-requests/:id/report.pdf", requireAgencyAuth, async (req, res) => {
    const lead = findReq(req, res);
    if (!lead) return;
    const snap = lead.report!.snapshot!;
    const lang = lead.lang === "en" ? "en" : "pl";
    const pdf = await buildReportPdf(stubClient(lead, snap), snap, lang);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="NovoPix-report-${hostOf(snap).replace(/[^\w.-]+/g, "_")}.pdf"`);
    return res.send(pdf);
  });

  app.post("/api/report-requests/:id/approve", requireAgencyAuth, async (req, res) => {
    const lead = findReq(req, res);
    if (!lead) return;
    const rep = lead.report!;
    if (rep.status === "sent") return res.status(409).json({ error: "Raport został już wysłany." });
    const reviewer = String(req.body?.reviewer || "").trim();
    if (reviewer.length < 3 || reviewer.length > 80) return res.status(400).json({ error: "Podaj imię i nazwisko osoby zatwierdzającej (min. 3 znaki)." });
    rep.status = "pending";
    rep.approvedBy = reviewer;
    rep.approvedAt = new Date().toISOString();
    rep.log = [...(rep.log || []), { at: rep.approvedAt, action: "approved", detail: reviewer }];
    if (!smtpConfigured()) {
      saveDb(true);
      return res.status(409).json({ error: "SMTP nie skonfigurowane – pobierz raport PDF i wyślij go ręcznie, potem oznacz jako wysłany.", code: "SMTP_NOT_CONFIGURED", approved: true });
    }
    const r = await sendLeadReport(lead, false);
    if (!r.ok) return res.status(502).json({ error: `Nie udało się wysłać raportu (${r.error || r.code}).`, code: "SEND_FAILED", approved: true });
    return res.json({ success: true });
  });

  app.post("/api/report-requests/:id/mark-sent", requireAgencyAuth, (req, res) => {
    const lead = findReq(req, res);
    if (!lead) return;
    const rep = lead.report!;
    if (!rep.approvedBy) return res.status(409).json({ error: "Najpierw zatwierdź raport (imię i nazwisko).", code: "NOT_APPROVED" });
    const now = new Date().toISOString();
    rep.status = "sent";
    rep.sentAt = now;
    rep.sentTo = lead.email;
    rep.log = [...(rep.log || []), { at: now, action: "marked_sent_manually", detail: lead.email }];
    const c = lead.clientId ? db.agencyClients.find((x) => x.id === lead.clientId) : undefined;
    if (c) logActivity(c, "email_sent", `Raport PDF oznaczony jako wysłany ręcznie (${lead.email})`);
    saveDb(true);
    return res.json({ success: true });
  });

  app.post("/api/report-requests/:id/reject", requireAgencyAuth, (req, res) => {
    const lead = findReq(req, res);
    if (!lead) return;
    lead.report!.status = "rejected";
    lead.report!.log = [...(lead.report!.log || []), { at: new Date().toISOString(), action: "rejected" }];
    saveDb();
    return res.json({ success: true });
  });

  // Tryb automatyczny: tylko gdy SMTP skonfigurowane; domyślnie wyłączony (raport czeka na zatwierdzenie).
  app.get("/api/settings/auto-report", requireAgencyAuth, (_req, res) => res.json({ autoSendReport: !!db.settings?.autoSendReport, smtp: smtpConfigured() }));
  app.put("/api/settings/auto-report", requireAgencyAuth, (req, res) => {
    const on = req.body?.autoSendReport === true;
    if (on && !smtpConfigured()) return res.status(409).json({ error: "Tryb automatyczny wymaga skonfigurowanego SMTP.", code: "SMTP_NOT_CONFIGURED" });
    db.settings = { ...(db.settings || { autoSendReport: false }), autoSendReport: on };
    saveDb(true);
    return res.json({ success: true, autoSendReport: on });
  });

  // --- Publiczne linki do wyników ---
  const sweep = () => {
    const now = Date.now();
    let n = 0;
    for (const [id, r] of Object.entries(results())) {
      if (Date.parse(r.expiresAt) < now) {
        delete results()[id];
        n++;
      }
    }
    if (n) saveDb();
  };
  sweep();
  setInterval(sweep, 6 * 60 * 60 * 1000).unref();

  app.post("/api/internal/results", requireInternal, (req, res) => {
    const snap = req.body?.snapshot;
    if (!validSnapshot(snap)) return res.status(410).json({ error: "Wynik skanu wygasł – zeskanuj stronę ponownie.", code: "SCAN_EXPIRED" });
    sweep();
    if (Object.keys(results()).length >= MAX_RESULTS) return res.status(503).json({ error: "Limit publicznych linków został osiągnięty." });
    const id = crypto.randomBytes(9).toString("base64url");
    const deleteToken = crypto.randomBytes(24).toString("hex");
    const now = Date.now();
    // Snapshot bez danych osobowych: tylko wynik pomiaru publicznej strony (bez i18n spoza użytych tekstów).
    const rec: SharedResult = { id, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + RESULT_TTL_MS).toISOString(), deleteTokenHash: sha(deleteToken), snapshot: snap };
    results()[id] = rec;
    trackEvent("share_link");
    saveDb();
    return res.json({ success: true, id, deleteToken, expiresAt: rec.expiresAt });
  });

  app.get("/api/internal/results/:id", requireInternal, (req, res) => {
    const r = results()[req.params.id];
    if (!r) return res.status(404).json({ error: "Not found" });
    if (Date.parse(r.expiresAt) < Date.now()) {
      delete results()[r.id];
      saveDb();
      return res.status(410).json({ error: "Expired" });
    }
    return res.json({ result: { id: r.id, createdAt: r.createdAt, expiresAt: r.expiresAt, snapshot: r.snapshot } });
  });

  app.delete("/api/internal/results/:id", requireInternal, (req, res) => {
    const r = results()[req.params.id];
    const token = String(req.body?.deleteToken || "");
    if (!r) return res.status(404).json({ error: "Not found" });
    const a = Buffer.from(sha(token));
    const b = Buffer.from(r.deleteTokenHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(403).json({ error: "Forbidden" });
    delete results()[r.id];
    saveDb();
    return res.json({ success: true });
  });

  app.get("/api/results", requireAgencyAuth, (_req, res) => {
    sweep();
    res.json({ results: Object.values(results()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({ id: r.id, host: hostOf(r.snapshot), createdAt: r.createdAt, expiresAt: r.expiresAt, overallScore: r.snapshot.overallScore })) });
  });
  app.delete("/api/results/:id", requireAgencyAuth, (req, res) => {
    if (!results()[req.params.id]) return res.status(404).json({ error: "Nie znaleziono linku." });
    delete results()[req.params.id];
    saveDb();
    return res.json({ success: true });
  });
}

// ===================== SKANER PUBLICZNY (APP_MODE=public): bramka bez zapisu danych =====================

type Forward = (pathname: string, method: "GET" | "POST" | "DELETE", body?: unknown) => Promise<{ status: number; data: any }>;

export function registerPublicFunnel(app: Express, forward: Forward) {
  const bad = (res: Response, lang: Lang) => res.status(502).json({ error: lang === "pl" ? "Nie udało się przekazać zgłoszenia. Spróbuj ponownie za minutę lub napisz na contact@novopix.uk." : "Could not submit the request. Try again in a minute or write to contact@novopix.uk." });

  // „Zobacz przykład”: prawdziwy, zapisany wynik pomiaru novopix.uk (snapshot /r/<id> bez danych osobowych), odnawiany co ok. 20 h.
  let example: { id: string; at: number } | null = null;
  let exampleBusy: Promise<void> | null = null;
  const ensureExample = async () => {
    if (example && Date.now() - example.at < 20 * 3600 * 1000) return;
    exampleBusy ||= (async () => {
      try {
        const out = await performScan("https://novopix.uk/", "mobile");
        const snap = snapshotFromScan(out.body, "mobile", "https://novopix.uk/");
        if (!snap || out.body?.measurementStatus === "failed") return;
        const r = await forward("/api/internal/results", "POST", { snapshot: snap });
        if (r.status === 200 && r.data?.id) example = { id: r.data.id, at: Date.now() };
      } catch {}
    })().finally(() => { exampleBusy = null; });
    await exampleBusy;
  };
  app.get("/example", async (req, res) => {
    const lang: Lang = normalizeFormLang(req.query.lang) || "pl";
    const limit = checkRateLimit(`example_${req.ip || "local"}`, 20, 60 * 60 * 1000);
    if (limit.allowed) await ensureExample();
    if (example) return res.redirect(302, `/r/${example.id}?lang=${lang}&example=1`);
    // Awaryjnie: świeży skan novopix.uk w skanerze.
    return res.redirect(302, `/?url=novopix.uk&autoscan=1&lang=${lang}`);
  });

  app.get("/api/funnel/config", (_req, res) => res.json({ policyUrl: POLICY_URL, consentText: CONSENT_TEXT }));

  app.post("/api/report-request", async (req, res) => {
    const lang: Lang = normalizeFormLang(req.body?.lang) || "pl";
    const limit = checkRateLimit(`rr_${req.ip || "local"}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: lang === "pl" ? "Zbyt wiele żądań. Spróbuj ponownie później." : "Too many requests. Please try again later." });
    if (req.body?.hp && String(req.body.hp).trim()) return res.status(200).json({ success: true, ignored: true });
    const snapshot = recallScan(req.body?.scanId);
    if (!snapshot) return res.status(410).json({ error: lang === "pl" ? "Wynik skanu wygasł – zeskanuj stronę ponownie." : "The scan result has expired – please scan the website again.", code: "SCAN_EXPIRED" });
    try {
      const out = await forward("/api/internal/report-request", "POST", { email: req.body?.email, consent: req.body?.consent === true, lang, snapshot });
      return res.status(out.status).json(out.data);
    } catch {
      return bad(res, lang);
    }
  });

  app.post("/api/share", async (req, res) => {
    const lang: Lang = normalizeFormLang(req.body?.lang) || "pl";
    const limit = checkRateLimit(`share_${req.ip || "local"}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: lang === "pl" ? "Zbyt wiele żądań. Spróbuj ponownie później." : "Too many requests. Please try again later." });
    const snapshot = recallScan(req.body?.scanId);
    if (!snapshot) return res.status(410).json({ error: lang === "pl" ? "Wynik skanu wygasł – zeskanuj stronę ponownie." : "The scan result has expired – please scan the website again.", code: "SCAN_EXPIRED" });
    try {
      const out = await forward("/api/internal/results", "POST", { snapshot });
      if (out.status !== 200) return res.status(out.status).json(out.data);
      return res.json({ success: true, id: out.data.id, path: `/r/${out.data.id}`, deleteToken: out.data.deleteToken, expiresAt: out.data.expiresAt });
    } catch {
      return bad(res, lang);
    }
  });

  app.delete("/api/share/:id", async (req, res) => {
    const limit = checkRateLimit(`shdel_${req.ip || "local"}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: "Too many requests." });
    try {
      const out = await forward(`/api/internal/results/${encodeURIComponent(req.params.id)}`, "DELETE", { deleteToken: req.body?.deleteToken });
      return res.status(out.status).json(out.data);
    } catch {
      return res.status(502).json({ error: "Unavailable" });
    }
  });

  const origin = (req: Request) => `${req.protocol}://${req.get("host")}`;
  const load = async (id: string) => {
    try {
      const out = await forward(`/api/internal/results/${encodeURIComponent(id)}`, "GET");
      return out;
    } catch {
      return { status: 502, data: {} };
    }
  };
  const notFoundPage = (res: Response, status: number, lang: Lang) => {
    const pl = lang === "pl";
    const msg = status === 410 ? (pl ? "Ten link wygasł." : "This link has expired.") : status === 404 ? (pl ? "Nie znaleziono wyniku (mógł zostać usunięty)." : "Result not found (it may have been deleted).") : pl ? "Wynik chwilowo niedostępny." : "Result temporarily unavailable.";
    res
      .status(status === 502 ? 503 : status)
      .set({ "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" })
      .type("html")
      .send(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="light dark"><title>NovoPix</title><style>body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:48px 16px;text-align:center;background:#f4f7f9;color:#0e2733}@media(prefers-color-scheme:dark){body{background:#0b1a22;color:#eaf2f6}}a{display:inline-block;margin-top:16px;background:#ffc233;color:#0e2733;font-weight:800;text-decoration:none;padding:12px 20px;border-radius:12px}</style></head><body><h1>${esc(msg)}</h1><a href="/">${pl ? "Zeskanuj własną stronę" : "Scan your own website"} →</a></body></html>`);
  };
  const pageLang = (req: Request): Lang => normalizeFormLang(req.query.lang) || (/^\s*pl/i.test(String(req.headers["accept-language"] || "")) ? "pl" : "en");

  app.get("/r/:id", async (req, res) => {
    const lang = pageLang(req);
    if (!/^[\w-]{8,32}$/.test(req.params.id)) return notFoundPage(res, 404, lang);
    const out = await load(req.params.id);
    if (out.status !== 200 || !out.data?.result) return notFoundPage(res, out.status === 410 ? 410 : out.status === 404 ? 404 : 502, lang);
    const r = out.data.result;
    const html = renderResultPage({ id: r.id, snapshot: r.snapshot, expiresAt: r.expiresAt, lang, origin: origin(req), withOgImage: await ogImageAvailable(), example: req.query.example === "1" });
    res.set({ "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "private, max-age=60" }).type("html").send(html);
  });

  const ogCache = new Map<string, Buffer>();
  app.get("/r/:id/og.png", async (req, res) => {
    if (!/^[\w-]{8,32}$/.test(req.params.id)) return res.status(404).end();
    const lang = normalizeFormLang(req.query.lang) || "pl";
    // Zawsze sprawdzamy w panelu, czy wynik nadal istnieje (usunięty/wygasły nie może być serwowany z pamięci).
    const out = await load(req.params.id);
    if (out.status !== 200 || !out.data?.result) return res.status(out.status === 410 ? 410 : 404).end();
    const key = `${req.params.id}:${lang}`;
    let png = ogCache.get(key);
    if (!png) {
      const made = await renderOgImage(out.data.result.snapshot, lang);
      if (!made) return res.status(404).end();
      png = made;
      if (ogCache.size >= 100) ogCache.delete(ogCache.keys().next().value as string);
      ogCache.set(key, png);
    }
    res.set({ "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" }).send(png);
  });
}
