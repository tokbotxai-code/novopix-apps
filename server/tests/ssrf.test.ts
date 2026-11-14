import test from "node:test";
import assert from "node:assert/strict";
import { validateSafePublicUrl, hostResolvesToPublicOnly, safeFetchHtml } from "../security";

test("odrzuca adresy lokalne i wewnętrzne", () => {
  for (const u of ["http://127.0.0.1/", "http://10.1.2.3/", "http://192.168.0.5/", "http://169.254.169.254/", "http://localhost/", "http://[::1]/", "http://[fd00::1]/", "https://intranet.local/"]) {
    assert.equal(validateSafePublicUrl(u).valid, false, u);
  }
});

test("wymaga pełnej nazwy domeny", () => {
  assert.equal(validateSafePublicUrl("londyn").valid, false);
  assert.equal(validateSafePublicUrl("firma.pl").valid, true);
});

test("sprawdzanie IP: prywatne i mapowane IPv4 w IPv6 są odrzucane", async () => {
  assert.equal(await hostResolvesToPublicOnly("127.0.0.1"), false);
  assert.equal(await hostResolvesToPublicOnly("172.16.0.1"), false);
  assert.equal(await hostResolvesToPublicOnly("100.64.0.1"), false);
  assert.equal(await hostResolvesToPublicOnly("::ffff:10.0.0.1"), false);
  assert.equal(await hostResolvesToPublicOnly("8.8.8.8"), true);
});

test("niepoprawna nazwa nie przechodzi (kontrola zamyka się przy błędzie)", async () => {
  assert.equal(await hostResolvesToPublicOnly("nie-istnieje-9f3a1c.invalid"), false);
});

test("pobieranie odrzuca adres wewnętrzny bez łączenia", async () => {
  const r = await safeFetchHtml("http://127.0.0.1:9/", 2000, 1000);
  assert.equal(r.ok, false);
  assert.equal(r.status, 0);
});
