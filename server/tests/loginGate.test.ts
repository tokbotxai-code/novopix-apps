import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowLogin } from "../../src/utils/loginGate";

const base = { isPublicMode: false, agencyToken: null as string | null, viewMode: "agency" as const, clientView: false };

test("panel bez PIN-u pokazuje logowanie", () => assert.equal(shouldShowLogin(base), true));
test("skaner publiczny nie pokazuje logowania", () => assert.equal(shouldShowLogin({ ...base, isPublicMode: true }), false));
test("zalogowana agencja nie widzi logowania", () => assert.equal(shouldShowLogin({ ...base, agencyToken: "t" }), false));
test("link klienta omija logowanie", () => assert.equal(shouldShowLogin({ ...base, clientView: true }), false));
