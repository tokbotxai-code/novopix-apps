import React, { useEffect, useState } from "react";
import { Copy, Download, FileText, Mail, Search, Send, ShieldCheck, Sparkles, Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { AgencyCtx, OfferDraft, STAGES, ScanSnapshot, stageLabel } from "../agencyTypes";
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

  const save = async (): Promise<boolean> => {
    setBusy("save");
    const r = await api<any>(ctx, `/api/offers/${o.id}`, { method: "PUT", body: { subject: o.subject, mailBody: o.mailBody, offerTitle: o.offerTitle, offerSections: o.offerSections } });
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
        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <span>{o.language.toUpperCase()} · {o.priceNet} {o.currency} {pl ? "netto" : "net"}</span>
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
              <span>{pl ? "Zatwierdzam ofertę" : "Approve offer"}</span>
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
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={send} disabled={!smtp || busy === "send"} title={smtp ? "" : pl ? "SMTP nie skonfigurowane" : "SMTP not configured"} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
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
  const [lang, setLang] = useState<"pl" | "en">(pl ? "pl" : "en");
  const [currency, setCurrency] = useState<"PLN" | "EUR" | "GBP">("PLN");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [o, m] = await Promise.all([api<any>(ctx, `/api/crm/clients/${client.id}/offers`), api<any>(ctx, "/api/mail/status")]);
      if (!alive) return;
      if (o.ok) setOffers(o.data.offers || []);
      if (m.ok) setSmtp(!!m.data.configured);
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
    const r = await api<any>(ctx, `/api/crm/clients/${client.id}/offer`, { method: "POST", body: { language: lang, currency } });
    setBusy(null);
    if (r.ok) {
      setOffers((prev) => [r.data.offer, ...prev]);
      onClientUpdated(r.data.client);
      ctx.showToast(pl ? "Szkic oferty gotowy – sprawdź i zatwierdź." : "Offer draft ready – review and approve.");
    } else setNote(r.data.error || "Error");
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
        <div className="flex flex-wrap gap-2 items-center">
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label={pl ? "Język oferty" : "Offer language"}>
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label={pl ? "Waluta" : "Currency"}>
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
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

      <section className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Bell className="w-4 h-4" /> {pl ? "3. Monitoring po wdrożeniu" : "3. Monitoring after delivery"}
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
