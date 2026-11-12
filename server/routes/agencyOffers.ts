import crypto from "crypto";
import type { Express } from "express";
import { requireAgencyAuth } from "../security";
import { db, saveDb, advanceStage, logActivity, OfferDraft } from "../database";
import { performScan } from "../scanService";
import { snapshotFromScan } from "../scanSnapshot";
import { generateOffer, offerToPlainText, violatesLegalRules } from "../offers";
import { buildReportPdf, buildBeforeAfterPdf } from "../pdfReport";
import { buildComparison } from "../beforeAfter";
import { smtpConfigured, smtpFrom, sendMail, buildEml } from "../mailer";
import { suggestLanguage, currencyForLang, effectiveLanguage, normalizeFormLang, Lang } from "../language";
import { sanitizePackage, packagePrice } from "../packages";

const findClient = (id: string) => db.agencyClients.find((c) => c.id === id);
const offersMap = () => (db.offers ||= {});
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function offerFingerprint(o: OfferDraft): string {
  return crypto.createHash("sha256").update(JSON.stringify([o.subject, o.mailBody, o.offerTitle, o.offerSections, o.priceNet, o.currency])).digest("hex").slice(0, 16);
}

export function registerAgencyOfferRoutes(app: Express) {
  app.get("/api/mail/status", requireAgencyAuth, (_req, res) => {
    res.json({ configured: smtpConfigured(), from: smtpConfigured() ? smtpFrom() : null });
  });

  // Skan klienta z CRM: wynik zapisuje się jako migawka przy kliencie, etap „Skan wykonany”.
  app.post("/api/crm/clients/:id/scan", requireAgencyAuth, async (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    const strategy = req.body?.strategy === "desktop" ? "desktop" : "mobile";
    const out = await performScan(client.website, strategy);
    const snap = snapshotFromScan(out.body, strategy, client.website);
    if (!snap) return res.status(out.status >= 400 ? out.status : 422).json({ error: out.body?.error || "Pomiar nie powiódł się.", measurementStatus: "failed" });
    client.lastScan = snap;
    if (typeof snap.overallScore === "number") client.lastScore = snap.overallScore;
    logActivity(client, "audit", `Skan strony (${snap.measurementStatus === "live_lighthouse" ? "Lighthouse" : "pomiar częściowy HTML"}): ${snap.overallScore ?? "brak"}/100`);
    advanceStage(client, "scanned", "Etap: skan wykonany");
    saveDb();
    return res.json({ success: true, client });
  });

  app.get("/api/crm/clients/:id/offers", requireAgencyAuth, (req, res) => {
    const list = Object.values(offersMap())
      .filter((o) => o.clientId === req.params.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ offers: list });
  });

  // Propozycja języka oferty: język zapisany przy kliencie, w przeciwnym razie reguły: formularz → <html lang> → domena.
  const languageInfo = (client: any) => {
    const suggestion = suggestLanguage({ formLang: client.leadLang, htmlLang: client.lastScan?.htmlLang, website: client.website });
    if (client.language === "pl" || client.language === "en") return { language: client.language as Lang, source: "client" as const, suggestion };
    return { language: suggestion.language, source: suggestion.source, suggestion };
  };

  app.get("/api/crm/clients/:id/language", requireAgencyAuth, (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    return res.json({ ...languageInfo(client), effective: effectiveLanguage(client) });
  });

  const activePackage = (id: any) => (typeof id === "string" && id ? (db.packages || []).find((p) => p.id === id) : undefined);

  app.post("/api/crm/clients/:id/offer", requireAgencyAuth, async (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    if (!client.lastScan) return res.status(409).json({ error: "Najpierw wykonaj skan strony klienta (przycisk „Skanuj”).", code: "NO_SCAN" });
    const info = languageInfo(client);
    const language: Lang = normalizeFormLang(req.body?.language) || info.language;
    const currency = ["PLN", "GBP"].includes(req.body?.currency) ? (req.body.currency as "PLN" | "GBP") : currencyForLang(language);
    let pkg;
    if (req.body?.packageId) {
      pkg = activePackage(req.body.packageId);
      if (!pkg) return res.status(404).json({ error: "Nie znaleziono pakietu.", code: "NO_PACKAGE" });
    }
    const { content, generatedBy, priceNet } = await generateOffer(client, language, currency, pkg);
    const now = new Date().toISOString();
    const offer: OfferDraft = {
      id: `off_${crypto.randomBytes(8).toString("hex")}`,
      clientId: client.id,
      language,
      status: "draft",
      ...content,
      priceNet,
      currency,
      ...(pkg ? { packageId: pkg.id, packageName: language === "pl" ? pkg.namePl : pkg.nameEn } : {}),
      generatedBy,
      createdAt: now,
      updatedAt: now,
      sendLog: [{ at: now, action: "draft_created", detail: `${generatedBy}, ${language}` }],
    };
    offersMap()[offer.id] = offer;
    logActivity(client, "offer_draft", `Szkic oferty (${language.toUpperCase()}, ${generatedBy === "ai" ? "AI" : "szablon"}${pkg ? `, pakiet: ${pkg.namePl}` : ""}) – czeka na zatwierdzenie`);
    advanceStage(client, "offer_draft", "Etap: szkic oferty");
    saveDb();
    return res.json({ success: true, offer, client });
  });

  // Przełącznik PL/EN w szkicu: regeneruje treść oferty i maila (AI z awaryjnym szablonem), waluta wynika z języka.
  app.post("/api/offers/:id/language", requireAgencyAuth, async (req, res) => {
    const o = offersMap()[req.params.id];
    if (!o) return res.status(404).json({ error: "Nie znaleziono oferty." });
    const client = findClient(o.clientId);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    const language = normalizeFormLang(req.body?.language);
    if (!language) return res.status(400).json({ error: "Język musi mieć wartość pl albo en." });
    if (language === o.language && (!req.body?.currency || req.body.currency === o.currency)) return res.json({ success: true, offer: o, unchanged: true });
    const pkg = activePackage(o.packageId);
    const currency = ["PLN", "GBP"].includes(req.body?.currency) ? (req.body.currency as "PLN" | "GBP") : currencyForLang(language);
    const { content, generatedBy, priceNet } = await generateOffer(client, language, currency, pkg);
    const now = new Date().toISOString();
    const wasApproved = o.status === "approved";
    Object.assign(o, content, { language, currency, priceNet, generatedBy, updatedAt: now, status: "draft" as const });
    if (pkg) o.packageName = language === "pl" ? pkg.namePl : pkg.nameEn;
    delete o.approvedBy;
    delete o.approvedAt;
    o.sendLog = [...(o.sendLog || []), { at: now, action: "language_changed", detail: `${language}${wasApproved ? " (wymaga ponownego zatwierdzenia)" : ""}` }];
    logActivity(client, "offer_draft", `Zmieniono język szkicu oferty na ${language.toUpperCase()} (${generatedBy === "ai" ? "AI" : "szablon"}) – czeka na zatwierdzenie`);
    saveDb();
    return res.json({ success: true, offer: o });
  });

  // --- Pakiety o stałej cenie (edytowalne w panelu) ---
  const pkgs = () => (db.packages ||= []);
  app.get("/api/packages", requireAgencyAuth, (_req, res) => {
    res.json({ packages: [...pkgs()].sort((a, b) => a.sort - b.sort) });
  });
  app.post("/api/packages", requireAgencyAuth, (req, res) => {
    const p = sanitizePackage({ ...req.body, sort: req.body?.sort ?? pkgs().length + 1 });
    if (!p) return res.status(400).json({ error: "Podaj nazwę pakietu po polsku i po angielsku." });
    pkgs().push(p);
    saveDb(true);
    return res.json({ success: true, package: p });
  });
  app.put("/api/packages/:id", requireAgencyAuth, (req, res) => {
    const i = pkgs().findIndex((p) => p.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Nie znaleziono pakietu." });
    const p = sanitizePackage(req.body, pkgs()[i]);
    if (!p) return res.status(400).json({ error: "Podaj nazwę pakietu po polsku i po angielsku." });
    pkgs()[i] = p;
    saveDb(true);
    return res.json({ success: true, package: p });
  });
  app.delete("/api/packages/:id", requireAgencyAuth, (req, res) => {
    const i = pkgs().findIndex((p) => p.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Nie znaleziono pakietu." });
    pkgs().splice(i, 1);
    saveDb(true);
    return res.json({ success: true });
  });

  app.put("/api/offers/:id", requireAgencyAuth, (req, res) => {
    const o = offersMap()[req.params.id];
    if (!o) return res.status(404).json({ error: "Nie znaleziono oferty." });
    const before = offerFingerprint(o);
    const b = req.body || {};
    if (typeof b.subject === "string") o.subject = b.subject.slice(0, 200);
    if (typeof b.mailBody === "string") o.mailBody = b.mailBody.slice(0, 6000);
    if (typeof b.offerTitle === "string") o.offerTitle = b.offerTitle.slice(0, 200);
    if (b.priceNet !== undefined && Number.isFinite(Number(b.priceNet)) && Number(b.priceNet) >= 0) o.priceNet = Math.round(Number(b.priceNet) * 100) / 100;
    if (["PLN", "EUR", "GBP"].includes(b.currency)) o.currency = b.currency;
    if (Array.isArray(b.offerSections)) {
      o.offerSections = b.offerSections.slice(0, 8).map((s: any) => ({ heading: String(s?.heading || "").slice(0, 120), body: String(s?.body || "").slice(0, 3000) }));
    }
    const all = [o.subject, o.mailBody, o.offerTitle, ...o.offerSections.map((s) => `${s.heading} ${s.body}`)].join("\n");
    const warn = violatesLegalRules(all);
    if (offerFingerprint(o) !== before) {
      o.updatedAt = new Date().toISOString();
      if (o.status === "approved") {
        // Zmiana treści po zatwierdzeniu wymaga ponownego zatwierdzenia.
        o.status = "draft";
        delete o.approvedBy;
        delete o.approvedAt;
        o.sendLog = [...(o.sendLog || []), { at: o.updatedAt, action: "edited_after_approval" }];
      }
    }
    saveDb();
    return res.json({ success: true, offer: o, legalWarning: warn ? true : false });
  });

  app.post("/api/offers/:id/approve", requireAgencyAuth, (req, res) => {
    const o = offersMap()[req.params.id];
    if (!o) return res.status(404).json({ error: "Nie znaleziono oferty." });
    const reviewer = String(req.body?.reviewer || "").trim();
    if (reviewer.length < 3 || reviewer.length > 80) return res.status(400).json({ error: "Podaj imię i nazwisko osoby zatwierdzającej (min. 3 znaki)." });
    const all = [o.subject, o.mailBody, o.offerTitle, ...o.offerSections.map((s) => `${s.heading} ${s.body}`)].join("\n");
    if (violatesLegalRules(all)) {
      return res.status(422).json({ error: "Treść zawiera sformułowania niedozwolone (gwarancja wyniku, obietnica ROI/przychodu lub „certyfikacja WCAG”). Popraw treść przed zatwierdzeniem.", code: "LEGAL_RULES" });
    }
    o.status = "approved";
    o.approvedBy = reviewer;
    o.approvedAt = new Date().toISOString();
    o.sendLog = [...(o.sendLog || []), { at: o.approvedAt, action: "approved", detail: reviewer }];
    const client = findClient(o.clientId);
    if (client) {
      client.language = o.language;
      logActivity(client, "offer_approved", `Oferta zatwierdzona przez: ${reviewer} (język: ${o.language.toUpperCase()})`);
      advanceStage(client, "offer_approved", "Etap: oferta zatwierdzona");
    }
    saveDb(true);
    return res.json({ success: true, offer: o, client });
  });

  const requireApproved = (req: any, res: any): { o: OfferDraft; client: any } | null => {
    const o = offersMap()[req.params.id];
    if (!o) {
      res.status(404).json({ error: "Nie znaleziono oferty." });
      return null;
    }
    if (o.status !== "approved") {
      res.status(409).json({ error: "Oferta nie jest zatwierdzona. Wysyłka i eksport są możliwe dopiero po zatwierdzeniu przez człowieka.", code: "NOT_APPROVED" });
      return null;
    }
    const client = findClient(o.clientId);
    if (!client) {
      res.status(404).json({ error: "Nie znaleziono klienta." });
      return null;
    }
    return { o, client };
  };

  async function pdfFor(client: any, lang: "pl" | "en") {
    if (!client.lastScan) return null;
    return buildReportPdf(client, client.lastScan, lang);
  }

  app.post("/api/offers/:id/send", requireAgencyAuth, async (req, res) => {
    const ctx = requireApproved(req, res);
    if (!ctx) return;
    const { o, client } = ctx;
    if (!smtpConfigured()) {
      return res.status(409).json({ error: "SMTP nie skonfigurowane – użyj „Kopiuj” lub „Pobierz .eml”.", code: "SMTP_NOT_CONFIGURED" });
    }
    const to = String(req.body?.to || client.email || "").trim();
    if (!EMAIL_RE.test(to) || /@(klient|firma)\.pl$/i.test(to) || /^kontakt@(klient|firma)\./i.test(to)) {
      return res.status(400).json({ error: "Podaj prawdziwy adres e-mail odbiorcy.", code: "BAD_RECIPIENT" });
    }
    const pdf = await pdfFor(client, o.language);
    const body = `${o.mailBody}\n\n--\n${offerToPlainText(o, client)}`;
    const out = await sendMail({
      to,
      subject: o.subject,
      text: body,
      replyTo: smtpFrom(),
      attachments: pdf ? [{ filename: `NovoPix-raport-${client.company.replace(/[^\w.-]+/g, "_")}.pdf`, content: pdf, contentType: "application/pdf" }] : undefined,
    });
    const now = new Date().toISOString();
    if (!out.ok) {
      o.sendLog = [...(o.sendLog || []), { at: now, action: "send_failed", detail: out.error || out.reason }];
      saveDb();
      return res.status(502).json({ error: `Nie udało się wysłać wiadomości (${out.error || out.reason}).`, code: "SEND_FAILED" });
    }
    o.sentAt = now;
    o.sentTo = to;
    o.sendLog = [...(o.sendLog || []), { at: now, action: "sent", detail: to }];
    logActivity(client, "email_sent", `Wysłano ofertę e-mailem do ${to} (zatwierdził: ${o.approvedBy})`);
    advanceStage(client, "audit_sent", "Etap: oferta wysłana");
    saveDb(true);
    return res.json({ success: true, offer: o, client });
  });

  // Ręczne oznaczenie jako wysłane (gdy mail poszedł z własnej skrzynki po „Kopiuj” / „.eml”).
  app.post("/api/offers/:id/mark-sent", requireAgencyAuth, (req, res) => {
    const ctx = requireApproved(req, res);
    if (!ctx) return;
    const { o, client } = ctx;
    const now = new Date().toISOString();
    o.sentAt = now;
    o.sentTo = String(req.body?.to || client.email || "").slice(0, 200);
    o.sendLog = [...(o.sendLog || []), { at: now, action: "marked_sent_manually", detail: o.sentTo }];
    logActivity(client, "email_sent", `Oferta oznaczona jako wysłana ręcznie (${o.sentTo})`);
    advanceStage(client, "audit_sent", "Etap: oferta wysłana");
    saveDb(true);
    return res.json({ success: true, offer: o, client });
  });

  app.get("/api/offers/:id/eml", requireAgencyAuth, async (req, res) => {
    const ctx = requireApproved(req, res);
    if (!ctx) return;
    const { o, client } = ctx;
    const pdf = await pdfFor(client, o.language);
    const eml = await buildEml({
      to: String(client.email || ""),
      subject: o.subject,
      text: `${o.mailBody}\n\n--\n${offerToPlainText(o, client)}`,
      attachments: pdf ? [{ filename: "NovoPix-raport.pdf", content: pdf, contentType: "application/pdf" }] : undefined,
    });
    res.setHeader("Content-Type", "message/rfc822");
    res.setHeader("Content-Disposition", `attachment; filename="oferta-${client.id}.eml"`);
    return res.send(eml);
  });

  // --- Skan „po wdrożeniu”, tabela przed/po i raport PDF zatwierdzany przez człowieka ---
  app.post("/api/crm/clients/:id/scan-after", requireAgencyAuth, async (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    const before = req.body?.rebase ? client.lastScan : client.beforeAfter?.before || client.lastScan;
    if (!before) return res.status(409).json({ error: "Brak skanu „przed” – najpierw wykonaj skan strony klienta.", code: "NO_BASELINE" });
    const strategy = req.body?.strategy === "desktop" ? "desktop" : req.body?.strategy === "mobile" ? "mobile" : before.strategy;
    const out = await performScan(client.website, strategy);
    const after = snapshotFromScan(out.body, strategy, client.website);
    if (!after) return res.status(out.status >= 400 ? out.status : 422).json({ error: out.body?.error || "Pomiar nie powiódł się.", measurementStatus: "failed" });
    // Nowy skan „po” unieważnia wcześniejsze zatwierdzenie raportu.
    client.beforeAfter = { before, after, status: "draft", language: client.beforeAfter?.language };
    logActivity(client, "audit", `Skan po wdrożeniu (${after.measurementStatus === "live_lighthouse" ? "Lighthouse" : "pomiar częściowy HTML"}): ${after.overallScore ?? "brak"}/100 (przed: ${before.overallScore ?? "brak"}/100)`);
    saveDb();
    return res.json({ success: true, client, comparison: buildComparison(before, after) });
  });

  app.get("/api/crm/clients/:id/before-after", requireAgencyAuth, (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    const ba = client.beforeAfter;
    if (!ba) return res.json({ comparison: null });
    return res.json({ comparison: buildComparison(ba.before, ba.after), state: { status: ba.status, language: ba.language || effectiveLanguage(client), approvedBy: ba.approvedBy, approvedAt: ba.approvedAt, sentAt: ba.sentAt, sentTo: ba.sentTo }, before: ba.before, after: ba.after });
  });

  app.post("/api/crm/clients/:id/before-after/approve", requireAgencyAuth, (req, res) => {
    const client = findClient(req.params.id);
    if (!client?.beforeAfter) return res.status(404).json({ error: "Brak porównania przed/po – wykonaj skan po wdrożeniu." });
    const reviewer = String(req.body?.reviewer || "").trim();
    if (reviewer.length < 3 || reviewer.length > 80) return res.status(400).json({ error: "Podaj imię i nazwisko osoby zatwierdzającej (min. 3 znaki)." });
    const language: Lang = normalizeFormLang(req.body?.language) || client.beforeAfter.language || effectiveLanguage(client);
    Object.assign(client.beforeAfter, { status: "approved" as const, approvedBy: reviewer, approvedAt: new Date().toISOString(), language });
    logActivity(client, "offer_approved", `Raport przed/po zatwierdzony przez: ${reviewer} (język: ${language.toUpperCase()})`);
    saveDb(true);
    return res.json({ success: true, client });
  });

  const approvedBA = (req: any, res: any) => {
    const client = findClient(req.params.id);
    if (!client?.beforeAfter) {
      res.status(404).json({ error: "Brak porównania przed/po – wykonaj skan po wdrożeniu." });
      return null;
    }
    if (client.beforeAfter.status !== "approved") {
      res.status(409).json({ error: "Raport przed/po nie jest zatwierdzony. PDF jest dostępny dopiero po zatwierdzeniu przez człowieka.", code: "NOT_APPROVED" });
      return null;
    }
    return client;
  };
  const baPdf = (client: any) => {
    const ba = client.beforeAfter;
    return buildBeforeAfterPdf(client, ba.before, ba.after, buildComparison(ba.before, ba.after), ba.language || effectiveLanguage(client), ba.approvedBy);
  };

  app.get("/api/crm/clients/:id/before-after.pdf", requireAgencyAuth, async (req, res) => {
    const client = approvedBA(req, res);
    if (!client) return;
    try {
      const pdf = await baPdf(client);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NovoPix-before-after-${client.company.replace(/[^\w.-]+/g, "_")}.pdf"`);
      return res.send(pdf);
    } catch {
      return res.status(500).json({ error: "Nie udało się wygenerować PDF." });
    }
  });

  app.post("/api/crm/clients/:id/before-after/send", requireAgencyAuth, async (req, res) => {
    const client = approvedBA(req, res);
    if (!client) return;
    if (!smtpConfigured()) return res.status(409).json({ error: "SMTP nie skonfigurowane – pobierz PDF i wyślij go ręcznie.", code: "SMTP_NOT_CONFIGURED" });
    const to = String(req.body?.to || client.email || "").trim();
    if (!EMAIL_RE.test(to)) return res.status(400).json({ error: "Podaj prawdziwy adres e-mail odbiorcy.", code: "BAD_RECIPIENT" });
    const ba = client.beforeAfter!;
    const lang = ba.language || effectiveLanguage(client);
    const host = (ba.after.finalUrl || client.website).replace(/^https?:\/\//, "").replace(/\/$/, "");
    const pdf = await baPdf(client);
    const out = await sendMail({
      to,
      subject: lang === "pl" ? `Raport przed i po wdrożeniu: ${host}` : `Before and after report: ${host}`,
      text: lang === "pl"
        ? `Dzień dobry,\n\nw załączniku raport zestawiający wyniki pomiarów strony ${host} przed i po wdrożeniu.\n\nRaport nie jest certyfikatem ani gwarancją wyniku.\n\nPozdrawiamy\nZespół NovoPix\ncontact@novopix.uk · novopix.uk`
        : `Hello,\n\nattached is the report comparing the measurements of ${host} before and after delivery.\n\nThe report is not a certificate or a guarantee of any outcome.\n\nBest regards\nNovoPix team\ncontact@novopix.uk · novopix.uk`,
      replyTo: smtpFrom(),
      attachments: [{ filename: `NovoPix-before-after-${host.replace(/[^\w.-]+/g, "_")}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    if (!out.ok) return res.status(502).json({ error: `Nie udało się wysłać wiadomości (${out.error || out.reason}).`, code: "SEND_FAILED" });
    ba.sentAt = new Date().toISOString();
    ba.sentTo = to;
    logActivity(client, "email_sent", `Wysłano raport przed/po e-mailem do ${to} (zatwierdził: ${ba.approvedBy})`);
    saveDb(true);
    return res.json({ success: true, client });
  });

  app.get("/api/crm/clients/:id/report.pdf", requireAgencyAuth, async (req, res) => {
    const client = findClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Nie znaleziono klienta." });
    if (!client.lastScan) return res.status(409).json({ error: "Brak pomiaru – najpierw wykonaj skan.", code: "NO_SCAN" });
    const lang: Lang = normalizeFormLang(req.query.lang) || effectiveLanguage(client);
    try {
      const pdf = await buildReportPdf(client, client.lastScan, lang);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NovoPix-raport-${client.company.replace(/[^\w.-]+/g, "_")}.pdf"`);
      return res.send(pdf);
    } catch (e: any) {
      return res.status(500).json({ error: "Nie udało się wygenerować PDF." });
    }
  });
}
