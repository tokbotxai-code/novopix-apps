import test from "node:test";
import assert from "node:assert/strict";
import { suggestLanguage, langFromDomain, langFromHtmlLang, currencyForLang, effectiveLanguage } from "../language";
import { templateOffer, generateOffer, violatesLegalRules } from "../offers";
import { DEFAULT_PACKAGES, packageLabel, packagePrice } from "../packages";
import { localizeSnapshot } from "../scanSnapshot";
import type { AgencyClient, ScanSnapshot } from "../database";

const snap: ScanSnapshot = {
  scannedAt: "2026-11-12T10:00:00.000Z",
  url: "https://firma.pl",
  finalUrl: "https://firma.pl/",
  strategy: "mobile",
  measurementStatus: "partial_html",
  overallScore: null,
  categories: { performance: null, seo: 70, accessibility: null, bestPractices: 60 },
  cwv: [],
  issues: [{ title: "Brak danych strukturalnych Schema.org (application/ld+json)", description: "x", priority: "medium" }],
  htmlLang: "pl",
  i18n: { "Brak danych strukturalnych Schema.org (application/ld+json)": "No Schema.org structured data (application/ld+json)" },
};

const client = (over: Partial<AgencyClient> = {}): AgencyClient => ({
  id: "c1", name: "Anna", company: "Firma", email: "a@firma.pl", phone: "", website: "https://firma.pl", status: "scanned",
  contractValue: 1200, hourlyRate: 150, estimatedHours: 8, retainerFee: 300, addedAt: "2026-11-12T00:00:00Z", lastScore: 0, notes: "", lastScan: snap, ...over,
});

test("reguła 1: język formularza wygrywa z <html lang> i domeną", () => {
  assert.deepEqual(suggestLanguage({ formLang: "en", htmlLang: "pl", website: "https://firma.pl" }), { language: "en", source: "form" });
  assert.deepEqual(suggestLanguage({ formLang: "pl-PL", htmlLang: "en", website: "https://firma.com" }), { language: "pl", source: "form" });
});

test("reguła 2: <html lang> strony klienta, gdy brak języka formularza", () => {
  assert.deepEqual(suggestLanguage({ htmlLang: "pl-PL", website: "https://firma.com" }), { language: "pl", source: "html" });
  assert.deepEqual(suggestLanguage({ htmlLang: "en-GB", website: "https://firma.pl" }), { language: "en", source: "html" });
  assert.equal(suggestLanguage({ htmlLang: "de", website: "https://firma.pl" }).language, "en");
  // niepoprawny atrybut jest pomijany → decyduje domena
  assert.deepEqual(suggestLanguage({ htmlLang: "???", website: "https://firma.pl" }), { language: "pl", source: "tld" });
  assert.equal(langFromHtmlLang(null), null);
});

test("reguła 3: końcówka domeny (.pl → pl, inne → en)", () => {
  assert.deepEqual(suggestLanguage({ website: "https://www.firma.pl/oferta?x=1" }), { language: "pl", source: "tld" });
  assert.equal(langFromDomain("firma.com"), "en");
  assert.equal(langFromDomain("https://shop.co.uk"), "en");
  assert.equal(langFromDomain("firma.pl:8080/x"), "pl");
});

test("waluta wynika z języka oferty, stare rekordy bez pola = pl", () => {
  assert.equal(currencyForLang("pl"), "PLN");
  assert.equal(currencyForLang("en"), "GBP");
  assert.equal(effectiveLanguage({}), "pl");
  assert.equal(effectiveLanguage({ language: "en" }), "en");
});

test("przełącznik PL/EN: generateOffer (bez AI) odtwarza treść w wybranym języku i walucie", async () => {
  const pkg = DEFAULT_PACKAGES.find((p) => p.id === "pkg_standard")!;
  const pl = await generateOffer(client(), "pl", "PLN", pkg);
  const en = await generateOffer(client(), "en", "GBP", pkg);
  assert.equal(pl.generatedBy, "template");
  assert.match(pl.content.mailBody, /Dzień dobry/);
  assert.match(en.content.mailBody, /Hello/);
  assert.notEqual(pl.content.subject, en.content.subject);
  assert.equal(pl.priceNet, 5490);
  assert.equal(en.priceNet, 1290);
  assert.match(pl.content.mailBody.replace(/\s/g, " "), /5 490 zł netto/);
  assert.match(en.content.mailBody, /£1,290 net/);
  // tekst EN nie zawiera polskich diakrytyków (problemy skanu są tłumaczone z mapy i18n)
  const all = [en.content.subject, en.content.mailBody, ...en.content.offerSections.map((s) => s.body)].join("\n");
  assert.doesNotMatch(all, /[ąćęłńóśźż]/i);
  assert.match(all, /No Schema\.org structured data/);
  assert.equal(violatesLegalRules(all), null);
});

test("pakiety: domyślne ceny netto PL (PLN) i EN (GBP) zgodne z ustaleniami", () => {
  const price = (id: string) => {
    const p = DEFAULT_PACKAGES.find((x) => x.id === id)!;
    return [packagePrice(p, "pl").amount, packagePrice(p, "en").amount];
  };
  assert.deepEqual(price("pkg_template"), [590, 149]);
  assert.deepEqual(price("pkg_start"), [2490, 590]);
  assert.deepEqual(price("pkg_extended"), [9990, 2490]);
  assert.deepEqual(price("pkg_speed_sprint"), [1990, 490]);
  assert.deepEqual(price("pkg_a11y_audit"), [4990, 1200]);
  assert.deepEqual(price("pkg_webapp"), [9990, 2500]);
  assert.deepEqual(price("pkg_care_plus"), [799, 199]);
  assert.equal(packageLabel(DEFAULT_PACKAGES.find((p) => p.id === "pkg_care_basic")!, "en"), "£49 / month");
  assert.match(packageLabel(DEFAULT_PACKAGES.find((p) => p.id === "pkg_template")!, "pl"), /^od 590 zł$/);
});

test("localizeSnapshot tłumaczy teksty skanu tylko dla EN", () => {
  assert.equal(localizeSnapshot(snap, "pl").issues[0].title, snap.issues[0].title);
  assert.equal(localizeSnapshot(snap, "en").issues[0].title, "No Schema.org structured data (application/ld+json)");
  assert.match(templateOffer(client(), snap, "pl", "PLN", 1200, 8).mailBody, /Brak danych strukturalnych/);
});
