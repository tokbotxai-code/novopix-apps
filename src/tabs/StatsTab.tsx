import { BarChart3, Download, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import type { AgencyCtx } from "../agencyTypes";
import { api, downloadFile } from "./agencyApi";

interface Summary {
  days: number;
  series: Array<{ date: string; views: number; uniques: number; scans: number }>;
  totals: { views: number; uniques: number; scans: number };
  pages: Array<{ page: string; views: number; uniques: number }>;
  refs: Array<{ ref: string; count: number }>;
  langs: Array<{ lang: string; count: number }>;
  events: Record<string, number>;
}

// Prywatne statystyki: dzienne sumy bez ciasteczek i bez adresów IP. Zera pokazujemy jako „brak danych”.
export default function StatsTab({ ctx }: { ctx: AgencyCtx }) {
  const pl = ctx.isPolish;
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<Summary | null>(null);
  const load = useCallback(async () => {
    const r = await api<Summary>(ctx, `/api/stats?days=${days}`);
    if (r.ok) setData(r.data);
  }, [ctx.token, days]);
  useEffect(() => {
    load();
  }, [load]);

  const none = <p className="text-xs text-slate-500" data-testid="stats-empty">{pl ? "Brak danych w tym okresie." : "No data in this period."}</p>;
  const ev = (k: string) => data?.events[k] || 0;
  const max = Math.max(1, ...(data?.series || []).map((d) => d.views));
  const maxScans = Math.max(1, ...(data?.series || []).map((d) => d.scans));
  const refLabel = (r: string) => (r === "direct" ? (pl ? "wejście bezpośrednie" : "direct") : r === "other" ? (pl ? "inne" : "other") : r);
  const card = "bg-white rounded-2xl p-5 border border-slate-200 space-y-3";
  const h3 = "text-sm font-extrabold text-slate-900";

  const bars = (key: "views" | "scans", top: number, label: string) => (
    <div className="flex items-end gap-px h-32" role="img" aria-label={label}>
      {data!.series.map((d) => (
        <div key={d.date} className="flex-1 h-full flex flex-col justify-end min-w-0" title={`${d.date}: ${key === "views" ? `${d.views} / ${d.uniques}` : d.scans}`}>
          <div className="w-full rounded-t bg-emerald-600" style={{ height: `${(d[key] / top) * 100}%`, minHeight: d[key] ? 2 : 0 }}>
            {key === "views" && <div className="w-full rounded-t bg-emerald-900" style={{ height: `${d.views ? (d.uniques / d.views) * 100 : 0}%` }} />}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="stats-tab">
      <div className={card + " flex flex-wrap items-center justify-between gap-3"}>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            {pl ? "Statystyki" : "Statistics"}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {pl ? "Zagregowane odsłony i użycie. Bez ciasteczek, bez zapisywania adresów IP. „Unikalni” to przybliżenie liczone w obrębie jednej doby." : "Aggregated page views and usage. No cookies, no stored IP addresses. “Unique” is an approximation counted within one day."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${days === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              {d} {pl ? "dni" : "days"}
            </button>
          ))}
          <button type="button" onClick={load} className="p-2 rounded-lg border border-slate-200 cursor-pointer" aria-label={pl ? "Odśwież" : "Refresh"}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => downloadFile(ctx, `/api/stats.csv?days=${days}`, `novopix-stats-${days}d.csv`)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {!data ? (
        <div className="text-xs text-slate-500 p-3">{pl ? "Ładowanie…" : "Loading…"}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              [pl ? "Odsłony" : "Page views", data.totals.views, "stats-views"],
              [pl ? "Unikalni (dziennie)" : "Unique (daily)", data.totals.uniques, "stats-uniques"],
              [pl ? "Skany" : "Scans", data.totals.scans, "stats-scans"],
            ].map(([label, value, id]) => (
              <div key={id as string} className="bg-white rounded-2xl p-4 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-600">{label}</div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 tabular-nums" data-testid={id as string}>{value}</div>
              </div>
            ))}
          </div>

          <div className={card}>
            <h3 className={h3}>{pl ? "Odsłony i unikalni, dzień po dniu" : "Views and unique visitors per day"}</h3>
            {data.totals.views === 0 ? none : (
              <>
                {bars("views", max, pl ? "Wykres odsłon dziennie" : "Daily page views chart")}
                <div className="flex justify-between text-[11px] text-slate-500 font-mono"><span>{data.series[0].date}</span><span>{data.series[data.series.length - 1].date}</span></div>
                <div className="text-[11px] text-slate-600 flex gap-4"><span><i className="inline-block w-2.5 h-2.5 bg-emerald-600 rounded-sm mr-1" />{pl ? "odsłony" : "views"}</span><span><i className="inline-block w-2.5 h-2.5 bg-emerald-900 rounded-sm mr-1" />{pl ? "unikalni" : "unique"}</span></div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className={h3}>{pl ? "Najczęściej otwierane strony" : "Top pages"}</h3>
              {data.pages.length === 0 ? none : (
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1 font-semibold">{pl ? "Strona" : "Page"}</th><th className="py-1 font-semibold text-right">{pl ? "Odsłony" : "Views"}</th><th className="py-1 font-semibold text-right">{pl ? "Unikalni" : "Unique"}</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.pages.map((p) => (
                      <tr key={p.page}><td className="py-1.5 font-mono break-all pr-2">{p.page}</td><td className="py-1.5 text-right font-mono tabular-nums">{p.views}</td><td className="py-1.5 text-right font-mono tabular-nums">{p.uniques}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="space-y-4">
              <div className={card}>
                <h3 className={h3}>{pl ? "Źródła wejść" : "Sources"}</h3>
                {data.refs.length === 0 ? none : (
                  <ul className="text-xs divide-y divide-slate-100">
                    {data.refs.map((r) => <li key={r.ref} className="py-1.5 flex justify-between gap-2"><span className="break-all">{refLabel(r.ref)}</span><span className="font-mono tabular-nums">{r.count}</span></li>)}
                  </ul>
                )}
              </div>
              <div className={card}>
                <h3 className={h3}>{pl ? "Język strony" : "Page language"}</h3>
                {data.langs.length === 0 ? none : (
                  <ul className="text-xs flex flex-wrap gap-2">
                    {data.langs.map((l) => <li key={l.lang} className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold">{l.lang === "other" ? (pl ? "inne" : "other") : l.lang.toUpperCase()}: <span className="font-mono">{l.count}</span></li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className={card}>
            <h3 className={h3}>{pl ? "Skany dziennie" : "Scans per day"}</h3>
            {data.totals.scans === 0 ? none : (
              <>
                {bars("scans", maxScans, pl ? "Wykres skanów dziennie" : "Daily scans chart")}
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1 font-semibold"></th><th className="py-1 font-semibold text-right">{pl ? "Pełny (Lighthouse)" : "Full (Lighthouse)"}</th><th className="py-1 pl-3 font-semibold text-right">{pl ? "Częściowy" : "Partial"}</th><th className="py-1 pl-3 font-semibold text-right">{pl ? "Błąd" : "Failed"}</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(["public", "panel"] as const).map((m) => (
                      <tr key={m}><td className="py-1.5 font-bold">{m === "public" ? (pl ? "Skaner publiczny" : "Public scanner") : pl ? "Panel" : "Panel"}</td>{["full", "partial", "failed"].map((s) => <td key={s} className="py-1.5 text-right font-mono tabular-nums">{ev(`scan_${m}_${s}`)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className={card}>
            <h3 className={h3}>{pl ? "Lejek" : "Funnel"}</h3>
            {ev("report_request") + ev("share_link") + ev("offer_approved") + ev("offer_sent") + data.totals.scans === 0 ? none : (
              <ul className="text-xs grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  [pl ? "Skany" : "Scans", data.totals.scans],
                  [pl ? "Prośby o raport PDF" : "PDF report requests", ev("report_request")],
                  [pl ? "Linki do wyniku" : "Result links", ev("share_link")],
                  [pl ? "Oferty zatwierdzone" : "Offers approved", ev("offer_approved")],
                  [pl ? "Oferty wysłane" : "Offers sent", ev("offer_sent")],
                ].map(([label, value]) => (
                  <li key={label as string} className="p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="text-[11px] font-bold text-slate-600">{label}</div><div className="text-lg font-mono font-extrabold tabular-nums">{value}</div></li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
