import { createPreparedConnector } from "./factory";

export const openStreetMapConnector = createPreparedConnector(
  "openstreetmap",
  ["aviation", "maritime", "rail", "road", "logistics"],
  "Prepared geospatial boundary; production extracts and ODbL attribution review required.",
);
