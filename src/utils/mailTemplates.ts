// Gotowe, edytowalne maile po skanie (PL i EN). Tylko prawdziwe dane z pomiaru; bez obietnic wyniku.
export type TemplateId = "company" | "school" | "shop" | "followup" | "offer";

export type TemplateCtx = { host: string; score: number | null; issues: string[]; lang: "pl" | "en"; offerLines?: string[] };

export const TEMPLATE_LABELS: Record<TemplateId, { pl: string; en: string }> = {
  company: { pl: "Firma: wynik skanu", en: "Business: scan result" },
  school: { pl: "Szkoła lub urząd: dostępność", en: "School or public body: accessibility" },
  shop: { pl: "Sklep internetowy", en: "Online shop" },
  followup: { pl: "Przypomnienie po raporcie", en: "Follow-up after the report" },
  offer: { pl: "Oferta z wyniku", en: "Offer based on the result" },
};

export function buildTemplate(id: TemplateId, c: TemplateCtx): { subject: string; body: string } {
  const pl = c.lang === "pl";
  const score = c.score !== null ? (pl ? `Wynik ogólny: ${c.score}/100.` : `Overall score: ${c.score}/100.`) : "";
  const top = c.issues.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join("\n");
  const issuesBlock = top ? `${pl ? "Najważniejsze rzeczy do sprawdzenia:" : "The most important things to check:"}\n${top}\n\n` : "";
  const sign = pl ? "Pozdrawiam,\nNovoPix UK" : "Kind regards,\nNovoPix UK";
  const hello = pl ? "Dzień dobry," : "Hello,";
  const subj = (a: string, b: string) => (pl ? a : b) + c.host;
  switch (id) {
    case "school":
      return {
        subject: subj("Wstępna analiza dostępności strony: ", "Preliminary accessibility check: "),
        body: pl
          ? `${hello}\n\nw załączniku wstępna analiza strony ${c.host}. ${score}\n\n${issuesBlock}Automat sprawdza tylko część wymagań. Klawiaturę, czytniki ekranu i treść trzeba sprawdzić ręcznie, a ten raport nie jest certyfikatem ani oceną zgodności z WCAG. Jeśli chcą Państwo, przygotuję zakres przeglądu dostępności i deklaracji dostępności.\n\n${sign}`
          : `${hello}\n\nattached is a preliminary check of ${c.host}. ${score}\n\n${issuesBlock}The automated check covers only part of the requirements. Keyboard use, screen readers and content have to be reviewed by hand, and this report is not a certificate or a WCAG conformance assessment. If you would like, I can prepare the scope of an accessibility review and an accessibility statement.\n\n${sign}`,
      };
    case "shop":
      return {
        subject: subj("Wynik skanu sklepu: ", "Scan result for your shop: "),
        body: pl
          ? `${hello}\n\nw załączniku wynik skanu ${c.host}. ${score}\n\n${issuesBlock}Przy sklepie najpierw warto sprawdzić szybkość strony na telefonie i dostępność formularzy. Mogę przygotować krótką propozycję zakresu i ceny.\n\n${sign}`
          : `${hello}\n\nattached is the scan result for ${c.host}. ${score}\n\n${issuesBlock}For a shop it is worth checking phone speed and form accessibility first. I can prepare a short proposal with scope and price.\n\n${sign}`,
      };
    case "followup":
      return {
        subject: subj("Czy raport był pomocny? ", "Was the report useful? "),
        body: pl
          ? `${hello}\n\nwysłałem Państwu raport dla ${c.host}. Chciałbym zapytać, czy wszystko jest jasne i czy mogę pomóc z którymś punktem. Wystarczy odpisać na tę wiadomość.\n\n${sign}`
          : `${hello}\n\nI sent you the report for ${c.host}. I wanted to ask whether everything is clear and whether I can help with any of the points. Simply reply to this e-mail.\n\n${sign}`,
      };
    case "offer":
      return {
        subject: subj("Propozycja zakresu i cen: ", "Proposed scope and prices: "),
        body: pl
          ? `${hello}\n\nna podstawie skanu ${c.host} proponuję:\n\n${(c.offerLines || []).join("\n")}\n\nCeny są netto (bez VAT). Dokładny zakres i cenę potwierdzamy na piśmie, zanim zaczniemy pracę. ${score}\n\n${sign}`
          : `${hello}\n\nbased on the scan of ${c.host} I suggest:\n\n${(c.offerLines || []).join("\n")}\n\nPrices are excluding VAT. We confirm the exact scope and price in writing before any work begins. ${score}\n\n${sign}`,
      };
    default:
      return {
        subject: subj("Wynik skanu strony: ", "Scan result for: "),
        body: pl
          ? `${hello}\n\nw załączniku wynik wstępnego skanu ${c.host}. ${score}\n\n${issuesBlock}To wstępna kontrola automatyczna, nie certyfikat ani gwarancja wyniku. Chętnie omówię, co warto poprawić najpierw.\n\n${sign}`
          : `${hello}\n\nattached is the preliminary scan of ${c.host}. ${score}\n\n${issuesBlock}This is a preliminary automated check, not a certificate or a guarantee of results. I am happy to talk through what to fix first.\n\n${sign}`,
      };
  }
}
