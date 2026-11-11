import { GoogleGenAI, Type } from "@google/genai";
import type { AgencyClient, OfferDraft, ScanSnapshot } from "./database";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { "User-Agent": "aistudio-build" } } })
  : null;

// Reguły prawne (jak w AI Advisor): bez gwarancji wyniku, bez obietnic przychodów/ROI, bez „certyfikacji WCAG”.
const FORBIDDEN = [
  /gwarancj/i,
  /gwarantuj/i,
  /guarante/i,
  /certyfikacj\w*\s+WCAG/i,
  /WCAG\s+certif/i,
  /certified/i,
  /zwrot z inwestycji/i,
  /\bROI\b/i,
  /\d+\s?%\s*(wi[eę]cej|wzrost|więcej sprzeda|konwersj)/i,
  /(increase|boost|grow)\w*\s+(your\s+)?(sales|revenue|conversions?)\s+by/i,
];

// Zdania z zaprzeczeniem („nie gwarantujemy…”, „bez gwarancji…”, „not a certificate”) są dozwolone – to zastrzeżenia.
const NEGATION = /\b(nie|bez)\b|\b(not|no|never|without)\b/i;

export function violatesLegalRules(text: string): string | null {
  const sentences = text.split(/[.!?\n]+/);
  for (const sentence of sentences) {
    if (NEGATION.test(sentence)) continue;
    for (const re of FORBIDDEN) if (re.test(sentence)) return re.source;
  }
  return null;
}

const fmt = (v: number | null | undefined) => (typeof v === "number" ? `${v}/100` : null);

function measuredLines(s: ScanSnapshot | undefined, pl: boolean): string[] {
  if (!s) return [];
  const out: string[] = [];
  const kind =
    s.measurementStatus === "live_lighthouse"
      ? pl ? "pełny pomiar Google Lighthouse" : "full Google Lighthouse measurement"
      : pl ? "pomiar częściowy (HTML/HTTP, bez Lighthouse)" : "partial measurement (HTML/HTTP, no Lighthouse)";
  out.push(pl ? `Rodzaj pomiaru: ${kind}` : `Measurement type: ${kind}`);
  if (fmt(s.overallScore)) out.push(pl ? `Wynik ogólny: ${fmt(s.overallScore)}` : `Overall: ${fmt(s.overallScore)}`);
  const c = s.categories;
  const cat: string[] = [];
  if (fmt(c.performance)) cat.push(`${pl ? "Wydajność" : "Performance"} ${fmt(c.performance)}`);
  if (fmt(c.seo)) cat.push(`SEO ${fmt(c.seo)}`);
  if (fmt(c.accessibility)) cat.push(`${pl ? "Dostępność" : "Accessibility"} ${fmt(c.accessibility)}`);
  if (fmt(c.bestPractices)) cat.push(`${pl ? "Dobre praktyki" : "Best practices"} ${fmt(c.bestPractices)}`);
  if (cat.length) out.push(cat.join(", "));
  if (c.accessibility === null) out.push(pl ? "Dostępność: brak pomiaru (wymaga Lighthouse)" : "Accessibility: not measured (requires Lighthouse)");
  return out;
}

export interface OfferContent {
  subject: string;
  mailBody: string;
  offerTitle: string;
  offerSections: Array<{ heading: string; body: string }>;
}

export function templateOffer(client: AgencyClient, snap: ScanSnapshot | undefined, lang: "pl" | "en", currency: string, priceNet: number, hours: number): OfferContent {
  const pl = lang === "pl";
  const site = snap?.finalUrl || client.website;
  const host = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const lines = measuredLines(snap, pl);
  const top = (snap?.issues || []).slice(0, 5);
  const greeting = pl ? (client.name && !/^klient/i.test(client.name) ? `Dzień dobry ${client.name},` : "Dzień dobry,") : client.name && !/^client/i.test(client.name) ? `Hello ${client.name},` : "Hello,";
  const issueBlock = top.length
    ? top.map((i, n) => `${n + 1}. ${i.title}`).join("\n")
    : pl ? "(brak zmierzonych problemów w ostatnim skanie)" : "(no issues recorded in the latest scan)";
  const disclaimer = pl
    ? "Wyniki pochodzą ze wstępnej kontroli automatycznej i nie stanowią certyfikatu ani gwarancji wyniku."
    : "Results come from a preliminary automated check and are not a certificate or a guarantee of any outcome.";
  const price = pl
    ? `Szacowany zakres: ok. ${hours} roboczogodzin, wycena ${priceNet} ${currency} netto (do uzgodnienia po analizie).`
    : `Estimated scope: about ${hours} working hours, quoted at ${priceNet} ${currency} net (to be confirmed after review).`;
  const subject = pl ? `Wstępna kontrola techniczna strony ${host}` : `Preliminary technical check of ${host}`;
  const mailBody = pl
    ? `${greeting}\n\nwykonaliśmy wstępną, automatyczną kontrolę techniczną strony ${host}.\n\n${lines.join("\n")}\n\nNajważniejsze zauważone kwestie:\n${issueBlock}\n\nPrzygotowaliśmy propozycję prac naprawczych. ${price} Raport pomiarowy przed i po wdrożeniu dołączymy do realizacji.\n\n${disclaimer}\n\nJeśli temat jest dla Państwa interesujący, odpowiedz na tę wiadomość – umówimy krótką rozmowę. Jeśli nie chcą Państwo otrzymywać od nas wiadomości, wystarczy odpowiedzieć „rezygnuję”.\n\nPozdrawiamy\nZespół NovoPix\ncontact@novopix.uk · novopix.uk`
    : `${greeting}\n\nwe ran a preliminary automated technical check of ${host}.\n\n${lines.join("\n")}\n\nMain findings:\n${issueBlock}\n\nWe have prepared a proposal for remediation work. ${price} A before/after measurement report is part of delivery.\n\n${disclaimer}\n\nIf this is of interest, simply reply and we will arrange a short call. If you would rather not hear from us, reply "unsubscribe".\n\nBest regards\nNovoPix team\ncontact@novopix.uk · novopix.uk`;
  const sections = [
    { heading: pl ? "Stan obecny (pomiar)" : "Current state (measured)", body: lines.join("\n") || (pl ? "Brak pomiaru – wykonaj skan." : "No measurement – run a scan.") },
    { heading: pl ? "Zauważone problemy" : "Findings", body: issueBlock },
    {
      heading: pl ? "Proponowany zakres prac" : "Proposed scope",
      body: pl
        ? `Naprawa zauważonych problemów technicznych (wydajność, SEO, dostępność, dobre praktyki) oraz raport pomiarowy przed i po wdrożeniu. Celujemy w poprawę wskaźników; nie gwarantujemy konkretnego wyniku.\n${price}`
        : `Remediation of the observed technical issues (performance, SEO, accessibility, best practices) plus a before/after measurement report. We aim to improve the metrics; no specific result is guaranteed.\n${price}`,
    },
    { heading: pl ? "Zastrzeżenie" : "Disclaimer", body: disclaimer },
  ];
  return { subject, mailBody, offerTitle: pl ? `Oferta: poprawa techniczna strony ${host}` : `Proposal: technical improvements for ${host}`, offerSections: sections };
}

