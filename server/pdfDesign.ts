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
  seo?: any;
  a11y?: any;
  recipient?: string;
};

function setup(title: string, landscape = false) {
  const doc = new PDFDocument({ size: "A4", layout: landscape ? "landscape" : "portrait", margins: { top: 60, bottom: 64, left: 46, right: 46 }, bufferPages: true, info: { Title: title, Author: "NovoPix" } });
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
  for (let i = range.start + 1; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // stopka leży poniżej marginesu: bez tego pdfkit dodaje nowe strony
    const y = doc.page.height - 44;
    doc.moveTo(46, y - 6).lineTo(46 + W, y - 6).lineWidth(0.6).strokeColor(C.line).stroke();
    doc.font("R").fontSize(7.5).fillColor(C.mute).text(t.disclaimer, 46, y, { width: W - 80, height: 30 });
    doc.font("B").fontSize(8).fillColor(C.ink).text(`${t.page} ${i} ${t.of} ${range.count - 1}`, 46 + W - 70, y, { width: 70, align: "right", lineBreak: false });
  }
}

function kvRows(doc: PDFKit.PDFDocument, rows: Array<[string, string, string]>, W: number) {
  rows.forEach(([k, v, col], i) => {
    if (doc.y > doc.page.height - 90) doc.addPage();
    const y = doc.y; if (i % 2 === 0) doc.rect(46, y - 2, W, 18).fill(C.soft);
    doc.font("B").fontSize(9.5).fillColor(C.ink).text(k, 54, y + 1, { width: W / 2 - 10, lineBreak: false, ellipsis: true });
    doc.font("B").fontSize(9.5).fillColor(col).text(v, 46 + W / 2, y + 1, { width: W / 2 - 8, align: "right", lineBreak: false, ellipsis: true });
    doc.y = y + 18;
  });
}
const stCol = (s: string | undefined) => (s === "good" ? C.good : s === "error" ? C.bad : s === "warning" ? C.warn : C.ink);

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

// ===== Okładka w stylu panelu „Growth Scanner” (układ 1:1 ze wzoru, dane tylko z prawdziwych pomiarów) =====
const D = { bg1: "#070d24", bg2: "#12285a", card: "#0e1a3a", edge: "#2d4f9c", txt: "#ffffff", mut: "#9fb3d9", cyan: "#22d3ee", green: "#34d399", amber: "#fbbf24", red: "#f87171", violet: "#8b5cf6" };
const dtone = (v: number | null) => (v === null ? D.mut : v >= 90 ? D.green : v >= 50 ? D.amber : D.red);

function dCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, title?: string) {
  doc.save().roundedRect(x, y, w, h, 12).fillOpacity(0.92).fill(D.card).restore();
  doc.save().roundedRect(x, y, w, h, 12).lineWidth(0.9).strokeOpacity(0.7).stroke(D.edge).restore();
  if (title) doc.font("B").fontSize(10.5).fillColor(D.txt).text(title, x + 14, y + 12, { width: w - 28, lineBreak: false });
}
function dRing(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, v: number | null, label?: string, lw = 6) {
  doc.save().lineWidth(lw).strokeOpacity(0.25).strokeColor(D.mut).circle(cx, cy, r).stroke().restore();
  if (v !== null && v > 0) {
    const a = (Math.min(100, v) / 100) * 2 * Math.PI - 0.0001;
    doc.save().lineCap("round").lineWidth(lw).strokeColor(dtone(v)).path(`M ${cx} ${cy - r} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`).stroke().restore();
  }
  doc.font("B").fontSize(r > 24 ? 15 : 10).fillColor(D.txt).text(v === null ? "–" : `${v}${r > 24 ? "" : "%"}`, cx - r, cy - (r > 24 ? 9 : 6), { width: 2 * r, align: "center", lineBreak: false });
  if (label) doc.font("R").fontSize(7.8).fillColor(D.mut).text(label, cx - r - 20, cy + r + 6, { width: 2 * r + 40, align: "center", lineBreak: false });
}
function dGauge(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, v: number | null) {
  const arc = (from: number, to: number) => { const p = (a: number) => [cx + r * Math.cos(Math.PI - a), cy - r * Math.sin(Math.PI - a)]; const [x1, y1] = p(from), [x2, y2] = p(to); return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`; };
  doc.save().lineCap("round").lineWidth(14).strokeOpacity(0.25).strokeColor(D.mut).path(arc(0, Math.PI - 0.001)).stroke().restore();
  if (v !== null && v > 0) doc.save().lineCap("round").lineWidth(14).strokeColor(dtone(v)).path(arc(0, Math.max(0.02, (Math.min(100, v) / 100) * Math.PI - 0.001))).stroke().restore();
  doc.font("B").fontSize(40).fillColor(D.txt).text(v === null ? "–" : String(v), cx - 60, cy - 46, { width: 120, align: "center", lineBreak: false });
  doc.font("R").fontSize(11).fillColor(D.mut).text("/100", cx - 60, cy - 4, { width: 120, align: "center", lineBreak: false });
}
function dBar(doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string, value: string, frac: number, color: string) {
  doc.font("R").fontSize(8.5).fillColor(D.mut).text(label, x, y, { width: w - 60, lineBreak: false });
  doc.font("B").fontSize(8.5).fillColor(D.txt).text(value, x + w - 60, y, { width: 60, align: "right", lineBreak: false });
  doc.save().roundedRect(x, y + 13, w, 6, 3).fillOpacity(0.25).fill(D.mut).restore();
  if (frac > 0) doc.roundedRect(x, y + 13, Math.max(6, w * Math.min(1, frac)), 6, 3).fill(color);
}

function dashboardCover(doc: PDFKit.PDFDocument, snap: ScanSnapshot, extras: FullExtras, lang: Lang, mode: "full" | "short") {
  const pl = lang === "pl";
  const t = T[lang];
  doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  const PW = doc.page.width, PH = doc.page.height;
  const g = doc.linearGradient(0, 0, PW, PH); g.stop(0, D.bg1).stop(1, D.bg2);
  doc.rect(0, 0, PW, PH).fill(g);
  // nagłówek
  drawLogo(doc, 32, 24, 34);
  doc.font("B").fontSize(23).fillColor(D.txt).text("NovoPix", 74, 24, { lineBreak: false });
  doc.font("B").fontSize(17).fillColor(D.cyan).text(pl ? "Raport techniczny strony" : "Website technical report", 74, 52, { lineBreak: false });
  doc.font("R").fontSize(10).fillColor(D.mut).text(snap.finalUrl, 32, 82, { width: PW - 64, lineBreak: false });
  const when = new Date(snap.scannedAt).toLocaleString(pl ? "pl-PL" : "en-GB", { timeZone: pl ? "Europe/Warsaw" : "Europe/London" });
  doc.font("R").fontSize(8.5).fillColor(D.mut).text(`${t.date}: ${when} · ${snap.measurementStatus === "live_lighthouse" ? "Google Lighthouse" : (pl ? "pomiar częściowy" : "partial measurement")} · ${mode === "full" ? t.full : t.short}`, 32, 97, { width: PW - 64, lineBreak: false });
  const M = 32, G = 12, top = 122;
  const colW = (PW - 2 * M - 2 * G) / 3;
  const c = snap.categories;
  const label = snap.overallScore === null ? t.none : snap.overallScore >= 90 ? t.good : snap.overallScore >= 65 ? t.improve : t.attention;
  // 1) wynik ogólny
  const h1 = 200;
  dCard(doc, M, top, colW, h1, t.overall);
  dGauge(doc, M + colW / 2, top + 100, 64, snap.overallScore);
  const pillW = 78; doc.roundedRect(M + colW / 2 - pillW / 2, top + 108, pillW, 18, 9).fillOpacity(0.2).fill(dtone(snap.overallScore)).fillOpacity(1);
  doc.font("B").fontSize(9).fillColor(dtone(snap.overallScore)).text(label, M + colW / 2 - pillW / 2, top + 113, { width: pillW, align: "center", lineBreak: false });
  const mini: Array<[string, number | null]> = [[t.perf, c.performance], [t.seo, c.seo], [t.acc, c.accessibility], [t.bp, c.bestPractices]];
  mini.forEach(([k, v], i) => { const yy = top + 138 + i * 14; doc.font("R").fontSize(8.5).fillColor(D.mut).text(k, M + 16, yy, { width: colW - 90, lineBreak: false }); doc.font("B").fontSize(8.5).fillColor(dtone(v)).text(v === null ? t.none : `${v}/100`, M + colW - 80, yy, { width: 64, align: "right", lineBreak: false }); });
  // 2) SEO i szybkość (pierścienie z prawdziwych wyników)
  const x2 = M + colW + G;
  dCard(doc, x2, top, colW, h1, pl ? "Wyniki kategorii" : "Category scores");
  const rings: Array<[string, number | null]> = [[t.perf, c.performance], [t.seo, c.seo], [t.bp, c.bestPractices], [pl ? "Dostępność" : "Accessibility", c.accessibility]];
  rings.forEach(([k, v], i) => dRing(doc, x2 + colW * (0.27 + (i % 2) * 0.46), top + 66 + Math.floor(i / 2) * 78, 24, v, k, 6));
  // 3) dostępność: rozbicie
  const x3 = x2 + colW + G;
  dCard(doc, x3, top, colW, h1, pl ? "Dostępność (automaty)" : "Accessibility (automated)");
  const b = extras.a11y?.breakdown || {};
  const a11y: Array<[string, number | null]> = [[pl ? "Kontrast" : "Contrast", b.contrast ?? null], [pl ? "Nawigacja" : "Navigation", b.navigation ?? null], [pl ? "Nazwy" : "Names", b.names ?? null], ["ARIA / ALT", b.aria ?? null]];
  if (b.contrast === undefined && b.navigation === undefined) dRing(doc, x3 + colW / 2, top + 95, 34, c.accessibility, pl ? "Wynik dostępności" : "Accessibility score", 8);
  else a11y.forEach(([k, v], i) => dRing(doc, x3 + colW * (0.27 + (i % 2) * 0.46), top + 66 + Math.floor(i / 2) * 78, 24, v, k, 6));
  doc.font("R").fontSize(7).fillColor(D.mut).text(pl ? "To nie ocena zgodności z WCAG ani certyfikat." : "Not a WCAG conformance rating or certificate.", x3 + 12, top + h1 - 16, { width: colW - 24, align: "center", lineBreak: false });
  // dolny rząd
  const top2 = top + h1 + G, h2 = PH - top2 - 38;
  const issues = [...snap.issues].sort((a, z) => (a.priority === "high" ? 0 : 1) - (z.priority === "high" ? 0 : 1));
  const high = issues.filter((i) => i.priority === "high").length, med = issues.length - high;
  // 4) postęp audytu
  dCard(doc, M, top2, colW, h2, pl ? "Bilans kontroli" : "Audit summary");
  const rv = extras.review?.summary;
  const tot = Math.max(1, issues.length + 4);
  dBar(doc, M + 16, top2 + 36, colW - 32, pl ? "Priorytet wysoki" : "High priority", String(high), high / tot, D.red);
  dBar(doc, M + 16, top2 + 66, colW - 32, pl ? "Priorytet średni" : "Medium priority", String(med), med / tot, D.amber);
  if (rv) { dBar(doc, M + 16, top2 + 96, colW - 32, t.pagesChecked, String(rv.pages), rv.pages / 40, D.cyan); dBar(doc, M + 16, top2 + 126, colW - 32, (pl ? "Błędne strony / linki" : "Broken pages / links"), `${rv.broken} / ${rv.brokenExternal}`, (rv.broken + rv.brokenExternal) / Math.max(1, rv.pages), D.red); }
  // 5) lista działań
  dCard(doc, x2, top2, colW, h2, pl ? "Co poprawić najpierw" : "What to fix first");
  issues.slice(0, 5).forEach((it, i) => {
    const yy = top2 + 34 + i * 25;
    doc.roundedRect(x2 + 14, yy, 12, 12, 3).lineWidth(1).stroke(it.priority === "high" ? D.red : D.amber);
    doc.font("R").fontSize(8.6).fillColor(D.txt).text(it.title, x2 + 34, yy + 1, { width: colW - 52, lineBreak: false, ellipsis: true });
  });
  if (!issues.length) doc.font("R").fontSize(9).fillColor(D.mut).text(t.noissues, x2 + 14, top2 + 38, { width: colW - 28 });
  // 6) historia / oferta
  dCard(doc, x3, top2, colW, h2, mode === "short" ? "Core Web Vitals" : pl ? "Historia wyniku" : "Score history");
  if (mode === "short") {
    snap.cwv.slice(0, 5).forEach((m, i) => {
      const yy = top2 + 38 + i * 24;
      doc.font("B").fontSize(9).fillColor(D.txt).text(m.acronym, x3 + 16, yy, { width: 44, lineBreak: false });
      doc.font("R").fontSize(8.5).fillColor(D.mut).text(`${t.target}: ${CWV_TARGET[m.acronym] || ""}`, x3 + 62, yy + 1, { width: 100, lineBreak: false });
      const col = m.status === "good" ? D.green : m.status === "poor" ? D.red : m.status === "needs-improvement" ? D.amber : D.txt;
      doc.font("B").fontSize(9).fillColor(col).text(m.status === "unavailable" ? t.none : m.displayValue.replace(/\s*\((pomiar laboratoryjny|lab measurement)\)/, ""), x3 + colW - 110, yy, { width: 94, align: "right", lineBreak: false });
    });
    doc.font("R").fontSize(7.4).fillColor(D.mut).text(pl ? "Pełny raport (panel) zawiera historię, domenę, SEO i ofertę." : "The full report (panel) adds history, domain, SEO and the offer.", x3 + 14, top2 + h2 - 24, { width: colW - 28, lineBreak: false });
  }
  const hist = mode === "short" ? [] : (extras.history || []).filter((h) => typeof h.overall === "number") as Array<{ at: string; overall: number }>;
  if (mode === "short") { /* karta Core Web Vitals narysowana wyżej */ } else if (hist.length >= 2) {
    const gx = x3 + 18, gy = top2 + 34, gw = colW - 36, gh = h2 - 70;
    doc.save().lineWidth(0.5).strokeOpacity(0.25).strokeColor(D.mut);
    [0, 0.5, 1].forEach((f) => doc.moveTo(gx, gy + gh * f).lineTo(gx + gw, gy + gh * f).stroke());
    doc.restore();
    const pts = hist.map((h, i) => [gx + (i / (hist.length - 1)) * gw, gy + gh - (h.overall / 100) * gh]);
    doc.save().lineWidth(2).strokeColor(D.green).moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([px, py]) => doc.lineTo(px, py));
    doc.stroke().restore();
    pts.forEach(([px, py]) => doc.circle(px, py, 2.6).fill(D.green));
    const d = hist[hist.length - 1].overall - hist[0].overall;
    doc.font("B").fontSize(9).fillColor(d >= 0 ? D.green : D.red).text(`${hist[0].overall} → ${hist[hist.length - 1].overall}  (${d > 0 ? "+" : ""}${d})`, x3 + 14, top2 + h2 - 26, { width: colW - 28, align: "center", lineBreak: false });
  } else {
    doc.font("R").fontSize(8.8).fillColor(D.mut).text(pl ? "Historia pojawi się po drugim pomiarze tej strony z panelu." : "History appears after a second measurement of this site from the panel.", x3 + 14, top2 + 40, { width: colW - 28 });
    (extras.offerLines || []).slice(0, 3).forEach((l, i) => doc.font("R").fontSize(8.3).fillColor(D.txt).text(l.replace(/^- /, "• "), x3 + 14, top2 + 78 + i * 22, { width: colW - 28, height: 20 }));
  }
  doc.font("R").fontSize(7.2).fillColor(D.mut).text(t.disclaimer, M, PH - 30, { width: PW - 2 * M, lineBreak: false, ellipsis: true });
}

export function buildSummaryPdf(client: AgencyClient, snap0: ScanSnapshot, lang: Lang): Promise<Buffer> {
  const t = T[lang];
  const snap = localizeSnapshot(snap0, lang);
  return new Promise((resolve, reject) => {
    const doc = setup(`${t.short} – ${snap.finalUrl}`, true);
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    dashboardCover(doc, snap, {}, lang, "short");
    doc.end();
  });
}

export function buildFullPdf(client: AgencyClient, snap0: ScanSnapshot, lang: Lang, extras: FullExtras = {}): Promise<Buffer> {
  const t = T[lang];
  const snap = localizeSnapshot(snap0, lang);
  return new Promise((resolve, reject) => {
    const doc = setup(`${t.full} – ${snap.finalUrl}`, true);
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    dashboardCover(doc, snap, extras, lang, "full");
    doc.addPage({ size: "A4", layout: "portrait", margins: { top: 60, bottom: 64, left: 46, right: 46 } });
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
    const sx = extras.seo;
    if (sx) {
      const pl = lang === "pl";
      section(doc, pl ? "SEO szczegółowo" : "Detailed SEO", W);
      const yn = (b: any) => (b ? (pl ? "tak" : "yes") : pl ? "nie" : "no");
      const rows: Array<[string, string, string]> = [];
      if (sx.title) rows.push([pl ? "Tytuł strony" : "Page title", `${sx.title.length ?? 0} ${pl ? "znaków" : "characters"}${sx.title.text ? `: ${String(sx.title.text).slice(0, 38)}` : ""}`, stCol(sx.title.status)]);
      if (sx.description) rows.push([pl ? "Opis meta" : "Meta description", sx.description.length ? `${sx.description.length} ${pl ? "znaków" : "characters"}` : pl ? "brak" : "missing", stCol(sx.description.status)]);
      if (sx.headings) rows.push([pl ? "Nagłówki H1 / H2 / H3" : "Headings H1 / H2 / H3", `${sx.headings.h1} / ${sx.headings.h2} / ${sx.headings.h3}`, stCol(sx.headings.status)]);
      if (sx.canonical) rows.push(["Canonical", sx.canonical.url ? (sx.canonical.isSelf ? (pl ? "wskazuje tę stronę" : "points to this page") : String(sx.canonical.url).slice(0, 38)) : pl ? "brak" : "missing", stCol(sx.canonical.status)]);
      if (sx.indexing) rows.push([pl ? "Indeksowanie (robots.txt / mapa strony)" : "Indexing (robots.txt / sitemap)", `${yn(sx.indexing.hasRobotsTxt)} / ${yn(sx.indexing.hasSitemapXml)}`, stCol(sx.indexing.status)]);
      if (sx.images) rows.push([pl ? "Obrazy (razem / bez ALT)" : "Images (total / without ALT)", `${sx.images.total} / ${sx.images.missingAlt}`, stCol(sx.images.status)]);
      if (sx.links) rows.push([pl ? "Linki (wewnętrzne / zewnętrzne)" : "Links (internal / external)", `${sx.links.internal} / ${sx.links.external}`, C.ink]);
      if (sx.social) rows.push([pl ? "Open Graph i dane strukturalne" : "Open Graph and structured data", `${sx.social.ogTitle ? "OG" : "–"} · JSON-LD: ${sx.social.schemaJsonLdCount ?? 0}`, stCol(sx.social.status)]);
      if (typeof sx.responseTimeMs === "number") rows.push([pl ? "Czas odpowiedzi serwera" : "Server response time", `${sx.responseTimeMs} ms`, sx.responseTimeMs > 800 ? C.warn : C.good]);
      if (typeof sx.htmlSizeKb === "number") rows.push([pl ? "Rozmiar HTML" : "HTML size", `${sx.htmlSizeKb} kB`, C.ink]);
      if (sx.scriptStats) rows.push([pl ? "Skrypty (razem / blokujące) i arkusze CSS" : "Scripts (total / render-blocking) and stylesheets", `${sx.scriptStats.totalScripts} / ${sx.scriptStats.renderBlockingScripts} · ${sx.scriptStats.stylesheets}`, sx.scriptStats.renderBlockingScripts ? C.warn : C.good]);
      if (sx.htmlLang !== undefined) rows.push([pl ? "Język strony (lang)" : "Page language (lang)", sx.htmlLang || (pl ? "brak" : "missing"), sx.htmlLang ? C.good : C.warn]);
      rows.push([pl ? "HTTPS / widok mobilny" : "HTTPS / mobile viewport", `${yn(sx.https)} / ${yn(sx.viewport)}`, sx.https && sx.viewport ? C.good : C.warn]);
      const tech = (sx.techStack && sx.techStack.length ? sx.techStack.join(", ") : sx.cmsTech) || "";
      if (tech) rows.push([pl ? "Wykryta technologia" : "Detected technology", String(tech).slice(0, 40), C.ink]);
      kvRows(doc, rows, W);
    }
    const ax = extras.a11y;
    if (ax) {
      const pl = lang === "pl";
      section(doc, pl ? "Dostępność: kontrole automatyczne" : "Accessibility: automated checks", W);
      const b = ax.breakdown || {};
      const rowsA: Array<[string, string, string]> = [];
      ([[pl ? "Kontrast tekstu" : "Text contrast", b.contrast], [pl ? "Nawigacja i fokus" : "Navigation and focus", b.navigation], [pl ? "Nazwy elementów" : "Element names", b.names], [pl ? "Atrybuty ARIA i ALT" : "ARIA and ALT", b.aria]] as Array<[string, number | null]>).forEach(([k, v]) => { if (typeof v === "number") rowsA.push([k, `${v}/100`, tone(v)]); });
      if (ax.statement) rowsA.push([pl ? "Deklaracja dostępności" : "Accessibility statement", ax.statement.found === true ? (pl ? "znaleziona" : "found") : ax.statement.found === false ? (pl ? "nie znaleziono" : "not found") : pl ? "nie udało się sprawdzić" : "could not be checked", ax.statement.found === true ? C.good : ax.statement.found === false ? C.warn : C.mute]);
      if (rowsA.length) kvRows(doc, rowsA, W);
      para(doc, pl ? "Automaty sprawdzają tylko część wymagań. To nie jest ocena zgodności z WCAG ani certyfikat. Klawiaturę, czytnik ekranu i treść trzeba sprawdzić ręcznie." : "Automated checks cover only part of the requirements. This is not a WCAG conformance assessment or a certificate. Keyboard use, screen readers and content must be reviewed by hand.", W, 8.5, C.mute);
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
      const unv = extras.review.unverifiedExternal || [];
      if (bl.length) { section(doc, t.broken, W); bl.slice(0, 20).forEach((b: any) => para(doc, `•  ${b.status || "–"}  ${String(b.url).slice(0, 90)}`, W, 8.5, C.bad)); }
      if (unv.length) { section(doc, lang === "pl" ? "Linki, których nie udało się sprawdzić" : "Links that could not be checked", W); unv.slice(0, 15).forEach((b: any) => para(doc, `•  ${String(b.url).slice(0, 90)}`, W, 8.5, C.mute)); }
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
