import { AgencyClient, AuditReport } from "../scannerTypes";
import { CheckCircle2, Phone, Send, X } from "lucide-react";
import React, { useState } from "react";

export function QuoteModal({
  isOpen,
  onClose,
  report,
  isPolish,
  estimatedBudget,
  currency,
  isPublicMode = false,
  onLeadSaved,
  initialDetails = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  isPolish: boolean;
  estimatedBudget: number;
  currency: string;
  isPublicMode?: boolean;
  onLeadSaved?: (client: AgencyClient) => void;
  initialDetails?: string;
}) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && initialDetails) setDetails((d) => (d.trim() ? d : isPolish ? `Interesuje mnie: ${initialDetails}` : `I am interested in: ${initialDetails}`));
  }, [isOpen, initialDetails, isPolish]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetUrl = report.finalUrl || report.scannedUrl || "novopix.uk";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) return;
    if (!consent) {
      setErrorMsg(isPolish ? "Proszę zaznaczyć zgodę na kontakt." : "Please confirm the consent checkbox.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrorMsg(isPolish ? "Proszę podać poprawny adres e-mail." : "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: targetUrl,
          details: details.trim(),
          overallScore: report.overallScore,
          scores: report.categories,
          estimatedBudget,
          lang: isPolish ? "pl" : "en",
          scanId: report.scanId,
          hp: honeypot,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.client && onLeadSaved) {
          onLeadSaved(data.client);
        }
        setSubmitted(true);
      } else {
        throw new Error("API error");
      }
    } catch {
      const subject = encodeURIComponent(`NovoPix Audit Quote (${estimatedBudget} ${currency}) - ${targetUrl}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nWebsite: ${targetUrl}\nScore: ${report.overallScore}/100\nEstimated Quote: ${estimatedBudget} ${currency}\n\nDetails:\n${details}`
      );
      window.location.href = `mailto:contact@novopix.uk?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } finally {
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
        <div className="bg-[#111A2E] text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            NOVOPIX DIGITAL STUDIO
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-heading">
            {isPublicMode ? (isPolish ? "Poproś o wycenę napraw" : "Request a quote for the fixes") : isPolish ? "Zamów Kompleksowe Wdrożenie Audytu" : "Request Turnkey Audit Remediation"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isPublicMode
              ? isPolish
                ? `Zgłoszenie dla ${targetUrl}. Przygotujemy wycenę po przeglądzie wyników i odezwiemy się.`
                : `Request for ${targetUrl}. We will review the results, prepare a quote and get back to you.`
              : isPolish
              ? `Szacowany kosztorys dla ${targetUrl}: ${estimatedBudget} ${currency} netto (wstępna wycena do potwierdzenia).`
              : `Estimated turnkey quote for ${targetUrl}: ${estimatedBudget} ${currency} (preliminary quote, to be confirmed).`}
          </p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {isPublicMode ? (isPolish ? "Dziękujemy, zgłoszenie wysłane!" : "Thank you, request sent!") : isPolish ? "Zgłoszenie Zapisane w Systemie i CRM!" : "Lead Captured & Saved to CRM!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isPublicMode
                  ? isPolish
                    ? "Odezwiemy się na podany adres e-mail po przeglądzie wyników."
                    : "We will contact you at the e-mail address you provided after reviewing the results."
                  : isPolish
                  ? "Dane klienta wraz z wynikiem skanu i wyceną zostały automatycznie dodane do zakładki Panel Agencji (CRM)."
                  : "The prospect's details, audit score, and quote have been saved to your Agency CRM."}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                {isPolish ? "Gotowe" : "Done"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Imię lub firma" : "Name or company"}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isPolish ? "np. Jan Kowalski" : "e.g. Sarah Jenkins"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "E-mail (wymagany)" : "E-mail (required)"}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isPolish ? "kontakt@twojafirma.pl" : "name@company.com"}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Telefon (opcjonalnie)" : "Phone (optional)"}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 600 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Strona" : "Website"}</label>
                  <input type="text" value={targetUrl} readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isPolish ? "Czego potrzebujesz? (opcjonalnie)" : "What do you need? (optional)"}</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={isPolish ? "np. szybsza strona, nowa strona, dostępność" : "e.g. a faster site, a new site, accessibility"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-emerald-600"
                />
                <span className="text-[11px] text-slate-500">
                  {isPolish
                    ? "Wyrażam zgodę na kontakt w sprawie tego zapytania."
                    : "I agree to be contacted about this request."}{" "}
                  <a href={isPolish ? "https://novopix.uk/polityka/" : "https://novopix.uk/privacy/"} className="underline">{isPolish ? "Polityka prywatności" : "Privacy policy"}</a>
                </span>
              </label>

              {errorMsg && <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">{errorMsg}</div>}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{isPublicMode ? (isPolish ? "Odpowiadamy mailem." : "We reply by e-mail.") : isPolish ? "Zapis bezpośrednio do CRM" : "Direct CRM integration"}</span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (isPolish ? "Wysyłanie..." : "Sending...") : (isPublicMode ? (isPolish ? "Wyślij zapytanie" : "Send request") : isPolish ? "Wyślij i zapisz w CRM" : "Submit enquiry")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
