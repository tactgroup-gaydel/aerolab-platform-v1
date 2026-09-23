/**
 * CLI : pnpm tsx server/entities/consolidateLive.ts [--country=SN] [--limit=N]
 * Consolide les aéroports en entités canoniques (graphe). Réutilise consolidate.ts.
 */
import "dotenv/config";
import { consolidateAirportEntities } from "./consolidate";

const args = process.argv.slice(2);
const country = args.find((a) => a.startsWith("--country="))?.split("=")[1];
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? Number(limitArg) : undefined;

consolidateAirportEntities({ countryCode: country, limit })
  .then((r) => {
    console.log(`Consolidation : ${r.linked} aéroport(s) liés, ${r.entitiesCreated} entité(s) créée(s), ${r.identifiers} identifiant(s), ${r.observations} observation(s) en ${r.durationMs} ms.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Echec de la consolidation :", error);
    process.exit(1);
  });
