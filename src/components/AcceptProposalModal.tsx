import { AgencyClient, AuditReport } from "../scannerTypes";
import { Check, CheckCircle2, Phone, X } from "lucide-react";
import React, { useState } from "react";

export function AcceptProposalModal({
  isOpen,
  onClose,
  report,
  clientNameDefault,
  netPrice,
  grossPrice,
  totalHours,
  hourlyRate,
  retainerFee,
  currency,
  selectedTasks,
  isPolish,
  onAccepted,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  clientNameDefault: string;
  netPrice: number;
  grossPrice: number;
  totalHours: number;
  hourlyRate: number;
  retainerFee: number;
  currency: string;
  selectedTasks: string[];
  isPolish: boolean;
  onAccepted: (client: AgencyClient) => void;
}) {
  const [name, setName] = useState<string>("");
  const [company, setCompany] = useState<string>(clientNameDefault || "");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [includeRetainer, setIncludeRetainer] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetUrl = report.finalUrl || report.scannedUrl;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/crm/accept-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Klient",
          company: company.trim() || clientNameDefault,
          email: email.trim(),
          phone: phone.trim(),
          website: targetUrl,
          contractValue: netPrice,
          hourlyRate,
          estimatedHours: totalHours,
          retainerFee: includeRetainer ? retainerFee : 0,
          lastScore: report.overallScore,
          selectedTasks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.client) onAccepted(data.client);
        setDone(true);
      }
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="bg-emerald-950 text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            POTWIERDZENIE ZAMÓWIENIA WDROŻENIA
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-heading">
            {isPolish ? "Akceptacja Kosztorysu Optymalizacji" : "Proposal Acceptance & Order Confirmation"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            {targetUrl} · {totalHours} rbh · {netPrice} {currency} netto ({grossPrice} {currency} brutto)
          </p>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {isPolish ? "Dziękujemy! Oferta Została Zaakceptowana" : "Thank You! Proposal Accepted"}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isPolish
                  ? "Otrzymaliśmy Twoją akceptację. Zakres i cenę potwierdzimy z Tobą e-mailem, zanim zaczniemy pracę."
                  : "We received your acceptance. We will confirm scope and price with you by email before any work starts."}
              </p>
              <button
                onClick={() => {
                  setDone(false);
                  onClose();
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isPolish ? "Zamknij" : "Close"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{isPolish ? "Zaakceptowany zakres prac:" : "Accepted Engineering Scope:"}</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {selectedTasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Imię i Nazwisko" : "Full Name"}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Nazwa Firmy / NIP" : "Company Name"}</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Twoja Firma Sp. z o.o."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "E-mail do faktury / kontaktu" : "Email Address"}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="biuro@firma.pl"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Telefon kontaktowy" : "Phone Number"}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 600 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRetainer}
                  onChange={(e) => setIncludeRetainer(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>
                  {isPolish
                    ? `Dołącz stały monitoring 24/7 i comiesięczne raporty wyników (+${retainerFee} ${currency}/mc)`
                    : `Include 24/7 monitoring & score maintenance (+${retainerFee} ${currency}/mo)`}
                </span>
              </label>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700">
                  {isPolish ? "Razem netto:" : "Total Net:"} {netPrice} {currency}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? (isPolish ? "Zapisywanie..." : "Confirming...") : (isPolish ? "Potwierdzam i Zamawiam Wdrożenie" : "Confirm & Order Implementation")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
