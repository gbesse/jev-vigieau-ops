# Jev VigiEau Ops

**Traduit les restrictions sécheresse VigiEau en impacts opérationnels vérifiables pour les sites professionnels.**

[![Tests](https://github.com/gbesse/jev-vigieau-ops/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-vigieau-ops/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · v0.1.3 · Documentation française

Le moteur filtre les restrictions selon le site, le profil d’usager, le type d’eau et la période. Jev relie ensuite une opération décrite aux règles déjà applicables.

## Démarrage rapide

```sh
git clone https://github.com/gbesse/jev-vigieau-ops.git
cd jev-vigieau-ops
npm install
npm run demo
```

La démonstration utilise uniquement des données et probabilités synthétiques. Elle n’effectue aucun appel réseau et ne constitue pas une mesure de qualité de Jev.

## Exemple exécutable

Cet exemple évalue le lavage de véhicules pendant une restriction sécheresse. Il utilise un fournisseur Jev simulé : aucune clé API ni connexion réseau n’est nécessaire. L’assertion intégrée fait échouer la commande si le comportement attendu change.

Le code complet de [`examples/demo.mjs`](examples/demo.mjs) est directement copiable :

```js
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
```

Lancez-le avec :

```sh
npm run demo:principal
```

Résultat à repérer : `impact: conditional`.

### Cas limite à tester

Une restriction arrivée à échéance ne déclenche aucune décision Jev. Le code se trouve dans [`examples/cas-limite.mjs`](examples/cas-limite.mjs).

```sh
npm run demo:limite
```

Résultat à repérer : `impact: inactive · appels Jev: 0`. La commande `npm run demo` exécute les deux exemples.

## Utilisation de la bibliothèque

Importez les fonctions métier depuis `@gbesse/jev-vigieau-ops`. Fournissez soit `createJevClient()` depuis l’export `./jev`, soit `createFakeProvider()` pour les tests hors ligne.

Les noms de l’API JavaScript restent stables pour préserver la compatibilité avec les versions précédentes. La documentation, les exemples et les explications destinées aux utilisateurs sont en français.

## Frontière de décision

Les coordonnées, profils, types d’eau, périodes et niveaux d’alerte restent déterministes. Jev applique seulement le texte fourni à l’opération décrite. L’arrêté préfectoral signé fait foi.

La question exacte envoyée à Jev est versionnée dans [`src/index.mjs`](src/index.mjs). Les identifiants, dates, calculs, filtres, seuils et transitions d’état restent gérés par du code ordinaire.

## Sources

- [https://www.data.gouv.fr/dataservices/api-vigieau](https://www.data.gouv.fr/dataservices/api-vigieau)
- [https://www.data.gouv.fr/datasets/donnee-secheresse-vigieau](https://www.data.gouv.fr/datasets/donnee-secheresse-vigieau)

Conservez l’attribution amont, les identifiants d’origine, les URL de source et les dates de récupération avec chaque enregistrement dérivé.

## Appels Jev réels

Les appels réels sont facultatifs et payants. Le client fixe le modèle `jev-1.13.0`, valide l’identité du modèle et toutes les probabilités, refuse les redirections, ne retente que les erreurs réseau et les réponses HTTP 429/529, puis bloque les requêtes dépassant une estimation prudente de 24 000 jetons.

```sh
TYPESAFE_API_KEY=... node scripts/live-smoke.mjs
```

N’envoyez jamais de secret, de donnée personnelle ni de dossier sensible non expurgé. Évaluez le comportement sur un jeu représentatif de cas français avant tout usage opérationnel.

## Validation

```sh
npm run check
npm run typecheck
npm test
npm run demo
```

La CI exécute ces vérifications sous Node.js 22 et 24.

Projet indépendant, sans affiliation avec TypeSafe AI ni avec l’administration française. Consultez la [documentation de l’API Jev](https://docs.typesafe.ai/api) et les [limites du modèle](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
