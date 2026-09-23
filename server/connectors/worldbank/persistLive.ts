/**
 * CLI manuel : pnpm tsx server/connectors/worldbank/persistLive.ts [--indicator=CODE]
 * Vrai fetch World Bank + vraie écriture MySQL. Réutilise persist.ts.
 */
import { persistWorldBankIndicator } from "./persist";
import { WORLD_BANK_LPI_OVERALL } from "./index";

const arg = process.argv.slice(2).find((a) => a.startsWith("--indicator="));
const indicator = arg ? arg.split("=")[1] : WORLD_BANK_LPI_OVERALL;

persistWorldBankIndicator(indicator)
  .then((r) => {
    console.log(`World Bank ${r.indicator} : ${r.upserted} enregistrement(s) inséré(s)/mis à jour en ${r.durationMs} ms.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Echec de la persistance World Bank :", error);
    process.exit(1);
  });
