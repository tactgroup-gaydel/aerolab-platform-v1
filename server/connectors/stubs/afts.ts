import { createPreparedConnector } from "./factory";

export const aftsConnector = createPreparedConnector(
  "afts",
  ["aviation", "maritime", "rail", "road", "logistics"],
  "Prepared regional transport boundary; source terms must be confirmed before ingestion.",
);
