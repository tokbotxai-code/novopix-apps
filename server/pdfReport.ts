import PDFDocument from "pdfkit";
import path from "path";
import { createRequire } from "module";
import type { AgencyClient, ScanSnapshot } from "./database";
import { localizeSnapshot } from "./scanSnapshot";
import type { Comparison } from "./beforeAfter";

const require_ = createRequire(import.meta.url);
function fontPath(file: string): string {
  const base = path.dirname(require_.resolve("dejavu-fonts-ttf/package.json"));
  return path.join(base, "ttf", file);
}

// Logo NovoPix = ikona z https://novopix.uk/favicon.svg (żółty kwadrat z pikselową literą N), rysowana wektorowo.
const LOGO_PX: Array<[number, number]> = [
  [10, 10], [46, 10], [10, 19], [19, 19], [46, 19], [10, 28], [28, 28], [46, 28], [10, 37], [37, 37], [46, 37], [10, 46], [46, 46],
];
export function drawLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  const k = size / 64;
  doc.save();
  doc.roundedRect(x, y, size, size, 14 * k).fill("#ffc233");
  for (const [px, py] of LOGO_PX) doc.roundedRect(x + px * k, y + py * k, 8 * k, 8 * k, 1.8 * k).fill("#0e2733");
  doc.restore();
}

const L = {
  pl: {
    title: "Raport wstępnej kontroli strony",
    prepared: "Przygotowano",
    site: "Strona",
    client: "Klient",
    date: "Data pomiaru",
    mode: "Rodzaj pomiaru",
    lh: "Pełny pomiar Google Lighthouse (PageSpeed Insights)",
    partial: "Pomiar częściowy: analiza HTML/HTTP. Wyniki Lighthouse niedostępne – pola oznaczone „brak pomiaru” nie zostały zmierzone.",
    scores: "Wyniki",
    overall: "Wynik ogólny",
    perf: "Wydajność",
    seo: "SEO",
    acc: "Dostępność",
    bp: "Dobre praktyki",
    nomeas: "brak pomiaru",
    cwv: "Wskaźniki Core Web Vitals i czasu odpowiedzi",
    issues: "Wykryte problemy",
    noissues: "W ostatnim pomiarze nie zapisano problemów.",
    prio: { high: "wysoki", medium: "średni", low: "niski" } as Record<string, string>,
    disclaimer:
      "Zastrzeżenie: dokument jest wynikiem wstępnej kontroli automatycznej. Nie jest certyfikatem, audytem zgodności (w tym WCAG) ani gwarancją jakiegokolwiek wyniku. Wartości mogą się różnić między pomiarami.",
    page: "Strona",
  },
  en: {
    title: "Preliminary website check report",
    prepared: "Prepared by",
    site: "Website",
    client: "Client",
    date: "Measured on",
    mode: "Measurement type",
    lh: "Full Google Lighthouse measurement (PageSpeed Insights)",
    partial: "Partial measurement: HTML/HTTP analysis. Lighthouse results are unavailable – fields marked “not measured” were not measured.",
    scores: "Scores",
    overall: "Overall score",
    perf: "Performance",
    seo: "SEO",
    acc: "Accessibility",
    bp: "Best practices",
    nomeas: "not measured",
    cwv: "Core Web Vitals and response time",
    issues: "Issues found",
    noissues: "No issues were recorded in the latest measurement.",
    prio: { high: "high", medium: "medium", low: "low" } as Record<string, string>,
    disclaimer:
      "Disclaimer: this document is the result of a preliminary automated check. It is not a certificate, a compliance audit (including WCAG) or a guarantee of any outcome. Values may differ between measurements.",
    page: "Page",
  },
};

const EN_NAMES: Record<string, string> = {
  "INP / JS": "Render-blocking scripts in <head>",
  TTFB: "Server response time (TTFB)",
  HTML: "HTML document size",
};
const EN_VALUES = (v: string) => v.replace(/ skryptów?$/, " scripts");

