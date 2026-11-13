import path from "path";
import { createRequire } from "module";
import type { ScanSnapshot } from "./database";
import { localizeSnapshot } from "./scanSnapshot";

// Publiczna strona wyniku /r/<id>: statyczny snapshot (bez danych osobowych), noindex, z og:image.
// Wszystkie teksty ze skanowanej strony są escapowane.

export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const T = {
  pl: {
    title: "Wynik skanu strony",
    lead: "Wstępna, automatyczna kontrola techniczna",
    overall: "Wynik ogólny",
    perf: "Wydajność",
    seo: "SEO",
    acc: "Dostępność",
    bp: "Dobre praktyki",
    nomeas: "brak pomiaru",
    full: "Pełny pomiar Google Lighthouse",
    partial: "Pomiar częściowy (HTML/HTTP) – pola „brak pomiaru” nie zostały zmierzone",
    issues: "Najważniejsze zauważone kwestie",
    noissues: "W tym pomiarze nie zapisano problemów.",
    cwv: "Wskaźniki",
    date: "Data pomiaru",
    cta: "Zeskanuj własną stronę",
    disclaimer: "To wynik wstępnej kontroli automatycznej – nie jest certyfikatem, audytem zgodności (w tym WCAG) ani gwarancją wyniku. Wartości mogą różnić się między pomiarami. Strona nie zawiera danych osobowych i wygasa po 90 dniach.",
    delete: "Chcesz usunąć ten link? Użyj przycisku „Usuń link” w skanerze, w którym go utworzono, lub napisz na contact@novopix.uk.",
    other: "English",
    expires: "Link wygasa",
  },
  en: {
    title: "Website scan result",
    lead: "Preliminary automated technical check",
    overall: "Overall score",
    perf: "Performance",
    seo: "SEO",
    acc: "Accessibility",
    bp: "Best practices",
    nomeas: "not measured",
    full: "Full Google Lighthouse measurement",
    partial: "Partial measurement (HTML/HTTP) – fields marked “not measured” were not measured",
    issues: "Main findings",
    noissues: "No issues were recorded in this measurement.",
    cwv: "Metrics",
    date: "Measured on",
    cta: "Scan your own website",
    disclaimer: "This is the result of a preliminary automated check – not a certificate, a compliance audit (including WCAG) or a guarantee of any outcome. Values may differ between measurements. This page contains no personal data and expires after 90 days.",
    delete: "Want to remove this link? Use the “Delete link” button in the scanner where it was created, or write to contact@novopix.uk.",
    other: "Polski",
    expires: "Link expires",
  },
};

export type PageLang = "pl" | "en";

export function hostOf(snap: ScanSnapshot): string {
  return String(snap.finalUrl || snap.url || "").replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 120);
}

const scoreClass = (v: number | null) => (v === null ? "na" : v >= 90 ? "good" : v >= 50 ? "mid" : "bad");

