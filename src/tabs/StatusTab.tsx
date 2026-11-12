import { Activity, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import type { AgencyCtx } from "../agencyTypes";
import { api } from "./agencyApi";

interface Svc {
  id: string; labelPl: string; labelEn: string; url: string;
  ok: boolean | null; consecutiveFails: number; alerting: boolean; lastCheck: string | null;
  httpStatus?: number; responseMs?: number; error?: string; mail?: string; downSince?: string;
}

export default function StatusTab({ ctx }: { ctx: AgencyCtx }) {
  const { isPolish } = ctx;
  const [data, setData] = useState<{ smtp: boolean; services: Svc[] } | null>(null);
  const load = useCallback(async () => {
    const r = await api(ctx, "/api/status/details");
    if (r.ok) setData(r.data);
  }, [ctx.token]);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(isPolish ? "pl-PL" : "en-GB") : "—");
  const mailTxt = (s: Svc) =>
    s.mail === "sent" ? (isPolish ? "mail wysłany" : "email sent")
    : s.mail === "failed" ? (isPolish ? "mail nie wyszedł" : "email failed")
    : s.mail === "not_configured" ? (isPolish ? "SMTP nie skonfigurowane – tylko znacznik w panelu" : "SMTP not configured – panel marker only") : "";

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          {isPolish ? "Status usług" : "Service status"}
        </h2>
        <button type="button" onClick={load} className="p-2 rounded-lg border border-slate-200 cursor-pointer" aria-label={isPolish ? "Odśwież" : "Refresh"}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {isPolish
          ? "Sprawdzanie co 5 minut. Alert (mail na contact@novopix.uk) po 2 kolejnych porażkach oraz mail o odzyskaniu. Panel nie wykryje awarii całego serwera."
          : "Checked every 5 minutes. Alert (email to contact@novopix.uk) after 2 consecutive failures, plus a recovery email. The panel cannot detect a whole-server outage."}
      </p>
      {data && !data.smtp && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          {isPolish ? "SMTP nie skonfigurowane – awarie widać tylko tutaj (czerwony znacznik)." : "SMTP not configured – outages are only shown here (red marker)."}
        </p>
      )}
      <ul className="space-y-2">
        {(data?.services || []).map((s) => (
          <li key={s.id} className={`rounded-xl border p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${s.ok === false ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
            <span className="flex items-center gap-2 font-bold text-slate-900">
              <span className={`w-2.5 h-2.5 rounded-full ${s.ok === true ? "bg-emerald-500" : s.ok === false ? "bg-rose-600" : "bg-slate-300"}`} />
              {isPolish ? s.labelPl : s.labelEn}
              <span className="font-mono font-normal text-slate-500 truncate">{s.url}</span>
            </span>
            <span className="text-slate-600">
              {s.ok === true ? "OK" : s.ok === false ? (isPolish ? "NIE OK" : "NOT OK") : (isPolish ? "brak danych" : "no data")}
              {s.httpStatus ? ` · HTTP ${s.httpStatus}` : ""}{s.responseMs ? ` · ${s.responseMs} ms` : ""}
              {s.consecutiveFails > 0 ? ` · ${isPolish ? "porażki" : "fails"}: ${s.consecutiveFails}` : ""}
              {mailTxt(s) ? ` · ${mailTxt(s)}` : ""} · {fmt(s.lastCheck)}
            </span>
          </li>
        ))}
        {!data && <li className="text-xs text-slate-500">{isPolish ? "Ładowanie…" : "Loading…"}</li>}
      </ul>
    </div>
  );
}
