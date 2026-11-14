import React, { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, ShieldCheck, Download, Link2, Mail } from "lucide-react";
import { AgencyCtx, ServicePackage, packageLabel } from "../agencyTypes";
import { api, downloadFile } from "./agencyApi";

const inputCls = "w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs";
const btnCls = "px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const GROUPS: Array<[ServicePackage["group"], string, string]> = [
  ["web", "Strony", "Websites"],
  ["speed", "Szybkość", "Speed"],
  ["a11y", "Dostępność", "Accessibility"],
  ["app", "Aplikacje", "Applications"],
  ["care", "Opieka (abonament)", "Care (subscription)"],
  ["other", "Inne", "Other"],
];

function PackageRow({ ctx, p, onSaved, onDeleted }: { ctx: AgencyCtx; p: ServicePackage; onSaved: (p: ServicePackage) => void; onDeleted: (id: string) => void }) {
  const pl = ctx.isPolish;
  const [d, setD] = useState<ServicePackage>(p);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<ServicePackage>) => {
    setD({ ...d, ...patch });
    setDirty(true);
  };
  const save = async () => {
    setBusy(true);
    setErr(null);
    const r = await api<any>(ctx, `/api/packages/${d.id}`, { method: "PUT", body: d });
    setBusy(false);
    if (r.ok) {
      setD(r.data.package);
      setDirty(false);
      onSaved(r.data.package);
      ctx.showToast(pl ? "Pakiet zapisany." : "Package saved.");
    } else setErr(r.data.error || "Error");
  };
  const remove = async () => {
    if (!window.confirm(pl ? `Usunąć pakiet „${d.namePl}”? Istniejące oferty zachowają swoją treść.` : `Delete package “${d.nameEn}”? Existing offers keep their text.`)) return;
    const r = await api<any>(ctx, `/api/packages/${d.id}`, { method: "DELETE" });
    if (r.ok) onDeleted(d.id);
    else setErr(r.data.error || "Error");
  };
  return (
    <div className={`border rounded-xl p-3 space-y-2 bg-white ${d.active ? "border-slate-200" : "border-slate-200 opacity-70"}`} data-testid="package-row">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100" data-testid="package-summary">
        <div className="font-extrabold text-sm text-slate-900">{pl ? d.namePl : d.nameEn}{!d.active && <span className="ml-2 text-[10px] font-bold text-slate-500">{pl ? "(wyłączony)" : "(inactive)"}</span>}</div>
        <div className="flex gap-2 text-xs font-extrabold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">PLN: {packageLabel(d, "pl", "PLN")}</span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">GBP: {packageLabel(d, "en", "GBP")}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Nazwa (PL)" : "Name (PL)"}
          <input className={inputCls + " mt-1"} value={d.namePl} onChange={(e) => set({ namePl: e.target.value })} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Nazwa (EN)" : "Name (EN)"}
          <input className={inputCls + " mt-1"} value={d.nameEn} onChange={(e) => set({ nameEn: e.target.value })} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Cena netto PLN" : "Net price PLN"}
          <input type="number" min={0} className={inputCls + " mt-1"} value={d.pricePln} onChange={(e) => set({ pricePln: Number(e.target.value) })} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Cena netto GBP" : "Net price GBP"}
          <input type="number" min={0} className={inputCls + " mt-1"} value={d.priceGbp} onChange={(e) => set({ priceGbp: Number(e.target.value) })} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Zakres (PL)" : "Scope (PL)"}
          <textarea rows={2} className={inputCls + " mt-1"} value={d.scopePl} onChange={(e) => set({ scopePl: e.target.value })} placeholder={pl ? "Uzupełnij – pojawi się w ofercie" : "Fill in – appears in the offer"} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Zakres (EN)" : "Scope (EN)"}
          <textarea rows={2} className={inputCls + " mt-1"} value={d.scopeEn} onChange={(e) => set({ scopeEn: e.target.value })} placeholder={pl ? "Uzupełnij – pojawi się w ofercie EN" : "Fill in – appears in the EN offer"} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Czas realizacji (PL)" : "Delivery time (PL)"}
          <input className={inputCls + " mt-1"} value={d.durationPl} onChange={(e) => set({ durationPl: e.target.value })} />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          {pl ? "Czas realizacji (EN)" : "Delivery time (EN)"}
          <input className={inputCls + " mt-1"} value={d.durationEn} onChange={(e) => set({ durationEn: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-700">
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={d.priceFrom} onChange={(e) => set({ priceFrom: e.target.checked })} /> {pl ? "Cena „od”" : "“From” price"}</label>
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={d.recurring} onChange={(e) => set({ recurring: e.target.checked })} /> {pl ? "Miesięcznie" : "Monthly"}</label>
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} /> {pl ? "Aktywny w wycenie" : "Active in quotes"}</label>
        
        <span className="flex gap-2 ml-auto">
          <button type="button" onClick={save} disabled={!dirty || busy} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
            <Save className="w-3.5 h-3.5" /> {pl ? "Zapisz" : "Save"}
          </button>
          <button type="button" onClick={remove} className={btnCls + " bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"} aria-label={pl ? "Usuń pakiet" : "Delete package"}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>
      {err && <div role="alert" className="text-[11px] font-bold text-rose-700">{err}</div>}
    </div>
  );
}

