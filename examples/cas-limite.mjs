// Cas limite : la période d’application est vérifiée avant le contenu de la règle.
import assert from "node:assert/strict";
import { assessOperation } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";

const jev = createFakeProvider(() => {
  throw new Error("Jev ne doit pas être appelé");
});
const resultat = await assessOperation(
  {
    id: "site-1",
    latitude: 43.6,
    longitude: 1.44,
    profile: "company",
    waterTypes: ["drinking"],
  },
  "Nettoyage des véhicules",
  {
    id: "r-1",
    zoneId: "z-31",
    level: "alert",
    profiles: ["company"],
    waterTypes: ["drinking"],
    rules: ["Lavage limité"],
    startsAt: "2026-06-01",
    endsAt: "2026-08-31",
    sourceUrl: "https://vigieau.gouv.fr",
  },
  jev,
  { at: "2026-09-30" },
);
assert.equal(resultat.impact, "inactive");
assert.equal(jev.calls, 0);
console.log(JSON.stringify(resultat, null, 2));
