import fs from "fs";
import path from "path";

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
}

export interface ClientActivityEntry {
  id: string;
  timestamp: string;
  type: "audit" | "proposal_sent" | "proposal_accepted" | "status_change" | "note";
  summary: string;
}

export interface AgencyClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: "lead" | "audit_sent" | "proposal_accepted" | "remediated" | "retainer";
  contractValue: number;
  hourlyRate: number;
  estimatedHours: number;
  retainerFee: number;
  addedAt: string;
  lastScore: number;
  notes: string;
  cmsTech?: string;
  activityLog?: ClientActivityEntry[];
}

export interface MonitoringAlertEntry {
  id: string;
  timestamp: string;
  type: "downtime" | "slow_response" | "score_drop" | "recovered";
  message: string;
  httpStatus?: number;
  responseTimeMs?: number;
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
}

export interface DatabaseSchema {
  leads: LeadRecord[];
  agencyClients: AgencyClient[];
  monitoredDomains: MonitoredDomain[];
  proposals: Record<string, any>;
  agencyPin: string;
  lastSavedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
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
    agencyPin: "",
    lastSavedAt: new Date().toISOString(),
  };
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
