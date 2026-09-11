import { createPreparedConnector } from "./factory";

export const unctadstatConnector = createPreparedConnector(
  "unctadstat",
  ["maritime", "logistics"],
  "Prepared indicator boundary for maritime trade and connectivity; dataset licensing review required.",
);
