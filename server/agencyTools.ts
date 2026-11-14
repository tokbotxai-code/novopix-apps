// Narzędzia agencji (tylko po PIN-ie): wysyłka raportu klientowi, ekran „Dziś”, historia pomiarów domeny,
// dziennik zmian i przywracanie kopii. Bez zmyślonych danych: wszystko pochodzi z bazy i prawdziwych pomiarów.
import fs from "fs";
import path from "path";
import type { Express } from "express";
import { requireAgencyAuth, checkRateLimit } from "./security";
import { db, saveDb, LeadRecord, AgencyClient } from "./database";
import { recallScan } from "./scanCache";
import { buildReportPdf } from "./pdfReport";
import { buildFullPdf } from "./pdfDesign";
import { getLastReview } from "./fullReview";
import { stubClient } from "./funnel";
import { hostOf } from "./resultPage";
import { sendMail, smtpConfigured } from "./mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function recordScanHistory(url: string, body: any) {
  try {
    if (!body || body.measurementStatus !== "live_lighthouse") return;
    const host = new URL(String(body.finalUrl || url).startsWith("http") ? String(body.finalUrl || url) : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
    if (!host) return;
    if (!db.domainHistory) db.domainHistory = {};
    const list = (db.domainHistory[host] = db.domainHistory[host] || []);
    const c = body.categories || {};
    const rec = { at: new Date().toISOString(), overall: typeof body.overallScore === "number" ? body.overallScore : null, performance: c.performance ?? null, seo: c.seo ?? null, accessibility: c.accessibility ?? null };
    const last = list[list.length - 1];
    // nie dopisujemy drugiego pomiaru z tych samych 10 minut
    if (last && Date.now() - new Date(last.at).getTime() < 10 * 60 * 1000) list[list.length - 1] = rec;
    else list.push(rec);
    if (list.length > 60) list.splice(0, list.length - 60);
    saveDb();
  } catch {}
}

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export function registerAgencyTools(app: Express) {
  // 1) Wysłanie raportu PDF klientowi z panelu (treść maila wybiera i edytuje agencja).
  app.post("/api/agency/send-scan-report", requireAgencyAuth, async (req, res) => {
    const lang = req.body?.lang === "en" ? "en" : "pl";
    const limit = checkRateLimit(`sendrep_${req.ip || "local"}`, 40, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ error: lang === "pl" ? "Zbyt wiele wysyłek. Spróbuj później." : "Too many sends. Try again later." });
    const email = String(req.body?.email || "").trim();
    const subject = String(req.body?.subject || "").trim().slice(0, 200);
    const message = String(req.body?.message || "").trim().slice(0, 6000);
    if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: lang === "pl" ? "Podaj poprawny adres e-mail." : "Enter a valid e-mail address." });
    if (!subject || !message) return res.status(400).json({ error: lang === "pl" ? "Temat i treść są wymagane." : "Subject and message are required." });
    const snap = recallScan(req.body?.scanId);
    if (!snap) return res.status(410).json({ error: lang === "pl" ? "Wynik skanu wygasł. Zeskanuj stronę ponownie." : "The scan result has expired. Scan the site again.", code: "SCAN_EXPIRED" });
    if (!smtpConfigured()) return res.status(409).json({ error: lang === "pl" ? "SMTP nie jest skonfigurowane." : "SMTP is not configured.", code: "SMTP_NOT_CONFIGURED" });
    const pdf = await buildReportPdf(stubClient({ email } as any, snap), snap, lang);
    const host = hostOf(snap).replace(/[^\w.-]+/g, "_");
    const out = await sendMail({
      to: email,
      subject,
      text: `${message}\n\n--\nNovoPix UK\ncontact@novopix.uk · https://novopix.uk\n${lang === "pl" ? "Raport jest wynikiem wstępnej kontroli automatycznej. To nie jest certyfikat, audyt zgodności (WCAG) ani opinia prawna." : "The report is the result of a preliminary automated check. It is not a certificate, a compliance (WCAG) audit or legal advice."}`,
      replyTo: "contact@novopix.uk",
      attachments: [{ filename: `NovoPix-${lang === "pl" ? "raport" : "report"}-${host}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    if (!out.ok) return res.status(502).json({ error: lang === "pl" ? "Nie udało się wysłać maila." : "The e-mail could not be sent.", code: "SEND_FAILED" });
    // jeśli adres należy do zgłoszenia w CRM, oznaczamy je jako obsłużone
    const lead = db.leads.find((l) => l.email.toLowerCase() === email.toLowerCase() && !l.repliedAt);
    if (lead) { lead.repliedAt = new Date().toISOString(); saveDb(); }
    return res.json({ ok: true });
  });

  // Pełny raport PDF dla agencji: wszystkie sekcje (wynik, CWV, problemy, domena i poczta, przegląd podstron, historia, oferta).
  app.post("/api/agency/full-pdf", requireAgencyAuth, async (req, res) => {
    const lang = req.body?.lang === "en" ? "en" : "pl";
    const snap = recallScan(req.body?.scanId);
    if (!snap) return res.status(410).json({ error: lang === "pl" ? "Wynik skanu wygasł. Zeskanuj stronę ponownie." : "The scan result has expired. Scan the site again.", code: "SCAN_EXPIRED" });
    try {
      const host = hostOf(snap).replace(/^www\./, "").toLowerCase();
      const ex = req.body?.extras || {};
      const pdf = await buildFullPdf(stubClient({ email: "" } as any, snap), snap, lang, {
        review: getLastReview(host),
        domainHealth: ex.domainHealth && typeof ex.domainHealth === "object" ? ex.domainHealth : undefined,
        contact: ex.contact && typeof ex.contact === "object" ? ex.contact : undefined,
        offerLines: Array.isArray(ex.offerLines) ? ex.offerLines.slice(0, 12).map((x: any) => String(x).slice(0, 200)) : undefined,
        history: (db.domainHistory || {})[host] || [],
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NovoPix-${lang === "pl" ? "pelny-raport" : "full-report"}-${host.replace(/[^\w.-]+/g, "_")}.pdf"`);
      return res.send(pdf);
    } catch (e: any) {
      console.warn("full-pdf error:", e?.message);
      return res.status(500).json({ error: lang === "pl" ? "Nie udało się przygotować PDF." : "Could not prepare the PDF." });
    }
  });

  // 3, 5) Ekran „Dziś”: zgłoszenia bez odpowiedzi, alerty monitoringu, ostatnie skany.
  app.get("/api/agency/today", requireAgencyAuth, (_req, res) => {
    const waiting = db.leads
      .filter((l: LeadRecord) => !l.isSample && !l.repliedAt && !(l.kind === "report" && l.report?.status === "sent"))
      .map((l) => ({ id: l.id, name: l.name || "", email: l.email, website: l.website, kind: l.kind || "quote", at: l.timestamp, days: daysSince(l.timestamp), lang: l.lang || "pl", score: l.overallScore }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 20);
    const alerts = db.monitoredDomains.flatMap((d) => (d.alertsLog || []).filter((a) => !a.seen).map((a) => ({ domain: d.domain, type: a.type, message: a.message, at: a.timestamp })))
      .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
    const recent = Object.entries(db.domainHistory || {})
      .map(([host, list]) => ({ host, last: list[list.length - 1] }))
      .filter((x) => x.last)
      .sort((a, b) => b.last.at.localeCompare(a.last.at)).slice(0, 8)
      .map((x) => ({ host: x.host, at: x.last.at, overall: x.last.overall, count: (db.domainHistory![x.host] || []).length }));
    res.json({ waiting, alerts, recent, smtp: smtpConfigured() });
  });

  app.post("/api/agency/leads/:id/replied", requireAgencyAuth, (req, res) => {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: "Nie znaleziono zgłoszenia." });
    lead.repliedAt = new Date().toISOString();
    saveDb();
    res.json({ ok: true });
  });

  // 4, 8) Historia pomiarów domeny (przed i po).
  app.get("/api/agency/history", requireAgencyAuth, (req, res) => {
    const host = String(req.query.host || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    res.json({ host, history: (db.domainHistory || {})[host] || [] });
  });

  // 10) Dziennik zmian: wpisy z kart klientów, zgłoszenia i alerty, od najnowszych.
  app.get("/api/agency/activity", requireAgencyAuth, (_req, res) => {
    const rows: Array<{ at: string; who: string; text: string }> = [];
    db.agencyClients.forEach((c: AgencyClient) => (c.activityLog || []).forEach((a) => rows.push({ at: a.timestamp || "", who: c.company || c.name, text: a.summary || a.type })));
    db.leads.forEach((l) => rows.push({ at: l.timestamp, who: l.email, text: l.kind === "report" ? "Prośba o raport PDF" : "Zapytanie o wycenę" }));
    db.monitoredDomains.forEach((d) => (d.alertsLog || []).forEach((a) => rows.push({ at: a.timestamp, who: d.domain, text: a.message })));
    rows.sort((a, b) => b.at.localeCompare(a.at));
    res.json({ rows: rows.slice(0, 60) });
  });

  // 10) Przywracanie kopii: najpierw zapis obecnej bazy, potem podmiana tylko poprawnej struktury.
  app.post("/api/agency/restore", requireAgencyAuth, (req, res) => {
    const d = req.body?.data;
    if (!d || typeof d !== "object" || !Array.isArray(d.leads) || !Array.isArray(d.agencyClients) || !Array.isArray(d.monitoredDomains)) {
      return res.status(400).json({ error: "To nie jest poprawna kopia bazy (brak leads, agencyClients albo monitoredDomains)." });
    }
    try {
      saveDb(true);
      const pin = db.agencyPin;
      db.leads = d.leads;
      db.agencyClients = d.agencyClients;
      db.monitoredDomains = d.monitoredDomains;
      if (d.proposals && typeof d.proposals === "object") db.proposals = d.proposals;
      if (d.offers && typeof d.offers === "object") db.offers = d.offers;
      if (d.domainHistory && typeof d.domainHistory === "object") db.domainHistory = d.domainHistory;
      db.agencyPin = pin; // PIN zostaje obecny
      saveDb();
      return res.json({ ok: true, leads: db.leads.length, clients: db.agencyClients.length, domains: db.monitoredDomains.length });
    } catch (e: any) {
      return res.status(500).json({ error: "Nie udało się przywrócić kopii." });
    }
  });
}
