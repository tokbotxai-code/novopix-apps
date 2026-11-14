export interface ContactCheck {
  host: string;
  checkedAt: string;
  ok: boolean; // false = nie udało się pobrać strony
  telLink: boolean;
  telPlainOnly: boolean; // numer jest w tekście, ale bez linku tel:
  mailLink: boolean;
  form: boolean;
  contactLink: boolean;
  nearTop: boolean | null; // czy kontakt jest w pierwszej części kodu strony (nagłówek)
}
