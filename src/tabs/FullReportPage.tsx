import React, { Suspense, lazy } from "react";
import type { AppState } from "../state/useAppState";
import type { AgencyCtx } from "../agencyTypes";

const OverviewTab = lazy(() => import("./OverviewTab"));
const AiAdvisorTab = lazy(() => import("./AiAdvisorTab"));
const PerformanceTab = lazy(() => import("./PerformanceTab"));
const SeoTab = lazy(() => import("./SeoTab"));
const InsightsTab = lazy(() => import("./InsightsTab"));
const AccessibilityTab = lazy(() => import("./AccessibilityTab"));
const DiagnosticsTab = lazy(() => import("./DiagnosticsTab"));
const ChecklistTab = lazy(() => import("./ChecklistTab"));
const FullReviewTab = lazy(() => import("./FullReviewTab"));
const BulkTab = lazy(() => import("./BulkTab"));
import { ReportActions, OfferBox, HistoryCard } from "./ReportExtras";

// Jeden raport dla agencji: wszystkie sekcje audytu jedna pod drugą, bez przełączania zakładek.
export default function FullReportPage({ app, ctx, onClientAdded }: { app: AppState; ctx: AgencyCtx; onClientAdded?: (c: any) => void }) {
  const pl = app.isPolish;
  const L = (a: string, b: string) => (pl ? a : b);
  const host = (app.currentReport.finalUrl || app.currentReport.scannedUrl || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={`fr-${id}`} className="space-y-3 scroll-mt-20" data-testid={`fr-${id}`}>
      <h2 className="text-lg font-extrabold text-slate-900 font-heading border-b border-slate-200 pb-2">{title}</h2>
      <Suspense fallback={<div className="text-xs text-slate-500">{L("Ładowanie…", "Loading…")}</div>}>{children}</Suspense>
    </section>
  );
  const nav: Array<[string, string]> = [
    ["overview", L("Podsumowanie", "Summary")],
    ["advisor", L("Doradca AI", "AI advisor")],
    ["speed", L("Szybkość", "Speed")],
    ["seo", "SEO"],
    ["issues", L("Problemy", "Issues")],
    ["a11y", L("Dostępność", "Accessibility")],
    ["crawl", L("Indeksowanie", "Crawling")],
    ["todo", L("Do zrobienia", "To do")],
    ["domain", L("Cała domena", "Whole domain")],
    ["bulk", L("Skan wielu stron", "Bulk scan")],
  ];
  return (
    <div className="space-y-8" data-testid="full-report">
      <div className="flex flex-wrap items-center gap-2 text-xs sticky top-16 z-10 bg-[#F4F6F9]/95 backdrop-blur py-2">
        <span className="font-bold text-slate-700 mr-1">{host}</span>
        {nav.map(([id, label]) => (
          <a key={id} href={`#fr-${id}`} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100">{label}</a>
        ))}
      </div>
      <ReportActions app={app} ctx={ctx} />
      <Section id="overview" title={L("Podsumowanie", "Summary")}><OverviewTab app={app} /><div className="mt-4 space-y-4"><HistoryCard app={app} ctx={ctx} /><OfferBox app={app} ctx={ctx} /></div></Section>
      <Section id="advisor" title={L("Doradca AI i skrypty rozmów", "AI advisor and sales scripts")}><AiAdvisorTab app={app} /></Section>
      <Section id="speed" title={L("Szybkość i Core Web Vitals", "Speed and Core Web Vitals")}><PerformanceTab app={app} /></Section>
      <Section id="seo" title={L("SEO szczegółowo", "Detailed SEO")}><SeoTab app={app} /></Section>
      <Section id="issues" title={L("Wykryte problemy i waga strony", "Detected issues and page weight")}><InsightsTab app={app} /></Section>
      <Section id="a11y" title={L("Kontrole dostępności", "Accessibility checks")}><AccessibilityTab app={app} /></Section>
      <Section id="crawl" title={L("Diagnostyka indeksowania", "Crawl diagnostics")}><DiagnosticsTab app={app} /></Section>
      <Section id="todo" title={L("Lista rzeczy do poprawy", "To-do list")}><ChecklistTab app={app} /></Section>
      <Section id="domain" title={L("Cała domena: podstrony, linki, subdomeny, poczta", "Whole domain: pages, links, subdomains, email")}>
        <FullReviewTab ctx={ctx} initialUrl={host} autoRunKey={app.currentReport.scanId || app.currentReport.id} />
      </Section>
      <Section id="bulk" title={L("Skan wielu stron i leady", "Bulk scan and leads")}>
        <BulkTab ctx={ctx} onClientAdded={(c) => onClientAdded?.(c)} />
      </Section>
    </div>
  );
}
