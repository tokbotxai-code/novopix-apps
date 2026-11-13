// Kontrola obecności deklaracji dostępności: tylko „znaleźliśmy / nie znaleźliśmy” elementów, bez oceny prawnej ani zgodności.
import { safeFetchHtml, validateSafePublicUrl } from "./security";
import type { StatementCheck } from "../src/utils/statementTypes";
import type { Presence } from "../src/utils/domainHealthTypes";

const LINK_TEXT = /deklaracj\w*\s+dost[eę]pno|accessibility\s+statement|statement\s+of\s+accessibility|declaraci[oó]n\s+de\s+accesibilidad/i;
const LINK_HREF = /deklaracja[-_]?dostepnosci|accessib|dostepnosc/i;
const STATEMENT_PHRASE = /accessibility\s+statement|statement\s+of\s+accessibility|deklaracj\w*\s+dost[eę]pno/i;
const COMMON_PATHS = ["/deklaracja-dostepnosci", "/deklaracja-dostepnosci/", "/dostepnosc", "/accessibility", "/accessibility-statement", "/accessibility.html", "/accessibility-statement.html", "/deklaracja-dostepnosci.html"];

const P = (re: RegExp, t: string): Presence => (re.test(t) ? "found" : "not_found");

// Strona jest deklaracją, gdy tytuł lub nagłówek mówi „deklaracja dostępności / accessibility statement”, albo (tytuł o dostępności) treść opisuje zgodność tej strony.
function looksLikeStatement(html: string): boolean {
  const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "") + " " + (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || "").replace(/<[^>]+>/g, " ");
  if (STATEMENT_PHRASE.test(title)) return true;
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return /accessib|dost[eę]pno/i.test(title) && /(this|our)\s+(website|site|service)[^.]{0,100}(compliant|accessible)|niniejsza\s+deklaracja|ta\s+strona[^.]{0,80}(zgodn|dost[eę]pn)/i.test(text);
}

function findLink(html: string, base: URL): string | null {
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = m[2].replace(/<[^>]+>/g, " ");
    if (LINK_TEXT.test(text) || LINK_HREF.test(m[1])) {
      try {
        const u = new URL(m[1], base);
        if (/^https?:$/.test(u.protocol)) return u.href;
      } catch {}
    }
  }
  return null;
}

export async function checkAccessibilityStatement(rawUrl: unknown): Promise<{ status: number; body: any }> {
  const v = validateSafePublicUrl(rawUrl);
  if (!v.valid || !v.parsed) return { status: 400, body: { error: v.error || "Invalid URL" } };
  const host = v.parsed.hostname.toLowerCase();
  const home = await safeFetchHtml(`https://${host}/`, 7000, 1200000).catch(() => null);
  const empty = { host, checkedAt: new Date().toISOString(), url: null, elements: { date: "unknown", contact: "unknown", compliance: "unknown", nonAccessible: "unknown", complaint: "unknown", wcag: "unknown" } } as const;
  if (!home || !home.ok) return { status: 200, body: { ...empty, found: null } satisfies StatementCheck };

  const base = new URL(home.finalUrl || `https://${host}/`);
  let target = findLink(home.htmlText, base);
  let page = target ? await safeFetchHtml(target, 7000, 800000).catch(() => null) : null;
  if (page?.ok && !looksLikeStatement(page.htmlText) && !/\.pdf(\?|$)/i.test(target || "")) {
    target = null;
    page = null;
  }
  if (!target || !page?.ok) {
    target = null;
    page = null;
    for (const path of COMMON_PATHS) {
      const u = new URL(path, base).href;
      const r = await safeFetchHtml(u, 5000, 800000).catch(() => null);
      if (r?.ok && r.status === 200 && looksLikeStatement(r.htmlText)) {
        target = r.finalUrl || u;
        page = r;
        break;
      }
    }
  }
  if (!target || !page) return { status: 200, body: { ...empty, found: false } satisfies StatementCheck };

  const text = page.htmlText.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const html = page.htmlText;
  const body: StatementCheck = {
    host,
    checkedAt: new Date().toISOString(),
    found: true,
    url: target,
    elements: {
      date: P(/(sporz[aą]dz|opublikowan|aktualizac|przegl[aą]d|prepared|published|reviewed|updated|last)[^.]{0,80}(\b20\d\d\b|\d{1,2}[./-]\d{1,2}[./-]20\d\d)|\b20\d\d-\d\d-\d\d\b/i, text),
      contact: /mailto:|tel:/i.test(html) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /\b(contact|kontakt|telefon|phone|e-mail|email)\b/i.test(text) ? "found" : "not_found",
      compliance: P(/(fully|partially|not)\s+compliant|w\s+pe[lł]ni\s+zgodn|cz[eę][sś]ciowo\s+zgodn|niezgodn/i, text),
      nonAccessible: P(/not\s+accessible|inaccessible|niedost[eę]pn|wy[lł][aą]czen|exemption|disproportionate/i, text),
      complaint: P(/enforcement\s+procedure|equality\s+advisory|eass|complain|skarg|rzecznik|wniosek\s+o\s+zapewnienie\s+dost[eę]pno/i, text),
      wcag: P(/\bWCAG\b/i, text),
    },
  };
  return { status: 200, body };
}
