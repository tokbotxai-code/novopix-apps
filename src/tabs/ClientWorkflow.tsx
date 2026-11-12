import React, { useEffect, useState } from "react";
import { Copy, Download, FileText, Mail, Search, Send, ShieldCheck, Sparkles, Bell, CheckCircle2, AlertTriangle, GitCompare } from "lucide-react";
import { AgencyCtx, Comparison, OfferDraft, STAGES, ScanSnapshot, ServicePackage, packageLabel, stageLabel } from "../agencyTypes";
import type { AgencyClient, MonitoredDomain } from "../scannerTypes";
import { api, copyText, downloadFile } from "./agencyApi";

interface Props {
  ctx: AgencyCtx;
  client: AgencyClient;
  monitored: MonitoredDomain | undefined;
  onClientUpdated: (c: AgencyClient) => void;
  onMonitoringAdded: (d: MonitoredDomain) => void;
}

const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs";
const btnCls = "px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const nm = (v: number | null, pl: boolean) => (v === null || v === undefined ? (pl ? "brak pomiaru" : "not measured") : `${v}/100`);

function ScanSummary({ s, pl }: { s: ScanSnapshot; pl: boolean }) {
  const cats: Array<[string, number | null]> = [
    [pl ? "Ogólny" : "Overall", s.overallScore],
    [pl ? "Wydajność" : "Performance", s.categories.performance],
    ["SEO", s.categories.seo],
    [pl ? "Dostępność" : "Accessibility", s.categories.accessibility],
    [pl ? "Dobre praktyki" : "Best practices", s.categories.bestPractices],
  ];
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-slate-500">
        {new Date(s.scannedAt).toLocaleString(pl ? "pl-PL" : "en-GB")} ·{" "}
        {s.measurementStatus === "live_lighthouse"
          ? pl ? "pełny pomiar Lighthouse" : "full Lighthouse measurement"
          : pl ? "pomiar częściowy (HTML/HTTP) – bez Lighthouse" : "partial measurement (HTML/HTTP) – no Lighthouse"}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cats.map(([k, v]) => (
          <div key={k} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <div className="text-[10px] text-slate-500">{k}</div>
            <div className={`text-xs font-mono font-extrabold tabular-nums ${v === null ? "text-amber-700" : "text-slate-900"}`}>{nm(v, pl)}</div>
          </div>
        ))}
      </div>
      {s.issues.length > 0 && (
        <ul className="text-[11px] text-slate-700 list-disc pl-5 space-y-0.5">
          {s.issues.slice(0, 5).map((i, n) => (
            <li key={n}>{i.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OfferCard({ ctx, offer, client, smtp, onChanged, onClientUpdated }: { ctx: AgencyCtx; offer: OfferDraft; client: AgencyClient; smtp: boolean; onChanged: (o: OfferDraft) => void; onClientUpdated: (c: AgencyClient) => void }) {
  const pl = ctx.isPolish;
  const [o, setO] = useState<OfferDraft>(offer);
  const [reviewer, setReviewer] = useState<string>(() => {
    try {
      return localStorage.getItem("novopix_reviewer") || "";
    } catch {
      return "";
    }
  });
  const [to, setTo] = useState<string>(client.email || "");
  const validTo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to.trim());
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setO(offer);
    setDirty(false);
  }, [offer.id, offer.updatedAt, offer.status, offer.sentAt]);

  const approved = o.status === "approved";
  const edit = (patch: Partial<OfferDraft>) => {
    setO({ ...o, ...patch });
    setDirty(true);
  };

  const switchLanguage = async (next: "pl" | "en", cur?: "PLN" | "GBP") => {
    if (next === o.language && (!cur || cur === o.currency)) return;
    const warn = pl
      ? `Zmiana języka na ${next.toUpperCase()} wygeneruje treść oferty i maila od nowa (waluta: ${next === "pl" ? "PLN" : "GBP"}). Twoje ręczne zmiany w tekście zostaną zastąpione, a oferta wróci do szkicu. Kontynuować?`
      : `Switching to ${next.toUpperCase()} regenerates the offer and email text (currency: ${next === "pl" ? "PLN" : "GBP"}). Your manual text edits will be replaced and the offer goes back to draft. Continue?`;
    if ((dirty || approved) && !window.confirm(warn)) return;
    setBusy("lang");
    const r = await api<any>(ctx, `/api/offers/${o.id}/language`, { method: "POST", body: { language: next, currency: cur || (next === o.language ? o.currency : undefined) } });
    setBusy(null);
    if (r.ok) {
      onChanged(r.data.offer);
      setO(r.data.offer);
      setDirty(false);
      setMsg({ kind: "ok", text: pl ? `Treść wygenerowana ponownie w języku ${next.toUpperCase()}.` : `Text regenerated in ${next.toUpperCase()}.` });
    } else setMsg({ kind: "err", text: r.data.error || "Error" });
  };

  const save = async (): Promise<boolean> => {
    setBusy("save");
    const r = await api<any>(ctx, `/api/offers/${o.id}`, { method: "PUT", body: { subject: o.subject, mailBody: o.mailBody, offerTitle: o.offerTitle, offerSections: o.offerSections, priceNet: o.priceNet, currency: o.currency } });
    setBusy(null);
    if (r.ok) {
      onChanged(r.data.offer);
      setMsg({ kind: "ok", text: pl ? "Zapisano zmiany." : "Changes saved." });
      return true;
    }
    setMsg({ kind: "err", text: r.data.error || "Error" });
    return false;
  };

  const approve = async () => {
    if (dirty && !(await save())) return;
    setBusy("approve");
    const r = await api<any>(ctx, `/api/offers/${o.id}/approve`, { method: "POST", body: { reviewer } });
    setBusy(null);
    if (r.ok) {
      try {
        localStorage.setItem("novopix_reviewer", reviewer);
      } catch {}
      onChanged(r.data.offer);
      if (r.data.client) onClientUpdated(r.data.client);
      setMsg({ kind: "ok", text: pl ? `Zatwierdzone przez ${reviewer}.` : `Approved by ${reviewer}.` });
    } else setMsg({ kind: "err", text: r.data.error || "Error" });
  };

  const send = async () => {
    setBusy("send");
    const r = await api<any>(ctx, `/api/offers/${o.id}/send`, { method: "POST", body: { to } });
    setBusy(null);
    if (r.ok) {
      onChanged(r.data.offer);
      if (r.data.client) onClientUpdated(r.data.client);
      setMsg({ kind: "ok", text: pl ? `Wysłano do ${to}.` : `Sent to ${to}.` });
    } else setMsg({ kind: "err", text: r.data.error || "Error" });
  };

  const markSent = async () => {
    setBusy("mark");
    const r = await api<any>(ctx, `/api/offers/${o.id}/mark-sent`, { method: "POST", body: { to } });
    setBusy(null);
    if (r.ok) {
      onChanged(r.data.offer);
      if (r.data.client) onClientUpdated(r.data.client);
      setMsg({ kind: "ok", text: pl ? "Oznaczono jako wysłane ręcznie." : "Marked as sent manually." });
    } else setMsg({ kind: "err", text: r.data.error || "Error" });
  };

  const copy = async () => {
    const ok = await copyText(`${pl ? "Temat" : "Subject"}: ${o.subject}\n\n${o.mailBody}`);
    setMsg({ kind: ok ? "ok" : "err", text: ok ? (pl ? "Skopiowano temat i treść maila." : "Subject and body copied.") : pl ? "Nie udało się skopiować." : "Copy failed." });
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white" data-testid="offer-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-2">
          <span data-testid="offer-language-badge" className="px-2 py-0.5 rounded-md bg-slate-900 text-white">{pl ? "Język oferty" : "Offer language"}: {o.language.toUpperCase()}</span>
          <span>{o.priceNet} {o.currency} {pl ? "netto" : "net"}</span>
          {o.packageName && <span className="font-normal text-slate-600">{pl ? "pakiet" : "package"}: {o.packageName}</span>}
          <span className="text-[10px] font-normal text-slate-500">{o.generatedBy === "ai" ? (pl ? "wygenerowano: AI" : "generated: AI") : pl ? "wygenerowano: szablon (bez AI)" : "generated: template (no AI)"}</span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {approved ? (pl ? `Zatwierdzone przez ${o.approvedBy}` : `Approved by ${o.approvedBy}`) : pl ? "Szkic – czeka na zatwierdzenie" : "Draft – awaiting approval"}
        </span>
      </div>
      {o.sentAt && (
        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
          {pl ? "Wysłano" : "Sent"}: {new Date(o.sentAt).toLocaleString(pl ? "pl-PL" : "en-GB")} → {o.sentTo}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="text-[11px] font-bold text-slate-600">
          <div>{pl ? "Język oferty, maila i PDF" : "Offer, email & PDF language"}</div>
          <div className="mt-1 inline-flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label={pl ? "Przełącznik języka" : "Language switch"}>
            {(["pl", "en"] as const).map((l) => (
              <button key={l} type="button" disabled={busy === "lang"} onClick={() => switchLanguage(l)} aria-pressed={o.language === l} data-testid={`offer-lang-${l}`} className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${o.language === l ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {busy === "lang" && <span className="ml-2 font-normal text-slate-500">{pl ? "Generuję…" : "Generating…"}</span>}
        </div>
        <div className="text-[11px] font-bold text-slate-600">
          <div>{pl ? "Waluta oferty" : "Offer currency"}</div>
          <div className="mt-1 inline-flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label={pl ? "Przełącznik waluty" : "Currency switch"}>
            {(["PLN", "GBP"] as const).map((c) => (
              <button key={c} type="button" disabled={busy === "lang"} onClick={() => switchLanguage(o.language, c)} aria-pressed={o.currency === c} data-testid={`offer-cur-${c}`} className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${o.currency === c ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Cena netto" : "Net price"} ({o.currency})
          <input type="number" min={0} step="1" className={inputCls + " mt-1 w-32"} value={o.priceNet} onChange={(e) => edit({ priceNet: Number(e.target.value) })} />
        </label>
      </div>
      <label className="block text-[11px] font-bold text-slate-600">
        {pl ? "Temat maila" : "Email subject"}
        <input className={inputCls + " mt-1"} value={o.subject} onChange={(e) => edit({ subject: e.target.value })} />
      </label>
      <label className="block text-[11px] font-bold text-slate-600">
        {pl ? "Treść maila" : "Email body"}
        <textarea className={inputCls + " mt-1 font-sans leading-relaxed"} rows={10} value={o.mailBody} onChange={(e) => edit({ mailBody: e.target.value })} />
      </label>
      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-slate-700">{pl ? "Treść oferty (sekcje)" : "Offer content (sections)"}</summary>
        <div className="space-y-2 mt-2">
          <input className={inputCls} value={o.offerTitle} onChange={(e) => edit({ offerTitle: e.target.value })} aria-label={pl ? "Tytuł oferty" : "Offer title"} />
          {o.offerSections.map((s, i) => (
            <div key={i} className="space-y-1">
              <input
                className={inputCls + " font-bold"}
                value={s.heading}
                onChange={(e) => edit({ offerSections: o.offerSections.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)) })}
              />
              <textarea
                className={inputCls}
                rows={4}
                value={s.body}
                onChange={(e) => edit({ offerSections: o.offerSections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })}
              />
            </div>
          ))}
        </div>
      </details>

      {dirty && (
        <button type="button" onClick={save} disabled={busy === "save"} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
          {pl ? "Zapisz zmiany" : "Save changes"}
        </button>
      )}

      {!approved && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-600">
            {pl ? "Adres odbiorcy" : "Recipient email"}
            <input className={inputCls + " mt-1"} type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {!validTo && (
            <div className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex flex-wrap items-center gap-2" data-testid="no-recipient">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pl ? "Brak e-maila klienta: wpisz adres, zanim wyślesz ofertę." : "No client e-mail: enter an address before sending the offer."}</span>
              <button type="button" onClick={() => setTo("contact@novopix.uk")} className="underline cursor-pointer">{pl ? "Użyj adresu NovoPix (test)" : "Use the NovoPix address (test)"}</button>
            </div>
          )}
        </div>
      )}
      {!approved && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
          <div className="text-[11px] text-amber-900 font-semibold">
            {pl
              ? "Nic nie wyjdzie do klienta, dopóki człowiek nie zatwierdzi oferty. Zatwierdzenie zapisuje Twoje imię i nazwisko oraz czas."
              : "Nothing goes to the client until a person approves the offer. Approval records your name and the time."}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={inputCls} placeholder={pl ? "Imię i nazwisko zatwierdzającego" : "Reviewer full name"} value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
            <button type="button" onClick={approve} disabled={busy === "approve" || reviewer.trim().length < 3} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"}>
              <ShieldCheck className="w-4 h-4" />
              <span>{pl ? `Zatwierdzam ofertę (${o.language.toUpperCase()}, ${o.currency})` : `Approve offer (${o.language.toUpperCase()}, ${o.currency})`}</span>
            </button>
          </div>
        </div>
      )}

      {approved && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className={`text-[11px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1.5 ${smtp ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
            {smtp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {smtp ? (pl ? "SMTP skonfigurowane" : "SMTP configured") : pl ? "SMTP nie skonfigurowane" : "SMTP not configured"}
          </div>
          <label className="block text-[11px] font-bold text-slate-600">
            {pl ? "Adres odbiorcy" : "Recipient email"}
            <input className={inputCls + " mt-1"} type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {!validTo && (
            <div className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex flex-wrap items-center gap-2" data-testid="no-recipient">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pl ? "Brak e-maila klienta: wpisz adres, zanim wyślesz ofertę." : "No client e-mail: enter an address before sending the offer."}</span>
              <button type="button" onClick={() => setTo("contact@novopix.uk")} className="underline cursor-pointer">{pl ? "Użyj adresu NovoPix (test)" : "Use the NovoPix address (test)"}</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={send} disabled={!smtp || !validTo || busy === "send"} title={smtp ? "" : pl ? "SMTP nie skonfigurowane" : "SMTP not configured"} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
              <Send className="w-4 h-4" />
              <span>{pl ? "Wyślij e-mailem" : "Send by email"}</span>
            </button>
            <button type="button" onClick={copy} className={btnCls + " bg-slate-100 hover:bg-slate-200 text-slate-800"}>
              <Copy className="w-4 h-4" />
              <span>{pl ? "Kopiuj" : "Copy"}</span>
            </button>
            <button type="button" onClick={() => downloadFile(ctx, `/api/offers/${o.id}/eml`, "oferta.eml")} className={btnCls + " bg-slate-100 hover:bg-slate-200 text-slate-800"}>
              <Mail className="w-4 h-4" />
              <span>{pl ? "Pobierz .eml" : "Download .eml"}</span>
            </button>
            {!o.sentAt && (
              <button type="button" onClick={markSent} disabled={busy === "mark"} className={btnCls + " bg-white border border-slate-300 hover:bg-slate-50 text-slate-800"}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{pl ? "Oznacz jako wysłane ręcznie" : "Mark as sent manually"}</span>
              </button>
            )}
          </div>
        </div>
      )}
      {msg && (
        <div role="status" className={`text-[11px] font-bold ${msg.kind === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

export default function ClientWorkflow({ ctx, client, monitored, onClientUpdated, onMonitoringAdded }: Props) {
  const pl = ctx.isPolish;
  const [offers, setOffers] = useState<OfferDraft[]>([]);
  const [smtp, setSmtp] = useState<boolean>(false);
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const [langInfo, setLangInfo] = useState<{ source: string; suggestion: { language: "pl" | "en"; source: string } } | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [packageId, setPackageId] = useState<string>("");
  const [cmp, setCmp] = useState<{ comparison: Comparison; state: any } | null>(null);
  const [reviewer, setReviewer] = useState<string>(() => {
    try {
      return localStorage.getItem("novopix_reviewer") || "";
    } catch {
      return "";
    }
  });
  const [curPick, setCurPick] = useState<"PLN" | "GBP" | null>(null);
  const currency: "PLN" | "GBP" = curPick || (lang === "pl" ? "PLN" : "GBP");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [o, m, l, pk, ba] = await Promise.all([
        api<any>(ctx, `/api/crm/clients/${client.id}/offers`),
        api<any>(ctx, "/api/mail/status"),
        api<any>(ctx, `/api/crm/clients/${client.id}/language`),
        api<any>(ctx, "/api/packages"),
        api<any>(ctx, `/api/crm/clients/${client.id}/before-after`),
      ]);
      if (!alive) return;
      if (o.ok) setOffers(o.data.offers || []);
      if (m.ok) setSmtp(!!m.data.configured);
      if (l.ok) {
        setLang(l.data.language === "en" ? "en" : "pl");
        setLangInfo({ source: l.data.source, suggestion: l.data.suggestion });
      }
      if (pk.ok) setPackages((pk.data.packages || []).filter((p: ServicePackage) => p.active));
      if (ba.ok && ba.data.comparison) setCmp({ comparison: ba.data.comparison, state: ba.data.state });
    })();
    return () => {
      alive = false;
    };
  }, [client.id]);

  const scan = async () => {
    setBusy("scan");
    setNote(null);
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/scan`, { method: "POST", body: { strategy } });
    setBusy(null);
    if (r.ok) {
      onClientUpdated(r.data.client);
      ctx.showToast(pl ? "Skan zapisany przy kliencie." : "Scan saved to the client.");
    } else setNote(r.data.error || (pl ? "Pomiar nie powiódł się." : "Measurement failed."));
  };

  const makeOffer = async () => {
    setBusy("offer");
    setNote(null);
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/offer`, { method: "POST", body: { language: lang, currency, packageId: packageId || undefined } });
    setBusy(null);
    if (r.ok) {
      setOffers((prev) => [r.data.offer, ...prev]);
      onClientUpdated(r.data.client);
      ctx.showToast(pl ? "Szkic oferty gotowy – sprawdź i zatwierdź." : "Offer draft ready – review and approve.");
    } else setNote(r.data.error || "Error");
  };

  // Jeden przycisk: skan (jeśli brak zapisanego) → szkic oferty z listą błędów i wyceną.
  const fullFlow = async () => {
    setNote(null);
    if (!snap) {
      setBusy("scan");
      const r = await api<any>(ctx, `/api/crm/clients/${client.id}/scan`, { method: "POST", body: { strategy } });
      if (!r.ok) {
        setBusy(null);
        setNote(r.data.error || (pl ? "Pomiar nie powiódł się." : "Measurement failed."));
        return;
      }
      onClientUpdated(r.data.client);
    }
    await makeOffer();
  };

  const addMonitoring = async () => {
    setBusy("mon");
    setNote(null);
    const r = await api<any>(ctx, "/api/monitoring/add", { method: "POST", body: { domain: client.website, clientName: client.company, interval: "daily", threshold: 80, clientId: client.id } });
    setBusy(null);
    if (r.ok && r.data.domain) {
      onMonitoringAdded(r.data.domain);
      if (r.data.client) onClientUpdated(r.data.client);
      ctx.showToast(pl ? "Domena dodana do monitoringu." : "Domain added to monitoring.");
    } else setNote(r.data.error || "Error");
  };

  const scanAfter = async (rebase = false) => {
    setBusy("after");
    setNote(null);
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/scan-after`, { method: "POST", body: { rebase } });
    if (r.ok) {
      onClientUpdated(r.data.client);
      const ba = await api<any>(ctx, `/api/crm/clients/${client.id}/before-after`);
      if (ba.ok && ba.data.comparison) setCmp({ comparison: ba.data.comparison, state: ba.data.state });
      ctx.showToast(pl ? "Skan po wdrożeniu zapisany." : "Post-delivery scan saved.");
    } else setNote(r.data.error || (pl ? "Pomiar nie powiódł się." : "Measurement failed."));
    setBusy(null);
  };

  const approveBA = async () => {
    setBusy("baapprove");
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/before-after/approve`, { method: "POST", body: { reviewer, language: cmp?.state?.language } });
    if (r.ok) {
      try {
        localStorage.setItem("novopix_reviewer", reviewer);
      } catch {}
      onClientUpdated(r.data.client);
      const ba = await api<any>(ctx, `/api/crm/clients/${client.id}/before-after`);
      if (ba.ok && ba.data.comparison) setCmp({ comparison: ba.data.comparison, state: ba.data.state });
      setNote(null);
      ctx.showToast(pl ? "Raport przed/po zatwierdzony." : "Before/after report approved.");
    } else setNote(r.data.error || "Error");
    setBusy(null);
  };

  const sendBA = async () => {
    setBusy("basend");
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/before-after/send`, { method: "POST", body: { to: client.email } });
    if (r.ok) {
      onClientUpdated(r.data.client);
      ctx.showToast(pl ? `Wysłano do ${client.email}.` : `Sent to ${client.email}.`);
      const ba = await api<any>(ctx, `/api/crm/clients/${client.id}/before-after`);
      if (ba.ok && ba.data.comparison) setCmp({ comparison: ba.data.comparison, state: ba.data.state });
    } else setNote(r.data.error || "Error");
    setBusy(null);
  };

  const curIdx = STAGES.findIndex((s) => s.id === client.status);
  const snap = client.lastScan;

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid="client-workflow">
      <ol className="flex flex-wrap gap-1.5" aria-label={pl ? "Etapy" : "Stages"}>
        {STAGES.map((s, i) => (
          <li key={s.id} className={`text-[10px] font-bold px-2 py-1 rounded-full border ${i === curIdx ? "bg-slate-900 text-white border-slate-900" : i < curIdx ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-slate-400 border-slate-200"}`}>
            {i + 1}. {pl ? s.pl : s.en}
          </li>
        ))}
      </ol>
      {note && (
        <div role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          {note}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={fullFlow} disabled={busy === "scan" || busy === "offer"} data-testid="full-flow" className={btnCls + " bg-emerald-700 hover:bg-emerald-800 text-white"}>
          <Sparkles className="w-4 h-4" />
          <span>{busy === "scan" ? (pl ? "Skanuję…" : "Scanning…") : busy === "offer" ? (pl ? "Tworzę ofertę…" : "Creating offer…") : pl ? "Utwórz ofertę naprawy" : "Create repair offer"}</span>
        </button>
        <span className="text-[11px] text-slate-600">{pl ? "Skan (jeśli brak) + lista błędów + wycena w jednym kroku. Język, walutę i pakiet wybierzesz niżej." : "Scan (if missing) + issue list + quote in one step. Choose language, currency and package below."}</span>
      </div>

      <section className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Search className="w-4 h-4" /> {pl ? "1. Skan strony klienta" : "1. Client website scan"}
        </h4>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label="Strategy">
            <option value="mobile">{pl ? "Telefon" : "Mobile"}</option>
            <option value="desktop">{pl ? "Komputer" : "Desktop"}</option>
          </select>
          <button type="button" onClick={scan} disabled={busy === "scan"} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
            <Search className="w-4 h-4" />
            <span>{busy === "scan" ? (pl ? "Mierzę…" : "Measuring…") : pl ? "Skanuj i zapisz wynik" : "Scan and save result"}</span>
          </button>
          {snap && (
            <>
              <button type="button" onClick={() => downloadFile(ctx, `/api/crm/clients/${client.id}/report.pdf?lang=pl`, "raport.pdf")} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
                <FileText className="w-4 h-4" />
                <span>{pl ? "Raport PDF (PL)" : "PDF report (PL)"}</span>
              </button>
              <button type="button" onClick={() => downloadFile(ctx, `/api/crm/clients/${client.id}/report.pdf?lang=en`, "report.pdf")} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
                <FileText className="w-4 h-4" />
                <span>{pl ? "Raport PDF (EN)" : "PDF report (EN)"}</span>
              </button>
            </>
          )}
        </div>
        {snap ? <ScanSummary s={snap} pl={pl} /> : <p className="text-[11px] text-slate-500">{pl ? "Brak zapisanego skanu – kliknij „Skanuj i zapisz wynik”." : "No saved scan yet – click “Scan and save result”."}</p>}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> {pl ? "2. Szkic oferty i maila → zatwierdzenie → wysyłka" : "2. Offer & email draft → approval → sending"}
        </h4>
        {langInfo && (
          <p className="text-[11px] text-slate-600" data-testid="lang-suggestion">
            {pl ? "Proponowany język" : "Suggested language"}: <strong>{langInfo.suggestion.language.toUpperCase()}</strong> (
            {{ form: pl ? "język formularza wyceny / raportu" : "quote / report form language", html: pl ? "atrybut <html lang> strony klienta" : "client site <html lang> attribute", tld: pl ? "końcówka domeny" : "domain ending" }[langInfo.suggestion.source] || langInfo.suggestion.source}
            ){langInfo.source === "client" ? (pl ? ` · zapisany przy kliencie: ${lang.toUpperCase()}` : ` · saved for the client: ${lang.toUpperCase()}`) : ""}. {pl ? "Możesz zmienić poniżej." : "You can change it below."}
          </p>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label={pl ? "Język oferty" : "Offer language"} data-testid="draft-language">
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
          <select value={currency} onChange={(e) => setCurPick(e.target.value as "PLN" | "GBP")} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label={pl ? "Waluta oferty" : "Offer currency"} data-testid="wf-currency">
            <option value="PLN">PLN</option>
            <option value="GBP">GBP</option>
          </select>
          <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold max-w-[16rem]" aria-label={pl ? "Pakiet" : "Package"} data-testid="draft-package">
            <option value="">{pl ? "Wycena godzinowa (bez pakietu)" : "Hourly quote (no package)"}</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {(lang === "pl" ? p.namePl : p.nameEn)} – {packageLabel(p, lang, currency)}
              </option>
            ))}
          </select>
          <button type="button" onClick={makeOffer} disabled={!snap || busy === "offer"} title={snap ? "" : pl ? "Najpierw wykonaj skan" : "Run a scan first"} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
            <Sparkles className="w-4 h-4" />
            <span>{busy === "offer" ? (pl ? "Generuję…" : "Generating…") : pl ? "Generuj szkic oferty i maila" : "Generate offer & email draft"}</span>
          </button>
        </div>
        {offers.map((o) => (
          <OfferCard
            key={o.id}
            ctx={ctx}
            offer={o}
            client={client}
            smtp={smtp}
            onChanged={(n) => setOffers((prev) => prev.map((x) => (x.id === n.id ? n : x)))}
            onClientUpdated={onClientUpdated}
          />
        ))}
      </section>

      <section className="space-y-2" data-testid="before-after">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <GitCompare className="w-4 h-4" /> {pl ? "3. Skan po wdrożeniu i raport przed/po" : "3. Post-delivery scan and before/after report"}
        </h4>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => scanAfter(false)} disabled={!snap || busy === "after"} title={snap ? "" : pl ? "Najpierw wykonaj skan „przed”" : "Run the “before” scan first"} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
            <Search className="w-4 h-4" />
            <span>{busy === "after" ? (pl ? "Mierzę…" : "Measuring…") : pl ? "Skan po wdrożeniu" : "Post-delivery scan"}</span>
          </button>
          {cmp && (
            <button type="button" onClick={() => window.confirm(pl ? "Ustawić ostatni skan klienta jako nowy stan „przed”?" : "Use the latest client scan as the new “before” baseline?") && scanAfter(true)} disabled={busy === "after"} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
              {pl ? "Nowy punkt odniesienia „przed”" : "New “before” baseline"}
            </button>
          )}
        </div>
        {!cmp && <p className="text-[11px] text-slate-500">{pl ? "Po wdrożeniu kliknij „Skan po wdrożeniu”: porównamy go ze skanem zapisanym wcześniej („przed”)." : "After delivery click “Post-delivery scan”: it is compared with the previously saved scan (“before”)."}</p>}
        {cmp && (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-lg bg-white" data-testid="compare-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="text-left p-2">{pl ? "Wskaźnik" : "Metric"}</th>
                    <th className="text-right p-2">{pl ? "Przed" : "Before"}</th>
                    <th className="text-right p-2">{pl ? "Po" : "After"}</th>
                    <th className="text-right p-2">{pl ? "Zmiana" : "Change"}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...cmp.comparison.rows.map((r) => ({ k: r.key, label: pl ? r.labelPl : r.labelEn, b: r.before, a: r.after, d: r.delta })),
                    { k: "rt", label: pl ? "Czas odpowiedzi serwera (ms)" : "Server response time (ms)", b: cmp.comparison.responseTimeMs.before, a: cmp.comparison.responseTimeMs.after, d: cmp.comparison.responseTimeMs.delta },
                    ...cmp.comparison.cwv.map((c) => ({ k: `cwv-${c.acronym}`, label: `${c.acronym}`, b: c.before, a: c.after, d: null as number | null })),
                  ].map((r) => (
                    <tr key={r.k} className="border-t border-slate-100">
                      <td className="p-2 font-bold text-slate-800">{r.label}</td>
                      <td className={`p-2 text-right font-mono ${r.b === null ? "text-amber-700" : ""}`}>{r.b === null ? (pl ? "brak pomiaru" : "not measured") : r.b}</td>
                      <td className={`p-2 text-right font-mono ${r.a === null ? "text-amber-700" : ""}`}>{r.a === null ? (pl ? "brak pomiaru" : "not measured") : r.a}</td>
                      <td className={`p-2 text-right font-mono font-bold ${r.d === null ? "text-slate-400" : r.d === 0 ? "" : (r.d > 0) !== (r.k === "rt") ? "text-emerald-700" : "text-rose-700"}`}>{r.d === null ? "–" : r.d > 0 ? `+${r.d}` : r.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cmp.comparison.notes.length > 0 && (
              <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2" role="note">
                {cmp.comparison.notes.includes("measurement_type_differs") && (pl ? "Pomiary „przed” i „po” wykonano różnymi metodami (Lighthouse vs analiza HTML/HTTP) – nie są w pełni porównywalne. " : "The “before” and “after” scans used different methods (Lighthouse vs HTML/HTTP analysis) – not fully comparable. ")}
                {cmp.comparison.notes.includes("strategy_differs") && (pl ? "Pomiary dotyczą różnych urządzeń." : "The scans are for different devices.")}
              </p>
            )}
            {cmp.state?.status === "approved" ? (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{pl ? `Zatwierdzone przez ${cmp.state.approvedBy} (PDF: ${String(cmp.state.language).toUpperCase()})` : `Approved by ${cmp.state.approvedBy} (PDF: ${String(cmp.state.language).toUpperCase()})`}</span>
                <button type="button" onClick={() => downloadFile(ctx, `/api/crm/clients/${client.id}/before-after.pdf`, "before-after.pdf")} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
                  <FileText className="w-4 h-4" />
                  <span>{pl ? "Pobierz raport PDF przed/po" : "Download before/after PDF"}</span>
                </button>
                <button type="button" onClick={sendBA} disabled={!smtp || !client.email || busy === "basend"} title={!smtp ? (pl ? "SMTP nie skonfigurowane" : "SMTP not configured") : ""} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
                  <Send className="w-4 h-4" />
                  <span>{pl ? "Wyślij e-mailem" : "Send by email"}</span>
                </button>
                {cmp.state.sentAt && <span className="text-[11px] font-bold text-emerald-800">{pl ? "Wysłano" : "Sent"}: {new Date(cmp.state.sentAt).toLocaleString(pl ? "pl-PL" : "en-GB")} → {cmp.state.sentTo}</span>}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <div className="text-[11px] text-amber-900 font-semibold">
                  {pl ? "Raport PDF przed/po wymaga zatwierdzenia przez człowieka. Wybierz język raportu i podaj imię i nazwisko." : "The before/after PDF needs human approval. Choose the report language and enter your full name."}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={cmp.state?.language || "pl"} onChange={(e) => setCmp({ ...cmp, state: { ...cmp.state, language: e.target.value } })} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label={pl ? "Język raportu" : "Report language"}>
                    <option value="pl">PL</option>
                    <option value="en">EN</option>
                  </select>
                  <input className={inputCls} placeholder={pl ? "Imię i nazwisko zatwierdzającego" : "Reviewer full name"} value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
                  <button type="button" onClick={approveBA} disabled={busy === "baapprove" || reviewer.trim().length < 3} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{pl ? "Zatwierdzam raport" : "Approve report"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Bell className="w-4 h-4" /> {pl ? "4. Monitoring po wdrożeniu" : "4. Monitoring after delivery"}
        </h4>
        {monitored ? (
          <p className="text-xs font-bold text-emerald-800">
            {pl ? "Domena jest w monitoringu" : "Domain is monitored"}: {monitored.domain} ({stageLabel("monitoring", pl)})
          </p>
        ) : (
          <button type="button" onClick={addMonitoring} disabled={busy === "mon"} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
            <Bell className="w-4 h-4" />
            <span>{pl ? "Dodaj domenę klienta do monitoringu" : "Add client domain to monitoring"}</span>
          </button>
        )}
      </section>
    </div>
  );
}
