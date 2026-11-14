// Wynik kontroli domeny i poczty (publicznie widoczne ustawienia). Wspólny typ dla serwera i interfejsu.
export type Presence = "found" | "not_found" | "unknown";
export interface DomainHealth {
  host: string;
  mailDomain: string;
  checkedAt: string;
  ssl: { status: "ok" | "expiring" | "invalid" | "unknown"; daysLeft: number | null; validTo: string | null };
  mail: { mx: Presence; spf: Presence; dmarc: Presence; dmarcPolicy: string | null; dkim: Presence };
  headers: { https: boolean | null; hsts: Presence; contentTypeOptions: Presence; framing: Presence; referrerPolicy: Presence; csp: Presence };
}
