import React, { useEffect, useState } from "react";
import type { AppState } from "../state/useAppState";
import type { AgencyCtx } from "../agencyTypes";
import { api } from "./agencyApi";
import { computeVerdict, verdictExtras } from "../utils/verdict";
import { copyText } from "../utils/clipboard";
import SendReportModal, { SendSeed } from "./SendReportModal";

const hostOf = (app: AppState) => (app.currentReport.finalUrl || app.currentReport.scannedUrl || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

function useOffer(app: AppState) {
  const v = computeVerdict(app.currentReport, app.audience, app.isPolish, verdictExtras(app.contactCheck, app.domainHealth, app.isPolish));
  const lines = (v?.items || []).map((it) => `- ${it.service}: ${it.price}`);
  return { v, lines };
}

// Przyciski nad raportem: wyślij klientowi, link do skanu, monitoring co tydzień.
export function ReportActions({ app, ctx }: { app: AppState; ctx: AgencyCtx }) {
  const pl = app.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const host = hostOf(app);
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<SendSeed>({ template: "company" });
  const { lines } = useOffer(app);
  const issues = (app.currentReport.issues || []).map((i) => i.title);
  const defaultTpl = app.audience === "institution" ? "school" : "company";
  const scanId = (app.currentReport as any).scanId as string | undefined;
  const addMonitor = async () => {
    const r = await api<any>(ctx, "/api/monitoring/add", { method: "POST", body: { domain: host, clientName: host, interval: "weekly", threshold: 80 } });
    ctx.showToast(r.ok ? L(`Monitoring co tydzień włączony dla ${host}.`, `Weekly monitoring is on for ${host}.`) : r.data?.error || L("Nie udało się włączyć monitoringu.", "Could not turn monitoring on."));
  };
  const copyLink = async () => {
    const link = `https://scanner.novopix.uk/?url=${encodeURIComponent(host)}&autoscan=1&lang=${pl ? "pl" : "en"}`;
    ctx.showToast((await copyText(link)) ? L("Skopiowano link do skanu dla klienta.", "Scan link for the client copied.") : link);
  };
  const btn = "px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer";
  return (
    <div className="flex flex-wrap gap-2" data-testid="report-actions">
      <button type="button" className={`${btn} !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700`} onClick={() => { setSeed({ template: defaultTpl }); setOpen(true); }}>{L("Wyślij klientowi", "Send to client")}</button>
      <button type="button" className={btn} onClick={() => { setSeed({ template: "offer", offerLines: lines }); setOpen(true); }}>{L("Wyślij ofertę", "Send an offer")}</button>
      <button type="button" className={btn} onClick={copyLink}>{L("Kopiuj link do skanu", "Copy scan link")}</button>
      <button type="button" className={btn} onClick={addMonitor}>{L("Monitoring co tydzień", "Weekly monitoring")}</button>
      <SendReportModal ctx={ctx} open={open} onClose={() => setOpen(false)} scanId={scanId} host={host} score={app.currentReport.overallScore ?? null} issues={issues} seed={seed} htmlLang={app.liveSeo?.htmlLang} />
    </div>
  );
}

// Oferta z wyniku: usługi z jawnych reguł i cennika (ceny netto), do skopiowania albo wysłania.
export function OfferBox({ app, ctx }: { app: AppState; ctx: AgencyCtx }) {
  const pl = app.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const { v, lines } = useOffer(app);
  const host = hostOf(app);
  const [open, setOpen] = useState(false);
  if (!v || !v.items.length) return null;
  const text = `${L("Propozycja dla", "Proposal for")} ${host}\n\n${lines.join("\n")}\n\n${L("Ceny netto (bez VAT). Zakres i cenę potwierdzamy na piśmie przed rozpoczęciem pracy.", "Prices exclude VAT. We confirm scope and price in writing before work begins.")}`;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3" data-testid="offer-box">
      <h3 className="text-sm font-extrabold text-slate-900">{L("Oferta z wyniku skanu", "Offer based on the scan")}</h3>
      <ul className="text-sm space-y-1">{v.items.map((it) => <li key={it.key}><strong>{it.service}</strong>: {it.price} <span className="text-slate-500">({it.problem})</span></li>)}</ul>
      <p className="text-[11px] text-slate-500">{L("Ceny pochodzą z cennika (netto). To rekomendacja z jawnych reguł, nie obietnica wyniku.", "Prices come from the price list (ex VAT). This is a recommendation from open rules, not a promise of results.")}</p>
      <div className="flex gap-2">
        <button type="button" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer" onClick={async () => ctx.showToast((await copyText(text)) ? L("Skopiowano ofertę.", "Offer copied.") : text)}>{L("Kopiuj", "Copy")}</button>
        <button type="button" className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer" onClick={() => setOpen(true)}>{L("Wyślij mailem", "Send by e-mail")}</button>
      </div>
      <SendReportModal ctx={ctx} open={open} onClose={() => setOpen(false)} scanId={(app.currentReport as any).scanId} host={host} score={app.currentReport.overallScore ?? null} issues={[]} seed={{ template: "offer", offerLines: lines }} htmlLang={app.liveSeo?.htmlLang} />
    </div>
  );
}

