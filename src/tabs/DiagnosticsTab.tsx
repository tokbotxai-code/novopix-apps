import React from "react";
import type { AppState } from "../state/useAppState";


export default function DiagnosticsTab({ app }: { app: AppState }) {
  const {
    currentReport,
    handleRunScan,
    isPolish,
    liveSeo,
    setUrlInput,
  } = app;
  return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                {isPolish ? "Diagnostyka Indeksowania i Struktury On-Page (Wyliczona dla Badanej Domeny)" : "Dynamic Crawl Diagnostics & On-Page Matrix"}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Wykryte linki / podstrony" : "Detected Links / Pages"}</div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tabular-nums">{currentReport.demo?.crawledPages.totalPages ?? 32}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Zdrowe (200 OK)" : "Healthy (200 OK)"}</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.healthy ?? 28}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Przekierowania (301/302)" : "Redirects"}</div>
                  <div className="text-2xl font-mono font-extrabold text-amber-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.redirects ?? 1}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Ostrzeżenia On-Page" : "On-Page Warnings"}</div>
                  <div className="text-2xl font-mono font-extrabold text-amber-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.warnings ?? 3}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">{isPolish ? "Błędy Indeksowania" : "Indexing Errors"}</div>
                  <div className="text-2xl font-mono font-extrabold text-rose-600 mt-1 tabular-nums">{currentReport.demo?.crawledPages.pagesWithErrors ?? 0}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">{isPolish ? "Element On-Page SEO" : "On-Page Element"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Brakujące" : "Missing"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Za krótkie" : "Too Short"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Za długie / Nadmiar" : "Too Long / Excess"}</th>
                      <th className="py-2.5 px-3 text-right">{isPolish ? "Status" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono tabular-nums">
                    {(currentReport.demo?.onPageSeoAnalysis || []).map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-right">{row.missing}</td>
                        <td className="py-3 px-3 text-right">{row.tooShort}</td>
                        <td className="py-3 px-3 text-right">{row.tooLong}</td>
                        <td className="py-3 px-3 text-right font-sans font-bold">
                          <span className={row.status === "good" ? "text-emerald-700" : row.status === "warning" ? "text-amber-700" : "text-rose-700"}>
                            {row.status === "good" ? (isPolish ? "W normie" : "Good") : row.status === "warning" ? (isPolish ? "Do poprawy" : "Warning") : (isPolish ? "Błąd" : "Error")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Discovered Subpages from Live HTML & Sitemap.xml — with 1-Click Subpage Audit */}
              {liveSeo.discoveredSubpages && liveSeo.discoveredSubpages.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isPolish
                          ? "Wykryte Podstrony i Adresy URL (Drzewo DOM + Sitemap.xml)"
                          : "Discovered Subpages & Internal URLs (DOM + Sitemap.xml)"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isPolish
                          ? "Kliknij dowolną podstronę, aby wykonać dla niej pełny audyt szybkości, SEO i WCAG 2.1 AA."
                          : "Click any discovered subpage to run a full speed, SEO, and WCAG 2.1 AA audit on it."}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      {liveSeo.discoveredSubpages.length} URL
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">{isPolish ? "Adres URL Podstrony" : "Subpage URL"}</th>
                          <th className="py-2 px-3">{isPolish ? "Źródło Wykrycia" : "Discovery Source"}</th>
                          <th className="py-2 px-3">{isPolish ? "Status HTTP" : "HTTP Status"}</th>
                          <th className="py-2 px-3 text-right">{isPolish ? "Akcja" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-mono">
                        {liveSeo.discoveredSubpages.map((sub, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-900 truncate max-w-md">{sub.url}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {sub.source === "sitemap" ? "sitemap.xml" : "HTML <a href>"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              <span
                                className={
                                  sub.status >= 200 && sub.status < 300
                                    ? "text-emerald-700"
                                    : sub.status >= 300 && sub.status < 400
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }
                              >
                                {sub.status === 0
                                  ? "TIMEOUT / ERR"
                                  : sub.status >= 200 && sub.status < 300
                                  ? `${sub.status} OK`
                                  : sub.status >= 300 && sub.status < 400
                                  ? `${sub.status} REDIRECT`
                                  : `${sub.status} ERROR`}
                              </span>
                              {sub.responseTimeMs ? (
                                <span className="ml-2 text-[10px] text-slate-400 font-normal">({sub.responseTimeMs}ms)</span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              <button
                                type="button"
                                onClick={() => {
                                  setUrlInput(sub.url);
                                  handleRunScan(sub.url);
                                }}
                                className="px-2.5 py-1 bg-[#0b2230] hover:bg-[#174460] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                {isPolish ? "Skanuj podstronę →" : "Audit Subpage →"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
  );
}