export function buildReportPdf(client: AgencyClient, snap0: ScanSnapshot, lang: "pl" | "en"): Promise<Buffer> {
  const t = L[lang];
  const snap = localizeSnapshot(snap0, lang);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 64, left: 50, right: 50 }, bufferPages: true, info: { Title: `${t.title} – ${snap.finalUrl}`, Author: "NovoPix" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("R", fontPath("DejaVuSans.ttf"));
    doc.registerFont("B", fontPath("DejaVuSans-Bold.ttf"));
    const W = doc.page.width - 100;

    drawLogo(doc, 50, 50, 40);
    doc.font("B").fontSize(18).fillColor("#0e2733").text("NovoPix", 100, 54);
    doc.font("R").fontSize(9).fillColor("#5b6b75").text("novopix.uk · contact@novopix.uk", 100, 76);
    doc.moveTo(50, 102).lineTo(50 + W, 102).strokeColor("#ffc233").lineWidth(2).stroke();

    doc.font("B").fontSize(17).fillColor("#0e2733").text(t.title, 50, 118, { width: W });
    doc.moveDown(0.5);
    const meta: Array<[string, string]> = [
      [t.site, snap.finalUrl],
      [t.client, client.company || client.name],
      [t.date, new Date(snap.scannedAt).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { timeZone: "Europe/Warsaw" })],
      [t.mode, snap.measurementStatus === "live_lighthouse" ? t.lh : t.partial],
    ];
    for (const [k, v] of meta) {
      const y = doc.y;
      doc.font("B").fontSize(10).fillColor("#0e2733").text(k + ":", 50, y, { width: 110, continued: false });
      doc.font("R").fontSize(10).fillColor("#222").text(v, 165, y, { width: W - 115 });
      doc.moveDown(0.3);
    }

    doc.moveDown(0.8);
    doc.font("B").fontSize(13).fillColor("#0e2733").text(t.scores, 50);
    doc.moveDown(0.4);
    const rows: Array<[string, number | null]> = [
      [t.overall, snap.overallScore],
      [t.perf, snap.categories.performance],
      [t.seo, snap.categories.seo],
      [t.acc, snap.categories.accessibility],
      [t.bp, snap.categories.bestPractices],
    ];
    for (const [k, v] of rows) {
      const y = doc.y;
      doc.rect(50, y, W, 24).fill(k === t.overall ? "#fff6dc" : "#f4f7f9");
      doc.font(k === t.overall ? "B" : "R").fontSize(11).fillColor("#0e2733").text(k, 60, y + 6, { width: W - 140 });
      if (v === null) doc.font("R").fillColor("#8a6d00").text(t.nomeas, 50 + W - 130, y + 6, { width: 120, align: "right" });
      else doc.font("B").fillColor(v >= 90 ? "#0a7d3b" : v >= 50 ? "#a65f00" : "#b3261e").text(`${v}/100`, 50 + W - 130, y + 6, { width: 120, align: "right" });
      doc.y = y + 28;
    }

    if (snap.cwv.length) {
      doc.moveDown(0.6);
      doc.font("B").fontSize(13).fillColor("#0e2733").text(t.cwv, 50);
      doc.moveDown(0.3);
      for (const m of snap.cwv) {
        const y = doc.y;
        if (y > doc.page.height - 110) doc.addPage();
        const yy = doc.y;
        doc.font("B").fontSize(10).fillColor("#0e2733").text(m.acronym, 50, yy, { width: 70 });
        doc.font("R").fontSize(10).fillColor("#222").text(lang === "en" ? EN_NAMES[m.acronym] || m.name : m.name, 125, yy, { width: W - 260 });
        const val = m.status === "unavailable" ? t.nomeas : lang === "en" ? EN_VALUES(m.displayValue) : m.displayValue;
        doc.font("B").text(val, 50 + W - 130, yy, { width: 130, align: "right" });
        doc.y = Math.max(doc.y, yy + 14) + 3;
      }
    }

    doc.moveDown(0.8);
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.font("B").fontSize(13).fillColor("#0e2733").text(t.issues, 50);
    doc.moveDown(0.3);
    if (!snap.issues.length) doc.font("R").fontSize(10).fillColor("#222").text(t.noissues, 50, doc.y, { width: W });
    snap.issues.slice(0, 12).forEach((it, i) => {
      if (doc.y > doc.page.height - 120) doc.addPage();
      doc.font("B").fontSize(10).fillColor("#0e2733").text(`${i + 1}. ${it.title}  [${t.prio[it.priority] || it.priority}]`, 50, doc.y, { width: W });
      if (it.description) doc.font("R").fontSize(9).fillColor("#444").text(it.description, 62, doc.y + 1, { width: W - 12 });
      doc.moveDown(0.5);
    });

    doc.moveDown(0.8);
    if (doc.y > doc.page.height - 130) doc.addPage();
    const dy = doc.y;
    const h = doc.font("R").fontSize(9).heightOfString(t.disclaimer, { width: W - 20 });
    doc.rect(50, dy, W, h + 18).fill("#f4f7f9");
    doc.fillColor("#444").text(t.disclaimer, 60, dy + 9, { width: W - 20 });

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      doc.font("R").fontSize(8).fillColor("#8a98a1").text(`NovoPix · ${t.page} ${i + 1}/${range.count}`, 50, doc.page.height - 40, { width: W, align: "center", lineBreak: false });
    }
    doc.end();
  });
}

