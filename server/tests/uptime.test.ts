import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import fs from "fs";
import os from "os";
import path from "path";

// Atrapy usług + atrapa SMTP: OK → błąd (1 porażka bez alertu, 2 = alert) → odzyskanie.
test("monitor usług: alert po 2 porażkach, mail o odzyskaniu, publiczny widok bez szczegółów", async () => {
  let code = 200;
  const svc = http.createServer((_q, r) => { r.statusCode = code; r.end("x"); });
  await new Promise<void>((r) => svc.listen(0, "127.0.0.1", r));
  const sp = (svc.address() as any).port;

  const mails: string[] = [];
  const smtp = net.createServer((sock) => {
    let data = false, buf = "";
    sock.write("220 fake ESMTP\r\n");
    sock.on("data", (d) => {
      buf += d.toString();
      if (data) { if (buf.includes("\r\n.\r\n")) { mails.push(buf); buf = ""; data = false; sock.write("250 queued\r\n"); } return; }
      for (const line of buf.split("\r\n").filter(Boolean)) {
        const u = line.toUpperCase();
        if (u.startsWith("EHLO")) sock.write("250-fake\r\n250 AUTH PLAIN LOGIN\r\n");
        else if (u.startsWith("AUTH")) sock.write("235 ok\r\n");
        else if (u === "DATA") { data = true; sock.write("354 go\r\n"); }
        else if (u === "QUIT") sock.end("221 bye\r\n");
        else sock.write("250 ok\r\n");
      }
      if (!data) buf = "";
    });
  });
  await new Promise<void>((r) => smtp.listen(0, "127.0.0.1", r));

  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "np-status-"));
  process.env.STATUS_TARGETS = JSON.stringify([
    { id: "a", labelPl: "Usługa A", labelEn: "Service A", url: `http://127.0.0.1:${sp}/health` },
    { id: "b", labelPl: "Usługa B", labelEn: "Service B", url: "http://127.0.0.1:1/" },
  ]);
  const m = await import("../uptimeMonitor");

  // 1) OK
  await m.runChecks();
  let p = m.publicStatus();
  assert.equal(p.services.find((s) => s.id === "a")!.ok, true);
  assert.ok(!JSON.stringify(p).includes("127.0.0.1"), "publiczny widok nie ujawnia adresów");

  // 2) błąd: 1. porażka – bez alertu, a dopiero 2. = nie ok + mail (SMTP nieustawione → znacznik)
  code = 500;
  await m.runChecks();
  assert.equal(m.detailedStatus().services.find((s: any) => s.id === "a")!.alerting, false);
  assert.equal(m.publicStatus().services.find((s) => s.id === "a")!.ok, true);
  await m.runChecks();
  let d: any = m.detailedStatus().services.find((s: any) => s.id === "a");
  assert.equal(d.alerting, true);
  assert.equal(m.publicStatus().services.find((s) => s.id === "a")!.ok, false);
  assert.equal(d.mail, "not_configured");

  // 3) z SMTP: alert + odzyskanie to dwa maile
  process.env.SMTP_HOST = "127.0.0.1"; process.env.SMTP_PORT = String((smtp.address() as any).port);
  process.env.SMTP_USER = "u"; process.env.SMTP_PASS = "p"; process.env.ALERT_EMAIL = "contact@novopix.uk";
  await m.runChecks(); // nadal awaria – bez ponownego maila
  assert.equal(mails.length, 0);
  code = 200;
  await m.runChecks();
  d = m.detailedStatus().services.find((s: any) => s.id === "a");
  assert.equal(d.ok, true);
  assert.equal(mails.length, 1);
  assert.match(mails[0], /Odzyskano/i);
  assert.match(mails[0], /contact@novopix\.uk/);

  // 4) nowa awaria z SMTP → mail o awarii
  code = 503;
  await m.runChecks(); await m.runChecks();
  assert.equal(mails.length, 2);
  assert.match(mails[1], /AWARIA/);

  svc.close(); smtp.close();
});
