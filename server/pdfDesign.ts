// Nowy wygląd raportów PDF: jasny, czytelny układ (czcionka Inter, pierścienie wyniku, paski, tabele).
// Dwa warianty: skrócony (publiczny / mailem) i pełny (panel agencji, z wszystkimi sekcjami).
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import type { AgencyClient, ScanSnapshot } from "./database";
import { localizeSnapshot } from "./scanSnapshot";
import { drawLogo } from "./pdfReport";

const require_ = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
function fontFile(inter: string, dejavu: string): string {
  const p = path.join(here, "fonts", inter);
  if (fs.existsSync(p)) return p;
  return path.join(path.dirname(require_.resolve("dejavu-fonts-ttf/package.json")), "ttf", dejavu);
}

const C = { ink: "#0e2733", mute: "#5b6b75", line: "#e3e9ee", soft: "#f4f7f9", brand: "#ffc233", teal: "#0d9488", good: "#0a7d3b", warn: "#b45309", bad: "#b3261e", white: "#ffffff" };
const tone = (v: number | null) => (v === null ? C.mute : v >= 90 ? C.good : v >= 50 ? C.warn : C.bad);

type Lang = "pl" | "en";
const T = {
  pl: {
    short: "Raport skrócony", full: "Pełny raport techniczny", site: "Strona", date: "Data pomiaru", prepared: "Przygotowano dla", lh: "Pełny pomiar Google Lighthouse (PageSpeed Insights)", partial: "Pomiar częściowy (HTML i HTTP). Pola „brak pomiaru” nie zostały zmierzone.",
    overall: "Wynik ogólny", perf: "Szybkość", seo: "SEO", acc: "Dostępność (automaty)", bp: "Dobre praktyki", none: "brak pomiaru",
    cwv: "Core Web Vitals i czas odpowiedzi", target: "Cel", issues: "Wykryte problemy", top3: "Trzy najważniejsze problemy", prio: { high: "wysoki", medium: "średni", low: "niski" } as Record<string, string>,
    noissues: "W tym pomiarze nie zapisano problemów.", inFull: "Co zawiera pełny raport", fullList: ["wszystkie wykryte problemy z priorytetami", "kontrola domeny, poczty i kontaktu", "przegląd wszystkich podstron, linków i subdomen", "historia wyników: przed i po", "rekomendowane usługi z cenami netto"],
    summary: "Podsumowanie", pagesChecked: "Przejrzane strony", brokenPages: "Błędne podstrony", brokenExt: "Błędne linki zewnętrzne", noTitle: "Bez tytułu", noDesc: "Bez opisu meta", noH1: "Bez nagłówka H1", imgNoAlt: "Obrazy bez ALT", dupTitles: "Powtórzone tytuły", subs: "Znalezione subdomeny",
    domainMail: "Domena i poczta", ssl: "Certyfikat SSL", mail: "Poczta (MX, SPF, DMARC, DKIM)", contact: "Kontakt na stronie głównej", history: "Historia wyniku (przed i po)", offer: "Rekomendowane usługi (ceny netto)", offerNote: "Rekomendacja wynika z jawnych reguł i cennika. To nie jest obietnica wyniku. Zakres i cenę potwierdzamy na piśmie przed rozpoczęciem pracy.",
    pages: "Podstrony", broken: "Błędne linki", subdomains: "Subdomeny", found: "jest", notfound: "nie znaleziono", unknown: "nie udało się sprawdzić",
    method: "Jak czytać ten raport", methodText: "Wyniki pochodzą z automatycznego pomiaru (Google Lighthouse i kontrola kodu strony). Wynik Lighthouse może się różnić o kilka punktów między pomiarami. Automaty znajdują tylko część problemów, dlatego klawiaturę, czytniki ekranu i treść trzeba sprawdzić ręcznie.",
    disclaimer: "To raport z wstępnej kontroli automatycznej. Nie jest certyfikatem, audytem zgodności (w tym WCAG), opinią prawną ani gwarancją wyniku.", page: "Strona", of: "z",
    health: "Kondycja", good: "Dobrze", improve: "Do poprawy", attention: "Wymaga uwagi", counts: "Problemy wg priorytetu", high: "wysoki", medium: "średni", low: "niski",
  },
  en: {
    short: "Summary report", full: "Full technical report", site: "Website", date: "Measured on", prepared: "Prepared for", lh: "Full Google Lighthouse measurement (PageSpeed Insights)", partial: "Partial measurement (HTML and HTTP). Fields marked “not measured” were not measured.",
    overall: "Overall score", perf: "Speed", seo: "SEO", acc: "Accessibility (automated)", bp: "Best practices", none: "not measured",
    cwv: "Core Web Vitals and response time", target: "Target", issues: "Issues found", top3: "Top three issues", prio: { high: "high", medium: "medium", low: "low" } as Record<string, string>,
    noissues: "No issues were recorded in this measurement.", inFull: "What the full report includes", fullList: ["every issue found, with priorities", "domain, email and contact checks", "all pages, links and subdomains reviewed", "score history: before and after", "recommended services with prices (ex VAT)"],
    summary: "Summary", pagesChecked: "Pages reviewed", brokenPages: "Broken pages", brokenExt: "Broken external links", noTitle: "No title", noDesc: "No meta description", noH1: "No H1", imgNoAlt: "Images without ALT", dupTitles: "Duplicate titles", subs: "Subdomains found",
    domainMail: "Domain and email", ssl: "SSL certificate", mail: "Email (MX, SPF, DMARC, DKIM)", contact: "Contact on the home page", history: "Score history (before and after)", offer: "Recommended services (ex VAT)", offerNote: "The recommendation comes from open rules and the price list. It is not a promise of results. We confirm scope and price in writing before work begins.",
    pages: "Pages", broken: "Broken links", subdomains: "Subdomains", found: "found", notfound: "not found", unknown: "could not be checked",
    method: "How to read this report", methodText: "Results come from an automated measurement (Google Lighthouse and a check of the page code). A Lighthouse score can vary by a few points between runs. Automated tools find only part of the problems, so keyboard use, screen readers and content have to be reviewed by hand.",
    disclaimer: "This is a preliminary automated check. It is not a certificate, a compliance audit (including WCAG), legal advice or a guarantee of results.", page: "Page", of: "of",
    health: "Health", good: "Good", improve: "Room to improve", attention: "Needs attention", counts: "Issues by priority", high: "high", medium: "medium", low: "low",
  },
};

