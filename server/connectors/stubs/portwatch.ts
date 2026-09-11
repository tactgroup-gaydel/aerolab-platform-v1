import { createPreparedConnector } from "./factory";

export const portWatchConnector = createPreparedConnector(
  "portwatch",
  ["maritime", "logistics"],
  "Prepared port-activity boundary; activation requires source terms and ingestion design review.",
);
