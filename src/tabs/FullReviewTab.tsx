import React, { useEffect, useRef, useState } from "react";
import type { AgencyCtx } from "../agencyTypes";
import { api } from "./agencyApi";

type Row = { url: string; status: number; ms: number; title: string; description: boolean; h1: number; imgNoAlt: number; noindex: boolean };

// Pełny przegląd domeny (tylko agencja): podstrony, linki, subdomeny i poczta. Wynik tylko z publicznie dostępnych danych.
export default function FullReviewTab({ ctx, initialUrl }: { ctx: AgencyCtx; initialUrl: string }) {
  const pl = ctx.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const [url, setUrl] = useState(initialUrl || "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const poll = async (id: string) => {
    const r = await api<any>(ctx, `/api/agency/full-review/${id}`);
    if (!r.ok) { setBusy(false); setErr(r.data?.error || L("Błąd połączenia.", "Connection error.")); return; }
    setProgress(r.data.progress || "");
    if (r.data.done) {
      setBusy(false);
      if (r.data.error) setErr(r.data.error); else setRes(r.data.result);
      return;
    }
    timer.current = window.setTimeout(() => poll(id), 2500);
  };
  const start = async () => {
    setErr(""); setRes(null); setBusy(true); setProgress("start");
    const r = await api<any>(ctx, "/api/agency/full-review", { method: "POST", body: { url } });
    if (!r.ok) { setBusy(false); setErr(r.data?.error || L("Nie udało się uruchomić przeglądu.", "Could not start the review.")); return; }
    poll(r.data.jobId);
  };
  const stepLabel: Record<string, string> = {
    start: L("Start", "Starting"),
    external: L("Sprawdzam linki zewnętrzne", "Checking external links"),
    subdomains: L("Sprawdzam subdomeny", "Checking subdomains"),
    mail: L("Sprawdzam pocztę i certyfikat", "Checking email and certificate"),
  };
  const stepText = progress.startsWith("pages") ? `${L("Przeglądam podstrony", "Crawling pages")} ${progress.replace("pages", "").trim()}` : stepLabel[progress] || progress;
  const s = res?.summary;
  const Stat = ({ n, label, bad }: { n: number; label: string; bad?: boolean }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <div className={`text-2xl font-mono font-extrabold tabular-nums ${bad && n > 0 ? "text-rose-600" : "text-slate-900"}`}>{n}</div>
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
    </div>
  );
  const mail = res?.domainHealth?.mail;
  return (
    <div className="space-y-5" data-testid="full-review">
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <h2 className="text-base font-extrabold text-slate-900 font-heading">{L("Pełny przegląd domeny", "Full domain review")}</h2>
        <p className="text-xs text-slate-600 mt-1">{L("Przechodzi po podstronach, linkach, popularnych subdomenach i poczcie domeny. Tylko publicznie dostępne dane, do 40 podstron, trwa zwykle 1–2 minuty.", "Walks through pages, links, common subdomains and the domain's email setup. Public data only, up to 40 pages, usually takes 1–2 minutes.")}</p>
        <form className="flex flex-col sm:flex-row gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); if (!busy && url.trim()) start(); }}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="firma.pl" className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono" aria-label={L("Adres domeny", "Domain")} />
          <button type="submit" disabled={busy || !url.trim()} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer">
            {busy ? L("Przeglądam…", "Reviewing…") : L("Uruchom przegląd", "Run review")}
          </button>
        </form>
        {busy && <p className="text-xs text-slate-600 mt-2" role="status">{stepText}</p>}
        {err && <p className="text-xs text-rose-700 mt-2" role="alert">{err}</p>}
      </div>
      {res && s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <Stat n={s.pages} label={L("Przejrzane strony", "Pages reviewed")} />
            <Stat n={s.broken} label={L("Błędne podstrony", "Broken pages")} bad />
            <Stat n={s.brokenExternal} label={L("Błędne linki zewn.", "Broken external links")} bad />
            <Stat n={s.noTitle} label={L("Bez tytułu", "No title")} bad />
            <Stat n={s.noDescription} label={L("Bez opisu meta", "No meta description")} bad />
            <Stat n={s.noH1} label={L("Bez nagłówka H1", "No H1")} bad />
            <Stat n={s.imgNoAlt} label={L("Obrazy bez ALT", "Images without ALT")} bad />
            <Stat n={s.duplicateTitles} label={L("Powtórzone tytuły", "Duplicate titles")} bad />
            <Stat n={s.subdomainsFound} label={L("Znalezione subdomeny", "Subdomains found")} />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 overflow-x-auto">
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">{L("Strony", "Pages")}</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-2">URL</th><th className="pr-2">HTTP</th><th className="pr-2">ms</th><th className="pr-2">{L("Tytuł", "Title")}</th><th className="pr-2">H1</th><th>ALT</th></tr></thead>
              <tbody>
                {(res.pages as Row[]).map((p) => (
                  <tr key={p.url} className="border-t border-slate-100">
                    <td className="py-1 pr-2 font-mono break-all">{p.url.replace(/^https?:\/\//, "")}</td>
                    <td className={`pr-2 font-bold ${p.status >= 400 || p.status === 0 ? "text-rose-600" : "text-emerald-700"}`}>{p.status || "–"}</td>
                    <td className="pr-2 tabular-nums">{p.ms}</td>
                    <td className="pr-2">{p.title || <span className="text-rose-600">{L("brak", "none")}</span>}</td>
                    <td className="pr-2">{p.h1}</td>
                    <td>{p.imgNoAlt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(res.broken.length > 0 || res.brokenExternal.length > 0) && (
            <div className="bg-white rounded-2xl p-5 border border-rose-200">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">{L("Błędne linki", "Broken links")}</h3>
              <ul className="text-xs space-y-1 font-mono break-all">
                {res.broken.map((b: any) => <li key={b.url}>{b.status || "–"} · {b.url}{b.from ? ` ← ${b.from}` : ""}</li>)}
                {res.brokenExternal.map((b: any) => <li key={b.url}>{b.status || "–"} · {b.url} ({L("zewnętrzny", "external")})</li>)}
              </ul>
            </div>
          )}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">{L("Subdomeny", "Subdomains")}</h3>
            {res.subdomains.length === 0 ? <p className="text-xs text-slate-600">{L("Nie znaleziono popularnych subdomen.", "No common subdomains found.")}</p> : (
              <ul className="text-xs space-y-1 font-mono">{res.subdomains.map((d: any) => <li key={d.name}>{d.name} · {d.ip} · HTTP {d.status || "–"}</li>)}</ul>
            )}
            <p className="text-[11px] text-slate-500 mt-2">{L("To popularne nazwy sprawdzone przez DNS, nie pełna lista subdomen.", "These are common names checked through DNS, not a complete list of subdomains.")}</p>
          </div>
          {mail && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">{L("Poczta domeny", "Domain email")}</h3>
              <ul className="text-xs space-y-1">
                {(["mx", "spf", "dmarc", "dkim"] as const).map((k) => (
                  <li key={k}><strong>{k.toUpperCase()}</strong>: {mail[k] === "found" ? L("jest", "found") : mail[k] === "not_found" ? L("nie znaleziono", "not found") : L("nie udało się sprawdzić", "could not check")}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-slate-500">{L("To przegląd automatyczny. Nie jest certyfikatem ani audytem zgodności (WCAG), ani opinią prawną.", "This is an automated review. It is not a certificate, a compliance (WCAG) audit or legal advice.")}</p>
        </>
      )}
    </div>
  );
}
