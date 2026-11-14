import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "np-agency-"));

test("historia domeny: zapisuje tylko prawdziwy pomiar i scala pomiary z 10 minut", async () => {
  const { recordScanHistory } = await import("../agencyTools");
  const { db } = await import("../database");
  recordScanHistory("https://www.example.com/", { measurementStatus: "partial_html", overallScore: 50, categories: {} });
  assert.equal(Object.keys(db.domainHistory || {}).length, 0, "pomiar częściowy nie trafia do historii");
  recordScanHistory("example.com", { measurementStatus: "live_lighthouse", finalUrl: "https://www.example.com/", overallScore: 80, categories: { performance: 70, seo: 90, accessibility: 85 } });
  recordScanHistory("example.com", { measurementStatus: "live_lighthouse", finalUrl: "https://www.example.com/", overallScore: 82, categories: { performance: 72, seo: 90, accessibility: 85 } });
  const list = db.domainHistory!["example.com"];
  assert.equal(list.length, 1, "dwa pomiary z tych samych 10 minut = jeden wpis");
  assert.equal(list[0].overall, 82);
});

test("pole repliedAt istnieje w typie zgłoszenia", async () => {
  const { db } = await import("../database");
  db.leads.push({ id: "x", timestamp: new Date().toISOString(), name: null, email: "a@b.pl", phone: null, website: "https://a.pl", details: "", overallScore: null, scores: {}, cwv: {}, isSample: false, repliedAt: "2026-11-14" });
  assert.equal(db.leads[db.leads.length - 1].repliedAt, "2026-11-14");
});
