import { AuditReport } from "../scannerTypes";

export function ScoreGaugeCard({
  title,
  score,
  status,
  isPolish,
}: {
  title: string;
  score: number | null;
  status: string;
  isPolish: boolean;
}) {
  const displayVal = score ?? 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayVal / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between items-center text-center relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</div>
      <div className="relative my-4 flex items-center justify-center">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="9" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={displayVal >= 85 ? "#059669" : displayVal >= 60 ? "#d97706" : "#e11d48"}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-black text-slate-900 tracking-tight tabular-nums">{score === null ? "—" : displayVal}</span>
          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-extrabold uppercase">{status}</span>
        </div>
      </div>
      <div className="text-[11px] font-medium text-slate-400">{isPolish ? "Hybrydowy pomiar PSI + HTML" : "Hybrid PSI + HTML Score"}</div>
    </div>
  );
}

export function ScoreBarCard({
  title,
  score,
  breakdown,
  isPolish,
}: {
  title: string;
  score: number | null;
  breakdown: Array<{ label: string; val: number | null }>;
  isPolish: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-black">{score ?? "N/A"}/100</span>
        </div>
        <div className="space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>{item.label}</span>
                <span className="font-mono tabular-nums text-slate-900 font-bold">{item.val ?? "N/A"}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${item.val ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] font-medium text-slate-400 mt-4">{isPolish ? "Weryfikacja Google Lighthouse" : "Google Lighthouse Verified"}</div>
    </div>
  );
}

export function ProgressSummaryCard({ report, isPolish }: { report: AuditReport; isPolish: boolean }) {
  const { completePercent, warnings, passedChecks, criticalIssues, totalChecks } = report.auditProgress;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">{isPolish ? "Bilans Testów Audytu" : "Audit Checks Summary"}</h3>
        <div className="text-2xl font-mono font-extrabold text-slate-900 mb-1.5 tabular-nums">{completePercent}%</div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completePercent}%` }} />
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Zaliczone testy" : "Passed checks"}</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">{passedChecks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Do optymalizacji" : "Warnings"}</span>
            <span className="font-mono font-bold text-amber-600 tabular-nums">{warnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Nieudane kontrole" : "Failed checks"}</span>
            <span className="font-mono font-bold text-rose-600 tabular-nums">{criticalIssues}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isPolish ? "Wszystkie reguły" : "Total rules"}</span>
            <span className="font-mono font-bold text-slate-800 tabular-nums">{totalChecks}</span>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-3">{isPolish ? "Zaliczone + do optymalizacji + krytyczne = wszystkie reguły" : "Passed + warnings + critical = total rules"}</div>
    </div>
  );
}