// Historia pomiarów domeny z panelu: przed i po z datami (tylko prawdziwe pomiary).
export function HistoryCard({ app, ctx }: { app: AppState; ctx: AgencyCtx }) {
  const pl = app.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const host = hostOf(app);
  const [rows, setRows] = useState<Array<{ at: string; overall: number | null }>>([]);
  useEffect(() => {
    let live = true;
    api<any>(ctx, `/api/agency/history?host=${encodeURIComponent(host)}`).then((r) => { if (live && r.ok) setRows(r.data.history || []); });
    return () => { live = false; };
  }, [host, app.currentReport.scanId]);
  const pts = rows.filter((r) => typeof r.overall === "number") as Array<{ at: string; overall: number }>;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(pl ? "pl-PL" : "en-GB", { day: "2-digit", month: "2-digit" });
  if (pts.length < 2) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-xs text-slate-600" data-testid="history-empty">
      {L("Historia wyniku tej domeny pojawi się po drugim pomiarze z panelu (w innym dniu lub po poprawkach).", "The score history of this domain appears after a second measurement from the panel (another day or after fixes).")}
    </div>
  );
  const first = pts[0], last = pts[pts.length - 1], d = last.overall - first.overall;
  const W = 280, H = 60, xs = (i: number) => (i / (pts.length - 1)) * (W - 8) + 4, ys = (v: number) => H - 6 - (v / 100) * (H - 12);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3" data-testid="history-card">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <strong>{L("Przed i po", "Before and after")}</strong>
        <span className="font-mono tabular-nums text-slate-500">{fmt(first.at)}: {first.overall}/100</span><span aria-hidden="true">→</span>
        <span className="font-mono tabular-nums text-slate-900">{fmt(last.at)}: {last.overall}/100</span>
        <span className={`font-bold ${d > 0 ? "text-emerald-700" : d < 0 ? "text-rose-700" : "text-slate-500"}`}>{d > 0 ? `+${d}` : d}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img" aria-label={L("Wykres wyniku w czasie", "Score over time")}>
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={pts.map((p, i) => `${xs(i)},${ys(p.overall)}`).join(" ")} />
        {pts.map((p, i) => <circle key={i} cx={xs(i)} cy={ys(p.overall)} r="2.5" fill="#10b981" />)}
      </svg>
      <p className="text-[11px] text-slate-500">{L("Wynik Lighthouse waha się o kilka punktów między pomiarami, więc małe różnice nie muszą oznaczać zmiany na stronie.", "Lighthouse results vary by a few points between runs, so small differences do not necessarily mean a change on the site.")}</p>
    </div>
  );
}
