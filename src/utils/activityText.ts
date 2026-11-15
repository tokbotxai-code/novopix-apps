// Wpisy historii CRM są zapisywane po polsku; w panelu EN pokazujemy je po angielsku (tylko wyświetlanie).
const MAP: Array<[RegExp, string]> = [
  [/Audyt techniczny domeny (.*?) wykazał wynik (\d+)\/100\..*/s, "Technical audit of $1 scored $2/100."],
  [/Klient wysłał formularz zapytania \(wynik: (.*?), budżet: (.*?)\)/, "Client submitted an enquiry form (score: $1, budget: $2)"],
  [/Utworzono kartę klienta w CRM \(wycena: (.*?) netto, (.*?) rbh\)/, "Client card created in CRM (quote: $1 net, $2 h)"],
  [/Zmiana etapu lejka: (.*)/, "Pipeline stage changed: $1"],
  [/Klient zaakceptował ofertę online \((.*?) netto, (.*?) rbh\)/, "Client accepted the offer online ($1 net, $2 h)"],
  [/Klient zaakceptował ofertę w Client Deal Room \((.*?) netto, (.*?) rbh\)/, "Client accepted the offer in the Client Deal Room ($1 net, $2 h)"],
  [/Dodano z listy leadów; skan: (.*?)\/100 \((.*?)\).*/s, "Added from the lead list; scan: $1/100 ($2)"],
  [/Domena dodana do monitoringu \(próg alertu < (.*?)\)/, "Domain added to monitoring (alert threshold < $1)"],
  [/Oferta oznaczona jako wysłana ręcznie \((.*?)\)/, "Offer marked as sent manually ($1)"],
  [/Oferta zatwierdzona przez: (.*?) \(język: (.*?)\)/, "Offer approved by: $1 (language: $2)"],
  [/Prośba o raport PDF ze skanera \((.*?), zgoda zapisana\) – czeka na zatwierdzenie.*/, "PDF report requested from the scanner ($1, consent recorded) – awaiting approval"],
  [/Raport PDF oznaczony jako wysłany ręcznie \((.*?)\)/, "PDF report marked as sent manually ($1)"],
  [/Raport PDF wysłany automatycznie na (.*)/, "PDF report sent automatically to $1"],
  [/Raport PDF wysłany na (.*?) \(zatwierdził: (.*?)\)/, "PDF report sent to $1 (approved by: $2)"],
  [/Raport przed\/po zatwierdzony przez: (.*?) \(język: (.*?)\)/, "Before/after report approved by: $1 (language: $2)"],
  [/Skan po wdrożeniu/, "Post-deployment scan"],
  [/Skan strony/, "Site scan"],
  [/Szkic oferty/, "Offer draft"],
  [/Wysłano ofertę e-mailem do (.*?) \(zatwierdził: (.*?)\)/, "Offer sent by e-mail to $1 (approved by: $2)"],
  [/Wysłano raport przed\/po e-mailem do (.*?) \(zatwierdził: (.*?)\)/, "Before/after report sent by e-mail to $1 (approved by: $2)"],
  [/Zmieniono język szkicu oferty na (.*)/, "Offer draft language changed to $1"],
  [/pomiar częściowy/g, "partial measurement"],
  [/brak/g, "n/a"],
];
export function localizeActivity(text: string, pl: boolean): string {
  if (pl || !text) return text;
  let out = text;
  for (const [re, to] of MAP) out = out.replace(re, to);
  return out;
}
