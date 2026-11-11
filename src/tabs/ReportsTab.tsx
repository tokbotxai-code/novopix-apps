import { Copy, Download, Lock, Printer, Send } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function ReportsTab({ app }: { app: AppState }) {
  const {
    auditorName,
    clientName,
    currency,
    currentPinInput,
    customOfferNote,
    handleDownloadHtmlReport,
    handleSaveAndCopyClientLink,
    includeQuoteInReport,
    isPolish,
    newPinInput,
    scopeSummary,
    setActiveTab,
    setAuditorName,
    setClientName,
    setCurrentPinInput,
    setCustomOfferNote,
    setIncludeQuoteInReport,
    setIsClientLinkLocked,
    setIsDefaultPinWarning,
    setNewPinInput,
    setViewMode,
    shareableClientUrl,
    showToast,
  } = app;
  return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Personalizacja Raportu White-Label (Twoja Marka)" : "White-Label Report Branding"}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isPolish ? "Przygotowano dla (Klient / Firma)" : "Prepared for (Client Name)"}
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isPolish ? "Nazwa Twojej Agencji / Audytora" : "Your Agency / Auditor Name"}
                      </label>
                      <input
                        type="text"
                        value={auditorName}
                        onChange={(e) => setAuditorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isPolish ? "Notatka Handlowa w Ofercie (warunki ustala agencja)" : "Offer Note (terms set by the agency)"}
                    </label>
                    <textarea
                      rows={2}
                      value={customOfferNote}
                      onChange={(e) => setCustomOfferNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeQuoteInReport}
                      onChange={(e) => setIncludeQuoteInReport(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>
                      {isPolish
                        ? `Dołącz kosztorys godzinowy (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency} netto) oraz wyliczenie ROI do raportu`
                        : `Include hourly quote (${scopeSummary.totalHours}h = ${scopeSummary.netPrice} ${currency}) & ROI table in exported report`}
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleDownloadHtmlReport}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isPolish ? "Pobierz Samowystarczalny Plik HTML dla Klienta" : "Download Standalone White-Label HTML"}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isPolish ? "Drukuj / Zapisz jako PDF" : "Print / Save as PDF"}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Interactive Shareable Client Link (Web-Report Link) */}
                <div className="bg-[#111A2E] text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {isPolish ? "Interaktywny Link do Pokoju Ofertowego Klienta" : "Interactive Shareable Client Deal Room Link"}
                    </div>
                    <h3 className="text-base font-extrabold">
                      {isPolish ? "Wyślij klientowi link, w którym jednym kliknięciem zaakceptuje wycenę" : "Send a direct interactive proposal link"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isPolish
                        ? "Link automatycznie uruchamia bezpieczny Pokój Ofertowy Klienta — ukrywa Twój CRM i instrukcje programistyczne „zrób to sam”, a wyświetla diagnozę strat, kosztorys oraz przycisk „Akceptuję Kosztorys i Zamawiam”."
                        : "This link launches the Client Deal Room—hiding internal CRM and DIY fixes while presenting your turnkey quote and a 1-click Accept button."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#16223A] border border-[#24375B] font-mono text-xs text-emerald-300 break-all">
                    {shareableClientUrl}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleSaveAndCopyClientLink}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{isPolish ? "Zapisz Snapshot 1:1 i Kopiuj Link Klienta" : "Save 1:1 Snapshot & Copy Client Link"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("client");
                        setIsClientLinkLocked(true);
                        setActiveTab("overview");
                        showToast(
                          isPolish
                            ? "Włączono zablokowany Pokój Klienta (Odblokowanie wymaga serwerowego kodu PIN)"
                            : "Switched to PIN-locked Client Deal Room (Server PIN required to unlock)"
                        );
                      }}
                      className="px-4 py-2.5 bg-[#1C2A47] hover:bg-[#25375D] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>{isPolish ? "Testuj Zablokowany Widok Klienta (PIN)" : "Test PIN-Locked Client View"}</span>
                    </button>
                  </div>

                  {/* Server-Side Agency PIN Change Form (Never Exposes Current PIN in DOM/JS) */}
                  <div className="pt-3 border-t border-[#1F2E4D] space-y-2">
                    <div className="text-[11px] text-slate-400">
                      {isPolish
                        ? "Zmiana serwerowego kodu PIN (zapis wyłącznie na serwerze w data/scanner-db.json — niewidoczny w kodzie przeglądarki):"
                        : "Change Server-Side Agency PIN (stored strictly on server in data/scanner-db.json):"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        maxLength={12}
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder={isPolish ? "Obecny PIN" : "Current PIN"}
                        className="w-28 px-2.5 py-1.5 bg-[#16223A] border border-[#2A3F68] rounded-lg text-xs font-mono text-white"
                      />
                      <input
                        type="password"
                        maxLength={12}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder={isPolish ? "Nowy PIN" : "New PIN"}
                        className="w-28 px-2.5 py-1.5 bg-[#16223A] border border-[#2A3F68] rounded-lg text-xs font-mono text-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/settings/change-pin", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ currentPin: currentPinInput, newPin: newPinInput }),
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setCurrentPinInput("");
                              setNewPinInput("");
                              setIsDefaultPinWarning(false);
                              showToast(isPolish ? "Zmieniono PIN na serwerze (data/scanner-db.json)!" : "Updated server PIN!");
                            } else {
                              showToast(data.error || (isPolish ? "Błędny obecny PIN" : "Invalid current PIN"));
                            }
                          } catch {}
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isPolish ? "Zapisz Nowy PIN" : "Update PIN"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
