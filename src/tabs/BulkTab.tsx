import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, ListOrdered, Plus, Upload } from "lucide-react";
import type { AgencyCtx, BulkScanJob, BulkScanRow } from "../agencyTypes";
import type { AgencyClient } from "../scannerTypes";
import { api, downloadFile } from "./agencyApi";

const MAX_URLS = 20;
const DOMAIN_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

// Wyciąga adresy z wklejonego tekstu lub pliku CSV (dowolny separator: nowa linia, przecinek, średnik, tabulator, spacja).
export function extractDomains(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of text.split(/[\s,;"']+/)) {
    const t = tok.trim().replace(/^﻿/, "");
    if (!t || !DOMAIN_RE.test(t)) continue;
    const key = t.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

const cell = (v: number | null | undefined, pl: boolean) =>
  typeof v === "number" ? <span className="font-mono font-bold tabular-nums">{v}</span> : <span className="text-amber-700 text-[10px] font-bold">{pl ? "brak pomiaru" : "not measured"}</span>;

function sortRows(rows: BulkScanRow[]): BulkScanRow[] {
  const w = (r: BulkScanRow) => (r.status === "done" ? (typeof r.rankScore === "number" ? r.rankScore : 500) : r.status === "failed" ? 900 : 700);
  return [...rows].sort((a, b) => w(a) - w(b));
}

export default function BulkTab({ ctx, onClientAdded }: { ctx: AgencyCtx; onClientAdded: (c: AgencyClient) => void }) {
  const pl = ctx.isPolish;
  const [text, setText] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [job, setJob] = useState<BulkScanJob | null>(null);
  const [jobs, setJobs] = useState<BulkScanJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => extractDomains(text), [text]);

  const running = !!job && !job.finishedAt;

  useEffect(() => {
    let alive = true;
    api<any>(ctx, "/api/bulk-scan").then((r) => {
      if (!alive || !r.ok) return;
      setJobs(r.data.jobs || []);
      if (r.data.jobs?.[0]) setJob(r.data.jobs[0]);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!job || job.finishedAt) return;
    const t = setInterval(async () => {
      const r = await api<any>(ctx, `/api/bulk-scan/${job.id}`);
      if (r.ok) {
        setJob(r.data.job);
        if (r.data.job.finishedAt) setJobs((prev) => [r.data.job, ...prev.filter((j) => j.id !== r.data.job.id)]);
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.finishedAt]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 500_000) {
      setErr(pl ? "Plik jest za duży (maks. 500 KB)." : "File too large (max 500 KB).");
      return;
    }
    const t = await f.text();
    setText((prev) => (prev ? prev + "\n" : "") + t);
    if (fileRef.current) fileRef.current.value = "";
  };

  const start = async () => {
    setErr(null);
    setInfo(null);
    setBusy(true);
    const r = await api<any>(ctx, "/api/bulk-scan", { method: "POST", body: { urls: urls.slice(0, MAX_URLS), strategy } });
    setBusy(false);
    if (!r.ok) {
      setErr(r.data.error || (pl ? "Nie udało się uruchomić skanowania." : "Could not start the scan."));
      return;
    }
    if (urls.length > MAX_URLS) setInfo(pl ? `Wczytano ${urls.length} adresów, przeskanowane zostanie pierwsze ${MAX_URLS}.` : `${urls.length} addresses loaded; only the first ${MAX_URLS} will be scanned.`);
    else if (r.data.skipped?.length) setInfo((pl ? "Pominięto: " : "Skipped: ") + r.data.skipped.join("; "));
    const j = await api<any>(ctx, `/api/bulk-scan/${r.data.jobId}`);
    if (j.ok) setJob(j.data.job);
  };

  const addToCrm = async (row: BulkScanRow) => {
    if (!job) return;
    const r = await api<any>(ctx, `/api/bulk-scan/${job.id}/add-to-crm`, { method: "POST", body: { url: row.url } });
    if (r.ok || r.status === 409) {
      if (r.ok) onClientAdded(r.data.client);
      setJob({ ...job, rows: job.rows.map((x) => (x.url === row.url ? { ...x, addedToCrm: r.data.client?.id || "x" } : x)) });
      ctx.showToast(r.ok ? (pl ? "Dodano do CRM jako lead." : "Added to CRM as a lead.") : pl ? "Ta domena już jest w CRM." : "This domain is already in the CRM.");
    } else setErr(r.data.error || "Error");
  };

  const rows = job ? sortRows(job.rows) : [];
  const doneCount = job ? job.rows.filter((r) => r.status === "done" || r.status === "failed").length : 0;
  const btn = "px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-emerald-600" />
          <span>{pl ? "Skan wielu stron i ranking leadów" : "Bulk scan & lead ranking"}</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {pl
            ? `Wklej listę domen (po jednej w linii) albo wczytaj plik CSV/TXT. Skanujemy do ${MAX_URLS} adresów naraz (po 2 równolegle), z tą samą ochroną przed adresami wewnętrznymi co pojedynczy skan. Wynik to ranking od najsłabszej strony; wybrane strony dodasz do CRM jednym kliknięciem.`
            : `Paste a list of domains (one per line) or load a CSV/TXT file. Up to ${MAX_URLS} addresses are scanned at once (2 in parallel) with the same protection against internal addresses as a single scan. The result is a ranking from the weakest site; add chosen sites to the CRM in one click.`}
        </p>
        <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed" data-testid="lead-source-note">
          {pl
            ? "Wyszukiwanie firm po branży i mieście nie jest dostępne: wymaga zewnętrznego źródła danych o firmach (np. oficjalny rejestr lub licencjonowana baza), którego tu nie ma. Nie scrapujemy wyników Google. Dlatego lista domen pochodzi od Ciebie."
            : "Searching companies by industry and city is not available: it requires an external business data source (e.g. an official registry or a licensed database), which is not connected here. We do not scrape Google results. The list of domains therefore comes from you."}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={pl ? "firma1.pl\nfirma2.pl\nhttps://firma3.com" : "company1.com\ncompany2.com"}
          aria-label={pl ? "Lista domen" : "Domain list"}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700" data-testid="url-count">
            {pl ? `Wykryto adresów: ${urls.length}` : `Addresses detected: ${urls.length}`}
            {urls.length > MAX_URLS ? (pl ? ` (limit ${MAX_URLS})` : ` (limit ${MAX_URLS})`) : ""}
          </span>
          <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="csv-input" />
          <button type="button" onClick={() => fileRef.current?.click()} className={btn + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
            <Upload className="w-4 h-4" />
            <span>{pl ? "Wczytaj CSV/TXT" : "Load CSV/TXT"}</span>
          </button>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" aria-label="Strategy">
            <option value="mobile">{pl ? "Telefon" : "Mobile"}</option>
            <option value="desktop">{pl ? "Komputer" : "Desktop"}</option>
          </select>
          <button type="button" onClick={start} disabled={busy || running || urls.length === 0} className={btn + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
            <Plus className="w-4 h-4" />
            <span>{running ? (pl ? "Skanowanie w toku…" : "Scanning…") : pl ? "Skanuj listę" : "Scan list"}</span>
          </button>
        </div>
        {err && (
          <div role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
            {err}
          </div>
        )}
        {info && <div className="text-[11px] text-slate-600">{info}</div>}
      </div>

      {job && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4" data-testid="bulk-results">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{pl ? "Ranking: od najsłabszej strony" : "Ranking: weakest first"}</h3>
              <div className="text-[11px] text-slate-500">
                {new Date(job.createdAt).toLocaleString(pl ? "pl-PL" : "en-GB")} · {pl ? `zmierzono ${doneCount} z ${job.rows.length}` : `measured ${doneCount} of ${job.rows.length}`}
                {running ? "…" : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {jobs.length > 1 && (
                <select
                  value={job.id}
                  onChange={(e) => {
                    const j = jobs.find((x) => x.id === e.target.value);
                    if (j) setJob(j);
                  }}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                  aria-label={pl ? "Wcześniejsze skany" : "Earlier scans"}
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {new Date(j.createdAt).toLocaleString(pl ? "pl-PL" : "en-GB")} ({j.rows.length})
                    </option>
                  ))}
                </select>
              )}
              <button type="button" onClick={() => downloadFile(ctx, `/api/bulk-scan/${job.id}/csv`, "skan.csv")} className={btn + " bg-slate-900 text-white hover:bg-slate-800"}>
                <Download className="w-4 h-4" />
                <span>{pl ? "Eksport CSV" : "Export CSV"}</span>
              </button>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round((doneCount / Math.max(1, job.rows.length)) * 100)}%` }} />
          </div>

          {/* Komputer: tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">{pl ? "Adres" : "Address"}</th>
                  <th className="py-2 px-2">{pl ? "Ranking" : "Rank score"}</th>
                  <th className="py-2 px-2">{pl ? "Wydajność" : "Perf."}</th>
                  <th className="py-2 px-2">SEO</th>
                  <th className="py-2 px-2">{pl ? "Dostęp." : "A11y"}</th>
                  <th className="py-2 px-2">{pl ? "Dobre prakt." : "Best pr."}</th>
                  <th className="py-2 px-2">{pl ? "Problemy" : "Issues"}</th>
                  <th className="py-2 px-2 text-right">{pl ? "Akcja" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={r.url}>
                    <td className="py-2.5 px-2 text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900 break-all">
                      {r.url.replace(/^https?:\/\//, "")}
                      {r.measurementStatus === "partial_html" && <span className="ml-1.5 text-[10px] font-sans font-bold text-slate-500">({pl ? "pomiar częściowy" : "partial"})</span>}
                    </td>
                    {r.status === "done" ? (
                      <>
                        <td className="py-2.5 px-2">{cell(r.rankScore, pl)}</td>
                        <td className="py-2.5 px-2">{cell(r.performance, pl)}</td>
                        <td className="py-2.5 px-2">{cell(r.seo, pl)}</td>
                        <td className="py-2.5 px-2">{cell(r.accessibility, pl)}</td>
                        <td className="py-2.5 px-2">{cell(r.bestPractices, pl)}</td>
                        <td className="py-2.5 px-2 font-mono">{r.issuesCount}</td>
                      </>
                    ) : (
                      <td colSpan={6} className={`py-2.5 px-2 text-[11px] font-bold ${r.status === "failed" ? "text-rose-700" : "text-slate-500"}`}>
                        {r.status === "failed" ? (pl ? `błąd: ${r.error || "brak pomiaru"}` : `error: ${r.error || "not measured"}`) : r.status === "running" ? (pl ? "mierzę…" : "measuring…") : pl ? "w kolejce" : "queued"}
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-right">
                      {r.status === "done" &&
                        (r.addedToCrm ? (
                          <span className="text-[11px] font-bold text-emerald-700">{pl ? "W CRM" : "In CRM"}</span>
                        ) : (
                          <button type="button" onClick={() => addToCrm(r)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer">
                            {pl ? "Dodaj do CRM" : "Add to CRM"}
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Telefon: karty */}
          <ul className="md:hidden space-y-2">
            {rows.map((r, i) => (
              <li key={r.url} className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 break-all">
                    {i + 1}. {r.url.replace(/^https?:\/\//, "")}
                  </span>
                </div>
                {r.status === "done" ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    <div>{pl ? "Ranking" : "Rank"}: {cell(r.rankScore, pl)}</div>
                    <div>{pl ? "Wydajność" : "Perf."}: {cell(r.performance, pl)}</div>
                    <div>SEO: {cell(r.seo, pl)}</div>
                    <div>{pl ? "Dostępność" : "A11y"}: {cell(r.accessibility, pl)}</div>
                    <div>{pl ? "Dobre praktyki" : "Best pr."}: {cell(r.bestPractices, pl)}</div>
                    <div>{pl ? "Problemy" : "Issues"}: <span className="font-mono font-bold">{r.issuesCount}</span></div>
                  </div>
                ) : (
                  <div className={`text-[11px] font-bold ${r.status === "failed" ? "text-rose-700" : "text-slate-500"}`}>
                    {r.status === "failed" ? (pl ? `błąd: ${r.error || "brak pomiaru"}` : `error: ${r.error || "not measured"}`) : r.status === "running" ? (pl ? "mierzę…" : "measuring…") : pl ? "w kolejce" : "queued"}
                  </div>
                )}
                {r.status === "done" &&
                  (r.addedToCrm ? (
                    <div className="text-[11px] font-bold text-emerald-700">{pl ? "W CRM" : "In CRM"}</div>
                  ) : (
                    <button type="button" onClick={() => addToCrm(r)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                      {pl ? "Dodaj do CRM" : "Add to CRM"}
                    </button>
                  ))}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-500">
            {pl
              ? "Ranking = wynik ogólny; przy pomiarze częściowym (bez Lighthouse) średnia z zmierzonych kategorii. „Brak pomiaru” oznacza, że wartości nie zmierzono. To wstępna kontrola automatyczna, nie certyfikat."
              : "Rank = overall score; for partial measurements (no Lighthouse) the average of measured categories. “Not measured” means the value was not measured. Preliminary automated check, not a certificate."}
          </p>
        </div>
      )}
    </div>
  );
}
