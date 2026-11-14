import { useEffect } from "react";
import { NovoPixAnimatedMark } from "./NovoPixAnimatedMark";

export function LoginScreen({
  isPolish,
  setIsPolish,
  pinAttempt,
  setPinAttempt,
  pinError,
  setPinError,
  onSubmit,
}: {
  isPolish: boolean;
  setIsPolish: (v: boolean) => void;
  pinAttempt: string;
  setPinAttempt: (v: string) => void;
  pinError: string | null;
  setPinError: (v: string | null) => void;
  onSubmit: (pin: string) => Promise<boolean>;
}) {
  useEffect(() => {
    document.title = isPolish ? "NovoPix: logowanie do panelu" : "NovoPix: agency panel login";
  }, [isPolish]);
  const scannerHref = `https://scanner.novopix.uk/?lang=${isPolish ? "pl" : "en"}`;
  return (
    <main className="min-h-screen bg-[#F4F6F9] dark:bg-[#0b1620] flex items-center justify-center px-4 py-8 text-slate-800 font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-[#12222f] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#103247] flex items-center justify-center shrink-0">
              <NovoPixAnimatedMark sizeClass="w-6 h-6" />
            </div>
            <span className="font-heading font-extrabold text-base text-slate-900 dark:text-white">NovoPix</span>
          </div>
          <div className="flex gap-1 text-xs font-bold">
            <button type="button" onClick={() => setIsPolish(true)} aria-pressed={isPolish} className={`px-2.5 py-1 rounded-lg cursor-pointer ${isPolish ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100"}`}>PL</button>
            <button type="button" onClick={() => setIsPolish(false)} aria-pressed={!isPolish} className={`px-2.5 py-1 rounded-lg cursor-pointer ${!isPolish ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100"}`}>EN</button>
          </div>
        </div>
        <h1 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
          {isPolish ? "Panel agencji NovoPix" : "NovoPix agency panel"}
        </h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(pinAttempt);
          }}
          className="space-y-3"
        >
          <label htmlFor="panel-pin" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
            {isPolish ? "Kod PIN" : "PIN"}
          </label>
          <input
            id="panel-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pinAttempt}
            onChange={(e) => {
              setPinAttempt(e.target.value);
              setPinError(null);
            }}
            placeholder="••••"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-mono tracking-widest text-center"
          />
          {pinError && <div role="alert" className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{pinError}</div>}
          <button type="submit" className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer">
            {isPolish ? "Zaloguj" : "Log in"}
          </button>
        </form>
        <div className="text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-1">
          <a href={scannerHref} className="font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 underline">
            {isPolish ? "Bezpłatny skaner" : "Free scanner"}
          </a>
          <div>contact@novopix.uk</div>
        </div>
      </div>
    </main>
  );
}
