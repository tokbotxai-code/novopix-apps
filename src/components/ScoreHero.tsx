import React from "react";
import type { AuditReport } from "../scannerTypes";

function useCountUp(target: number, ms = 900) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const tone = (n: number) => (n >= 90 ? "#10b981" : n >= 50 ? "#f59e0b" : "#ef4444");

function Ring({ value, label, size = 96, stroke = 9, na = false }: { value: number; label: string; size?: number; stroke?: number; na?: boolean }) {
  const shown = useCountUp(na ? 0 : value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone(value)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - shown / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-extrabold text-slate-900 tabular-nums" style={{ fontSize: size / 3.4 }}>
          {na ? "–" : shown}
        </div>
      </div>
      <div className="text-[11px] font-bold text-slate-600 text-center">{label}{na ? " (brak pomiaru / not measured)" : ""}</div>
    </div>
  );
}

export function ScoreHero({ report, isPolish }: { report: AuditReport; isPolish: boolean }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const live = report.measurementStatus === "live_lighthouse";
  const hist = report.demo?.scoreHistory || [];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;
  const delta = prev && typeof prev.overall === "number" ? (report.overallScore || 0) - prev.overall : null;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200" data-testid="score-hero">
      <style>{"@media (prefers-reduced-motion: no-preference){[data-testid=score-hero] circle:nth-child(2){transition:stroke-dashoffset .2s linear}}"}</style>
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
        <Ring value={report.overallScore || 0} na={!live} label={L("Wynik ogólny", "Overall score")} size={132} stroke={12} />
        <div className="grid grid-cols-3 gap-4 flex-1 w-full">
          <Ring value={report.categories.performance || 0} na={!live} label={L("Szybkość", "Speed")} />
          <Ring value={report.categories.seo || 0} label="SEO" />
          <Ring value={report.categories.accessibility || 0} na={!live} label={L("Dostępność (automaty)", "Accessibility (automated)")} />
        </div>
      </div>
      {prev && delta !== null && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs" data-testid="before-after">
          <span className="font-bold text-slate-700">{L("Przed i po", "Before and after")}</span>
          <span className="font-mono font-extrabold tabular-nums text-slate-500">{prev.overall}/100</span>
          <span aria-hidden="true">→</span>
          <span className="font-mono font-extrabold tabular-nums text-slate-900">{report.overallScore}/100</span>
          <span className={`font-bold ${delta > 0 ? "text-emerald-700" : delta < 0 ? "text-rose-700" : "text-slate-500"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
          <span className="text-slate-500">{L("(poprzedni skan tej strony w tej sesji)", "(previous scan of this site in this session)")}</span>
        </div>
      )}
    </div>
  );
}