export type FullExtras = {
  review?: any;
  domainHealth?: any;
  contact?: any;
  offerLines?: string[];
  history?: Array<{ at: string; overall: number | null }>;
  recipient?: string;
};

function setup(title: string) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 64, left: 46, right: 46 }, bufferPages: true, info: { Title: title, Author: "NovoPix" } });
  doc.registerFont("R", fontFile("Inter-Regular.otf", "DejaVuSans.ttf"));
  doc.registerFont("B", fontFile("Inter-Bold.otf", "DejaVuSans-Bold.ttf"));
  return doc;
}

function header(doc: PDFKit.PDFDocument, t: typeof T.pl, kind: string, W: number) {
  doc.rect(0, 0, doc.page.width, 92).fill(C.soft);
  doc.rect(0, 92, doc.page.width, 3).fill(C.brand);
  drawLogo(doc, 46, 26, 40);
  doc.font("B").fontSize(17).fillColor(C.ink).text("NovoPix", 96, 28);
  doc.font("R").fontSize(8.5).fillColor(C.mute).text("novopix.uk · contact@novopix.uk", 96, 50);
  doc.font("B").fontSize(10).fillColor(C.teal).text(kind.toUpperCase(), 46, 36, { width: W, align: "right" });
  doc.y = 112;
}

