import { createPreparedConnector } from "./factory";

export const mobilityDataConnector = createPreparedConnector(
  "mobilitydata",
  ["road", "rail"],
  "Prepared feed-registry boundary; individual feed license and refresh contract review required.",
);
