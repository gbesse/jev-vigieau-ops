// Objectif : démontrer la frontière de décision sans appel réseau.
import assert from "node:assert/strict";
import { assessOperation } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const p = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: {
    impact: {
      type: "choice",
      choice: "conditional",
      probabilities: {
        allowed: 0.05,
        conditional: 0.8,
        possibly_prohibited: 0.1,
        unclear: 0.05,
      },
      confidence: 0.8,
    },
  },
  usage: {},
}));
const resultat = await assessOperation(
  {
    id: "site-1",
    latitude: 43.6,
    longitude: 1.44,
    profile: "company",
    waterTypes: ["drinking"],
  },
  "Nettoyage quotidien des véhicules",
  {
    id: "a-1",
    zoneId: "z-31",
    level: "alert",
    profiles: ["company"],
    waterTypes: ["drinking"],
    rules: ["Le lavage professionnel est limité aux dispositifs économes."],
    startsAt: "2026-09-01",
    endsAt: "2026-10-31",
    sourceUrl: "https://vigieau.gouv.fr",
  },
  p,
  { at: "2026-09-29" },
);
assert.equal(resultat.impact, "conditional");
console.log(JSON.stringify(resultat, null, 2));
