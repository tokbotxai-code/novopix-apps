import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Download,
  CheckCircle2,
  Server,
  Layers,
  Activity,
} from "lucide-react";
import { AuditReport, LiveSeoInspection } from "../scannerTypes";

interface AuditIntegrityBannerProps {
  report: AuditReport;
  liveSeo: LiveSeoInspection;
  isPolish: boolean;
  viewMode: "agency" | "client";
  agencyToken: string | null;
  isDefaultPinWarning: boolean;
  scanError: string | null;
  onUnlockWithPin: (pin: string) => Promise<boolean>;
  onDownloadBackup: () => void;
  onOpenPinSettings: () => void;
}

export function AuditIntegrityBanner({
  report,
  liveSeo,
  isPolish,
  viewMode,
  agencyToken,
  isDefaultPinWarning,
  scanError,
  onUnlockWithPin,
  onDownloadBackup,
  onOpenPinSettings,
}: AuditIntegrityBannerProps) {
  const [quickPin, setQuickPin] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);

  const status = report.id === "empty" ? "none" : report.measurementStatus || (report.livePsiVerified ? "live_lighthouse" : "partial_html");

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPin.trim()) return;
    setAuthBusy(true);
    setAuthErr(null);
    const ok = await onUnlockWithPin(quickPin.trim());
    setAuthBusy(false);
    if (ok) {
      setQuickPin("");
    } else {
      setAuthErr(isPolish ? "Błędny kod PIN lub przekroczono limit prób." : "Invalid PIN or rate limit exceeded.");
    }
  };

  return (
    <div className="space-y-3 no-print">
      {/* 1. Scan Error Alert (State 3: Failed — Zero fabricated scores) */}
      {scanError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-rose-950">
              {isPolish
                ? "Stan Pomiaru 3/3: Brak pomiaru (Strona nieosiągalna lub zablokowana)"
                : "Measurement State 3/3: Measurement Failed (Unreachable or Blocked)"}
            </div>
            <p className="text-rose-800 leading-relaxed">{scanError}</p>
          </div>
        </div>
      )}

      {/* 2. Authentic Measurement Provenance Banner (3 States: Live Lighthouse vs Partial HTML vs Demo) */}
      <div
        className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs ${
          status === "live_lighthouse"
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            : status === "partial_html"
            ? "bg-amber-50/80 border-amber-200 text-amber-950"
            : "bg-slate-100/80 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-start gap-3">
          {status === "live_lighthouse" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : status === "partial_html" ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Activity className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-extrabold flex flex-wrap items-center gap-2">
              <span>
                {status === "live_lighthouse"
                  ? isPolish
                    ? "Stan Pomiaru 1/3: Rzeczywisty Pomiar Google Lighthouse API + Inspekcja DOM"
                    : "Measurement State 1/3: Verified Google Lighthouse API + Live DOM Inspection"
                  : status === "partial_html"
                  ? isPolish
                    ? "Stan Pomiaru 2/3: Częściowy Pomiar Rzeczywisty (Live HTML + HTTP — bez symulacji)"
                    : "Measurement State 2/3: Partial Real Measurement (Live HTML + HTTP — zero simulation)"
                  : isPolish
                  ? "Brak pomiaru: zeskanuj stronę"
                  : "No measurement yet: scan a website"}
              </span>
            </div>
            <p className="text-[11px] opacity-85 leading-relaxed">
              {report.measurementNote ||
                (status === "live_lighthouse"
                  ? isPolish
                    ? "Wszystkie wskaźniki Core Web Vitals, waga zasobów oraz błędy pochodzą bezpośrednio z silnika Google Lighthouse i żywego dokumentu HTML."
                    : "All Core Web Vitals, resource weights, and diagnostics originate directly from Google Lighthouse and live HTML."
                  : status === "partial_html"
                  ? isPolish
                    ? "Zmierzono prawdziwy kod HTML, czas odpowiedzi TTFB, nagłówki bezpieczeństwa i strukturę SEO. Silnik Google Lighthouse przekroczył bezpłatny limit zapytań lub został ograniczony przez firewall."
                    : "Measured real HTML DOM, TTFB, security headers, and SEO tags. Google Lighthouse API quota was exceeded."
                  : isPolish
                  ? "Żadne liczby nie są pokazywane, dopóki nie wykonasz pomiaru. Wpisz adres strony i kliknij Skanuj."
                  : "No numbers are shown until you run a measurement. Enter a website address and click Scan.")}
            </p>
          </div>
        </div>

        {/* Detected Technology, CMS & Script Telemetry */}
        {status !== "none" && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-200/60">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>CMS/Stack:</span>
            <strong className="text-slate-900">{liveSeo.cmsTech || "HTML5"}</strong>
          </div>
          <span aria-hidden="true">·</span>
          <div className="text-slate-700">
            TTFB: <strong className="text-slate-900">{liveSeo.responseTimeMs} ms</strong>
          </div>
          <span aria-hidden="true">·</span>
          <div className="text-slate-700">
            {isPolish ? "Skrypty blokujące:" : "Blocking JS:"}{" "}
            <strong className={(liveSeo.scriptStats?.renderBlockingScripts || 0) > 0 ? "text-amber-700" : "text-emerald-700"}>
              {liveSeo.scriptStats?.renderBlockingScripts ?? 0}
            </strong>
          </div>
        </div>
        )}
      </div>

      {/* 3. Server-Side CRM Session Authorization & Atomic Backup Bar (Agency Mode Only) */}
      {viewMode === "agency" && (
        <div className="p-3.5 rounded-2xl bg-[#0f172a] text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {agencyToken ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {agencyToken
                  ? isPolish
                    ? "Zalogowano w panelu agencji (CRM i monitoring aktywne)"
                    : "Logged in to the agency panel (CRM and monitoring active)"
                  : isPolish
                  ? "CRM i monitoring są chronione PIN-em — zaloguj się, aby z nich korzystać"
                  : "CRM and monitoring are PIN-protected — log in to use them"}
              </span>
              {agencyToken && isDefaultPinWarning && (
                <span className="ml-2 text-amber-300 font-semibold">
                  {isPolish
                    ? "· Uwaga: Używasz domyślnego kodu PIN! Zmień go w zakładce Raporty."
                    : "· Warning: Default PIN is active! Change it in Reports tab."}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!agencyToken ? (
              <form onSubmit={handleQuickLogin} className="flex items-center gap-2">
                <input
                  type="password"
                  value={quickPin}
                  onChange={(e) => setQuickPin(e.target.value)}
                  placeholder={isPolish ? "PIN Administratora" : "Admin PIN"}
                  className="w-36 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  disabled={authBusy}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{authBusy ? "..." : isPolish ? "Zaloguj do CRM" : "Login CRM"}</span>
                </button>
                {authErr && <span className="text-rose-400 text-[11px] font-semibold">{authErr}</span>}
              </form>
            ) : (
              <>
                {isDefaultPinWarning && (
                  <button
                    type="button"
                    onClick={onOpenPinSettings}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    {isPolish ? "Zmień domyślny PIN →" : "Change Default PIN →"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDownloadBackup}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isPolish ? "Kopia Zapasowa Bazy CRM (.json)" : "Backup CRM DB (.json)"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
