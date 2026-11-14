import test from "node:test";
import assert from "node:assert/strict";
import { CONSENT_TEXT, MARKETING_TEXT } from "../funnel";

test("zgoda na raport jest osobna od zgody marketingowej", () => {
  for (const lang of ["pl", "en"] as const) {
    assert.ok(!/usług|services/i.test(CONSENT_TEXT[lang]), "zgoda na raport nie wspomina o ofercie");
    assert.ok(/nieobowiązkow|optional/i.test(MARKETING_TEXT[lang]));
  }
});
