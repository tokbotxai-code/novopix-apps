import fs from "fs";
import path from "path";
import { clonePackages } from "./packages";

export interface LeadRecord {
  id: string;
  timestamp: string;
  name: string | null;
  email: string;
  phone: string | null;
  website: string;
  details: string;
  overallScore: number | null;
  scores: Record<string, number>;
  cwv: Record<string, string>;
  isSample: boolean;
  userAgent?: string;
  ip?: string;
  // Język interfejsu w chwili wysłania formularza (pl/en) – pierwsza reguła wyboru języka oferty.
  lang?: "pl" | "en";
  // Zgłoszenie „Wyślij mi pełny raport PDF”: zgoda i status raportu (raport czeka na zatwierdzenie przez człowieka).
  kind?: "quote" | "report";
  consent?: { reportAndInfo: boolean; at: string; text: string; policyUrl: string };
  report?: ReportRequestState;
  clientId?: string;
}

export interface ReportRequestState {
  status: "pending" | "sent" | "rejected";
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  sentTo?: string;
  auto?: boolean;
  snapshot?: ScanSnapshot;
  log?: Array<{ at: string; action: string; detail?: string }>;
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

// Publiczny, statyczny snapshot wyniku (/r/<id>): bez danych osobowych, wygasa po 90 dniach.
export interface SharedResult {
  id: string;
  createdAt: string;
  expiresAt: string;
  deleteTokenHash: string;
  snapshot: ScanSnapshot;
}

export interface PanelSettings {
  autoSendReport: boolean;
}

export interface ClientActivityEntry {
  id: string;
  timestamp: string;
  type: "audit" | "proposal_sent" | "proposal_accepted" | "status_change" | "note" | "offer_draft" | "offer_approved" | "email_sent" | "monitoring";
  summary: string;
}

// Etapy ścieżki: lead → skan → szkic oferty → oferta zatwierdzona → wysłano → zaakceptowano → wdrożono → monitoring → abonament.
// Starsze rekordy w bazie mają tylko lead/audit_sent/proposal_accepted/remediated/retainer – nadal są poprawne.
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

export const STAGE_ORDER: ClientStage[] = [
  "lead",
  "scanned",
  "offer_draft",
  "offer_approved",
  "audit_sent",
  "proposal_accepted",
  "remediated",
  "monitoring",
  "retainer",
];

// Migawka ostatniego pomiaru (wartości null = brak pomiaru; niczego nie zmyślamy).
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
  cmsTech?: string | null;
  // Atrybut <html lang> strony (null = brak) – druga reguła wyboru języka oferty.
  htmlLang?: string | null;
  // Tłumaczenia PL→EN tekstów skanu, użyte w tej migawce (do ofert i PDF w języku angielskim).
  i18n?: Record<string, string>;
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
  snapshot?: ScanSnapshot;
}

export interface BulkScanJob {
  id: string;
  createdAt: string;
  finishedAt?: string;
  strategy: "mobile" | "desktop";
  rows: BulkScanRow[];
}

// Skan „przed i po wdrożeniu”: stan „przed” jest zamrożony przy pierwszym skanie po wdrożeniu.
export interface BeforeAfterState {
  before: ScanSnapshot;
  after: ScanSnapshot;
  status: "draft" | "approved";
  language?: "pl" | "en";
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  sentTo?: string;
}

export interface AgencyClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStage;
  contractValue: number;
  hourlyRate: number;
  estimatedHours: number;
  retainerFee: number;
  addedAt: string;
  lastScore: number;
  notes: string;
  cmsTech?: string;
  activityLog?: ClientActivityEntry[];
  lastScan?: ScanSnapshot;
  source?: string;
  // Język oferty/maila/PDF (opcjonalny; stare rekordy bez pola = pl). leadLang = język formularza.
  language?: "pl" | "en";
  leadLang?: "pl" | "en";
  // Skan „po wdrożeniu” (lastScan = stan „przed”) i zatwierdzenie raportu przed/po przez człowieka.
  beforeAfter?: BeforeAfterState;
}

export interface MonitoringAlertEntry {
  id: string;
  timestamp: string;
  type: "downtime" | "slow_response" | "score_drop" | "psi_drop" | "recovered";
  message: string;
  httpStatus?: number;
  responseTimeMs?: number;
  seen?: boolean;
  emailed?: "sent" | "not_configured" | "failed";
}

export interface MonitoredDomain {
  id: string;
  domain: string;
  clientName: string;
  interval: "5m" | "15m" | "60m" | "daily" | "weekly";
  threshold: number;
  lastCheck: string;
  lastScore: number;
  performanceScore: number;
  seoScore: number;
  uptimePercent: number;
  responseTimeMs: number;
  httpStatus?: number;
  totalChecks?: number;
  successfulChecks?: number;
  status: "healthy" | "warning" | "alert";
  history: Array<{ date: string; score: number; responseMs: number; httpStatus?: number; ok?: boolean }>;
  alertsLog?: MonitoringAlertEntry[];
  // Pomiar Google PageSpeed: najwyżej 1 raz dziennie na domenę; brak pomiaru = status "unavailable" (bez wymyślonych liczb).
  psi?: {
    at: string;
    status: "live_lighthouse" | "unavailable";
    overall: number | null;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    error?: string;
  };
  psiAttemptDay?: string;
  clientId?: string;
}

