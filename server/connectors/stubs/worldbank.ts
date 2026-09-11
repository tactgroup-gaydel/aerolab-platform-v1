import { createPreparedConnector } from "./factory";

export const worldBankConnector = createPreparedConnector(
  "worldbank",
  ["logistics", "road", "rail"],
  "Prepared structural-indicator boundary; dataset-by-dataset license and methodology review required.",
);
