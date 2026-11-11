import { Bell, Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function MonitoringTab({ app }: { app: AppState }) {
  const {
    checkingDomainId,
    handleAddMonitorDomain,
    handleCheckMonitoredDomain,
    handleDeleteMonitoredDomain,
    handleMarkAlertsSeen,
    handleRunPsi,
    isPolish,
    monitoredDomains,
    newMonitorClient,
    newMonitorInterval,
    newMonitorUrl,
    setNewMonitorClient,
    setNewMonitorInterval,
    setNewMonitorUrl,
    unseenAlerts,
  } = app;
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-600" />
                      <span>
                        {isPolish ? "Monitoring stron i alerty" : "Website monitoring & alerts"}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {isPolish
                        ? "Cykliczne pomiary HTTP/HTML według wybranego interwału oraz jeden pomiar Google PageSpeed dziennie na domenę. Gdy strona nie odpowiada lub wynik spadnie poniżej progu, pojawi się alert w panelu i mail na contact@novopix.uk (jeśli SMTP jest skonfigurowane). Brak pomiaru jest pokazywany jako „brak pomiaru”."
                        : "Periodic HTTP/HTML checks at the chosen interval plus one Google PageSpeed measurement per domain per day. When a site does not respond or the score drops below the threshold, an alert appears in the panel and an email goes to contact@novopix.uk (if SMTP is configured). Missing measurements are shown as “not measured”."}
                    </p>
                  </div>
                </div>

                {/* Add Domain Form */}
                <form onSubmit={handleAddMonitorDomain} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={newMonitorUrl}
                    onChange={(e) => setNewMonitorUrl(e.target.value)}
                    placeholder={isPolish ? "Domena (np. sklepklienta.pl)" : "Domain (e.g. client.com)"}
                    className="sm:col-span-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                  <input
                    type="text"
                    value={newMonitorClient}
                    onChange={(e) => setNewMonitorClient(e.target.value)}
                    placeholder={isPolish ? "Nazwa klienta" : "Client Name"}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <select
                    value={newMonitorInterval}
                    onChange={(e) => setNewMonitorInterval(e.target.value as "5m" | "15m" | "60m" | "daily" | "weekly")}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="5m">{isPolish ? "Co 5 minut (24/7 Live)" : "Every 5 min"}</option>
                    <option value="15m">{isPolish ? "Co 15 minut (24/7)" : "Every 15 min"}</option>
                    <option value="60m">{isPolish ? "Co 1 godzinę" : "Hourly Check"}</option>
                    <option value="daily">{isPolish ? "Skan Codziennie (24h)" : "Daily Check"}</option>
                    <option value="weekly">{isPolish ? "Skan Co Tydzień" : "Weekly Check"}</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPolish ? "Dodaj do Monitoringu" : "Add to Watchlist"}</span>
                  </button>
                </form>
              </div>

              {unseenAlerts.length > 0 && (
                <div role="alert" className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 space-y-2" data-testid="alerts-panel">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold text-rose-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                      {isPolish ? `Nowe alerty (${unseenAlerts.length})` : `New alerts (${unseenAlerts.length})`}
                    </div>
                    <button type="button" onClick={handleMarkAlertsSeen} className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-lg text-xs font-bold cursor-pointer">
                      {isPolish ? "Oznacz jako przeczytane" : "Mark as read"}
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {unseenAlerts.slice(0, 10).map((a) => (
                      <li key={a.id} className="text-xs text-rose-900">
                        <span className="font-mono font-bold">{a.domain}</span> · {new Date(a.timestamp).toLocaleString(isPolish ? "pl-PL" : "en-GB")} — {a.message}{" "}
                        <span className="text-[10px] font-bold text-rose-700">
                          {a.emailed === "sent"
                            ? isPolish ? "[mail wysłany na contact@novopix.uk]" : "[email sent to contact@novopix.uk]"
                            : a.emailed === "failed"
                            ? isPolish ? "[mail nie został wysłany: błąd SMTP]" : "[email failed: SMTP error]"
                            : isPolish ? "[mail nie wysłany: SMTP nie skonfigurowane]" : "[email not sent: SMTP not configured]"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Monitored Domains Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {monitoredDomains.map((dom) => (
                  <div key={dom.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          {dom.clientName} · <span className="font-mono text-[10px] text-slate-400">[{dom.interval}]</span>
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            dom.status === "healthy" ? "text-emerald-700" : dom.status === "warning" ? "text-amber-700" : "text-rose-700"
                          }`}
                        >
                          {dom.status === "healthy" ? (isPolish ? "W normie" : "Healthy") : dom.status === "warning" ? (isPolish ? "Spadek wyniku" : "Warning") : (isPolish ? "ALERT PROGOWY!" : "ALERT!")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-mono font-bold text-slate-900 truncate">{dom.domain}</div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          (dom.httpStatus ?? 200) >= 200 && (dom.httpStatus ?? 200) < 300
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          HTTP {dom.httpStatus ?? 200}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">WebScore</div>
                          <div className="text-base font-mono font-extrabold text-slate-900 tabular-nums">{dom.lastScore}/100</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">Real Uptime</div>
                          <div className="text-base font-mono font-extrabold text-emerald-700 tabular-nums">{dom.uptimePercent}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[10px] text-slate-500">TTFB</div>
                          <div className="text-base font-mono font-extrabold text-slate-900 tabular-nums">{dom.responseTimeMs}ms</div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>{isPolish ? "Historia pomiarów" : "Recent checks"}</span>
                          <span>{isPolish ? `Próg alertu: < ${dom.threshold}` : `Alert threshold: < ${dom.threshold}`}</span>
                        </div>
                        <div className="h-12 flex items-end gap-1.5 pt-2 border-b border-slate-100">
                          {dom.history.map((h, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className={`w-full rounded-t ${h.score >= dom.threshold ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ height: `${Math.max(10, Math.round(h.score * 0.36))}px` }}
                              />
                              <span className="text-[9px] font-mono text-slate-400 tabular-nums">{h.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2" data-testid="psi-line">
                        <span className="font-bold">Google PageSpeed ({isPolish ? "telefon" : "mobile"}): </span>
                        {dom.psi && dom.psi.status === "live_lighthouse" ? (
                          <span className="font-mono font-bold">
                            {dom.psi.overall}/100 · {new Date(dom.psi.at).toLocaleDateString(isPolish ? "pl-PL" : "en-GB")}
                          </span>
                        ) : dom.psi ? (
                          <span className="text-amber-800 font-bold">
                            {isPolish ? "brak pomiaru" : "not measured"} ({new Date(dom.psi.at).toLocaleDateString(isPolish ? "pl-PL" : "en-GB")}{dom.psi.error ? `: ${dom.psi.error}` : ""})
                          </span>
                        ) : (
                          <span className="text-slate-500">{isPolish ? "jeszcze nie mierzono (1 pomiar dziennie)" : "not measured yet (1 per day)"}</span>
                        )}
                      </div>

                      {dom.alertsLog && dom.alertsLog.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <div className="text-[10px] font-bold text-rose-700 uppercase">
                            {isPolish ? "Ostatni Alert Systemowy:" : "Latest Alert:"}
                          </div>
                          <div className="text-[11px] bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2 font-mono leading-snug">
                            {dom.alertsLog[0].message}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCheckMonitoredDomain(dom.id)}
                        disabled={checkingDomainId === dom.id}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingDomainId === dom.id ? "animate-spin" : ""}`} />
                        <span>{isPolish ? "Sprawdź Teraz" : "Run Check"}</span>
                      </button>
                      <button
                        onClick={() => handleRunPsi(dom.id)}
                        disabled={checkingDomainId === dom.id}
                        className="px-2.5 py-2 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                        title={isPolish ? "Pomiar Google PageSpeed (maks. 1 dziennie na domenę)" : "Google PageSpeed measurement (max 1/day per domain)"}
                      >
                        PageSpeed
                      </button>
                      <button
                        onClick={() => handleDeleteMonitoredDomain(dom.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 cursor-pointer"
                        title={isPolish ? "Usuń z monitoringu" : "Remove"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  );
}