function ring(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, value: number | null, label: string, t: typeof T.pl, big = false) {
  doc.save();
  doc.lineWidth(big ? 11 : 8).strokeColor(C.line).circle(cx, cy, r).stroke();
  if (value !== null && value > 0) {
    const a = (Math.min(100, value) / 100) * 2 * Math.PI - 0.0001;
    const x1 = cx, y1 = cy - r, x2 = cx + r * Math.sin(a), y2 = cy - r * Math.cos(a);
    doc.lineCap("round").lineWidth(big ? 11 : 8).strokeColor(tone(value)).path(`M ${x1} ${y1} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x2} ${y2}`).stroke();
  }
  doc.restore();
  doc.font("B").fontSize(big ? 30 : 19).fillColor(value === null ? C.mute : C.ink).text(value === null ? "–" : String(value), cx - r, cy - (big ? 17 : 11), { width: 2 * r, align: "center" });
  doc.font("R").fontSize(big ? 9 : 8).fillColor(C.mute).text(label, cx - r - 24, cy + r + 8, { width: 2 * r + 48, align: "center" });
}

function section(doc: PDFKit.PDFDocument, title: string, W: number) {
  if (doc.y > doc.page.height - 150) doc.addPage();
  doc.moveDown(0.8);
  const y = doc.y;
  doc.rect(46, y + 2, 4, 15).fill(C.brand);
  doc.font("B").fontSize(13).fillColor(C.ink).text(title, 58, y, { width: W - 12 });
  doc.moveDown(0.5);
}

function para(doc: PDFKit.PDFDocument, text: string, W: number, size = 9.5, color = C.ink) {
  doc.font("R").fontSize(size).fillColor(color).text(text, 46, doc.y, { width: W, lineGap: 2 });
}

function footers(doc: PDFKit.PDFDocument, t: typeof T.pl, W: number) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // stopka leży poniżej marginesu: bez tego pdfkit dodaje nowe strony
    const y = doc.page.height - 44;
    doc.moveTo(46, y - 6).lineTo(46 + W, y - 6).lineWidth(0.6).strokeColor(C.line).stroke();
    doc.font("R").fontSize(7.5).fillColor(C.mute).text(t.disclaimer, 46, y, { width: W - 80, height: 30 });
    doc.font("B").fontSize(8).fillColor(C.ink).text(`${t.page} ${i + 1} ${t.of} ${range.count}`, 46 + W - 70, y, { width: 70, align: "right", lineBreak: false });
  }
}

const CWV_TARGET: Record<string, string> = { LCP: "≤ 2.5 s", INP: "≤ 200 ms", CLS: "≤ 0.1", FCP: "≤ 1.8 s", TBT: "≤ 200 ms", TTFB: "≤ 800 ms" };
const EN_NAMES: Record<string, string> = { LCP: "Largest Contentful Paint", INP: "Interaction to Next Paint", CLS: "Cumulative Layout Shift", FCP: "First Contentful Paint", TBT: "Total Blocking Time" };

function scoresBlock(doc: PDFKit.PDFDocument, snap: ScanSnapshot, t: typeof T.pl, W: number) {
  const y0 = doc.y + 6;
  ring(doc, 46 + 62, y0 + 66, 52, snap.overallScore, t.overall, t, true);
  const bars: Array<[string, number | null]> = [[t.perf, snap.categories.performance], [t.seo, snap.categories.seo], [t.acc, snap.categories.accessibility], [t.bp, snap.categories.bestPractices]];
  const bx = 46 + 150, bw = W - 150;
  bars.forEach(([label, v], i) => {
    const by = y0 + 8 + i * 32;
    doc.font("B").fontSize(9.5).fillColor(C.ink).text(label, bx, by, { width: bw - 70 });
    doc.font("B").fontSize(9.5).fillColor(tone(v)).text(v === null ? t.none : `${v}/100`, bx + bw - 70, by, { width: 70, align: "right" });
    doc.roundedRect(bx, by + 15, bw, 6, 3).fill(C.line);
    if (v !== null && v > 0) doc.roundedRect(bx, by + 15, Math.max(6, (bw * v) / 100), 6, 3).fill(tone(v));
  });
  doc.y = y0 + 148;
}

