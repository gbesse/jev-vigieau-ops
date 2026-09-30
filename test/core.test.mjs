// Objectif : ne traiter une restriction que si sa zone est vérifiée pour le site.
import test from "node:test";
import assert from "node:assert/strict";
import { site, assessOperation } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";

const s = { id: "s", latitude: 1, longitude: 2, profile: "company", waterTypes: ["drinking"], zoneIds: ["z"] };
const r = { id: "r", zoneId: "z", level: "alert", profiles: ["company"], waterTypes: ["drinking"],
  rules: ["Arrosage interdit"], startsAt: "2026-01-01", endsAt: "2026-12-31", sourceUrl: "https://vigieau.gouv.fr" };

test("validates profile and coordinates", () => {
  assert.throws(() => site({ ...s, profile: "x" }), /profile/);
  assert.throws(() => site({ ...s, latitude: 91 }), /coordinates/);
});
test("rejects malformed zone identifiers", () => {
  assert.throws(() => site({ ...s, zoneIds: "z" }), /zoneIds/);
  assert.throws(() => site({ ...s, zoneIds: [""] }), /zoneIds/);
  assert.deepEqual(site({ ...s, zoneIds: [" z ", "z"] }).zoneIds, ["z"]);
});
test("inactive restriction bypasses Jev", async () => {
  const p = createFakeProvider(() => { throw Error("must not run"); });
  const result = await assessOperation(s, "lavage", r, p, { at: "2027-01-01" });
  assert.equal(result.impact, "inactive");
  assert.equal(p.calls, 0);
});
test("unknown site zone requires review without calling Jev", async () => {
  const p = createFakeProvider(() => { throw Error("must not run"); });
  const result = await assessOperation({ ...s, zoneIds: undefined }, "lavage", r, p, { at: "2026-06-01" });
  assert.equal(result.impact, "zone_unverified");
  assert.equal(result.review, true);
  assert.equal(p.calls, 0);
});
test("different zone bypasses Jev", async () => {
  const p = createFakeProvider(() => { throw Error("must not run"); });
  const result = await assessOperation({ ...s, zoneIds: ["other"] }, "lavage", r, p, { at: "2026-06-01" });
  assert.equal(result.impact, "different_zone");
  assert.equal(p.calls, 0);
});
test("invalid evaluation date is rejected", async () => {
  await assert.rejects(assessOperation(s, "lavage", r, null, { at: "invalid" }), /valid date/);
});
test("date-only end remains active through its final UTC day", async () => {
  const p = createFakeProvider(() => ({ model: "jev-1.13.0", answers: { impact: {
    type: "choice", choice: "conditional",
    probabilities: { allowed: .05, conditional: .8, possibly_prohibited: .1, unclear: .05 }, confidence: .8,
  } }, usage: {} }));
  assert.equal((await assessOperation(s, "lavage", r, p, { at: "2026-12-31T12:00:00Z" })).impact, "conditional");
  assert.equal((await assessOperation(s, "lavage", r, p, { at: "2027-01-01T00:00:00Z" })).impact, "inactive");
  assert.equal(p.calls, 1);
});
test("active rule in confirmed zone is reviewed", async () => {
  const p = createFakeProvider(() => ({ model: "jev-1.13.0", answers: { impact: {
    type: "choice", choice: "possibly_prohibited",
    probabilities: { allowed: .05, conditional: .1, possibly_prohibited: .8, unclear: .05 }, confidence: .8,
  } }, usage: {} }));
  assert.equal((await assessOperation(s, "arrosage", r, p, { at: "2026-06-01" })).review, true);
  assert.equal(p.calls, 1);
});
