import React, { useEffect, useState } from "react";
import { Link2, Mail, Trash2 } from "lucide-react";
import type { AppState } from "../state/useAppState";
import { copyText } from "../utils/clipboard";

const POLICY_URL = "https://novopix.uk/privacy/";
const SHARES_KEY = "novopix_shares";

type Share = { id: string; path: string; deleteToken: string; expiresAt: string };

const readShares = (): Record<string, Share> => {
  try {
    return JSON.parse(localStorage.getItem(SHARES_KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const writeShares = (v: Record<string, Share>) => {
  try {
    localStorage.setItem(SHARES_KEY, JSON.stringify(v));
  } catch {}
};

// Lejek skanera publicznego: raport PDF na e-mail (zgoda, honeypot) oraz publiczny link do wyniku (/r/<id>).
export default function PublicFunnel({ app }: { app: AppState }) {
  const { currentReport, isPolish: pl, showToast } = app;
  const scanId = currentReport.scanId;
  const ok = !!scanId && (currentReport.measurementStatus === "live_lighthouse" || currentReport.measurementStatus === "partial_html");

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState<"report" | "share" | "del" | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [share, setShare] = useState<Share | null>(null);
  const [sentFor, setSentFor] = useState<string | null>(null);

  // Nowy skan = nowy formularz i nowy link.
  useEffect(() => {
    setMsg(null);
    setShare(null);
    setSentFor(null);
  }, [scanId]);

  if (!ok) return null;
  const submitted = sentFor === scanId;

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setMsg({ kind: "err", text: pl ? "Podaj poprawny adres e-mail." : "Please enter a valid email address." });
      return;
    }
    if (!consent) {
      setMsg({ kind: "err", text: pl ? "Zaznacz zgodę, aby otrzymać raport." : "Please tick the consent box to receive the report." });
      return;
    }
    setBusy("report");
    try {
      const res = await fetch("/api/report-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, email: email.trim(), consent: true, lang: pl ? "pl" : "en", hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSentFor(scanId!);
        setMsg({
          kind: "ok",
          text: data.autoSent
            ? pl ? "Raport PDF został wysłany na podany adres e-mail." : "The PDF report has been sent to the e-mail address provided."
            : pl ? "Zgłoszenie przyjęte. Raport PDF wyślemy na podany adres po zatwierdzeniu przez nasz zespół." : "Request received. We will send the PDF report to the address provided once our team has approved it.",
        });
      } else {
        setMsg({ kind: "err", text: data.error || (pl ? "Nie udało się wysłać zgłoszenia." : "Could not submit the request.") });
      }
    } catch {
      setMsg({ kind: "err", text: pl ? "Błąd połączenia z serwerem." : "Connection error." });
    } finally {
      setBusy(null);
    }
  };

  const createShare = async () => {
    setBusy("share");
    setMsg(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, lang: pl ? "pl" : "en" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        const s: Share = { id: data.id, path: data.path, deleteToken: data.deleteToken, expiresAt: data.expiresAt };
        setShare(s);
        writeShares({ ...readShares(), [s.id]: s });
      } else setMsg({ kind: "err", text: data.error || (pl ? "Nie udało się utworzyć linku." : "Could not create the link.") });
    } catch {
      setMsg({ kind: "err", text: pl ? "Błąd połączenia z serwerem." : "Connection error." });
    } finally {
      setBusy(null);
    }
  };

  const removeShare = async () => {
    if (!share) return;
    setBusy("del");
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(share.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: share.deleteToken }),
      });
      if (res.ok || res.status === 404) {
        const all = readShares();
        delete all[share.id];
        writeShares(all);
        setShare(null);
        setMsg({ kind: "ok", text: pl ? "Link został usunięty." : "The link has been deleted." });
      } else setMsg({ kind: "err", text: pl ? "Nie udało się usunąć linku." : "Could not delete the link." });
    } catch {
      setMsg({ kind: "err", text: pl ? "Błąd połączenia z serwerem." : "Connection error." });
    } finally {
      setBusy(null);
    }
  };

  const fullUrl = share ? `${window.location.origin}${share.path}` : "";
  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm";

  // „Chcesz, żebyśmy to naprawili?”: pakiety z cennika (ceny stałe, nie z godzin). EN w GBP, PL w PLN.
  const perf = currentReport.categories.performance;
  const acc = currentReport.categories.accessibility;
  const pricingUrl = pl ? "https://novopix.uk/pl/cennik/" : "https://novopix.uk/pricing/";
  const offer =
    typeof perf === "number" && perf < 90
      ? { text: pl ? "Speed Sprint od 1 990 zł" : "Speed Sprint from £490", cta: pl ? "Zobacz pakiet" : "See the package" }
      : typeof acc === "number" && acc < 95
      ? { text: pl ? "Przegląd dostępności od 1 590 zł" : "Accessibility review from £390", cta: pl ? "Zobacz pakiet" : "See the package" }
      : { text: "", cta: pl ? "Zobacz pakiety" : "See packages" };
  return (
    <>
    <section className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" data-testid="fix-cta">
      <div>
        <h3 className="text-base font-extrabold text-slate-900">{pl ? "Chcesz, żebyśmy to naprawili?" : "Want us to fix it?"}</h3>
        {offer.text && <p className="text-sm text-slate-700 mt-1" data-testid="fix-cta-offer">{pl ? "Przykładowy pakiet:" : "Example package:"} <strong>{offer.text}</strong></p>}
        <p className="text-[11px] text-slate-600 mt-1">{pl ? "Ceny netto, zakres potwierdzamy na piśmie przed rozpoczęciem pracy." : "Prices exclude VAT; we confirm the scope in writing before any work begins."}</p>
      </div>
      <a href={pricingUrl} target="_blank" rel="noopener" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold text-center whitespace-nowrap">{offer.cta}</a>
    </section>
    <section className="bg-white rounded-2xl p-6 border border-slate-200 space-y-5" data-testid="public-funnel" aria-label={pl ? "Raport i udostępnianie wyniku" : "Report and sharing"}>
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={submitReport} className="space-y-3" noValidate>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600" />
            {pl ? "Wyślij mi pełny raport PDF na e-mail" : "Send me the full PDF report by email"}
          </h3>
          {submitted ? (
            <p className="text-sm font-bold text-emerald-700" role="status">{msg?.text}</p>
          ) : (
            <>
              <label className="block text-xs font-bold text-slate-700">
                {pl ? "Adres e-mail" : "Email address"}
                <input type="email" inputMode="email" autoComplete="email" className={inputCls + " mt-1"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
              </label>
              {/* Honeypot: ukryte pole, które wypełniają tylko boty */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                </label>
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-700 leading-snug cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                <span>
                  {pl ? "Wyrażam zgodę na otrzymanie raportu PDF na podany adres e-mail oraz informacji o usługach NovoPix. " : "I agree to receive the PDF report at the e-mail address provided and information about NovoPix services. "}
                  <a href={POLICY_URL} target="_blank" rel="noopener noreferrer" className="underline font-bold">
                    {pl ? "Polityka prywatności" : "Privacy policy"}
                  </a>
                  .
                </span>
              </label>
              <button type="submit" disabled={busy === "report"} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">
                {busy === "report" ? (pl ? "Wysyłam…" : "Sending…") : pl ? "Wyślij raport PDF" : "Send PDF report"}
              </button>
            </>
          )}
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-600" />
            {pl ? "Publiczny link do wyniku" : "Public link to the result"}
          </h3>
          {!share ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pl
                  ? "Statyczna strona z wynikiem (bez danych osobowych, niewidoczna dla wyszukiwarek). Wygasa po 90 dniach, możesz ją usunąć w dowolnej chwili."
                  : "A static results page (no personal data, hidden from search engines). It expires after 90 days and you can delete it at any time."}
              </p>
              <button type="button" onClick={createShare} disabled={busy === "share"} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">
                {busy === "share" ? (pl ? "Tworzę…" : "Creating…") : pl ? "Utwórz link do wyniku" : "Create result link"}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <input readOnly className={inputCls + " font-mono text-xs"} value={fullUrl} aria-label={pl ? "Adres linku" : "Link address"} onFocus={(e) => e.currentTarget.select()} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => showToast((await copyText(fullUrl)) ? (pl ? "Link skopiowany." : "Link copied.") : pl ? "Nie udało się skopiować." : "Copy failed.")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {pl ? "Kopiuj link" : "Copy link"}
                </button>
                <a href={share.path} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold">
                  {pl ? "Otwórz" : "Open"}
                </a>
                <button type="button" onClick={removeShare} disabled={busy === "del"} className="px-3 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                  {pl ? "Usuń link" : "Delete link"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{pl ? "Wygasa" : "Expires"}: {new Date(share.expiresAt).toLocaleDateString(pl ? "pl-PL" : "en-GB")}</p>
            </div>
          )}
        </div>
      </div>
      {msg && !submitted && (
        <div role={msg.kind === "err" ? "alert" : "status"} className={`text-xs font-bold ${msg.kind === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {msg.text}
        </div>
      )}
    </section>
    </>
  );
}