export function renderResultPage(opts: { id: string; snapshot: ScanSnapshot; expiresAt: string; lang: PageLang; origin: string; withOgImage: boolean; example?: boolean }): string {
  const { id, lang, origin } = opts;
  const t = T[lang];
  const snap = localizeSnapshot(opts.snapshot, lang);
  const host = hostOf(snap);
  const c = snap.categories;
  const rows: Array<[string, number | null]> = [
    [t.overall, snap.overallScore],
    [t.perf, c.performance],
    [t.seo, c.seo],
    [t.acc, c.accessibility],
    [t.bp, c.bestPractices],
  ];
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { timeZone: "Europe/Warsaw" });
  const desc = `${t.lead}: ${host}. ${t.overall}: ${snap.overallScore === null ? t.nomeas : snap.overallScore + "/100"}.`;
  const url = `${origin}/r/${id}`;
  const other: PageLang = lang === "pl" ? "en" : "pl";
  const og = opts.withOgImage ? `<meta property="og:image" content="${esc(url)}/og.png?lang=${lang}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image" content="${esc(url)}/og.png?lang=${lang}">` : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)}: ${esc(host)} · NovoPix</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.title)}: ${esc(host)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
${og}
<style>
:root{--bg:#f4f7f9;--card:#fff;--ink:#0e2733;--muted:#5b6b75;--line:#e1e8ed;--accent:#ffc233;--good:#0a7d3b;--mid:#a65f00;--bad:#b3261e;--na:#8a6d00}
@media (prefers-color-scheme:dark){:root{--bg:#0b1a22;--card:#12262f;--ink:#eaf2f6;--muted:#a3b5bf;--line:#223a45;--good:#4cd48a;--mid:#ffb454;--bad:#ff7b72;--na:#e8c15a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:20px 16px 48px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
.brand{font-weight:800;letter-spacing:.02em}.brand i{display:inline-block;width:22px;height:22px;border-radius:6px;background:var(--accent);vertical-align:-5px;margin-right:8px}
a{color:inherit}.lang{font-size:14px;color:var(--muted)}
h1{font-size:24px;line-height:1.25;margin:0 0 4px;word-break:break-word}.sub{color:var(--muted);margin:0 0 16px;font-size:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:14px}
.row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}
.row b.good{color:var(--good)}.row b.mid{color:var(--mid)}.row b.bad{color:var(--bad)}.row b.na{color:var(--na);font-weight:600}
h2{font-size:16px;margin:0 0 8px}ol,ul{margin:0;padding-left:20px}li{margin:4px 0}
.cta{display:inline-block;background:var(--accent);color:#0e2733;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:12px;margin:8px 0 18px}
.cta:focus-visible,a:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
small,.note{color:var(--muted);font-size:13px}
</style>
</head>
<body>
<main>
<header><div class="brand"><i aria-hidden="true"></i>NovoPix</div><a class="lang" href="/r/${esc(id)}?lang=${other}" hreflang="${other}">${esc(t.other)}</a></header>
<h1>${esc(host)}</h1>
${opts.example ? `<p class="sub"><strong>${lang === "pl" ? "Przykładowy raport dla novopix.uk" : "Example report for novopix.uk"}</strong></p>` : ""}
<p class="sub">${esc(t.lead)} · ${esc(t.date)}: ${esc(fmtDate(snap.scannedAt))} · ${esc(snap.measurementStatus === "live_lighthouse" ? t.full : t.partial)}</p>
<a class="cta" href="/">${esc(t.cta)} →</a>
<section class="card" aria-label="${esc(t.overall)}">
${rows.map(([k, v]) => `<div class="row"><span>${esc(k)}</span><b class="${scoreClass(v)}">${v === null ? esc(t.nomeas) : esc(v) + "/100"}</b></div>`).join("\n")}
</section>
${snap.cwv.length ? `<section class="card"><h2>${esc(t.cwv)}</h2>${snap.cwv.map((m) => `<div class="row"><span>${esc(m.name)}</span><b class="${m.status === "unavailable" ? "na" : ""}">${esc(m.status === "unavailable" ? t.nomeas : m.displayValue)}</b></div>`).join("")}</section>` : ""}
<section class="card"><h2>${esc(t.issues)}</h2>${snap.issues.length ? `<ol>${snap.issues.slice(0, 6).map((i) => `<li>${esc(i.title)}</li>`).join("")}</ol>` : `<p>${esc(t.noissues)}</p>`}</section>
<p class="note">${esc(t.disclaimer)}</p>
<p class="note">${esc(t.expires)}: ${esc(fmtDate(opts.expiresAt))}. ${esc(t.delete)}</p>
</main>
</body>
</html>`;
}

// --- og:image (PNG 1200×630) rysowany po stronie serwera; brak biblioteki graficznej = brak og:image (strona nadal działa) ---
const require_ = createRequire(import.meta.url);
let canvasLib: any | null | undefined;
async function loadCanvas() {
  if (canvasLib !== undefined) return canvasLib;
  try {
    const lib = await import("@napi-rs/canvas");
    const base = path.dirname(require_.resolve("dejavu-fonts-ttf/package.json"));
    lib.GlobalFonts.registerFromPath(path.join(base, "ttf", "DejaVuSans.ttf"), "DejaVu");
    lib.GlobalFonts.registerFromPath(path.join(base, "ttf", "DejaVuSans-Bold.ttf"), "DejaVu Bold");
    canvasLib = lib;
  } catch {
    canvasLib = null;
  }
  return canvasLib;
}
export const ogImageAvailable = async () => !!(await loadCanvas());

export async function renderOgImage(snapshot: ScanSnapshot, lang: PageLang): Promise<Buffer | null> {
  const lib = await loadCanvas();
  if (!lib) return null;
  const t = T[lang];
  const snap = localizeSnapshot(snapshot, lang);
  const W = 1200;
  const H = 630;
  const canvas = lib.createCanvas(W, H);
  const g = canvas.getContext("2d");
  g.fillStyle = "#0e2733";
  g.fillRect(0, 0, W, H);
  // logo NovoPix (żółty kwadrat z pikselową literą N)
  g.fillStyle = "#ffc233";
  g.beginPath();
  g.roundRect(60, 56, 72, 72, 16);
  g.fill();
  g.fillStyle = "#0e2733";
  const px: Array<[number, number]> = [[10, 10], [46, 10], [10, 19], [19, 19], [46, 19], [10, 28], [28, 28], [46, 28], [10, 37], [37, 37], [46, 37], [10, 46], [46, 46]];
  const k = 72 / 64;
  for (const [x, y] of px) {
    g.beginPath();
    g.roundRect(60 + x * k, 56 + y * k, 8 * k, 8 * k, 2);
    g.fill();
  }
  g.fillStyle = "#ffffff";
  g.font = "bold 40px 'DejaVu Bold'";
  g.fillText("NovoPix", 152, 106);
  g.fillStyle = "#a3b5bf";
  g.font = "28px DejaVu";
  g.fillText(t.lead, 60, 190);
  g.fillStyle = "#ffffff";
  g.font = "bold 46px 'DejaVu Bold'";
  let host = hostOf(snap);
  while (g.measureText(host).width > W - 120 && host.length > 4) host = host.slice(0, -2);
  if (host !== hostOf(snap)) host += "…";
  g.fillText(host, 60, 250);
  const colour = (v: number | null) => (v === null ? "#e8c15a" : v >= 90 ? "#4cd48a" : v >= 50 ? "#ffb454" : "#ff7b72");
  // wynik ogólny
  g.fillStyle = colour(snap.overallScore);
  if (snap.overallScore === null) {
    g.font = "bold 78px 'DejaVu Bold'";
    g.fillText(t.nomeas, 60, 420);
  } else {
    g.font = "bold 150px 'DejaVu Bold'";
    const big = String(snap.overallScore);
    g.fillText(big, 60, 430);
    const bw = g.measureText(big).width;
    g.fillStyle = "#a3b5bf";
    g.font = "36px DejaVu";
    g.fillText("/100", 60 + bw + 16, 430);
  }
  g.fillStyle = "#a3b5bf";
  g.font = "26px DejaVu";
  g.fillText(t.overall, 60, 470);
  // kategorie
  const cats: Array<[string, number | null]> = [[t.perf, snap.categories.performance], [t.seo, snap.categories.seo], [t.acc, snap.categories.accessibility], [t.bp, snap.categories.bestPractices]];
  cats.forEach(([name, v], i) => {
    const x = 60 + i * 280;
    g.fillStyle = "#12262f";
    g.beginPath();
    g.roundRect(x, 500, 260, 100, 14);
    g.fill();
    g.fillStyle = "#a3b5bf";
    g.font = "22px DejaVu";
    g.fillText(name, x + 18, 536);
    g.fillStyle = colour(v);
    g.font = v === null ? "bold 24px 'DejaVu Bold'" : "bold 36px 'DejaVu Bold'";
    g.fillText(v === null ? t.nomeas : `${v}/100`, x + 18, 582);
  });
  return canvas.toBuffer("image/png");
}
