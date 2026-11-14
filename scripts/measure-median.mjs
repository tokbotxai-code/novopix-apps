// Pomiar skanerem NovoPix: N prób na adres, tylko pełne pomiary (live_lighthouse), mediana i rozrzut.
// Użycie: node scripts/measure-median.mjs [--runs 5] [--scanner https://scanner.novopix.uk] url1 url2 ...
const args = process.argv.slice(2);
let runs = 5;
let scanner = "https://scanner.novopix.uk";
const urls = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--runs") runs = Math.max(1, Number(args[++i]) || 5);
  else if (args[i] === "--scanner") scanner = args[++i];
  else urls.push(args[i]);
}
if (!urls.length) {
  console.error("Podaj co najmniej jeden adres.");
  process.exit(2);
}
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const KEYS = ["performance", "seo", "accessibility", "bestPractices"];
for (const url of urls) {
  const got = Object.fromEntries(KEYS.map((k) => [k, []]));
  let full = 0;
  for (let i = 0; i < runs; i++) {
    try {
      const r = await fetch(`${scanner}/api/scan`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, strategy: "mobile" }), signal: AbortSignal.timeout(150000) });
      const j = await r.json();
      if (j.measurementStatus === "live_lighthouse") {
        full++;
        for (const k of KEYS) if (typeof j.categories?.[k] === "number") got[k].push(j.categories[k]);
      }
    } catch {}
    await new Promise((res) => setTimeout(res, 3000));
  }
  const cell = (k) => (got[k].length ? `${median(got[k])} (${Math.min(...got[k])}–${Math.max(...got[k])})` : "brak");
  console.log(`${url}  pełne pomiary: ${full}/${runs}  wydajność ${cell("performance")}  SEO ${cell("seo")}  dostępność ${cell("accessibility")}  praktyki ${cell("bestPractices")}`);
}
