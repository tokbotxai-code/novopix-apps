import PDFDocument from "pdfkit";
import path from "path";
import { createRequire } from "module";
import type { AgencyClient, ScanSnapshot } from "./database";

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

export function buildReportPdf(client: AgencyClient, snap: ScanSnapshot, lang: "pl" | "en"): Promise<Buffer> {
  const t = L[lang];
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
