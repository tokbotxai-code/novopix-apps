// Typy współdzielone przez zakładki agencyjne (panel). Odpowiadają server/database.ts.

export type ClientStage =
  | "lead"
  | "scanned"
  | "offer_draft"
  | "offer_approved"
  | "audit_sent"
  | "proposal_accepted"
  | "remediated"
  | "monitoring"
  | "retainer";

export const STAGES: Array<{ id: ClientStage; pl: string; en: string }> = [
  { id: "lead", pl: "Zgłoszenie / lead", en: "Lead" },
  { id: "scanned", pl: "Skan wykonany", en: "Scanned" },
  { id: "offer_draft", pl: "Szkic oferty", en: "Offer draft" },
  { id: "offer_approved", pl: "Oferta zatwierdzona", en: "Offer approved" },
  { id: "audit_sent", pl: "Oferta wysłana", en: "Offer sent" },
  { id: "proposal_accepted", pl: "Zaakceptowana przez klienta", en: "Accepted by client" },
  { id: "remediated", pl: "Wdrożono", en: "Remediated" },
  { id: "monitoring", pl: "Monitoring aktywny", en: "Monitoring active" },
  { id: "retainer", pl: "Stały abonament", en: "Active retainer" },
];

export const stageLabel = (id: string, isPolish: boolean) => {
  const s = STAGES.find((x) => x.id === id);
  return s ? (isPolish ? s.pl : s.en) : id;
};

export interface ScanSnapshot {
  scannedAt: string;
  url: string;
  finalUrl: string;
  strategy: "mobile" | "desktop";
  measurementStatus: "live_lighthouse" | "partial_html" | "failed";
  measurementNote?: string;
  overallScore: number | null;
  categories: { performance: number | null; seo: number | null; accessibility: number | null; bestPractices: number | null };
  cwv: Array<{ acronym: string; name: string; displayValue: string; status: string }>;
  issues: Array<{ title: string; description: string; priority: string; category?: string }>;
  responseTimeMs?: number | null;
  https?: boolean;
  htmlLang?: string | null;
}

export interface OfferDraft {
  id: string;
  clientId: string;
  language: "pl" | "en";
  status: "draft" | "approved";
  subject: string;
  mailBody: string;
  offerTitle: string;
  offerSections: Array<{ heading: string; body: string }>;
  priceNet: number;
  currency: "PLN" | "EUR" | "GBP";
  packageId?: string;
  packageName?: string;
  generatedBy: "ai" | "template";
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  sentTo?: string;
  sendLog?: Array<{ at: string; action: string; detail?: string }>;
}

export interface BulkScanRow {
  url: string;
  status: "queued" | "running" | "done" | "failed";
  measurementStatus?: "live_lighthouse" | "partial_html" | "failed";
  overallScore: number | null;
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  issuesCount: number | null;
  rankScore?: number | null;
  error?: string;
  addedToCrm?: string;
}

export interface BulkScanJob {
  id: string;
  createdAt: string;
  finishedAt?: string;
  strategy: "mobile" | "desktop";
  rows: BulkScanRow[];
}

export interface ServicePackage {
  id: string;
  group: "web" | "speed" | "a11y" | "app" | "care" | "other";
  sort: number;
  namePl: string;
  nameEn: string;
  scopePl: string;
  scopeEn: string;
  durationPl: string;
  durationEn: string;
  pricePln: number;
  priceGbp: number;
  priceFrom: boolean;
  recurring: boolean;
  active: boolean;
}

export const packageLabel = (p: ServicePackage, lang: "pl" | "en", cur?: "PLN" | "GBP") => {
  const c = cur || (lang === "pl" ? "PLN" : "GBP");
  const amount = c === "PLN" ? p.pricePln : p.priceGbp;
  const num = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "pl" ? "\u00a0" : ",");
  return `${p.priceFrom ? (lang === "pl" ? "od " : "from ") : ""}${c === "PLN" ? `${num} zł` : `£${num}`}${p.recurring ? (lang === "pl" ? " / mies." : " / month") : ""}`;
};

export interface CompareRow {
  key: string;
  labelPl: string;
  labelEn: string;
  before: number | null;
  after: number | null;
  delta: number | null;
}
export interface Comparison {
  rows: CompareRow[];
  responseTimeMs: { before: number | null; after: number | null; delta: number | null };
  cwv: Array<{ acronym: string; name: string; before: string | null; after: string | null }>;
  comparable: boolean;
  notes: Array<"measurement_type_differs" | "strategy_differs">;
}

// Wspólny kontekst przekazywany do zakładek agencyjnych (lazy-loaded).
export interface AgencyCtx {
  isPolish: boolean;
  token: string | null;
  authHeaders: () => Record<string, string>;
  showToast: (msg: string) => void;
  requestLogin: () => void;
  onUnauthorized: () => void;
}
