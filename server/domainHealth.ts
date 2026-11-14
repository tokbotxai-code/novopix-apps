// Kontrola domeny i poczty: certyfikat SSL, rekordy SPF/DMARC/MX, popularne selektory DKIM i podstawowe nagłówki bezpieczeństwa.
// Tylko publicznie widoczne dane (DNS, certyfikat, nagłówki odpowiedzi); żadnych opinii prawnych.
import dns from "node:dns/promises";
import tls from "node:tls";
import { safeFetchHtml, validateSafePublicUrl } from "./security";
import type { DomainHealth, Presence } from "../src/utils/domainHealthTypes";

const DKIM_SELECTORS = ["google", "default", "selector1", "selector2", "k1", "k2", "mail", "s1", "s2", "dkim", "smtp", "mandrill"];
const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p.catch(() => fallback), new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

async function txt(name: string): Promise<string[] | null> {
  try {
    const r = await dns.resolveTxt(name);
    return r.map((x) => x.join(""));
  } catch (e: any) {
    return e?.code === "ENOTFOUND" || e?.code === "ENODATA" ? [] : null; // null = nie udało się sprawdzić
  }
}
async function hasMx(name: string): Promise<Presence> {
  try {
    const r = await dns.resolveMx(name);
    return r.length ? "found" : "not_found";
  } catch (e: any) {
    return e?.code === "ENOTFOUND" || e?.code === "ENODATA" ? "not_found" : "unknown";
  }
}

// Zabezpieczenie przed fałszywym „nie znaleźliśmy”: gdy resolver DNS serwera nie zwraca rekordów MX/TXT nawet dla znanej domeny, wynik to „nie udało się sprawdzić”.
let canary: { ok: boolean; at: number } | null = null;
async function dnsHealthy(): Promise<boolean> {
  if (canary && Date.now() - canary.at < 10 * 60 * 1000) return canary.ok;
  let ok = false;
  try {
    ok = (await withTimeout(dns.resolveMx("google.com"), 4000, [])).length > 0;
  } catch {}
  canary = { ok, at: Date.now() };
  return ok;
}

async function mailChecks(domain: string): Promise<DomainHealth["mail"]> {
  if (!(await dnsHealthy())) return { mx: "unknown", spf: "unknown", dmarc: "unknown", dmarcPolicy: null, dkim: "unknown" };
  const [mx, rootTxt, dmarcTxt] = await Promise.all([hasMx(domain), txt(domain), txt(`_dmarc.${domain}`)]);
  const spf: Presence = rootTxt === null ? "unknown" : rootTxt.some((t) => /^v=spf1\b/i.test(t)) ? "found" : "not_found";
  const dm = dmarcTxt === null ? null : dmarcTxt.find((t) => /^v=DMARC1\b/i.test(t)) || "";
  const dmarc: Presence = dmarcTxt === null ? "unknown" : dm ? "found" : "not_found";
  const policy = dm ? /\bp=([a-z]+)/i.exec(dm)?.[1]?.toLowerCase() || null : null;
  let dkim: Presence = "not_found";
  let unknownCount = 0;
  await Promise.all(
    DKIM_SELECTORS.map(async (sel) => {
      const name = `${sel}._domainkey.${domain}`;
      const t = await txt(name);
      if (t === null) unknownCount++;
      else if (t.length) dkim = "found";
      else {
        try {
          const c = await dns.resolveCname(name);
          if (c.length) dkim = "found";
        } catch {}
      }
    })
  );
  if (dkim === "not_found" && unknownCount === DKIM_SELECTORS.length) dkim = "unknown";
  return { mx, spf, dmarc, dmarcPolicy: policy, dkim };
}

function sslCheck(host: string): Promise<DomainHealth["ssl"]> {
  return withTimeout(
    new Promise<DomainHealth["ssl"]>((resolve) => {
      const socket = tls.connect({ host, port: 443, servername: host, timeout: 6000, rejectUnauthorized: false }, () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();
        if (!cert || !cert.valid_to) return resolve({ status: "unknown", daysLeft: null, validTo: null });
        const to = new Date(cert.valid_to);
        const daysLeft = Math.floor((to.getTime() - Date.now()) / 86400000);
        const status = !authorized || daysLeft < 0 ? "invalid" : daysLeft < 14 ? "expiring" : "ok";
        resolve({ status, daysLeft, validTo: to.toISOString().slice(0, 10) });
      });
      socket.on("error", () => resolve({ status: "unknown", daysLeft: null, validTo: null }));
      socket.on("timeout", () => {
        socket.destroy();
        resolve({ status: "unknown", daysLeft: null, validTo: null });
      });
    }),
    8000,
    { status: "unknown", daysLeft: null, validTo: null }
  );
}

const has = (h: Headers, n: string): Presence => (h.get(n) ? "found" : "not_found");

export async function checkDomainHealth(rawUrl: unknown): Promise<{ status: number; body: any }> {
  const v = validateSafePublicUrl(rawUrl);
  if (!v.valid || !v.parsed) return { status: 400, body: { error: v.error || "Invalid URL" } };
  const host = v.parsed.hostname.toLowerCase();
  const base = host.replace(/^www\./, "");

  const [ssl, page] = await Promise.all([
    sslCheck(host),
    withTimeout(safeFetchHtml(`https://${host}/`, 7000, 200000).catch(() => null), 9000, null),
  ]);
  let mailDomain = base;
  let mail = await withTimeout(mailChecks(mailDomain), 9000, { mx: "unknown", spf: "unknown", dmarc: "unknown", dmarcPolicy: null, dkim: "unknown" } as DomainHealth["mail"]);
  const labels = base.split(".");
  if (mail.mx === "not_found" && mail.spf === "not_found" && mail.dmarc === "not_found" && labels.length >= 3) {
    const parent = labels.slice(1).join(".");
    mailDomain = parent;
    mail = await withTimeout(mailChecks(parent), 9000, mail);
  }
  const h = page?.ok ? page.headers : null;
  const csp = h?.get("content-security-policy") || "";
  const result: DomainHealth = {
    host,
    mailDomain,
    checkedAt: new Date().toISOString(),
    ssl,
    mail,
    headers: {
      https: page ? /^https:/i.test(page.finalUrl) : null,
      hsts: h ? has(h, "strict-transport-security") : "unknown",
      contentTypeOptions: h ? has(h, "x-content-type-options") : "unknown",
      framing: h ? (h.get("x-frame-options") || /frame-ancestors/i.test(csp) ? "found" : "not_found") : "unknown",
      referrerPolicy: h ? has(h, "referrer-policy") : "unknown",
      csp: h ? (csp ? "found" : "not_found") : "unknown",
    },
  };
  return { status: 200, body: result };
}