function cwvTable(doc: PDFKit.PDFDocument, snap: ScanSnapshot, t: typeof T.pl, lang: Lang, W: number) {
  section(doc, t.cwv, W);
  snap.cwv.forEach((m, i) => {
    if (doc.y > doc.page.height - 90) doc.addPage();
    const y = doc.y;
    if (i % 2 === 0) doc.rect(46, y - 3, W, 22).fill(C.soft);
    doc.font("B").fontSize(9.5).fillColor(C.ink).text(m.acronym, 54, y + 2, { width: 50 });
    doc.font("R").fontSize(9.5).fillColor(C.ink).text(lang === "en" ? EN_NAMES[m.acronym] || m.name : m.name, 108, y + 2, { width: W - 340, lineBreak: false, ellipsis: true });
    doc.font("R").fontSize(8.5).fillColor(C.mute).text(CWV_TARGET[m.acronym] ? `${t.target}: ${CWV_TARGET[m.acronym]}` : "", 46 + W - 232, y + 3, { width: 84, lineBreak: false });
    const val = m.status === "unavailable" ? t.none : m.displayValue.replace(/\s*\((pomiar laboratoryjny|lab measurement)\)/, "");
    const col = m.status === "good" ? C.good : m.status === "poor" ? C.bad : m.status === "needs-improvement" ? C.warn : C.ink;
    doc.font("B").fontSize(9.5).fillColor(col).text(val, 46 + W - 144, y + 2, { width: 138, align: "right", lineBreak: false, ellipsis: true });
    doc.y = y + 22;
  });
}

const looksEn = (x: string) => (x.match(/\b(the|and|can|your|of|to|that|this|for|with|are|is)\b/gi) || []).length >= 2;
function issueRows(doc: PDFKit.PDFDocument, snap: ScanSnapshot, t: typeof T.pl, W: number, limit: number, lang: Lang) {
  const list = [...snap.issues].sort((a, b) => (a.priority === "high" ? 0 : 1) - (b.priority === "high" ? 0 : 1)).slice(0, limit);
  if (!list.length) return para(doc, t.noissues, W);
  list.forEach((it, i) => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    const y = doc.y;
    const col = it.priority === "high" ? C.bad : C.warn;
    doc.roundedRect(46, y, W, 4, 2).fill(C.line);
    doc.font("B").fontSize(10).fillColor(C.ink).text(`${i + 1}. ${it.title}`, 46, y + 10, { width: W - 90 });
    doc.font("B").fontSize(8).fillColor(col).text((t.prio[it.priority] || it.priority).toUpperCase(), 46 + W - 80, y + 11, { width: 80, align: "right" });
    const d = lang === "pl" && it.description && looksEn(it.description) ? "Szczegóły i sposób naprawy znajdziesz w dokumentacji Google Lighthouse." : it.description;
    if (d) doc.font("R").fontSize(8.8).fillColor(C.mute).text(d.length > 260 ? d.slice(0, 257) + "…" : d, 46, doc.y + 2, { width: W, lineGap: 1.5 });
    doc.moveDown(0.6);
  });
}

function metaBlock(doc: PDFKit.PDFDocument, snap: ScanSnapshot, t: typeof T.pl, lang: Lang, client: AgencyClient, W: number, title: string) {
  doc.font("B").fontSize(21).fillColor(C.ink).text(title, 46, doc.y, { width: W });
  doc.font("B").fontSize(11).fillColor(C.teal).text(snap.finalUrl, 46, doc.y + 2, { width: W });
  const when = new Date(snap.scannedAt).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { timeZone: lang === "pl" ? "Europe/Warsaw" : "Europe/London" });
  doc.font("R").fontSize(9).fillColor(C.mute).text(`${t.date}: ${when} · ${snap.measurementStatus === "live_lighthouse" ? t.lh : t.partial}`, 46, doc.y + 4, { width: W });
  if (client.company || client.name) doc.text(`${t.prepared}: ${client.company || client.name}`, 46, doc.y + 2, { width: W });
  doc.moveDown(0.6);
}

