import type { Localized } from "@shared/content";

export const copy = {
  brandKicker: { fr: "THE MOBILITY INTELLIGENCE COMPANY", en: "THE MOBILITY INTELLIGENCE COMPANY" },
  home: { fr: "Accueil", en: "Home" },
  actu: { fr: "Actu", en: "Actu" },
  hub: { fr: "Hub", en: "Hub" },
  more: { fr: "Plus", en: "More" },
  search: { fr: "Rechercher", en: "Search" },
  data: { fr: "Data", en: "Data" },
  airports: { fr: "Airports", en: "Airports" },
  map: { fr: "Map", en: "Map" },
  intelligence: { fr: "Intelligence", en: "Intelligence" },
  projects: { fr: "Projects", en: "Projects" },
  act: { fr: "AeroLab ACT", en: "AeroLab ACT" },
  explore: { fr: "Explorer", en: "Explore" },
  read: { fr: "Lire", en: "Read" },
  viewAll: { fr: "Voir tout", en: "View all" },
  related: { fr: "À explorer ensuite", en: "Explore next" },
  demo: { fr: "DEMO / SAMPLE DATA", en: "DEMO / SAMPLE DATA" },
  back: { fr: "Retour", en: "Back" },
  noResults: { fr: "Aucun résultat", en: "No results" },
  loading: { fr: "Chargement…", en: "Loading…" },
  submit: { fr: "Envoyer la demande", en: "Send request" },
} satisfies Record<string, Localized>;

export type CopyKey = keyof typeof copy;
