import React from "react";

export function ScanProgress({ isPolish, host }: { isPolish: boolean; host: string }) {
  const L = (pl: string, en: string) => (isPolish ? pl : en);
  const [sec, setSec] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-5 no-print" role="status" aria-live="polite" data-testid="scan-progress">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-6 h-6 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <div>
          <div className="font-extrabold text-slate-900">{L("Mierzymy Twoją stronę na telefonie i na komputerze", "We are measuring your site on phone and desktop")}{host ? `: ${host}` : ""}</div>
          <div className="text-sm text-slate-600">{L(`Mija ${sec} s. Pomiar robi Google Lighthouse i zwykle trwa 15–40 sekund. Nie zamykaj tej strony.`, `${sec}s so far. Google Lighthouse does the measuring and it usually takes 15–40 seconds. Please keep this page open.`)}</div>
        </div>
      </div>
      {sec >= 45 && <p className="text-sm text-slate-600 mt-3">{L("Trwa dłużej niż zwykle: Google bywa wolniejszy przy większych stronach. Wynik jeszcze się liczy.", "This is taking longer than usual: Google can be slower on larger sites. The result is still being calculated.")}</p>}
      <p className="text-xs text-slate-500 mt-3">{L("Gdy pomiar się skończy, sprawdzimy jeszcze domenę, pocztę i kontakt, a to zajmie kilka sekund.", "Once the measurement finishes we also check the domain, email and contact, which takes a few seconds.")}</p>
    </div>
  );
}
