import React, { useEffect, useState } from "react";
import type { AgencyCtx } from "../agencyTypes";
import { api } from "./agencyApi";
import { TEMPLATE_LABELS, TemplateId, buildTemplate } from "../utils/mailTemplates";

export type SendSeed = { template: TemplateId; offerLines?: string[] };

export default function SendReportModal({ ctx, open, onClose, scanId, host, score, issues, seed, defaultEmail, htmlLang }: {
  ctx: AgencyCtx; open: boolean; onClose: () => void; scanId?: string; host: string; score: number | null; issues: string[]; seed: SendSeed; defaultEmail?: string; htmlLang?: string | null;
}) {
  const pl = ctx.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  // Język maila proponujemy z faktów (a Ty możesz go zmienić): 1) język strony (atrybut lang), 2) końcówka .pl, 3) język panelu.
  const suggested: { lang: "pl" | "en"; why: string } = (() => {
    const hl = (htmlLang || "").toLowerCase();
    if (hl.startsWith("pl")) return { lang: "pl", why: pl ? "strona ma język polski (lang=pl)" : "the site is in Polish (lang=pl)" };
    if (hl.startsWith("en")) return { lang: "en", why: pl ? "strona ma język angielski (lang=en)" : "the site is in English (lang=en)" };
    if (/\.pl$/.test(host)) return { lang: "pl", why: pl ? "domena kończy się na .pl" : "the domain ends in .pl" };
    if (/\.(uk|com|org|net|eu)$/.test(host)) return { lang: "en", why: pl ? "domena nie jest polska" : "the domain is not Polish" };
    return { lang: pl ? "pl" : "en", why: pl ? "brak danych o stronie, użyto języka panelu" : "no data about the site, the panel language is used" };
  })();
  const [lang, setLang] = useState<"pl" | "en">(suggested.lang);
  useEffect(() => { if (open) setLang(suggested.lang); }, [open, suggested.lang, host]);
  const [tpl, setTpl] = useState<TemplateId>(seed.template);
  const [email, setEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (open) { setTpl(seed.template); setMsg(null); } }, [open, seed.template]);
  useEffect(() => {
    if (!open) return;
    const t = buildTemplate(tpl, { host, score, issues, lang, offerLines: seed.offerLines });
    setSubject(t.subject); setMessage(t.body);
  }, [open, tpl, lang, host, score, issues.join("|"), (seed.offerLines || []).join("|")]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const send = async () => {
    setBusy(true); setMsg(null);
    const r = await api<any>(ctx, "/api/agency/send-scan-report", { method: "POST", body: { scanId, email, lang, subject, message } });
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: L("Wysłano. Raport PDF jest w załączniku.", "Sent. The PDF report is attached.") }); }
    else setMsg({ ok: false, text: r.data?.error || L("Nie udało się wysłać.", "Could not send.") });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={L("Wyślij raport klientowi", "Send the report to the client")} data-testid="send-modal">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900">{L("Wyślij raport klientowi", "Send the report to the client")}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 text-sm font-bold cursor-pointer" aria-label={L("Zamknij", "Close")}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="space-y-1"><span className="font-bold text-slate-700">{L("Szablon", "Template")}</span>
            <select value={tpl} onChange={(e) => setTpl(e.target.value as TemplateId)} className="w-full border border-slate-200 rounded-lg px-2 py-2">
              {(Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((k) => <option key={k} value={k}>{TEMPLATE_LABELS[k][pl ? "pl" : "en"]}</option>)}
            </select></label>
          <label className="space-y-1"><span className="font-bold text-slate-700">{L("Język", "Language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as "pl" | "en")} className="w-full border border-slate-200 rounded-lg px-2 py-2"><option value="pl">Polski</option><option value="en">English</option></select>
            <span className="block text-[11px] text-slate-500" data-testid="lang-hint">{L("Zaproponowano", "Suggested")}: {suggested.lang.toUpperCase()}, {suggested.why}.</span></label>
        </div>
        <label className="block text-xs space-y-1"><span className="font-bold text-slate-700">{L("E-mail klienta", "Client e-mail")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="klient@firma.pl" /></label>
        <label className="block text-xs space-y-1"><span className="font-bold text-slate-700">{L("Temat", "Subject")}</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></label>
        <label className="block text-xs space-y-1"><span className="font-bold text-slate-700">{L("Treść (możesz edytować)", "Message (editable)")}</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={11} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-sans" /></label>
        <p className="text-[11px] text-slate-500">{L("Raport PDF zostanie dołączony. Mail wysyła się z contact@novopix.uk.", "The PDF report is attached. The e-mail is sent from contact@novopix.uk.")}</p>
        {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.text}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer">{L("Zamknij", "Close")}</button>
          <button type="button" disabled={busy || !email.trim() || !scanId} onClick={send} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer">{busy ? L("Wysyłam…", "Sending…") : L("Wyślij", "Send")}</button>
        </div>
      </div>
    </div>
  );
}
