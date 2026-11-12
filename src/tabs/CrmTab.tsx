import { Activity, Download, Phone, Plus, Trash2 } from "lucide-react";
import { AgencyClient } from "../scannerTypes";
import React, { Suspense, lazy } from "react";
import { STAGES } from "../agencyTypes";
import type { AppState } from "../state/useAppState";
const ClientWorkflow = lazy(() => import("./ClientWorkflow"));

export default function CrmTab({ app }: { app: AppState }) {
  const {
    agencyCtx,
    crmClients,
    crmFilter,
    crmMetrics,
    currency,
    expandedClientId,
    filteredCrmClients,
    handleAddCrmClient,
    handleDeleteClient,
    handleDownloadCrmBackup,
    handleRunScan,
    handleUpdateClientStatus,
    isPolish,
    monitoredDomains,
    newClientCompany,
    newClientEmail,
    newClientName,
    newClientPhone,
    newClientWeb,
    setActiveTab,
    setClientName,
    setCrmFilter,
    setExpandedClientId,
    setMonitoredDomains,
    setNewClientCompany,
    setNewClientEmail,
    setNewClientName,
    setNewClientPhone,
    setNewClientWeb,
    setUrlInput,
    updateClientLocal,
  } = app;
  return (
            <div className="space-y-6">
              {/* CRM KPI Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Wartość Lejka Zleceń (Jednorazowe)" : "Total Pipeline Value"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">
                    {crmMetrics.pipelineVal.toLocaleString()} {currency}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Stały Przychód Abonamentowy (MRR)" : "Monthly Retainer MRR"}</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">
                    +{crmMetrics.monthlyMrr.toLocaleString()} {currency}/mc
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Aktywni Klienci i Leady" : "Total Clients & Leads"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{crmMetrics.count}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{isPolish ? "Średni Wynik Domen Klientów" : "Avg Client WebScore"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{crmMetrics.avgScore === null ? "—" : `${crmMetrics.avgScore}/100`}</div>
                </div>
              </div>

              {/* Add Client Form */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {isPolish ? "Dodaj Nowego Klienta do Lejka Agencji" : "Add New Client to Agency Pipeline"}
                </h3>
                <form onSubmit={handleAddCrmClient} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder={isPolish ? "Imię i nazwisko" : "Contact Name"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder={isPolish ? "Nazwa firmy" : "Company"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={newClientWeb}
                    onChange={(e) => setNewClientWeb(e.target.value)}
                    placeholder={isPolish ? "Domena (np. firma.pl)" : "Website URL"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="E-mail"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder={isPolish ? "Telefon" : "Phone"}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPolish ? "Dodaj Klienta" : "Add Client"}</span>
                  </button>
                </form>
              </div>

              {/* CRM Table with Pipeline Filter */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isPolish ? "Baza Klientów, Statusy Wdrożeń i Historia Kontaktu" : "Client Pipeline & Activity Log"}
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownloadCrmBackup}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isPolish ? "Eksportuj Backup JSON" : "Export Backup JSON"}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: "all", label: isPolish ? "Wszyscy" : "All" },
                      ...STAGES.map((st) => ({ id: st.id as string, label: isPolish ? st.pl : st.en })),
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setCrmFilter(st.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          crmFilter === st.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">{isPolish ? "Klient / Firma / Historia" : "Client / Company / Log"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Domena, CMS & Wynik" : "Domain, CMS & Score"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Etap Sprzedaży" : "Pipeline Stage"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Wycena Wdrożenia" : "Contract Value"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Akcje" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCrmClients.map((client) => (
                        <React.Fragment key={client.id}>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{client.company}</div>
                            <div className="text-[11px] text-slate-500">
                              {client.name} · {client.email} · {client.phone}
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                              aria-expanded={expandedClientId === client.id}
                              className="mt-2 px-3.5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-extrabold hover:bg-emerald-800 cursor-pointer"
                            >
                              {isPolish ? "Utwórz ofertę naprawy (skan → oferta → mail)" : "Create repair offer (scan → offer → email)"}
                            </button>
                            {client.notes && <div className="text-[11px] text-slate-600 mt-1 italic">{client.notes}</div>}
                            {client.activityLog && client.activityLog.length > 0 && (
                              <div className="mt-1.5 text-[10px] font-mono text-slate-500 bg-slate-100/80 px-2 py-1 rounded border border-slate-200/70">
                                {new Date(client.activityLog[0].timestamp).toLocaleDateString()} — {client.activityLog[0].summary}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <div className="font-bold text-slate-800">{client.website}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold">
                              WebScore: {client.lastScore}/100 {client.cmsTech ? `· ${client.cmsTech}` : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <select
                              value={client.status}
                              onChange={(e) => handleUpdateClientStatus(client.id, e.target.value as AgencyClient["status"])}
                              className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                            >
                              {STAGES.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {isPolish ? st.pl : st.en}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                            <div className="font-extrabold text-slate-900">{client.contractValue} {currency}</div>
                            <div className="text-[11px] text-slate-500">+{client.retainerFee || 300} {currency}/mc</div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setUrlInput(client.website);
                                  setClientName(client.company);
                                  setActiveTab("overview");
                                  handleRunScan(client.website);
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                              >
                                {isPolish ? "Skanuj" : "Scan"}
                              </button>
                              <button
                                onClick={() => {
                                  setClientName(client.company);
                                  setActiveTab("reports");
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                {isPolish ? "Oferta" : "Proposal"}
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                {expandedClientId && crmClients.find((c) => c.id === expandedClientId) && (
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isPolish ? "Ścieżka klienta" : "Client workflow"}: {crmClients.find((c) => c.id === expandedClientId)!.company}
                    </div>
                    <Suspense fallback={<div className="text-xs text-slate-500 p-3">{isPolish ? "Ładowanie…" : "Loading…"}</div>}>
                      <ClientWorkflow
                        key={expandedClientId}
                        ctx={agencyCtx}
                        client={crmClients.find((c) => c.id === expandedClientId)!}
                        monitored={monitoredDomains.find((d) => {
                          const cl = crmClients.find((c) => c.id === expandedClientId)!;
                          const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
                          return d.clientId === cl.id || norm(d.domain) === norm(cl.website);
                        })}
                        onClientUpdated={updateClientLocal}
                        onMonitoringAdded={(d) => setMonitoredDomains((prev) => [d, ...prev.filter((x) => x.id !== d.id)])}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
  );
}