interface ReportReq {
  id: string;
  email: string;
  website: string;
  lang: "pl" | "en";
  timestamp: string;
  overallScore: number | null;
  measurementStatus?: string;
  consentAt?: string;
  status: "pending" | "sent" | "rejected";
  approvedBy?: string;
  sentAt?: string;
  auto?: boolean;
}

function ReportRequests({ ctx }: { ctx: AgencyCtx }) {
  const pl = ctx.isPolish;
  const [rows, setRows] = useState<ReportReq[]>([]);
  const [auto, setAuto] = useState(false);
  const [smtp, setSmtp] = useState(false);
  const [reviewer, setReviewer] = useState<string>(() => {
    try {
      return localStorage.getItem("novopix_reviewer") || "";
    } catch {
      return "";
    }
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<any>(ctx, "/api/report-requests");
    if (r.ok) {
      setRows(r.data.requests || []);
      setAuto(!!r.data.autoSendReport);
      setSmtp(!!r.data.smtp);
    }
  }, [ctx.token]);
  useEffect(() => {
    load();
  }, [load]);

  const toggleAuto = async (on: boolean) => {
    setMsg(null);
    const r = await api<any>(ctx, "/api/settings/auto-report", { method: "PUT", body: { autoSendReport: on } });
    if (r.ok) setAuto(on);
    else setMsg(r.data.error || "Error");
  };
  const act = async (id: string, what: "approve" | "mark-sent" | "reject") => {
    setBusy(id + what);
    setMsg(null);
    const r = await api<any>(ctx, `/api/report-requests/${id}/${what}`, { method: "POST", body: { reviewer } });
    setBusy(null);
    if (what === "approve") {
      try {
        localStorage.setItem("novopix_reviewer", reviewer);
      } catch {}
    }
    if (!r.ok) setMsg(r.data.error || "Error");
    else ctx.showToast(pl ? "Gotowe." : "Done.");
    load();
  };

  return (
    <section className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3" data-testid="report-requests">
      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
        <Mail className="w-4 h-4 text-emerald-600" /> {pl ? "Prośby o raport PDF ze skanera publicznego" : "PDF report requests from the public scanner"}
      </h3>
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
        <label className={`flex items-center gap-2 text-xs font-bold ${smtp ? "text-slate-800 cursor-pointer" : "text-slate-400"}`}>
          <input type="checkbox" checked={auto} disabled={!smtp} onChange={(e) => toggleAuto(e.target.checked)} data-testid="auto-report-toggle" />
          {pl ? "Tryb automatyczny: wysyłaj raport od razu po zgłoszeniu (bez zatwierdzania)" : "Automatic mode: send the report right after the request (no approval)"}
        </label>
        <p className="text-[11px] text-slate-500">
          {smtp
            ? pl ? "Domyślnie wyłączony – raport czeka na Twoje zatwierdzenie, a powiadomienie trafia na contact@novopix.uk." : "Off by default – the report waits for your approval and a notification goes to contact@novopix.uk."
            : pl ? "SMTP nie skonfigurowane – tryb automatyczny niedostępny. Raport zatwierdzasz i wysyłasz ręcznie (pobierz PDF)." : "SMTP not configured – automatic mode unavailable. Approve the report and send it manually (download the PDF)."}
        </p>
      </div>
      <input className={inputCls} placeholder={pl ? "Imię i nazwisko zatwierdzającego" : "Reviewer full name"} value={reviewer} onChange={(e) => setReviewer(e.target.value)} aria-label={pl ? "Imię i nazwisko zatwierdzającego" : "Reviewer full name"} />
      {msg && <div role="alert" className="text-[11px] font-bold text-rose-700">{msg}</div>}
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">{pl ? "Brak próśb o raport." : "No report requests yet."}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl p-3 text-xs space-y-2" data-testid="report-request">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-900 break-all">{r.website} · {r.email}</div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === "sent" ? "bg-emerald-100 text-emerald-800" : r.status === "rejected" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
                  {r.status === "sent" ? (r.auto ? (pl ? "Wysłano automatycznie" : "Sent automatically") : pl ? "Wysłano" : "Sent") : r.status === "rejected" ? (pl ? "Odrzucono" : "Rejected") : r.approvedBy ? (pl ? `Zatwierdzono (${r.approvedBy}) – do wysłania` : `Approved (${r.approvedBy}) – to send`) : pl ? "Czeka na zatwierdzenie" : "Awaiting approval"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(r.timestamp).toLocaleString(pl ? "pl-PL" : "en-GB")} · {pl ? "język raportu" : "report language"}: {r.lang.toUpperCase()} · {pl ? "wynik" : "score"}: {r.overallScore ?? (pl ? "brak pomiaru" : "not measured")} · {pl ? "zgoda zapisana" : "consent stored"}: {r.consentAt ? new Date(r.consentAt).toLocaleString(pl ? "pl-PL" : "en-GB") : "–"}
              </div>
              {r.status !== "rejected" && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => downloadFile(ctx, `/api/report-requests/${r.id}/report.pdf`, "report.pdf")} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
                    <Download className="w-3.5 h-3.5" /> {pl ? "Podgląd PDF" : "Preview PDF"}
                  </button>
                  {r.status === "pending" && (
                    <>
                      <button type="button" onClick={() => act(r.id, "approve")} disabled={reviewer.trim().length < 3 || busy === r.id + "approve"} className={btnCls + " bg-emerald-600 hover:bg-emerald-700 text-white"}>
                        <ShieldCheck className="w-3.5 h-3.5" /> {smtp ? (pl ? "Zatwierdzam i wysyłam" : "Approve & send") : pl ? "Zatwierdzam" : "Approve"}
                      </button>
                      {r.approvedBy && !smtp && (
                        <button type="button" onClick={() => act(r.id, "mark-sent")} className={btnCls + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}>
                          {pl ? "Oznacz jako wysłane ręcznie" : "Mark as sent manually"}
                        </button>
                      )}
                      <button type="button" onClick={() => act(r.id, "reject")} className={btnCls + " bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"}>
                        {pl ? "Odrzuć" : "Reject"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SharedLinks({ ctx }: { ctx: AgencyCtx }) {
  const pl = ctx.isPolish;
  const [rows, setRows] = useState<Array<{ id: string; host: string; createdAt: string; expiresAt: string; overallScore: number | null }>>([]);
  const load = useCallback(async () => {
    const r = await api<any>(ctx, "/api/results");
    if (r.ok) setRows(r.data.results || []);
  }, [ctx.token]);
  useEffect(() => {
    load();
  }, [load]);
  const del = async (id: string) => {
    if (!window.confirm(pl ? "Usunąć ten publiczny link?" : "Delete this public link?")) return;
    const r = await api<any>(ctx, `/api/results/${id}`, { method: "DELETE" });
    if (r.ok) load();
  };
  return (
    <section className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3" data-testid="shared-links">
      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-emerald-600" /> {pl ? "Publiczne linki do wyników (/r/…)" : "Public result links (/r/…)"}
      </h3>
      <p className="text-[11px] text-slate-500">{pl ? "Statyczne strony bez danych osobowych, noindex, wygasają po 90 dniach. Tu możesz usunąć dowolny link." : "Static pages without personal data, noindex, expire after 90 days. You can delete any link here."}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">{pl ? "Brak aktywnych linków." : "No active links."}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-800 break-all">{r.host}</span>
              <span className="text-slate-500">{new Date(r.createdAt).toLocaleDateString(pl ? "pl-PL" : "en-GB")} → {new Date(r.expiresAt).toLocaleDateString(pl ? "pl-PL" : "en-GB")} · {r.overallScore ?? (pl ? "brak pomiaru" : "not measured")}</span>
              <button type="button" onClick={() => del(r.id)} className={btnCls + " bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"}>
                <Trash2 className="w-3.5 h-3.5" /> {pl ? "Usuń" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PackagesTab({ ctx }: { ctx: AgencyCtx }) {
  const pl = ctx.isPolish;
  const [pkgs, setPkgs] = useState<ServicePackage[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await api<any>(ctx, "/api/packages");
      if (r.ok) setPkgs(r.data.packages || []);
      else setErr(r.data.error || "Error");
    })();
  }, [ctx.token]);

  const add = async () => {
    const r = await api<any>(ctx, "/api/packages", { method: "POST", body: { namePl: "Nowy pakiet", nameEn: "New package", pricePln: 0, priceGbp: 0, group: "other" } });
    if (r.ok) setPkgs((prev) => [...prev, r.data.package]);
    else setErr(r.data.error || "Error");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-heading">{pl ? "Pakiety o stałej cenie" : "Fixed-price packages"}</h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              {pl
                ? "Ceny netto. Oferta w języku PL liczy w PLN, w języku EN – w GBP. Pakiet wybierasz w wycenie klienta zamiast godzin. Zakres i czas realizacji uzupełnij sam – tylko to, co tu wpiszesz, trafia do oferty."
                : "Net prices. PL offers use PLN, EN offers use GBP. Pick a package in the client quote instead of hours. Fill in scope and delivery time yourself – only what you enter here goes into the offer."}
            </p>
          </div>
          <button type="button" onClick={add} className={btnCls + " bg-slate-900 text-white hover:bg-slate-800"}>
            <Plus className="w-4 h-4" /> {pl ? "Dodaj pakiet" : "Add package"}
          </button>
        </div>
        {err && <div role="alert" className="text-xs font-bold text-rose-700">{err}</div>}
        {GROUPS.map(([g, gpl, gen]) => {
          const list = pkgs.filter((p) => p.group === g).sort((a, b) => a.sort - b.sort);
          if (!list.length) return null;
          return (
            <div key={g} className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{pl ? gpl : gen}</h3>
              {list.map((p) => (
                <PackageRow key={p.id} ctx={ctx} p={p} onSaved={(n) => setPkgs((prev) => prev.map((x) => (x.id === n.id ? n : x)))} onDeleted={(id) => setPkgs((prev) => prev.filter((x) => x.id !== id))} />
              ))}
            </div>
          );
        })}
      </section>
      <ReportRequests ctx={ctx} />
      <SharedLinks ctx={ctx} />
    </div>
  );
}
