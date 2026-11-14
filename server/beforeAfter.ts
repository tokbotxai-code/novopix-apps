import type { ScanSnapshot } from "./database";

// Porównanie „przed / po”: tylko wartości zmierzone. Brak pomiaru = null (żadnych szacunków ani zgadywania).
export interface CompareRow {
  key: string;
  labelPl: string;
  labelEn: string;
  before: number | null;
  after: number | null;
  delta: number | null;
}
export interface CompareCwv {
  acronym: string;
  name: string;
  before: string | null;
  after: string | null;
}
export interface Comparison {
  rows: CompareRow[];
  responseTimeMs: { before: number | null; after: number | null; delta: number | null };
  cwv: CompareCwv[];
  comparable: boolean;
  notes: Array<"measurement_type_differs" | "strategy_differs">;
}

const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const delta = (a: number | null, b: number | null) => (a === null || b === null ? null : Math.round((b - a) * 100) / 100);

export function buildComparison(before: ScanSnapshot, after: ScanSnapshot): Comparison {
  const defs: Array<[string, string, string, (s: ScanSnapshot) => number | null]> = [
    ["overall", "Wynik ogólny", "Overall score", (s) => n(s.overallScore)],
    ["performance", "Wydajność", "Performance", (s) => n(s.categories.performance)],
    ["seo", "SEO", "SEO", (s) => n(s.categories.seo)],
    ["accessibility", "Dostępność", "Accessibility", (s) => n(s.categories.accessibility)],
    ["bestPractices", "Dobre praktyki", "Best practices", (s) => n(s.categories.bestPractices)],
  ];
  const rows: CompareRow[] = defs.map(([key, labelPl, labelEn, get]) => {
    const b = get(before);
    const a = get(after);
    return { key, labelPl, labelEn, before: b, after: a, delta: delta(b, a) };
  });
  const val = (s: ScanSnapshot, acr: string): string | null => {
    const c = s.cwv.find((x) => x.acronym === acr);
    return c && c.status !== "unavailable" && c.displayValue && !/^brak pomiaru$/i.test(c.displayValue) ? c.displayValue : null;
  };
  const acronyms = Array.from(new Set([...before.cwv, ...after.cwv].map((c) => c.acronym)));
  const cwv: CompareCwv[] = acronyms.map((acr) => ({
    acronym: acr,
    name: (after.cwv.find((c) => c.acronym === acr) || before.cwv.find((c) => c.acronym === acr))!.name,
    before: val(before, acr),
    after: val(after, acr),
  }));
  const bt = n(before.responseTimeMs);
  const at = n(after.responseTimeMs);
  const notes: Comparison["notes"] = [];
  if (before.measurementStatus !== after.measurementStatus) notes.push("measurement_type_differs");
  if (before.strategy !== after.strategy) notes.push("strategy_differs");
  return { rows, responseTimeMs: { before: bt, after: at, delta: delta(bt, at) }, cwv, comparable: notes.length === 0, notes };
}
