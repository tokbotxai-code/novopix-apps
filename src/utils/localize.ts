// Serwer generuje część tekstów skanu po polsku i dołącza mapę `i18n` (tekst PL → tekst EN).
// Dzięki niej interfejs może zmienić język także po wykonaniu skanu, bez ponownego pomiaru.
export function localizeDeep<T>(value: T, map: Record<string, string> | undefined, toEnglish: boolean): T {
  if (!toEnglish || !map) return value;
  const walk = (v: any): any => {
    if (typeof v === "string") return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const k of Object.keys(v)) out[k] = k === "i18n" ? v[k] : walk(v[k]);
      return out;
    }
    return v;
  };
  return walk(value);
}
