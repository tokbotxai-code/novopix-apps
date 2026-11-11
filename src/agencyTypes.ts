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

// Wspólny kontekst przekazywany do zakładek agencyjnych (lazy-loaded).
export interface AgencyCtx {
  isPolish: boolean;
  token: string | null;
  authHeaders: () => Record<string, string>;
  showToast: (msg: string) => void;
  requestLogin: () => void;
  onUnauthorized: () => void;
}
