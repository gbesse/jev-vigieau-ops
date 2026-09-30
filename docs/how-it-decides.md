# Comment la décision est prise

La correspondance entre coordonnées et zones d’alerte doit être vérifiée en amont et fournie dans `site.zoneIds`. Sans zone confirmée, le résultat est `zone_unverified` et exige une revue sans appel Jev. Une restriction d’une autre zone est écartée. Les profils, types d’eau et périodes restent déterministes. Jev applique seulement le texte fourni à l’opération décrite. L’arrêté préfectoral signé fait foi.

La question et les critères exacts sont versionnés dans [`src/index.mjs`](../src/index.mjs). Les probabilités de la démonstration sont synthétiques. Calibrez les seuils de revue sur des cas français annotés et représentatifs avant tout usage opérationnel.
