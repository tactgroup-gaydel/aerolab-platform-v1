import { createPreparedConnector } from "./factory";

export const ourAirportsConnector = createPreparedConnector(
  "ourairports",
  ["aviation"],
  "Prepared master-data boundary; activation requires license and ingestion review.",
);