const BA = {
  pl: {
    title: "Raport przed i po wdrożeniu",
    site: "Strona",
    client: "Klient",
    before: "Przed",
    after: "Po",
    change: "Zmiana",
    metric: "Wskaźnik",
    nomeas: "brak pomiaru",
    rt: "Czas odpowiedzi serwera (ms)",
    cwv: "Wskaźniki czasu i Core Web Vitals",
    dates: "Daty pomiarów",
    approved: "Zatwierdził(a)",
    notes: {
      measurement_type_differs: "Uwaga: pomiary „przed” i „po” wykonano różnymi metodami (Lighthouse vs analiza HTML/HTTP), więc nie są w pełni porównywalne.",
      strategy_differs: "Uwaga: pomiary „przed” i „po” wykonano dla różnych urządzeń (telefon vs komputer).",
    } as Record<string, string>,
    disclaimer: "Zastrzeżenie: dokument zestawia wyniki dwóch automatycznych pomiarów. Nie jest certyfikatem, audytem zgodności (w tym WCAG) ani gwarancją wyniku. Wartości mogą różnić się między pomiarami; pole „brak pomiaru” oznacza, że wartości nie zmierzono.",
    page: "Strona",
  },
  en: {
    title: "Before and after report",
    site: "Website",
    client: "Client",
    before: "Before",
    after: "After",
    change: "Change",
    metric: "Metric",
    nomeas: "not measured",
    rt: "Server response time (ms)",
    cwv: "Timing metrics and Core Web Vitals",
    dates: "Measurement dates",
    approved: "Approved by",
    notes: {
      measurement_type_differs: "Note: the “before” and “after” measurements used different methods (Lighthouse vs HTML/HTTP analysis), so they are not fully comparable.",
      strategy_differs: "Note: the “before” and “after” measurements were made for different devices (mobile vs desktop).",
    } as Record<string, string>,
    disclaimer: "Disclaimer: this document compares the results of two automated measurements. It is not a certificate, a compliance audit (including WCAG) or a guarantee of any outcome. Values may differ between measurements; “not measured” means the value was not measured.",
    page: "Page",
  },
};

