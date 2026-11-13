// Czy pokazać ekran logowania panelu (agencja bez sesji PIN, nie tryb publiczny, nie link klienta).
export function shouldShowLogin(o: { isPublicMode: boolean; agencyToken: string | null; viewMode: "agency" | "client"; clientView: boolean }): boolean {
  return !o.isPublicMode && !o.agencyToken && o.viewMode === "agency" && !o.clientView;
}
