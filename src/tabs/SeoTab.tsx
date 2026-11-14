import React, { lazy } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import type { AppState } from "../state/useAppState";


export default function SeoTab({ app }: { app: AppState }) {
  const {
    currentReport,
    handleRunSeoCheck,
    isPolish,
    isSeoLoading,
    liveSeo,
  } = app;
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Search className="w-5 h-5 text-emerald-600" />
                    <span>
                      {isPolish
                        ? "Głęboki Audyt Technicznego SEO, Nagłówków H1-H6 i Bezpieczeństwa HTTP"
                        : "Deep Technical SEO, H1-H6 Hierarchy & Security Inspector"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPolish
                      ? `Rzeczywista analiza pobranego kodu źródłowego HTML dla ${liveSeo.url} (Rozmiar DOM: ${liveSeo.htmlSizeKb} KB, TTFB: ${liveSeo.responseTimeMs} ms).`
                      : `Live server-side HTML DOM & HTTP header inspection for ${liveSeo.url} (${liveSeo.htmlSizeKb} KB, TTFB: ${liveSeo.responseTimeMs} ms).`}
                  </p>
                </div>
                <button
                  onClick={() => handleRunSeoCheck(currentReport.finalUrl || currentReport.scannedUrl)}
                  disabled={isSeoLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeoLoading ? "animate-spin" : ""}`} />
                  <span>{isPolish ? "Skanuj Kod HTML Ponownie" : "Re-Scan Live HTML"}</span>
                </button>
              </div>

              {/* Google SERP Preview + Meta Title & Description Audit */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isPolish ? "Podgląd Wyniku w Wyszukiwarce Google (SERP Snippet)" : "Google SERP Snippet Preview"}
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500 truncate">{liveSeo.url}</div>
                    <div className="text-base font-bold text-[#1a0dab] hover:underline leading-snug">
                      {liveSeo.title.text || (isPolish ? "Brak znacznika <title> na stronie!" : "Missing <title> tag!")}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {liveSeo.description.text || (isPolish ? "Brak znacznika <meta name='description'>! Google wygeneruje przypadkowy wycinek tekstu ze strony." : "Missing meta description! Google will generate a random text snippet.")}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Meta Title ({liveSeo.title.length} {isPolish ? "znaków" : "chars"} · ~{liveSeo.title.pixelWidth}px)</span>
                        <span className={liveSeo.title.status === "good" ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.title.status === "good" ? (isPolish ? "Optymalny (30-65 zn.)" : "Optimal") : (isPolish ? "Wymaga korekty" : "Needs adjustment")}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${liveSeo.title.status === "good" ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.round((liveSeo.title.length / 65) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Meta Description ({liveSeo.description.length} {isPolish ? "znaków" : "chars"} · ~{liveSeo.description.pixelWidth}px)</span>
                        <span className={liveSeo.description.status === "good" ? "text-emerald-700" : "text-amber-700"}>
                          {liveSeo.description.status === "good" ? (isPolish ? "Optymalny (110-165 zn.)" : "Optimal") : (isPolish ? "Wymaga rozbudowy" : "Needs optimization")}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${liveSeo.description.status === "good" ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.round((liveSeo.description.length / 165) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Headings Hierarchy H1-H6 & Extracted Texts */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isPolish ? "Struktura Nagłówków H1–H6 w Kodzie DOM" : "DOM Heading Hierarchy (H1–H6)"}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700">
                      {liveSeo.headings.h1 === 1 ? (isPolish ? "1x H1 (Wzorcowo)" : "1x H1 (Optimal)") : (isPolish ? `Uwaga: ${liveSeo.headings.h1}x H1` : `Warning: ${liveSeo.headings.h1}x H1`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2 text-center">
                    {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) => (
                      <div key={tag} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">{tag}</div>
                        <div className="text-lg font-mono font-extrabold text-slate-900 tabular-nums">
                          {liveSeo.headings[tag]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-700">
                      {isPolish ? "Wykryty główny nagłówek H1:" : "Extracted H1 Heading:"}
                    </div>
                    {liveSeo.headings.h1Texts.length > 0 ? (
                      liveSeo.headings.h1Texts.map((txt, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-mono font-semibold text-emerald-950">
                          &lt;h1&gt; {txt} &lt;/h1&gt;
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold">
                        {isPolish ? "BŁĄD KRYTYCZNY SEO: Brak nagłówka <h1> na stronie głównej!" : "CRITICAL SEO ERROR: No <h1> tag found on page!"}
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-700 pt-2">
                      {isPolish ? "Przykładowe nagłówki sekcji H2:" : "Extracted H2 Subheadings:"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {liveSeo.headings.h2Texts.map((txt, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 truncate">
                          &lt;h2&gt; {txt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Indexing, Images, Links & HTTP Security Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "Indeksowanie & Sitemap" : "Crawlability & Indexing"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Meta Robots</span>
                      <span className="font-mono font-bold text-emerald-700">{liveSeo.indexing.robotsMeta}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Plik /robots.txt" : "File /robots.txt"}</span>
                      <span className="font-bold">{liveSeo.indexing.hasRobotsTxt ? (isPolish ? "Dostępny (200 OK)" : "Available (200 OK)") : (isPolish ? "Brak pliku!" : "Missing file!")}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Mapa /sitemap.xml" : "Sitemap /sitemap.xml"}</span>
                      <span className="font-bold">{liveSeo.indexing.hasSitemapXml ? (isPolish ? "Aktywna (200 OK)" : "Active (200 OK)") : (isPolish ? "Brak mapy!" : "Missing sitemap!")}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Canonical URL</span>
                      <span className="font-mono truncate max-w-[160px] font-semibold">{liveSeo.canonical.url || (isPolish ? "Brak" : "None")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "Audyt Obrazów, Linków i Schema" : "Images, Links & Schema.org"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Obrazy ogółem / bez ALT w kodzie HTML" : "Total images / without ALT in HTML"}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {liveSeo.images.total} / <strong className={liveSeo.images.missingAlt > 0 ? "text-amber-600" : "text-emerald-600"}>{liveSeo.images.missingAlt} {isPolish ? "brak" : "missing"}</strong>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Lazy-loading (loading=&quot;lazy&quot;)</span>
                      <span className="font-mono font-bold tabular-nums">{liveSeo.images.lazyLoaded} {isPolish ? "obrazów" : "images"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Linki Wewnętrzne / Zewnętrzne" : "Internal / External Links"}</span>
                      <span className="font-mono font-bold tabular-nums">{liveSeo.links.internal} {isPolish ? "wew." : "int."} / {liveSeo.links.external} {isPolish ? "zew." : "ext."}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">{isPolish ? "Dane Schema.org (JSON-LD)" : "Schema.org data (JSON-LD)"}</span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums">{liveSeo.social.schemaJsonLdCount} {isPolish ? "wykryte" : "detected"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isPolish ? "Nagłówki Bezpieczeństwa HTTP" : "HTTP Security Headers"}
                    </h3>
                    <span className="text-xs font-mono font-extrabold text-emerald-700 tabular-nums">
                      {liveSeo.securityHeaders.score}/100
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{isPolish ? "Certyfikat HTTPS / SSL" : "HTTPS / SSL certificate"}</span>
                      <span className="font-bold text-emerald-700">{liveSeo.securityHeaders.https ? (isPolish ? "Chroniona" : "Protected") : (isPolish ? "Brak!" : "Missing!")}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Strict-Transport-Security (HSTS)</span>
                      <span className="font-bold">{liveSeo.securityHeaders.hsts ? (isPolish ? "Aktywny" : "Active") : (isPolish ? "Brak" : "Missing")}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">X-Content-Type-Options</span>
                      <span className="font-bold">{liveSeo.securityHeaders.xContentTypeOptions ? "nosniff" : (isPolish ? "Brak" : "Missing")}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Content-Security-Policy (CSP)</span>
                      <span className="font-bold">{liveSeo.securityHeaders.csp ? (isPolish ? "Skonfigurowane" : "Configured") : (isPolish ? "Do wdrożenia" : "To be implemented")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
