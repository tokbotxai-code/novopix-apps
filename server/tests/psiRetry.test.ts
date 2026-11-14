import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// Atrapa PageSpeed API: scenariusz ustala, które wywołania zawodzą.
function mock(plan: Array<"500" | "ok" | "empty" | "429" | "nofcp">) {
  let calls = 0;
  const server = http.createServer((_req, res) => {
    const step = plan[Math.min(calls, plan.length - 1)];
    calls++;
    if (step === "500") { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: "Lighthouse returned error: NO_FCP" } })); }
    if (step === "nofcp") { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: "Lighthouse returned error: NO_FCP. The page did not paint any content." } })); }
    if (step === "429") { res.writeHead(429, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: "Quota exceeded" } })); }
    res.writeHead(200, { "content-type": "application/json" });
    if (step === "empty") return res.end("{}");
    const cat = (score: number) => ({ score });
    res.end(JSON.stringify({ lighthouseResult: { categories: { performance: cat(0.9), seo: cat(1), accessibility: cat(1), "best-practices": cat(1) }, audits: {} } }));
  });
  return new Promise<{ base: string; calls: () => number; close: () => void }>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ base: `http://127.0.0.1:${(server.address() as any).port}`, calls: () => calls, close: () => server.close() }))
  );
}

async function scan(plan: Array<"500" | "ok" | "empty" | "429" | "nofcp">) {
  const m = await mock(plan);
  process.env.PSI_API_BASE = m.base;
  process.env.PSI_RETRY_PAUSE_MS = "50";
  const { performScan } = await import("../scanService");
  const out = await performScan("example.com", "mobile");
  m.close();
  delete process.env.PSI_API_BASE;
  return { status: out.body.measurementStatus, calls: m.calls(), perf: out.body.categories?.performance };
}

test("pełny pomiar za pierwszym razem: bez ponowienia", async () => {
  const r = await scan(["ok"]);
  assert.equal(r.status, "live_lighthouse");
  assert.equal(r.calls, 1);
});
test("pierwsza próba zawodzi (5xx), druga działa: pełny pomiar po jednym ponowieniu", async () => {
  const r = await scan(["500", "ok"]);
  assert.equal(r.status, "live_lighthouse");
  assert.equal(r.calls, 2);
  assert.equal(r.perf, 90);
});
test("odpowiedź bez wyniku Lighthouse jest ponawiana raz", async () => {
  const r = await scan(["empty", "ok"]);
  assert.equal(r.status, "live_lighthouse");
  assert.equal(r.calls, 2);
});
test("dwie porażki: uczciwy pomiar częściowy, dokładnie dwie próby", async () => {
  const r = await scan(["500", "500", "ok"]);
  assert.notEqual(r.status, "live_lighthouse");
  assert.equal(r.calls, 2);
  assert.equal(r.perf ?? null, null);
});
test("limit zapytań (4xx) nie jest ponawiany", async () => {
  const r = await scan(["429", "ok"]);
  assert.notEqual(r.status, "live_lighthouse");
  assert.equal(r.calls, 1);
});
test("chwilowy błąd Lighthouse NO_FCP (HTTP 400) jest ponawiany raz", async () => {
  const r = await scan(["nofcp", "ok"]);
  assert.equal(r.status, "live_lighthouse");
  assert.equal(r.calls, 2);
});