export function buildSummaryPdf(client: AgencyClient, snap0: ScanSnapshot, lang: Lang): Promise<Buffer> {
  const t = T[lang];
  const snap = localizeSnapshot(snap0, lang);
  return new Promise((resolve, reject) => {
    const doc = setup(`${t.short} – ${snap.finalUrl}`);
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const W = doc.page.width - 92;
    header(doc, t, t.short, W);
    metaBlock(doc, snap, t, lang, client, W, t.short);
    scoresBlock(doc, snap, t, W);
    if (snap.cwv.length) cwvTable(doc, snap, t, lang, W);
    section(doc, t.top3, W);
    issueRows(doc, snap, t, W, 3, lang);
    section(doc, t.inFull, W);
    t.fullList.forEach((x) => para(doc, `•  ${x}`, W, 9.5, C.mute));
    footers(doc, t, W);
    doc.end();
  });
}

export function buildFullPdf(client: AgencyClient, snap0: ScanSnapshot, lang: Lang, extras: FullExtras = {}): Promise<Buffer> {
  const t = T[lang];
  const snap = localizeSnapshot(snap0, lang);
  return new Promise((resolve, reject) => {
    const doc = setup(`${t.full} – ${snap.finalUrl}`);
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const W = doc.page.width - 92;
    header(doc, t, t.full, W);
    metaBlock(doc, snap, t, lang, client, W, t.full);
    scoresBlock(doc, snap, t, W);

    // Podsumowanie: liczby problemów wg priorytetu + wyniki przeglądu domeny
    section(doc, t.summary, W);
    const high = snap.issues.filter((i) => i.priority === "high").length, med = snap.issues.length - high;
    const stats: Array<[string, string, string]> = [[t.high, String(high), high ? C.bad : C.good], [t.medium, String(med), med ? C.warn : C.good]];
    const rv = extras.review?.summary;
    if (rv) stats.push([t.pagesChecked, String(rv.pages), C.ink], [t.brokenPages, String(rv.broken), rv.broken ? C.bad : C.good], [t.brokenExt, String(rv.brokenExternal), rv.brokenExternal ? C.bad : C.good], [t.noDesc, String(rv.noDescription), rv.noDescription ? C.warn : C.good], [t.imgNoAlt, String(rv.imgNoAlt), rv.imgNoAlt ? C.warn : C.good], [t.dupTitles, String(rv.duplicateTitles), rv.duplicateTitles ? C.warn : C.good], [t.subs, String(rv.subdomainsFound), C.ink]);
    const cw = (W - 10) / 4;
    const gy = doc.y;
    stats.forEach(([label, v, col], i) => {
      const x = 46 + (i % 4) * (cw + 3.3), y = gy + Math.floor(i / 4) * 54;
      doc.roundedRect(x, y, cw, 48, 6).fill(C.soft);
      doc.font("B").fontSize(18).fillColor(col).text(v, x, y + 7, { width: cw, align: "center" });
      doc.font("R").fontSize(7.8).fillColor(C.mute).text(label, x + 4, y + 31, { width: cw - 8, align: "center" });
    });
    doc.y = gy + Math.ceil(stats.length / 4) * 54 + 4;

    if (snap.cwv.length) cwvTable(doc, snap, t, lang, W);
    section(doc, t.issues, W);
    issueRows(doc, snap, t, W, 40, lang);

    const dh = extras.domainHealth;
    if (dh) {
      section(doc, t.domainMail, W);
      const state = (v: string) => (v === "found" ? [t.found, C.good] : v === "not_found" ? [t.notfound, C.bad] : [t.unknown, C.mute]);
      const rows: Array<[string, string, string]> = [];
      if (dh.ssl) rows.push([t.ssl, dh.ssl.status === "ok" ? `${lang === "pl" ? "ważny jeszcze" : "valid for"} ${dh.ssl.daysLeft} ${lang === "pl" ? "dni" : "days"}` : dh.ssl.status, dh.ssl.status === "ok" ? C.good : C.warn]);
      if (dh.mail) (["mx", "spf", "dmarc", "dkim"] as const).forEach((k) => { const [s, c] = state(dh.mail[k]); rows.push([k.toUpperCase(), s, c]); });
      rows.forEach(([k, v, col], i) => {
        const y = doc.y; if (i % 2 === 0) doc.rect(46, y - 2, W, 18).fill(C.soft);
        doc.font("B").fontSize(9.5).fillColor(C.ink).text(k, 54, y + 1, { width: 140 });
        doc.font("B").fontSize(9.5).fillColor(col).text(v, 46 + W - 200, y + 1, { width: 192, align: "right" }); doc.y = y + 18;
      });
    }
    if (extras.contact?.ok) {
      section(doc, t.contact, W);
      const c = extras.contact;
      const found = [c.telLink && (lang === "pl" ? "telefon" : "phone"), c.mailLink && "e-mail", c.form && (lang === "pl" ? "formularz" : "form"), c.contactLink && (lang === "pl" ? "strona kontaktu" : "contact page")].filter(Boolean).join(", ");
      para(doc, found ? `${lang === "pl" ? "Znaleziono" : "Found"}: ${found}.` : (lang === "pl" ? "Na stronie głównej nie znaleźliśmy klikalnego telefonu, maila ani formularza." : "We did not find a tappable phone, e-mail or form on the home page."), W);
    }
    if (rv && extras.review?.pages?.length) {
      section(doc, t.pages, W);
      (extras.review.pages as any[]).slice(0, 40).forEach((p, i) => {
        if (doc.y > doc.page.height - 80) doc.addPage();
        const y = doc.y; if (i % 2 === 0) doc.rect(46, y - 2, W, 16).fill(C.soft);
        doc.font("R").fontSize(8).fillColor(C.ink).text(String(p.url).replace(/^https?:\/\//, "").slice(0, 70), 52, y + 1, { width: W - 130, lineBreak: false });
        doc.font("B").fontSize(8).fillColor(p.status >= 400 || !p.status ? C.bad : C.good).text(String(p.status || "–"), 46 + W - 120, y + 1, { width: 30, align: "right" });
        doc.font("R").fontSize(8).fillColor(C.mute).text(`${p.ms} ms`, 46 + W - 80, y + 1, { width: 72, align: "right" }); doc.y = y + 16;
      });
      const bl = [...(extras.review.broken || []), ...(extras.review.brokenExternal || [])];
      if (bl.length) { section(doc, t.broken, W); bl.slice(0, 20).forEach((b: any) => para(doc, `•  ${b.status || "–"}  ${String(b.url).slice(0, 90)}`, W, 8.5, C.bad)); }
      const sd = extras.review.subdomains || [];
      if (sd.length) { section(doc, t.subdomains, W); sd.slice(0, 20).forEach((s: any) => para(doc, `•  ${s.name}  (HTTP ${s.status || "–"})`, W, 8.5, C.ink)); }
    }
    const hist = (extras.history || []).filter((h) => typeof h.overall === "number") as Array<{ at: string; overall: number }>;
    if (hist.length >= 2) {
      section(doc, t.history, W);
      const first = hist[0], last = hist[hist.length - 1], d = last.overall - first.overall;
      const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB");
      para(doc, `${fmt(first.at)}: ${first.overall}/100  →  ${fmt(last.at)}: ${last.overall}/100  (${d > 0 ? "+" : ""}${d})`, W, 11);
    }
    if (extras.offerLines?.length) {
      section(doc, t.offer, W);
      extras.offerLines.forEach((l) => para(doc, l, W, 10));
      doc.moveDown(0.3); para(doc, t.offerNote, W, 8.5, C.mute);
    }
    section(doc, t.method, W);
    para(doc, t.methodText, W, 9, C.mute);
    footers(doc, t, W);
    doc.end();
  });
}
