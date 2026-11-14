import React, { useEffect, useState } from "react";
import type { AppState } from "../state/useAppState";
import { computeVerdict, verdictExtras } from "../utils/verdict";

// Panel „Growth Scanner”: układ 1:1 ze wzoru (miernik wyniku, SEO, dostępność, postęp audytu, lista działań, analityka wzrostu).
// Wszystkie liczby pochodzą z prawdziwego pomiaru; czego nie mierzymy (ruch, konwersje), tego nie pokazujemy.
const tone = (v: number | null) => (v === null ? "#9fb3d9" : v >= 90 ? "#34d399" : v >= 50 ? "#fbbf24" : "#f87171");

function Gauge({ v }: { v: number | null }) {
  const r = 78, cx = 100, cy = 98;
  const pt = (a: number) => `${cx + r * Math.cos(Math.PI - a)} ${cy - r * Math.sin(Math.PI - a)}`;
  const arc = (to: number) => `M ${pt(0)} A ${r} ${r} 0 0 1 ${pt(to)}`;
  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[240px] mx-auto" role="img" aria-label={v === null ? "brak pomiaru" : `${v} / 100`}>
      <defs><linearGradient id="gd-g" x1="0" x2="1"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#34d399" /></linearGradient></defs>
      <path d={arc(Math.PI - 0.001)} fill="none" stroke="#9fb3d9" strokeOpacity=".25" strokeWidth="15" strokeLinecap="round" />
      {v !== null && v > 0 && <path d={arc(Math.max(0.03, (Math.min(100, v) / 100) * Math.PI - 0.001))} fill="none" stroke={v >= 90 ? "url(#gd-g)" : tone(v)} strokeWidth="15" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,.45))" }} />}
      <text x="100" y="86" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff">{v === null ? "–" : v}</text>
      <text x="100" y="106" textAnchor="middle" fontSize="13" fill="#9fb3d9">/100</text>
    </svg>
  );
}

function Ring({ v, label, sub, size = 62 }: { v: number | null; label: string; sub?: string; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" role="img" aria-label={`${label}: ${v === null ? "–" : v + "%"}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#9fb3d9" strokeOpacity=".22" strokeWidth="6" />
        {v !== null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone(v)} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, v) / 100)} style={{ filter: `drop-shadow(0 0 4px ${tone(v)}88)` }} />}
        <text x={size / 2} y={size / 2} transform={`rotate(90 ${size / 2} ${size / 2})`} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="800" fill="#fff">{v === null ? "–" : `${v}%`}</text>
      </svg>
      <div className="min-w-0"><div className="text-[13px] font-semibold text-white leading-tight">{label}</div>{sub && <div className="text-[11px] text-sky-200/70 leading-tight">{sub}</div>}</div>
    </div>
  );
}

function RingV({ v, label, size = 58 }: { v: number | null; label: string; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${label}: ${v === null ? "–" : v + "%"}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#9fb3d9" strokeOpacity=".22" strokeWidth="6" />
        {v !== null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone(v)} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, v) / 100)} style={{ filter: `drop-shadow(0 0 4px ${tone(v)}88)` }} />}
        <text x={size / 2} y={size / 2} transform={`rotate(90 ${size / 2} ${size / 2})`} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill="#fff">{v === null ? "–" : `${v}%`}</text>
      </svg>
      <div className="text-[12px] font-semibold text-white text-center leading-tight">{label}</div>
    </div>
  );
}

