/**
 * VÉRIFICATION MANUELLE — OURAIRPORTS LIVE
 * ==========================================
 *
 * Ce script fait un VRAI appel réseau vers la source OurAirports réelle.
 * Il n'est PAS un test automatique (vitest.config.ts n'inclut que
 * server/**\/*.test.ts — ce fichier n'est jamais exécuté par `pnpm test`).
 *
 * Lancer manuellement :
 *   pnpm tsx server/connectors/ourairports/liveCheck.ts
 *
 * Ce script N'ÉCRIT DANS AUCUNE BASE DE DONNÉES. Il fait juste la preuve
 * qu'une vraie ingestion (fetch → parse → validation → normalisation →
 * résolution d'entité) fonctionne sur les données réelles, et affiche les
 * résultats pour vérification humaine — conformément à la règle « ne jamais
 * prétendre qu'une intégration est fonctionnelle si elle ne l'est pas ».
 */

import { runOurAirportsLiveIngestion, resolveAirportEntity, OURAIRPORTS_SOURCE_URL } from "./index";

async function main() {
  console.log("=== AeroLab — Vérification live OurAirports ===");
  console.log("Endpoint :", OURAIRPORTS_SOURCE_URL);
  console.log("Démarrage du fetch réel...\n");

  const started = Date.now();
  const result = await runOurAirportsLiveIngestion(10);
  const durationMs = Date.now() - started;

  console.log(`Terminé en ${durationMs} ms`);
  console.log("Retrieved at :", result.retrievedAt);
  console.log("Lignes totales dans le fichier :", result.totalRows);
  console.log("Lignes valides :", result.validCount);
  console.log("Lignes rejetées :", result.rejectedCount);
  if (result.rejectedSamples.length > 0) {
    console.log("Exemples de rejets :", result.rejectedSamples);
  }

  console.log("\n--- Échantillon de 10 aéroports normalisés (résolution d'entité à vide) ---");
  for (const airport of result.airports) {
    const resolution = resolveAirportEntity(airport, []);
    console.log(
      `- ${airport.name} | IATA=${airport.iata ?? "—"} ICAO=${airport.icao ?? "—"} pays=${airport.countryId ?? "—"} lat/lon=${airport.latitude ?? "—"},${airport.longitude ?? "—"} | résolution: ${resolution.method}`,
    );
  }

  console.log("\nAucune donnée n'a été inventée : chaque ligne ci-dessus vient directement du fichier CSV réel.");
  console.log("Aucune écriture en base n'a eu lieu (script en lecture seule).");
}

main().catch((error) => {
  console.error("\n❌ Échec de la vérification live OurAirports :", error);
  process.exit(1);
});
