// Kontrola kontaktu na stronie głównej (analiza kodu HTML, bez uruchamiania przeglądarki).
// Automat może czegoś nie widzieć (kontakt ładowany skryptem, w obrazku albo na podstronie), więc wynik to „znaleźliśmy / nie znaleźliśmy”.
import { safeFetchHtml, validateSafePublicUrl } from "./security";
import type { ContactCheck } from "../src/utils/contactTypes";

const CONTACT_WORD = /(^|[^a-z])(kontakt|contact|zadzwo[ńn]|umów|umow|napisz|book\s+(a|now)|call\s+us|get\s+in\s+touch|zapytaj)/i;

export async function checkContact(rawUrl: unknown): Promise<{ status: number; body: any }> {
  const v = validateSafePublicUrl(rawUrl);
  if (!v.valid || !v.parsed) return { status: 400, body: { error: v.error || "Invalid URL" } };
  const host = v.parsed.hostname.toLowerCase();
  const home = await safeFetchHtml(`https://${host}/`, 7000, 1500000).catch(() => null);
  const base = { host, checkedAt: new Date().toISOString() };
  if (!home || !home.ok) return { status: 200, body: { ...base, ok: false, telLink: false, telPlainOnly: false, mailLink: false, form: false, contactLink: false, nearTop: null } satisfies ContactCheck };

  const html = home.htmlText.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const telRe = /href\s*=\s*["']\s*tel:/i;
  const mailRe = /href\s*=\s*["']\s*mailto:/i;
  const telLink = telRe.test(html);
  const mailLink = mailRe.test(html);
  const form = /<form\b[\s\S]*?(type\s*=\s*["']?email|<textarea)/i.test(html);
  let contactLink = false;
  const aRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let firstContactIdx = Infinity;
  while ((m = aRe.exec(html))) {
    if (CONTACT_WORD.test(m[2].replace(/<[^>]+>/g, " ")) || /\/(kontakt|contact)/i.test(m[1])) {
      contactLink = true;
      firstContactIdx = Math.min(firstContactIdx, m.index);
    }
  }
  const phoneInText = /(\+\s?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?){2,4}\d{2,4}/.test(text.replace(/\b(19|20)\d{2}\b/g, "")) && /(\+\d{1,3}[\s-]?\d|\b\d{3}[\s-]\d{3}[\s-]\d{3}\b|\b\d{2}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}\b|\b0\d{3,4}[\s-]?\d{3}[\s-]?\d{3,4}\b)/.test(text);
  const idx = [telLink ? html.search(telRe) : -1, mailLink ? html.search(mailRe) : -1, firstContactIdx === Infinity ? -1 : firstContactIdx].filter((i) => i >= 0);
  const nearTop = idx.length ? Math.min(...idx) < Math.max(4000, html.length * 0.15) : null;
  const body: ContactCheck = { ...base, ok: true, telLink, telPlainOnly: !telLink && phoneInText, mailLink, form, contactLink, nearTop };
  return { status: 200, body };
}
