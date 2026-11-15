import React, { useCallback, useEffect, useState } from "react";
import { localizeActivity } from "../utils/activityText";
import type { AgencyCtx } from "../agencyTypes";
import { api } from "./agencyApi";

type Today = {
  waiting: Array<{ id: string; name: string; email: string; website: string; kind: string; days: number; lang: string; score: number | null }>;
  alerts: Array<{ domain: string; type: string; message: string; at: string }>;
  recent: Array<{ host: string; at: string; overall: number | null; count: number }>;
  smtp: boolean;
};

// Ekran „Dziś” dla agencji: kto czeka na odpowiedź, alerty monitoringu, ostatnie skany, dziennik zmian i kopia bazy.
export default function TodayWidget({ ctx, onScan }: { ctx: AgencyCtx; onScan: (host: string) => void }) {
  const pl = ctx.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const [data, setData] = useState<Today | null>(null);
  const [activity, setActivity] = useState<Array<{ at: string; who: string; text: string }> | null>(null);
  const load = useCallback(async () => {
    const r = await api<Today>(ctx, "/api/agency/today");
    if (r.ok) setData(r.data);
  }, [ctx.token]);
  useEffect(() => { if (ctx.token) load(); }, [load]);
  const loadActivity = async () => {
    if (activity) return;
    const r = await api<any>(ctx, "/api/agency/activity");
    if (r.ok) setActivity(r.data.rows || []);
  };
  const replied = async (id: string) => { await api(ctx, `/api/agency/leads/${id}/replied`, { method: "POST", body: {} }); load(); };
  const restore = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm(L("Przywrócić bazę z tego pliku? Obecna baza zostanie najpierw zapisana jako kopia.", "Restore the database from this file? The current database is saved as a backup first."))) return;
    try {
      const json = JSON.parse(await file.text());
      const r = await api<any>(ctx, "/api/agency/restore", { method: "POST", body: { data: json } });
      ctx.showToast(r.ok ? L(`Przywrócono: ${r.data.clients} klientów, ${r.data.leads} zgłoszeń.`, `Restored: ${r.data.clients} clients, ${r.data.leads} leads.`) : r.data?.error || L("Nie udało się przywrócić.", "Restore failed."));
      if (r.ok) load();
    } catch { ctx.showToast(L("Plik nie jest poprawnym JSON-em.", "The file is not valid JSON.")); }
  };
  if (!data) return null;
  const card = "rounded-xl border border-slate-200 bg-white p-4 text-left space-y-2";
  const mail = (w: Today["waiting"][number]) => `mailto:${w.email}?subject=${encodeURIComponent(w.lang === "en" ? "Your website check" : "Wynik kontroli Twojej strony")}`;
  return (
    <div className="space-y-3 text-left" data-testid="today-widget">
      <h3 className="text-sm font-extrabold text-slate-900">{L("Dziś", "Today")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={card}>
          <div className="text-xs font-bold text-slate-500">{L("Czekają na odpowiedź", "Waiting for a reply")} ({data.waiting.length})</div>
          {data.waiting.length === 0 && <p className="text-xs text-slate-600">{L("Nic nie czeka.", "Nothing is waiting.")}</p>}
          {data.waiting.slice(0, 5).map((w) => (
            <div key={w.id} className="text-xs border-t border-slate-100 pt-2 space-y-1">
              <div className="font-bold text-slate-900 break-all">{w.email}</div>
              <div className="text-slate-600 break-all">{w.website}{w.score !== null ? ` · ${w.score}/100` : ""} · {w.days === 0 ? L("dziś", "today") : L(`${w.days} dni temu`, `${w.days} days ago`)}</div>
              <div className="flex gap-2">
                <a href={mail(w)} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold">{L("Odpisz", "Reply")}</a>
                <button type="button" onClick={() => replied(w.id)} className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold cursor-pointer">{L("Odpisano", "Replied")}</button>
              </div>
            </div>
          ))}
        </div>
        <div className={card}>
          <div className="text-xs font-bold text-slate-500">{L("Alerty monitoringu", "Monitoring alerts")} ({data.alerts.length})</div>
          {data.alerts.length === 0 && <p className="text-xs text-slate-600">{L("Brak nowych alertów.", "No new alerts.")}</p>}
          {data.alerts.slice(0, 5).map((a, i) => <div key={i} className="text-xs border-t border-slate-100 pt-2"><div className="font-bold break-all">{a.domain}</div><div className="text-slate-600">{a.message}</div></div>)}
        </div>
        <div className={card}>
          <div className="text-xs font-bold text-slate-500">{L("Ostatnie skany", "Recent scans")}</div>
          {data.recent.length === 0 && <p className="text-xs text-slate-600">{L("Brak zapisanych skanów.", "No saved scans yet.")}</p>}
          {data.recent.map((r) => (
            <button key={r.host} type="button" onClick={() => onScan(r.host)} className="w-full flex justify-between gap-2 text-xs border-t border-slate-100 pt-2 cursor-pointer hover:text-emerald-700">
              <span className="font-bold break-all text-left">{r.host}</span><span className="font-mono tabular-nums shrink-0">{r.overall ?? "–"}/100 · {r.count}×</span>
            </button>
          ))}
        </div>
      </div>
      <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && loadActivity()} className={card}>
        <summary className="cursor-pointer text-xs font-bold text-slate-700">{L("Dziennik zmian i kopia bazy", "Change log and database backup")}</summary>
        <div className="mt-2 space-y-2">
          {!activity && <p className="text-xs text-slate-500">{L("Ładowanie…", "Loading…")}</p>}
          {activity && activity.length === 0 && <p className="text-xs text-slate-600">{L("Brak wpisów.", "No entries.")}</p>}
          {activity && activity.slice(0, 25).map((a, i) => <div key={i} className="text-xs border-t border-slate-100 pt-1"><span className="font-mono text-slate-500">{a.at.slice(0, 16).replace("T", " ")}</span> · <strong className="break-all">{a.who}</strong>: {localizeActivity(a.text, pl)}</div>)}
          <label className="block text-xs pt-2 border-t border-slate-100"><span className="font-bold text-slate-700">{L("Przywróć kopię bazy (plik .json z „Kopia zapasowa”)", "Restore a database backup (.json file from “Backup”)")}</span>
            <input type="file" accept="application/json,.json" onChange={(e) => { restore(e.target.files?.[0]); e.currentTarget.value = ""; }} className="block mt-1 text-xs" /></label>
        </div>
      </details>
    </div>
  );
}
