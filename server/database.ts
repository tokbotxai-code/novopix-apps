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

export const DEFAULT_CLIENTS: AgencyClient[] = [
  {
    id: "cli_1",
    name: "Jan Kowalski",
    company: "AutoKlinika Sp. z o.o.",
    email: "jan@autoklinika.pl",
    phone: "+48 601 234 567",
    website: "https://autoklinika.pl",
    status: "proposal_accepted",
    contractValue: 1350,
    hourlyRate: 150,
    estimatedHours: 9,
    retainerFee: 300,
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastScore: 58,
    cmsTech: "WordPress",
    notes: "Klient zaakceptował kosztorys 9h (optymalizacja LCP, WebP/AVIF, nagłówki H1-H3 w katalogu usług).",
    activityLog: [
      {
        id: "act_1",
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        type: "audit",
        summary: "Wykonano audyt techniczny (wynik początkowy: 58/100)",
      },
      {
        id: "act_2",
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        type: "proposal_accepted",
        summary: "Zaakceptowano kosztorys 9 rbh (1350 PLN netto)",
      },
    ],
  },
  {
    id: "cli_2",
    name: "Anna Nowak",
    company: "Kancelaria Nowak & Partnerzy",
    email: "kontakt@nowak-kancelaria.pl",
    phone: "+48 502 987 654",
    website: "https://nowak-kancelaria.pl",
    status: "remediated",
    contractValue: 1650,
    hourlyRate: 150,
    estimatedHours: 11,
    retainerFee: 350,
    addedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    lastScore: 95,
    cmsTech: "Custom / Next.js",
    notes: "Wdrożenie zakończone sukcesem. Wynik wzrósł z 49 na 95/100. Klient przeszedł na abonament monitoringu.",
    activityLog: [
      {
        id: "act_3",
        timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
        type: "audit",
        summary: "Audyt początkowy: 49/100",
      },
      {
        id: "act_4",
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        type: "status_change",
        summary: "Zakończono wdrożenie — pomiar kontrolny 95/100",
      },
    ],
  },
  {
    id: "cli_3",
    name: "Michał Wiśniewski",
    company: "FashionHub E-Commerce",
    email: "m.wisniewski@fashionhub.eu",
    phone: "+48 730 111 222",
    website: "https://fashionhub.eu",
    status: "audit_sent",
    contractValue: 2100,
    hourlyRate: 150,
    estimatedHours: 14,
    retainerFee: 450,
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastScore: 44,
    cmsTech: "WooCommerce",
    notes: "Wysłano interaktywny link do oferty + raport PDF. Bardzo wolny koszyk mobilny (LCP 5.4s).",
    activityLog: [
      {
        id: "act_5",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: "proposal_sent",
        summary: "Wysłano link do Pokoju Ofertowego Klienta (2100 PLN / 14h)",
      },
    ],
  },
];

export const DEFAULT_DOMAINS: MonitoredDomain[] = [
  {
    id: "dom_1",
    domain: "https://novopix.uk",
    clientName: "NovoPix Studio",
    interval: "60m",
    threshold: 85,
    lastCheck: new Date().toISOString(),
    lastScore: 96,
    performanceScore: 95,
    seoScore: 98,
    uptimePercent: 100,
    responseTimeMs: 142,
    httpStatus: 200,
    totalChecks: 24,
    successfulChecks: 24,
    status: "healthy",
    history: [
      { date: "01 Nov", score: 93, responseMs: 165, httpStatus: 200, ok: true },
      { date: "03 Nov", score: 94, responseMs: 158, httpStatus: 200, ok: true },
      { date: "05 Nov", score: 95, responseMs: 149, httpStatus: 200, ok: true },
      { date: "07 Nov", score: 96, responseMs: 145, httpStatus: 200, ok: true },
      { date: "09 Nov", score: 96, responseMs: 142, httpStatus: 200, ok: true },
    ],
    alertsLog: [],
  },
  {
    id: "dom_2",
    domain: "https://autoklinika.pl",
    clientName: "AutoKlinika Sp. z o.o.",
    interval: "daily",
    threshold: 75,
    lastCheck: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastScore: 58,
    performanceScore: 52,
    seoScore: 64,
    uptimePercent: 95.8,
    responseTimeMs: 680,
    httpStatus: 200,
    totalChecks: 24,
    successfulChecks: 23,
    status: "warning",
    history: [
      { date: "01 Nov", score: 66, responseMs: 520, httpStatus: 200, ok: true },
      { date: "03 Nov", score: 63, responseMs: 590, httpStatus: 200, ok: true },
      { date: "05 Nov", score: 61, responseMs: 610, httpStatus: 200, ok: true },
      { date: "07 Nov", score: 59, responseMs: 650, httpStatus: 200, ok: true },
      { date: "09 Nov", score: 58, responseMs: 680, httpStatus: 200, ok: true },
    ],
    alertsLog: [
      {
        id: "al_1",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        type: "score_drop",
        message: "Wynik techniczny (58/100) poniżej ustalonego progu (75/100).",
        httpStatus: 200,
        responseTimeMs: 680,
      },
    ],
  },
];

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
        agencyClients:
          Array.isArray(parsed.agencyClients) && parsed.agencyClients.length > 0
            ? parsed.agencyClients
            : DEFAULT_CLIENTS,
        monitoredDomains:
          Array.isArray(parsed.monitoredDomains) && parsed.monitoredDomains.length > 0
            ? parsed.monitoredDomains
            : DEFAULT_DOMAINS,
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
