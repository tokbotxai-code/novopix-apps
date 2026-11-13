export interface VisualMark {
  kind: string; // id audytu Lighthouse, np. "color-contrast"
  title: string; // oryginalny tytuł audytu (angielski), rezerwowy opis
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface VisualData {
  image: string; // data URL zrzutu całej strony (telefon)
  width: number;
  height: number;
  marks: VisualMark[];
}

type L = [string, string, string, string]; // [tytuł PL, tytuł EN, wyjaśnienie PL, wyjaśnienie EN]
export const MARK_INFO: Record<string, L> = {
  "color-contrast": ["Niski kontrast tekstu", "Low text contrast", "Tekst jest trudny do odczytania dla osób słabowidzących.", "The text is hard to read for people with low vision."],
  "image-alt": ["Obraz bez opisu", "Image without description", "Czytnik ekranu nie wie, co przedstawia obraz.", "A screen reader does not know what the image shows."],
  "button-name": ["Przycisk bez nazwy", "Button without a name", "Czytnik ekranu nie wie, co robi przycisk.", "A screen reader does not know what the button does."],
  "link-name": ["Link bez nazwy", "Link without a name", "Czytnik ekranu nie wie, dokąd prowadzi link.", "A screen reader does not know where the link goes."],
  label: ["Pole formularza bez etykiety", "Form field without a label", "Nie wiadomo, co wpisać w pole.", "It is not clear what to enter in the field."],
  "target-size": ["Za mały obszar kliknięcia", "Tap target too small", "Trudno trafić palcem w ten element.", "It is hard to hit this element with a finger."],
  "frame-title": ["Ramka bez tytułu", "Frame without a title", "Czytnik ekranu nie opisze zawartości ramki.", "A screen reader cannot describe the frame."],
  "select-name": ["Lista wyboru bez nazwy", "Dropdown without a name", "Nie wiadomo, czego dotyczy lista.", "It is not clear what the list is for."],
  "input-image-alt": ["Przycisk-obraz bez opisu", "Image button without description", "Czytnik ekranu nie wie, co robi przycisk.", "A screen reader does not know what the button does."],
};
