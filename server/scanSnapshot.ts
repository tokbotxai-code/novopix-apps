import type { ScanSnapshot } from "./database";

const num = (v: any): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Przekształca odpowiedź /api/scan w zwięzłą migawkę. Wartości, których nie zmierzono, zostają null.
export function snapshotFromScan(body: any, strategy: "mobile" | "desktop", url: string): ScanSnapshot | null {
  if (!body || body.measurementStatus === "failed" || !body.measurementStatus) return null;
  const cwv = body.coreWebVitals || {};
  return {
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
  };
}