async function aiOffer(client: AgencyClient, snap: ScanSnapshot, lang: "pl" | "en", currency: string, priceNet: number, hours: number): Promise<OfferContent | null> {
  if (!ai) return null;
  const pl = lang === "pl";
  const prompt = `You are drafting a commercial offer and a short outreach email for NovoPix Digital Studio (web performance & technical SEO). A human will review and approve it before anything is sent.
STRICT LEGAL & ETHICAL RULES:
1. NEVER promise guaranteed revenue, ROI, conversion lift or any percentage uplift. You may say faster sites typically lose fewer visitors.
2. NEVER promise a guaranteed score ("gwarancja wyniku 90+"). Say "celujemy w poprawę wskaźników i raportujemy zmiany przed i po wdrożeniu" / "we aim to improve the metrics and report before/after".
3. NEVER use "WCAG certification" ("certyfikacja WCAG"). Say "audyt i poprawki zgodne z kryteriami WCAG 2.1 AA" if accessibility is relevant.
4. Use ONLY the measured facts below. If a value is null/missing say it was not measured. Do not invent numbers, client names, case studies or deadlines.
5. State that results come from a preliminary automated check, not a certificate.
6. The email must be short (max ~170 words), polite, include an opt-out sentence, and sign as "${pl ? "Zespół NovoPix" : "NovoPix team"}".
Language: ${pl ? "Polish (Polski), correct diacritics" : "English"}
Client contact: ${client.name} (${client.company})
Website: ${snap.finalUrl}
Measurement type: ${snap.measurementStatus}
Overall: ${snap.overallScore}; Categories: ${JSON.stringify(snap.categories)}
Core Web Vitals: ${JSON.stringify(snap.cwv)}
Issues: ${JSON.stringify(snap.issues.slice(0, 8))}
Quote: ${hours} working hours, ${priceNet} ${currency} net.
Return JSON: subject, mailBody, offerTitle, offerSections (3-5 sections with heading and body: current state, findings, proposed scope with the quote, disclaimer).`;
  try {
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            mailBody: { type: Type.STRING },
            offerTitle: { type: Type.STRING },
            offerSections: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["heading", "body"] },
            },
          },
          required: ["subject", "mailBody", "offerTitle", "offerSections"],
        },
      },
    });
    const parsed = JSON.parse((r.text ?? "{}").trim());
    if (!parsed.subject || !parsed.mailBody || !Array.isArray(parsed.offerSections) || !parsed.offerSections.length) return null;
    const all = [parsed.subject, parsed.mailBody, parsed.offerTitle, ...parsed.offerSections.map((s: any) => `${s.heading} ${s.body}`)].join("\n");
    if (violatesLegalRules(all)) return null;
    return {
      subject: String(parsed.subject).slice(0, 200),
      mailBody: String(parsed.mailBody).slice(0, 4000),
      offerTitle: String(parsed.offerTitle || "").slice(0, 200),
      offerSections: parsed.offerSections.slice(0, 6).map((s: any) => ({ heading: String(s.heading).slice(0, 120), body: String(s.body).slice(0, 2500) })),
    };
  } catch (e: any) {
    console.warn("Offer AI fallback used:", e?.message);
    return null;
  }
}

export async function generateOffer(client: AgencyClient, lang: "pl" | "en", currency: "PLN" | "EUR" | "GBP"): Promise<{ content: OfferContent; generatedBy: "ai" | "template"; priceNet: number; hours: number }> {
  const hours = client.estimatedHours || 8;
  const priceNet = client.contractValue || hours * (client.hourlyRate || 150);
  const snap = client.lastScan;
  const fromAi = snap ? await aiOffer(client, snap, lang, currency, priceNet, hours) : null;
  if (fromAi) return { content: fromAi, generatedBy: "ai", priceNet, hours };
  return { content: templateOffer(client, snap, lang, currency, priceNet, hours), generatedBy: "template", priceNet, hours };
}

export function offerToPlainText(o: OfferDraft, client: AgencyClient): string {
  const head = `${o.offerTitle}\n${client.company} · ${client.website}\n`;
  return `${head}\n${o.offerSections.map((s) => `${s.heading}\n${s.body}`).join("\n\n")}\n`;
}
