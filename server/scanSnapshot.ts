import type { ScanSnapshot } from "./database";

const num = (v: any): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Przekształca odpowiedź /api/scan w zwięzłą migawkę. Wartości, których nie zmierzono, zostają null.
export function snapshotFromScan(body: any, strategy: "mobile" | "desktop", url: string): ScanSnapshot | null {
  if (!body || body.measurementStatus === "failed" || !body.measurementStatus) return null;
  const cwv = body.coreWebVitals || {};
  const snap: ScanSnapshot = {
    scannedAt: new Date().toISOString(),
    url,
    finalUrl: String(body.finalUrl || url),
    strategy,
    measurementStatus: body.measurementStatus,
    measurementNote: body.measurementNote,
    overallScore: num(body.overallScore),
    categories: {
      performance: num(body.categories?.performance),
      seo: num(body.categories?.seo),
      accessibility: num(body.categories?.accessibility),
      bestPractices: num(body.categories?.bestPractices),
    },
    cwv: ["lcp", "inp", "cls", "fcp", "tbt"]
      .filter((k) => cwv[k])
      .map((k) => {
        const partialNoLab = body.measurementStatus === "partial_html" && (k === "lcp" || k === "cls");
        return {
          acronym: String(cwv[k].acronym || k.toUpperCase()),
          name: partialNoLab ? (k === "lcp" ? "Largest Contentful Paint" : "Cumulative Layout Shift") : String(cwv[k].name || k),
          displayValue: partialNoLab ? "Brak pomiaru" : String(cwv[k].displayValue || "Brak pomiaru"),
          status: partialNoLab ? "unavailable" : String(cwv[k].status || "unavailable"),
        };
      }),
    issues: (Array.isArray(body.issues) ? body.issues : []).slice(0, 12).map((i: any) => ({
      title: String(i.title || "").slice(0, 200),
      description: String(i.description || "").slice(0, 400),
      priority: String(i.priority || "medium"),
      category: i.category ? String(i.category) : undefined,
    })),
    https: typeof body.deviceScores?.https === "boolean" ? body.deviceScores.https : undefined,
    responseTimeMs: num(body.pageWeight?.serverResponseMs),
    htmlLang: typeof body.htmlLang === "string" && body.htmlLang.trim() ? body.htmlLang.trim().slice(0, 20) : null,
  };
  snap.i18n = usedTranslations(snap, body.i18n);
  if (!Object.keys(snap.i18n).length) delete snap.i18n;
  return snap;
}

// Z mapy tłumaczeń skanu zostawiamy tylko wpisy użyte w migawce (żeby nie rozdymać bazy).
function usedTranslations(snap: ScanSnapshot, map: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!map || typeof map !== "object") return out;
  const texts = new Set<string>();
  for (const i of snap.issues) {
    texts.add(i.title);
    texts.add(i.description);
  }
  for (const c of snap.cwv) {
    texts.add(c.name);
    texts.add(c.displayValue);
  }
  if (snap.measurementNote) texts.add(snap.measurementNote);
  for (const t of texts) if (typeof map[t] === "string") out[t] = String(map[t]).slice(0, 600);
  return out;
}

// Wersja migawki z tekstami w języku angielskim (gdzie istnieje tłumaczenie); polska = bez zmian.
export function localizeSnapshot(snap: ScanSnapshot, lang: "pl" | "en"): ScanSnapshot {
  if (lang === "pl" || !snap.i18n) return snap;
  const m = snap.i18n;
  const tr = (t: string) => (Object.prototype.hasOwnProperty.call(m, t) ? m[t] : t);
  return {
    ...snap,
    measurementNote: snap.measurementNote ? tr(snap.measurementNote) : snap.measurementNote,
    cwv: snap.cwv.map((c) => ({ ...c, name: tr(c.name), displayValue: tr(c.displayValue) })),
    issues: snap.issues.map((i) => ({ ...i, title: tr(i.title), description: tr(i.description) })),
  };
}
