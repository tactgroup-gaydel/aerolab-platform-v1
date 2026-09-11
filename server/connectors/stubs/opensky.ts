import { createPreparedConnector } from "./factory";

export const openSkyConnector = createPreparedConnector(
  "opensky",
  ["aviation"],
  "Prepared aircraft-data boundary; activation requires operational credentials and license review.",
);