function Card({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-sky-400/30 bg-[#0e1a3a]/80 backdrop-blur p-4 shadow-[0_0_24px_rgba(56,120,255,.12)] ${className}`}>
      <h3 className="text-[15px] font-bold text-white">{title}</h3>
      {sub && <div className="text-[11px] text-sky-200/70 -mt-0.5 mb-1">{sub}</div>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Bar({ label, value, frac, color }: { label: string; value: string; frac: number; color: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[12px] text-sky-100"><span>{label}</span><strong className="text-white tabular-nums">{value}</strong></div>
      <div className="h-2 rounded-full bg-white/10 mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, frac * 100))}%`, background: color, boxShadow: `0 0 8px ${color}99` }} /></div>
    </div>
  );
}

export default function GrowthDashboard({ app }: { app: AppState }) {
  const { currentReport: r, liveSeo, isPolish: pl } = app;
  const L = (a: string, b: string) => (pl ? a : b);
  const host = (r.finalUrl || r.scannedUrl || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const [serverHist, setServerHist] = useState<Array<{ at: string; overall: number | null }>>([]);
  useEffect(() => {
    if (!app.agencyToken || app.isPublicMode) { setServerHist([]); return; }
    let live = true;
    fetch(`/api/agency/history?host=${encodeURIComponent(host.replace(/^www\./, ""))}`, { headers: app.getAuthHeaders() }).then((x) => x.json()).then((j) => live && setServerHist(j.history || [])).catch(() => {});
    return () => { live = false; };
  }, [host, r.scanId, app.agencyToken]);
  const sess = (r.demo?.scoreHistory || []).map((p: any) => ({ at: p.date, overall: p.overall as number }));
  const pts = ((serverHist.length >= 2 ? serverHist : sess).filter((p) => typeof p.overall === "number")) as Array<{ at: string; overall: number }>;
  const prev = pts.length >= 2 ? pts[pts.length - 2].overall : null;
  const delta = (cur: number | null, p: number | null) => (cur !== null && p !== null ? cur - p : null);
  const verdict = computeVerdict(r, app.audience, pl, verdictExtras(app.contactCheck, app.domainHealth, pl));
  const c = r.categories;
  const ap = r.auditProgress;
  const scanned = r.scannedAt ? new Date(r.scannedAt).toLocaleString(pl ? "pl-PL" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "";
  const label = r.overallScore === null ? L("brak pomiaru", "not measured") : r.overallScore >= 90 ? L("Dobrze", "Healthy") : r.overallScore >= 65 ? L("Do poprawy", "Room to improve") : L("Wymaga uwagi", "Needs attention");
  const byCat = { perf: 0, seo: 0, a11y: 0, other: 0 };
  r.issues.forEach((i) => { const k = (i.category || "").toLowerCase(); if (k.includes("perf")) byCat.perf++; else if (k.includes("seo")) byCat.seo++; else if (k.includes("access")) byCat.a11y++; else byCat.other++; });
  const donut = [[L("Szybkość", "Speed"), byCat.perf, "#22d3ee"], ["SEO", byCat.seo, "#34d399"], [L("Dostępność", "Accessibility"), byCat.a11y, "#fbbf24"], [L("Inne", "Other"), byCat.other, "#8b5cf6"]] as Array<[string, number, string]>;
  const totalIssues = donut.reduce((a, d) => a + d[1], 0);
  const R = 34, CC = 2 * Math.PI * R;
  let acc = 0;
  const W = 300, H = 110;
  const xs = (i: number) => 26 + (pts.length > 1 ? (i / (pts.length - 1)) * (W - 40) : 0), ys = (v: number) => H - 14 - (v / 100) * (H - 28);
  const cwv = [["LCP", r.coreWebVitals.lcp], ["INP", r.coreWebVitals.inp], ["CLS", r.coreWebVitals.cls]] as const;
  const actions = (r.recommendedActions || []).slice(0, 4);
  const noteWcag = L("To nie ocena zgodności z WCAG ani certyfikat.", "Not a WCAG conformance rating or certificate.");
  const d1 = delta(r.overallScore, prev);
  return (
    <div className="rounded-3xl p-4 sm:p-6 text-white" style={{ background: "radial-gradient(1200px 500px at 85% -10%, #3b2a8f55, transparent), linear-gradient(135deg, #070d24, #10224f 60%, #0b1a3d)" }} data-testid="growth-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold">{L("Przegląd wzrostu i audytu strony", "Website Growth & Audit Overview")}</h2>
          <div className="text-xs text-sky-100/80 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono">{host}</span><span>·</span><span>{L("Status", "Status")}:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${tone(r.overallScore)}33`, color: tone(r.overallScore) }}>{label}</span>
            {scanned && <><span>·</span><span>{L("Ostatni skan", "Last scan")}: {scanned}</span></>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          {[L("Audyt i diagnoza", "Audit & diagnose"), L("Śledź wzrost", "Track growth"), L("Konkretne rekomendacje", "Actionable recommendations")].map((t) => <span key={t} className="px-3 py-1 rounded-full border border-sky-400/40 bg-white/5">✓ {t}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title={L("Wynik ogólny strony", "Overall Website Score")}>
              <Gauge v={r.overallScore} />
              <div className="text-center -mt-1"><span className="px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: `${tone(r.overallScore)}33`, color: tone(r.overallScore) }}>{label}</span></div>
              <dl className="mt-3 space-y-1 text-[12px]">
                {[[L("Szybkość", "Speed"), c.performance], ["SEO", c.seo], [L("Dostępność (automaty)", "Accessibility (automated)"), c.accessibility], [L("Dobre praktyki", "Best practices"), c.bestPractices]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between"><dt className="text-sky-100/80">{k as string}</dt><dd className="font-bold tabular-nums" style={{ color: tone(v as number | null) }}>{v === null ? L("brak pomiaru", "not measured") : `${v}/100`}</dd></div>
                ))}
                {d1 !== null && <div className="flex justify-between"><dt className="text-sky-100/80">{L("Zmiana od poprzedniego pomiaru", "Change since the last measurement")}</dt><dd className={`font-bold ${d1 >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{d1 > 0 ? `+${d1}` : d1}</dd></div>}
              </dl>
            </Card>
            <Card title={L("Status SEO", "SEO Status")}>
              <div className="space-y-3 pt-1">
                <Ring v={c.seo} label={L("Techniczne SEO", "Technical SEO")} sub={L("wynik Lighthouse", "Lighthouse score")} />
                <Ring v={r.seoBreakdown.crawlability} label={L("Indeksowanie", "Crawlability")} sub={L("robots, mapa strony, canonical", "robots, sitemap, canonical")} />
                <Ring v={r.seoBreakdown.onPageSeo} label="On-Page SEO" sub={L("tytuł, opis, nagłówki", "title, description, headings")} />
              </div>
            </Card>
            <Card title={L("Dostępność (automaty)", "Accessibility (automated)")} sub={noteWcag}>
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-1">
                {[[L("Kontrast", "Contrast"), r.accessibilityBreakdown.contrast], [L("Nawigacja", "Navigation"), r.accessibilityBreakdown.navigation], [L("Nazwy", "Names"), r.accessibilityBreakdown.names], ["ARIA / ALT", r.accessibilityBreakdown.aria]].map(([k, v]) => (
                  <RingV key={String(k)} v={v as number | null} label={k as string} />
                ))}
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title={L("Postęp audytu", "Audit Progress")}>
              <div className="text-[12px] text-sky-100 mb-1">{ap.completePercent}% {L("zakończone", "complete")}</div>
              <Bar label={L("Zaliczone testy", "Passed checks")} value={String(ap.passedChecks)} frac={ap.totalChecks ? ap.passedChecks / ap.totalChecks : 0} color="#34d399" />
              <Bar label={L("Do optymalizacji", "Warnings")} value={String(ap.warnings)} frac={ap.totalChecks ? ap.warnings / ap.totalChecks : 0} color="#fbbf24" />
              <Bar label={L("Poważniejsze uwagi", "Bigger notes")} value={String(ap.criticalIssues)} frac={ap.totalChecks ? ap.criticalIssues / ap.totalChecks : 0} color="#f87171" />
            </Card>
            <Card title="Core Web Vitals">
              <div className="space-y-2.5 pt-1">
                {cwv.map(([k, m]) => (
                  <div key={k} className="flex items-center justify-between text-[12px]"><span className="font-bold text-white w-10">{k}</span>
                    <span className="text-sky-100/70 flex-1 px-2 truncate">{m.status === "good" ? L("dobrze", "good") : m.status === "poor" ? L("słabo", "poor") : m.status === "needs-improvement" ? L("do poprawy", "needs work") : "–"}</span>
                    <span className="font-bold tabular-nums" style={{ color: m.status === "good" ? "#34d399" : m.status === "poor" ? "#f87171" : "#fbbf24" }}>{String(m.displayValue).replace(/\s*\((pomiar laboratoryjny|lab measurement)\)/, "")}</span></div>
                ))}
                {liveSeo && typeof liveSeo.responseTimeMs === "number" && <div className="flex justify-between text-[12px] pt-1 border-t border-white/10"><span className="text-sky-100/80">{L("Czas odpowiedzi serwera", "Server response time")}</span><strong className="tabular-nums">{liveSeo.responseTimeMs} ms</strong></div>}
              </div>
            </Card>
            <Card title={L("Lista: zalecane działania", "Checklist: Recommended Actions")}>
              <ul className="space-y-2">
                {actions.length === 0 && <li className="text-[12px] text-sky-100/70">{L("Brak zapisanych działań.", "No recorded actions.")}</li>}
                {actions.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="flex items-center gap-2 min-w-0"><span aria-hidden="true" className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${a.status === "checked" ? "bg-emerald-400 border-emerald-400" : "border-sky-300"}`} /><span className="truncate">{a.title}</span></span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${a.status === "checked" ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>{a.status === "checked" ? L("Zrobione", "Checked") : L("Do zrobienia", "Pending")}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <aside className="xl:col-span-4 rounded-2xl border border-sky-400/30 bg-[#0b1636]/70 p-4 space-y-4" aria-label={L("Analityka wzrostu", "Growth Analytics")}>
          <div><h3 className="text-lg font-extrabold">{L("Analityka wzrostu", "Growth Analytics")}</h3><div className="text-[11px] text-sky-200/70">{L("Wyniki strony i historia pomiarów", "Website results and measurement history")}</div></div>
          <div className="rounded-xl border border-sky-400/25 bg-white/5 p-3 grid grid-cols-4 gap-2 items-center">
            <div className="col-span-1 text-center"><div className="mx-auto"><Ring v={r.overallScore} label="" size={64} /></div><div className="text-[10px] text-sky-100/80 -mt-1">{L("Wynik", "Score")}</div></div>
            {[[L("Szybkość", "Speed"), c.performance], ["SEO", c.seo], [L("Dostępność", "Access."), c.accessibility]].map(([k, v]) => (
              <div key={String(k)} className="text-center border-l border-white/10 pl-1"><div className="text-[10px] text-sky-100/70">{k as string}</div><div className="text-xl font-extrabold tabular-nums" style={{ color: tone(v as number | null) }}>{v === null ? "–" : v}</div></div>
            ))}
          </div>
          <div className="rounded-xl border border-sky-400/25 bg-white/5 p-3">
            <div className="text-[13px] font-bold mb-1">{L("Wynik w czasie", "Score over time")}</div>
            {pts.length >= 2 ? (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={L("Wykres wyniku w czasie", "Score over time chart")}>
                {[0, 50, 100].map((g) => <g key={g}><line x1="24" x2={W - 14} y1={ys(g)} y2={ys(g)} stroke="#9fb3d9" strokeOpacity=".2" /><text x="1" y={ys(g) + 3} fontSize="8" fill="#9fb3d9">{g}</text></g>)}
                <polyline points={pts.map((p, i) => `${xs(i)},${ys(p.overall)}`).join(" ")} fill="none" stroke="#34d399" strokeWidth="2.4" style={{ filter: "drop-shadow(0 0 4px #34d399aa)" }} />
                {pts.map((p, i) => <circle key={i} cx={xs(i)} cy={ys(p.overall)} r="3" fill="#34d399" />)}
              </svg>
            ) : <p className="text-[12px] text-sky-100/70 py-6">{L("Wykres pojawi się po drugim pomiarze tej strony.", "The chart appears after a second measurement of this site.")}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <div className="rounded-xl border border-sky-400/25 bg-white/5 p-3">
              <div className="text-[13px] font-bold mb-2">{L("Problemy wg obszaru", "Issues by area")}</div>
              <div className="flex items-center gap-3">
                <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 shrink-0" role="img" aria-label={L("Podział problemów", "Issue split")}>
                  <circle cx="44" cy="44" r={R} fill="none" stroke="#9fb3d9" strokeOpacity=".2" strokeWidth="12" />
                  {totalIssues > 0 && donut.map(([k, n, col]) => { const len = (n / totalIssues) * CC; const el = <circle key={k} cx="44" cy="44" r={R} fill="none" stroke={col} strokeWidth="12" strokeDasharray={`${len} ${CC - len}`} strokeDashoffset={-acc} />; acc += len; return el; })}
                  <text x="44" y="44" transform="rotate(90 44 44)" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="800" fill="#fff">{totalIssues}</text>
                </svg>
                <ul className="text-[11px] space-y-1 flex-1">{donut.map(([k, n, col]) => <li key={k} className="flex justify-between gap-2"><span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: col }} />{k}</span><strong className="tabular-nums">{n}</strong></li>)}</ul>
              </div>
            </div>
            <div className="rounded-xl border border-sky-400/25 bg-white/5 p-3">
              <div className="text-[13px] font-bold mb-2">{L("Największe szanse na poprawę", "Top Growth Opportunities")}</div>
              <ul className="space-y-1.5">
                {(verdict?.items || []).slice(0, 3).map((it) => <li key={it.key} className="flex items-start gap-2 text-[12px]"><span aria-hidden="true" className="mt-0.5 text-emerald-300">✓</span><span><strong>{it.service}</strong> <span className="text-sky-100/70">({it.price})</span></span></li>)}
                {(!verdict || verdict.items.length === 0) && r.issues.slice(0, 3).map((it) => <li key={it.id} className="flex items-start gap-2 text-[12px]"><span aria-hidden="true" className="mt-0.5 text-emerald-300">✓</span><span>{it.title}</span></li>)}
                {(!verdict || verdict.items.length === 0) && r.issues.length === 0 && <li className="text-[12px] text-sky-100/70">{L("Brak wykrytych rzeczy do poprawy.", "Nothing to improve was detected.")}</li>}
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <p className="text-[11px] text-sky-200/60 mt-3">{L("Wyniki pochodzą z pomiaru Google Lighthouse i kontroli kodu strony. To nie jest certyfikat, audyt zgodności (WCAG) ani opinia prawna.", "Results come from a Google Lighthouse measurement and a check of the page code. This is not a certificate, a compliance (WCAG) audit or legal advice.")}</p>
    </div>
  );
}
