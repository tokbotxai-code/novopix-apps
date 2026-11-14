import crypto from "crypto";
import type { ScanSnapshot } from "./database";

// Pamięć podręczna wyników skanu (RAM, 2 h): zgłoszenia (lead, raport, publiczny link) odwołują się do scanId,
// więc nie da się ich podrobić własnymi liczbami przesłanymi z przeglądarki. Dane nie są zapisywane na dysku.
const TTL_MS = 2 * 60 * 60 * 1000;
const MAX = 500;
const cache = new Map<string, { at: number; snapshot: ScanSnapshot }>();

export function rememberScan(snapshot: ScanSnapshot): string {
  const now = Date.now();
  for (const [k, v] of cache) if (now - v.at > TTL_MS) cache.delete(k);
  while (cache.size >= MAX) {
    const first = cache.keys().next().value;
    if (first === undefined) break;
    cache.delete(first);
  }
  const id = `sc_${crypto.randomBytes(9).toString("hex")}`;
  cache.set(id, { at: now, snapshot });
  return id;
}

export function recallScan(id: unknown): ScanSnapshot | null {
  if (typeof id !== "string") return null;
  const hit = cache.get(id);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(id);
    return null;
  }
  return hit.snapshot;
}
