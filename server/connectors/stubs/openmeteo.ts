import { createPreparedConnector } from "./factory";

export const openMeteoConnector = createPreparedConnector(
  "openmeteo",
  ["logistics"],
  "Prepared weather-context boundary; operational use and attribution terms require review.",
);