export function buildBeforeAfterPdf(client: AgencyClient, before: ScanSnapshot, after: ScanSnapshot, cmp: Comparison, lang: "pl" | "en", approvedBy: string): Promise<Buffer> {
  const t = BA[lang];
  const loc = (d: string) => new Date(d).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { timeZone: "Europe/Warsaw" });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 64, left: 50, right: 50 }, bufferPages: true, info: { Title: `${t.title} – ${after.finalUrl}`, Author: "NovoPix" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("R", fontPath("DejaVuSans.ttf"));
    doc.registerFont("B", fontPath("DejaVuSans-Bold.ttf"));
    const W = doc.page.width - 100;
    drawLogo(doc, 50, 50, 40);
    doc.font("B").fontSize(18).fillColor("#0e2733").text("NovoPix", 100, 54);
    doc.font("R").fontSize(9).fillColor("#5b6b75").text("novopix.uk · contact@novopix.uk", 100, 76);
    doc.moveTo(50, 102).lineTo(50 + W, 102).strokeColor("#ffc233").lineWidth(2).stroke();
    doc.font("B").fontSize(17).fillColor("#0e2733").text(t.title, 50, 118, { width: W });
    doc.moveDown(0.5);
    const meta: Array<[string, string]> = [
      [t.site, after.finalUrl],
      [t.client, client.company || client.name],
      [t.dates, `${t.before}: ${loc(before.scannedAt)} · ${t.after}: ${loc(after.scannedAt)}`],
      [t.approved, approvedBy],
    ];
    for (const [k, v] of meta) {
      const y = doc.y;
      doc.font("B").fontSize(10).fillColor("#0e2733").text(k + ":", 50, y, { width: 110 });
      doc.font("R").fontSize(10).fillColor("#222").text(v, 165, y, { width: W - 115 });
      doc.moveDown(0.3);
    }
    const colX = [50 + W - 270, 50 + W - 180, 50 + W - 90];
    const head = () => {
      const y = doc.y;
      doc.rect(50, y, W, 22).fill("#0e2733");
      doc.font("B").fontSize(10).fillColor("#ffffff").text(t.metric, 58, y + 6, { width: W - 290 });
      [t.before, t.after, t.change].forEach((h, i) => doc.text(h, colX[i], y + 6, { width: 80, align: "right" }));
      doc.y = y + 26;
    };
    const cell = (v: number | string | null) => (v === null ? t.nomeas : String(v));
    const line = (label: string, b: number | string | null, a: number | string | null, d: number | null) => {
      if (doc.y > doc.page.height - 110) {
        doc.addPage();
        head();
      }
      const y = doc.y;
      doc.rect(50, y, W, 22).fill("#f4f7f9");
      doc.font("R").fontSize(10).fillColor("#0e2733").text(label, 58, y + 6, { width: W - 290 });
      doc.fillColor(b === null ? "#8a6d00" : "#222").text(cell(b), colX[0], y + 6, { width: 80, align: "right" });
      doc.fillColor(a === null ? "#8a6d00" : "#222").text(cell(a), colX[1], y + 6, { width: 80, align: "right" });
      doc.font("B").fillColor(d === null ? "#8a6d00" : d > 0 ? "#0a7d3b" : d < 0 ? "#b3261e" : "#222").text(d === null ? "–" : d > 0 ? `+${d}` : String(d), colX[2], y + 6, { width: 80, align: "right" });
      doc.y = y + 26;
    };
    doc.moveDown(0.8);
    head();
    for (const r of cmp.rows) line(lang === "pl" ? r.labelPl : r.labelEn, r.before, r.after, r.delta);
    line(t.rt, cmp.responseTimeMs.before, cmp.responseTimeMs.after, cmp.responseTimeMs.delta);
    if (cmp.cwv.length) {
      doc.moveDown(0.6);
      doc.font("B").fontSize(12).fillColor("#0e2733").text(t.cwv, 50);
      doc.moveDown(0.3);
      head();
      for (const c of cmp.cwv) line(`${c.acronym} – ${lang === "en" ? (localizeSnapshot(after, "en").cwv.find((x) => x.acronym === c.acronym)?.name ?? c.name) : c.name}`, c.before === null ? null : lang === "en" ? EN_VALUES(c.before) : c.before, c.after === null ? null : lang === "en" ? EN_VALUES(c.after) : c.after, null);
    }
    for (const note of cmp.notes) {
      doc.moveDown(0.5);
      doc.font("B").fontSize(9).fillColor("#8a6d00").text(t.notes[note], 50, doc.y, { width: W });
    }
    doc.moveDown(0.8);
    if (doc.y > doc.page.height - 130) doc.addPage();
    const dy = doc.y;
    const h = doc.font("R").fontSize(9).heightOfString(t.disclaimer, { width: W - 20 });
    doc.rect(50, dy, W, h + 18).fill("#f4f7f9");
    doc.fillColor("#444").text(t.disclaimer, 60, dy + 9, { width: W - 20 });
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      doc.font("R").fontSize(8).fillColor("#8a98a1").text(`NovoPix · ${t.page} ${i + 1}/${range.count}`, 50, doc.page.height - 40, { width: W, align: "center", lineBreak: false });
    }
    doc.end();
  });
}
