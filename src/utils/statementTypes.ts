import type { Presence } from "./domainHealthTypes";
export interface StatementCheck {
  host: string;
  checkedAt: string;
  found: boolean | null; // null = nie udało się sprawdzić (np. strona nie odpowiedziała)
  url: string | null;
  elements: { date: Presence; contact: Presence; compliance: Presence; nonAccessible: Presence; complaint: Presence; wcag: Presence };
}