export interface DatabaseSchema {
  leads: LeadRecord[];
  agencyClients: AgencyClient[];
  monitoredDomains: MonitoredDomain[];
  proposals: Record<string, any>;
  offers?: Record<string, OfferDraft>;
  bulkScans?: BulkScanJob[];
  packages?: ServicePackage[];
  sharedResults?: Record<string, SharedResult>;
  settings?: PanelSettings;
  // Dzienne sumy odwiedzin i zdarzeń (server/stats.ts); bez adresów IP i identyfikatorów.
  stats?: Record<string, { pages: Record<string, { v: number; u: number }>; refs: Record<string, number>; langs: Record<string, number>; events: Record<string, number> }>;
  agencyPin: string;
  lastSavedAt?: string;
}

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const DB_PATH = path.join(DATA_DIR, "scanner-db.json");
const DB_TMP_PATH = path.join(DATA_DIR, "scanner-db.json.tmp");

// Brak danych przykładowych: CRM i monitoring zaczynają puste (żadnych zmyślonych klientów ani przychodów).
export const DEFAULT_CLIENTS: AgencyClient[] = [];
export const DEFAULT_DOMAINS: MonitoredDomain[] = [];

// Wcześniejsze wersje zapisywały przykładowych klientów do bazy; usuwamy je przy wczytaniu (po id i nazwie firmy).
const DEMO_CLIENT_IDS = new Set(["cli_1", "cli_2", "cli_3"]);
const DEMO_COMPANIES = new Set(["AutoKlinika Sp. z o.o.", "Kancelaria Nowak & Partnerzy", "FashionHub E-Commerce"]);
const DEMO_DOMAIN_IDS = new Set(["dom_1", "dom_2"]);
const isDemoClient = (c: any) => DEMO_CLIENT_IDS.has(c?.id) && DEMO_COMPANIES.has(c?.company);
const isDemoDomain = (d: any) => DEMO_DOMAIN_IDS.has(d?.id);

export function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        leads: Array.isArray(parsed.leads) ? parsed.leads : [],
        agencyClients: Array.isArray(parsed.agencyClients) ? parsed.agencyClients.filter((c: any) => !isDemoClient(c)) : [],
        monitoredDomains: Array.isArray(parsed.monitoredDomains) ? parsed.monitoredDomains.filter((d: any) => !isDemoDomain(d)) : [],
        proposals: parsed.proposals && typeof parsed.proposals === "object" ? parsed.proposals : {},
        offers: parsed.offers && typeof parsed.offers === "object" ? parsed.offers : {},
        bulkScans: Array.isArray(parsed.bulkScans) ? parsed.bulkScans : [],
        // Starsza baza nie ma pakietów/ustawień: dosiewamy domyślne (istniejące dane nie są zmieniane).
        packages: Array.isArray(parsed.packages) && parsed.packages.length ? parsed.packages : clonePackages(),
        sharedResults: parsed.sharedResults && typeof parsed.sharedResults === "object" ? parsed.sharedResults : {},
        stats: parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
        settings: { autoSendReport: !!parsed.settings?.autoSendReport },
        agencyPin:
          typeof parsed.agencyPin === "string" && parsed.agencyPin.trim()
            ? parsed.agencyPin.trim()
            : "",
        lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn("Could not read scanner-db.json, initializing defaults:", e);
  }
  return {
    leads: [],
    agencyClients: [...DEFAULT_CLIENTS],
    monitoredDomains: [...DEFAULT_DOMAINS],
    proposals: {},
    offers: {},
    bulkScans: [],
    packages: clonePackages(),
    sharedResults: {},
    settings: { autoSendReport: false },
    agencyPin: "",
    lastSavedAt: new Date().toISOString(),
  };
}

export function advanceStage(client: AgencyClient, target: ClientStage, summary: string): boolean {
  const cur = STAGE_ORDER.indexOf(client.status);
  const next = STAGE_ORDER.indexOf(target);
  if (next <= cur) return false;
  client.status = target;
  if (!Array.isArray(client.activityLog)) client.activityLog = [];
  client.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    type: "status_change",
    summary,
  });
  return true;
}

export function logActivity(client: AgencyClient, type: ClientActivityEntry["type"], summary: string) {
  if (!Array.isArray(client.activityLog)) client.activityLog = [];
  client.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    type,
    summary,
  });
  if (client.activityLog.length > 60) client.activityLog.length = 60;
}

export const db: DatabaseSchema = loadDb();

let isWriting = false;
let pendingWrite = false;

// Atomic write using .tmp + renameSync so concurrent requests never corrupt scanner-db.json
export function saveDb(createBackupSnapshot = false) {
  if (isWriting) {
    pendingWrite = true;
    return;
  }
  isWriting = true;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastSavedAt = new Date().toISOString();
    const payload = JSON.stringify(db, null, 2);
    fs.writeFileSync(DB_TMP_PATH, payload, "utf-8");
    fs.renameSync(DB_TMP_PATH, DB_PATH);

    if (createBackupSnapshot) {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(BACKUP_DIR, `scanner-db-backup-${stamp}.json`);
      fs.writeFileSync(backupFile, payload, "utf-8");

      // Keep at most 10 rolling backups
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("scanner-db-backup-"))
        .sort();
      while (files.length > 10) {
        const oldest = files.shift();
        if (oldest) {
          try {
            fs.unlinkSync(path.join(BACKUP_DIR, oldest));
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn("Could not persist scanner-db.json:", e);
  } finally {
    isWriting = false;
    if (pendingWrite) {
      pendingWrite = false;
      saveDb(false);
    }
  }
}
