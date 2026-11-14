import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// --- 1. SSRF Protection & Safe URL Validator ---
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "[::1]",
  "::1",
  "metadata.google.internal",
  "metadata",
  "169.254.169.254",
]);

export interface SafeUrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  parsed?: URL;
  error?: string;
}

export function validateSafePublicUrl(rawInput: unknown): SafeUrlValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { valid: false, error: "Adres URL jest wymagany." };
  }

  let candidate = rawInput.trim();
  if (!candidate) {
    return { valid: false, error: "Adres URL nie może być pusty." };
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = "https://" + candidate;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { valid: false, error: "Nieprawidłowy format adresu URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Dozwolone są wyłącznie protokoły HTTP oraz HTTPS." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".lan")
  ) {
    return {
      valid: false,
      error: "Ze względów bezpieczeństwa (ochrona Anti-SSRF) skanowanie adresów lokalnych i wewnętrznych jest zablokowane.",
    };
  }

  // Check if hostname is a raw IPv4 address in a private subnet
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          error: "Blokada bezpieczeństwa Anti-SSRF: prywatne adresy IP nie mogą być skanowane.",
        };
      }
    }
  }

  // Check IPv6 loopback / link-local / unique-local
  if (hostname.includes(":")) {
    const cleanIpv6 = hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (
      cleanIpv6 === "::1" ||
      cleanIpv6 === "::" ||
      cleanIpv6.startsWith("fe80:") ||
      cleanIpv6.startsWith("fc") ||
      cleanIpv6.startsWith("fd")
    ) {
      return {
        valid: false,
        error: "Blokada bezpieczeństwa Anti-SSRF: prywatne adresy IPv6 są niedozwolone.",
      };
    }
  }

  // Ensure hostname has at least one dot (valid public domain)
  if (!hostname.includes(".")) {
    return {
      valid: false,
      error: "Podaj pełną nazwę domeny publicznej (np. twojafirma.pl).",
    };
  }

  return {
    valid: true,
    normalizedUrl: parsed.href,
    parsed,
  };
}

// Safe HTTP fetch with redirect validation & response size cap (default max 1.5 MB)
export async function safeFetchHtml(
  rawUrl: string,
  timeoutMs = 8000,
  maxBytes = 1572864
): Promise<{
  ok: boolean;
  status: number;
  finalUrl: string;
  responseTimeMs: number;
  redirectCount: number;
  redirectChain: string[];
  headers: Headers;
  htmlText: string;
  error?: string;
}> {
  const startTime = Date.now();
  let currentUrl = rawUrl;
  const redirectChain: string[] = [];
  const maxRedirects = 5;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const check = validateSafePublicUrl(currentUrl);
    if (!check.valid || !check.normalizedUrl) {
      return {
        ok: false,
        status: 0,
        finalUrl: currentUrl,
        responseTimeMs: Date.now() - startTime,
        redirectCount: redirectChain.length,
        redirectChain,
        headers: new Headers(),
        htmlText: "",
        error: check.error || "Blocked URL",
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(check.normalizedUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NovoPixAuditBot/2.0; +https://novopix.uk)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timer);

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get("location");
        if (loc && hop < maxRedirects) {
          const nextUrl = new URL(loc, check.normalizedUrl).href;
          redirectChain.push(`${res.status} -> ${nextUrl}`);
          currentUrl = nextUrl;
          continue;
        }
      }

      // Read body with size limit
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            receivedBytes += value.byteLength;
            if (receivedBytes > maxBytes) {
              await reader.cancel();
              break;
            }
            chunks.push(value);
          }
        }
      }

      const combined = Buffer.concat(chunks);
      const htmlText = combined.toString("utf-8");

      return {
        ok: res.ok,
        status: res.status,
        finalUrl: check.normalizedUrl,
        responseTimeMs: Date.now() - startTime,
        redirectCount: redirectChain.length,
        redirectChain,
        headers: res.headers,
        htmlText,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return {
        ok: false,
        status: 0,
        finalUrl: currentUrl,
        responseTimeMs: Date.now() - startTime,
        redirectCount: redirectChain.length,
        redirectChain,
        headers: new Headers(),
        htmlText: "",
        error: err?.name === "AbortError" ? "Przekroczono limit czasu połączenia (Timeout)" : err?.message || "Błąd połączenia HTTP",
      };
    }
  }

  return {
    ok: false,
    status: 310,
    finalUrl: currentUrl,
    responseTimeMs: Date.now() - startTime,
    redirectCount: redirectChain.length,
    redirectChain,
    headers: new Headers(),
    htmlText: "",
    error: "Zbyt wiele przekierowań (pętla przekierowań 301/302)",
  };
}

// --- 2. Server-Side Session Tokens & Rate Limiting ---
interface SessionRecord {
  token: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}

const activeSessions = new Map<string, SessionRecord>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function createAgencySession(ip = "local"): SessionRecord {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const record: SessionRecord = {
    token,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip,
  };
  activeSessions.set(token, record);
  return record;
}

export function isValidAgencySession(token?: string | null): boolean {
  if (!token) return false;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  const session = activeSessions.get(clean);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(clean);
    return false;
  }
  return true;
}

export function extractTokenFromReq(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const m = cookieHeader.match(/(?:^|;\s*)agency_session=([a-f0-9]{64})/);
    if (m) return m[1];
  }
  const customHeader = req.headers["x-agency-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

export function requireAgencyAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromReq(req);
  if (!isValidAgencySession(token)) {
    return res.status(401).json({
      error: "Brak autoryzacji agencji. Zaloguj się kodem PIN administratora, aby uzyskać dostęp do danych CRM.",
      code: "UNAUTHORIZED_CRM_ACCESS",
    });
  }
  next();
}

// Rate limiter for PIN brute-force & scan abuse protection
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = rateBuckets.get(key);
  if (!existing || now > existing.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  rateBuckets.delete(key);
}

// --- 3. Agency PIN: no built-in default, constant-time comparison ---
const WEAK_PINS = new Set(["2026", "1234", "0000", "1111", "123456", "password", "admin", "novopix"]);

export function isWeakPin(pin: string): boolean {
  const p = pin.trim().toLowerCase();
  return p.length < 10 || WEAK_PINS.has(p);
}

export function initAgencyPin(): void {
  const isProd = process.env.NODE_ENV === "production";
  const pin = String(process.env.AGENCY_PIN || "").trim();
  if (pin && !isWeakPin(pin)) return;
  if (isProd) {
    throw new Error("Production requires AGENCY_PIN (at least 10 characters, not a common value). Run: npm run setup");
  }
  process.env.AGENCY_PIN = crypto.randomBytes(8).toString("hex");
  console.log(`NovoPix local admin PIN (this run only): ${process.env.AGENCY_PIN}`);
}

export function getAgencyPin(): string {
  return String(process.env.AGENCY_PIN || "").trim();
}

export function pinsEqual(submitted: string, actual: string): boolean {
  if (!submitted || !actual) return false;
  const a = crypto.createHash("sha256").update(submitted).digest();
  const b = crypto.createHash("sha256").update(actual).digest();
  return crypto.timingSafeEqual(a, b);
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `agency_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 3600}${secure}`;
}

export function clearSessionCookie(): string {
  return "agency_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
}
