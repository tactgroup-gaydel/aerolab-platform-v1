export type Locale = "fr" | "en";

export type Localized = {
  fr: string;
  en: string;
};

export type SectorSlug = "air" | "sea" | "rail" | "road" | "logistics";

export type Article = {
  slug: string;
  title: Localized;
  excerpt: Localized;
  category: string;
  sector: SectorSlug;
  geography: string;
  readTime: number;
  publishedLabel: Localized;
  fact: Localized;
  context: Localized;
  signal: Localized;
  implications: Localized;
  tags: string[];
};

export type Country = {
  slug: string;
  name: Localized;
  iso: string;
  region: string;
  description: Localized;
  focus: string[];
  coordinates: { x: number; y: number };
};

export type Market = {
  slug: string;
  name: Localized;
  country: string;
  sector: Localized;
  description: Localized;
};

export type Infrastructure = {
  slug: string;
  name: Localized;
  type: Localized;
  country: string;
  city: string;
  coordinates: { x: number; y: number };
  description: Localized;
};

export type Indicator = {
  slug: string;
  name: Localized;
  value: string;
  unit: Localized;
  period: string;
  territory: string;
  sector: Localized;
  source: Localized;
  publisher: string;
  updated: string;
  methodology: Localized;
  demo: boolean;
};

export type Analysis = {
  slug: string;
  title: Localized;
  summary: Localized;
  country: string;
  sector: Localized;
  sections: {
    facts: Localized;
    data: Localized;
    context: Localized;
    implications: Localized;
    reading: Localized;
    action: Localized;
  };
};

export type Project = {
  slug: string;
  title: Localized;
  label: Localized;
  country: string;
  sector: Localized;
  context?: Localized;
  intervention?: Localized;
  deliverables?: Localized;
  illustrative: boolean;
};

export const sectors: Array<{ slug: SectorSlug; label: Localized; short: string }> = [
  { slug: "air", label: { fr: "Aérien", en: "Air" }, short: "AIR" },
  { slug: "sea", label: { fr: "Maritime", en: "Maritime" }, short: "MER" },
  { slug: "rail", label: { fr: "Ferroviaire", en: "Rail" }, short: "RAIL" },
  { slug: "road", label: { fr: "Routier", en: "Road" }, short: "ROUTE" },
  { slug: "logistics", label: { fr: "Logistique", en: "Logistics" }, short: "LOGISTIQUE" },
];

export const articles: Article[] = [
  {
    slug: "grands-mouvements-mobilite-africaine",
    title: {
      fr: "Les grands mouvements de la mobilité africaine",
      en: "The major movements shaping African mobility",
    },
    excerpt: {
      fr: "Les évolutions qui redessinent les réseaux, les infrastructures et les marchés.",
      en: "The shifts reshaping networks, infrastructure and markets.",
    },
    category: "SIGNAL",
    sector: "air",
    geography: "Afrique",
    readTime: 4,
    publishedLabel: { fr: "Aujourd’hui", en: "Today" },
    fact: {
      fr: "Un système de mobilité en transformation.",
      en: "A mobility system in transition.",
    },
    context: {
      fr: "Les réseaux africains évoluent sous l’effet des infrastructures, des corridors, des investissements et des nouveaux besoins de connectivité.",
      en: "African networks are changing under the influence of infrastructure, corridors, investment and new connectivity needs.",
    },
    signal: {
      fr: "Derrière chaque annonce se trouve potentiellement une évolution de marché ou de réseau.",
      en: "Behind every announcement may lie a shift in a market or network.",
    },
    implications: {
      fr: "Les décideurs doivent pouvoir relier rapidement le fait à son environnement opérationnel.",
      en: "Decision-makers need to connect the signal quickly to its operating environment.",
    },
    tags: ["Afrique", "Réseaux", "Connectivité"],
  },
  {
    slug: "ports-corridors-chaines-logistiques",
    title: {
      fr: "Ports, corridors et nouvelles chaînes logistiques",
      en: "Ports, corridors and new logistics chains",
    },
    excerpt: {
      fr: "Lire les infrastructures comme des systèmes connectés plutôt que comme des actifs isolés.",
      en: "Read infrastructure as connected systems rather than isolated assets.",
    },
    category: "INFRASTRUCTURE",
    sector: "logistics",
    geography: "Afrique de l’Ouest",
    readTime: 5,
    publishedLabel: { fr: "Cette semaine", en: "This week" },
    fact: {
      fr: "Les corridors structurent les trajectoires économiques autant que les flux.",
      en: "Corridors shape economic trajectories as much as they shape flows.",
    },
    context: {
      fr: "Une lecture utile relie ports, marchés, territoires et capacités de desserte.",
      en: "A useful reading connects ports, markets, territories and reach capacity.",
    },
    signal: {
      fr: "La performance d’un corridor se lit dans la relation entre infrastructure et marché.",
      en: "Corridor performance is visible in the relationship between infrastructure and market.",
    },
    implications: {
      fr: "Les arbitrages gagnent à être documentés à l’échelle du système.",
      en: "Trade-offs are best documented at system scale.",
    },
    tags: ["Ports", "Corridors", "Logistique"],
  },
];

export const countries: Country[] = [
  {
    slug: "senegal",
    name: { fr: "Sénégal", en: "Senegal" },
    iso: "SN",
    region: "West Africa",
    description: {
      fr: "Un territoire de connexion entre façade atlantique, marchés régionaux et réseaux aériens.",
      en: "A connector territory between the Atlantic coast, regional markets and air networks.",
    },
    focus: ["Aérien", "Portuaire", "Corridors"],
    coordinates: { x: 23, y: 46 },
  },
  {
    slug: "kenya",
    name: { fr: "Kenya", en: "Kenya" },
    iso: "KE",
    region: "East Africa",
    description: {
      fr: "Un hub régional où se rencontrent aviation, logistique et accès aux marchés d’Afrique de l’Est.",
      en: "A regional hub where aviation, logistics and market access meet in East Africa.",
    },
    focus: ["Aérien", "Logistique", "Marchés"],
    coordinates: { x: 63, y: 54 },
  },
  {
    slug: "morocco",
    name: { fr: "Maroc", en: "Morocco" },
    iso: "MA",
    region: "North Africa",
    description: {
      fr: "Une interface stratégique entre Afrique, Europe et réseaux maritimes et aériens.",
      en: "A strategic interface between Africa, Europe and maritime and air networks.",
    },
    focus: ["Aérien", "Maritime", "Industrie"],
    coordinates: { x: 31, y: 25 },
  },
];

export const markets: Market[] = [
  { slug: "west-africa-air-network", name: { fr: "Réseau aérien ouest-africain", en: "West African air network" }, country: "Afrique de l’Ouest", sector: { fr: "Aérien", en: "Air" }, description: { fr: "Marché relationnel à explorer par ses liaisons, territoires et capacités.", en: "Relational market to explore through links, territories and capacity." } },
  { slug: "atlantic-logistics-corridor", name: { fr: "Corridor logistique atlantique", en: "Atlantic logistics corridor" }, country: "Afrique de l’Ouest", sector: { fr: "Logistique", en: "Logistics" }, description: { fr: "Lecture de marché structurée autour des ports, routes et plateformes.", en: "Market reading structured around ports, roads and platforms." } },
];

export const infrastructures: Infrastructure[] = [
  { slug: "blaise-diagne-airport", name: { fr: "Aéroport international Blaise Diagne", en: "Blaise Diagne International Airport" }, type: { fr: "Aéroport", en: "Airport" }, country: "Sénégal", city: "Dakar", coordinates: { x: 27, y: 48 }, description: { fr: "Point d’entrée aérien à relier aux réseaux, marchés et indicateurs du territoire.", en: "Air gateway to connect with the territory’s networks, markets and indicators." } },
  { slug: "port-of-dakar", name: { fr: "Port de Dakar", en: "Port of Dakar" }, type: { fr: "Port", en: "Port" }, country: "Sénégal", city: "Dakar", coordinates: { x: 25, y: 52 }, description: { fr: "Infrastructure maritime à replacer dans l’architecture des corridors régionaux.", en: "Maritime infrastructure to read within the regional corridor architecture." } },
  { slug: "jomo-kenyatta-airport", name: { fr: "Aéroport international Jomo Kenyatta", en: "Jomo Kenyatta International Airport" }, type: { fr: "Aéroport", en: "Airport" }, country: "Kenya", city: "Nairobi", coordinates: { x: 65, y: 55 }, description: { fr: "Nœud aérien régional à explorer par les connexions et les marchés desservis.", en: "Regional air node to explore through connections and markets served." } },
];

export const indicators: Indicator[] = [
  {
    slug: "connectivite-aerienne-regionale",
    name: { fr: "Connectivité aérienne régionale", en: "Regional air connectivity" },
    value: "72",
    unit: { fr: "indice", en: "index" },
    period: "2025",
    territory: "Afrique de l’Ouest",
    sector: { fr: "Aérien", en: "Air" },
    source: { fr: "Source de démonstration à valider", en: "Demonstration source to be validated" },
    publisher: "AeroLab Research Desk",
    updated: "2026-01-15",
    methodology: {
      fr: "Indice illustratif agrégant la fréquence, la diversité et la continuité des liaisons. Valeur de démonstration, non publiée.",
      en: "Illustrative index combining frequency, diversity and continuity of links. Demonstration value, not published.",
    },
    demo: true,
  },
  {
    slug: "accessibilite-portuaire-corridor",
    name: { fr: "Accessibilité portuaire d’un corridor", en: "Corridor port accessibility" },
    value: "58",
    unit: { fr: "score", en: "score" },
    period: "2025",
    territory: "Afrique de l’Ouest",
    sector: { fr: "Logistique", en: "Logistics" },
    source: { fr: "Base de travail AeroLab (DEMO)", en: "AeroLab working base (DEMO)" },
    publisher: "AeroLab Research Desk",
    updated: "2026-02-03",
    methodology: {
      fr: "Score de démonstration utilisé pour illustrer la traçabilité d’un indicateur territorial.",
      en: "Demonstration score used to illustrate the provenance of a territorial indicator.",
    },
    demo: true,
  },
  {
    slug: "densite-infrastructures-strategiques",
    name: { fr: "Densité d’infrastructures stratégiques", en: "Strategic infrastructure density" },
    value: "14",
    unit: { fr: "points / territoire", en: "points / territory" },
    period: "2024",
    territory: "Sénégal",
    sector: { fr: "Multimodal", en: "Multimodal" },
    source: { fr: "Donnée illustrative — publication à confirmer", en: "Illustrative data — publication to be confirmed" },
    publisher: "AeroLab Research Desk",
    updated: "2026-02-18",
    methodology: {
      fr: "Exemple de fiche indicateur, sans valeur de référence publique revendiquée.",
      en: "Example indicator record, with no claimed public reference value.",
    },
    demo: true,
  },
];

export const analyses: Analysis[] = [
  {
    slug: "senegal-hub-connectivite",
    title: { fr: "Sénégal : lire un hub de connectivité", en: "Senegal: reading a connectivity hub" },
    summary: {
      fr: "Une lecture AeroLab des liens entre territoire, infrastructure et marché.",
      en: "An AeroLab reading of the links between territory, infrastructure and market.",
    },
    country: "Sénégal",
    sector: { fr: "Multimodal", en: "Multimodal" },
    sections: {
      facts: { fr: "Le Sénégal concentre plusieurs fonctions de passage et de redistribution.", en: "Senegal concentrates several gateway and redistribution functions." },
      data: { fr: "Les indicateurs de connectivité doivent être rapprochés des infrastructures et des territoires desservis.", en: "Connectivity indicators should be read alongside infrastructure and territories served." },
      context: { fr: "La position atlantique n’explique pas seule la dynamique : les relations régionales comptent.", en: "The Atlantic position does not explain the dynamic alone: regional relationships matter." },
      implications: { fr: "Le sujet est moins celui d’un actif isolé que celui d’un système de connexions.", en: "The issue is less an isolated asset than a system of connections." },
      reading: { fr: "AeroLab recommande de croiser les signaux, les données et la carte avant d’arbitrer.", en: "AeroLab recommends connecting signals, data and geography before making a decision." },
      action: { fr: "Construire une base relationnelle des corridors et des capacités de desserte.", en: "Build a relational base of corridors and reach capacity." },
    },
  },
  {
    slug: "corridors-comme-systemes",
    title: { fr: "Les corridors comme systèmes", en: "Corridors as systems" },
    summary: { fr: "Passer de la carte des actifs à la compréhension des relations.", en: "Move from an asset map to an understanding of relationships." },
    country: "Afrique de l’Ouest",
    sector: { fr: "Logistique", en: "Logistics" },
    sections: {
      facts: { fr: "Un corridor relie plusieurs infrastructures, marchés et décisions.", en: "A corridor connects multiple infrastructures, markets and decisions." },
      data: { fr: "La donnée utile combine localisation, capacité, période et provenance.", en: "Useful data combines location, capacity, period and provenance." },
      context: { fr: "Les performances peuvent varier selon les segments et les interfaces.", en: "Performance can vary by segment and interface." },
      implications: { fr: "Une lecture agrégée peut masquer les points de rupture.", en: "An aggregate reading can hide points of failure." },
      reading: { fr: "La valeur vient de la mise en relation des objets, pas de leur accumulation.", en: "Value comes from connecting objects, not accumulating them." },
      action: { fr: "Prioriser les zones où une intervention peut améliorer la continuité du système.", en: "Prioritize areas where an intervention can improve system continuity." },
    },
  },
];

export const projects: Project[] = [
  {
    slug: "cartographie-corridors",
    title: { fr: "Cartographie des corridors de mobilité", en: "Mobility corridor mapping" },
    label: { fr: "CAPACITÉ · DEMO", en: "CAPABILITY · DEMO" },
    country: "Afrique de l’Ouest",
    sector: { fr: "Logistique", en: "Logistics" },
    context: { fr: "Exemple de cadrage pour relier territoires, infrastructures et marchés. Contenu illustratif, sans référence client.", en: "Illustrative framing to connect territories, infrastructure and markets. Illustrative content, no client reference." },
    intervention: { fr: "Structurer une base relationnelle et une lecture cartographique des corridors prioritaires.", en: "Structure a relational base and map-based reading of priority corridors." },
    deliverables: { fr: "Schéma de connaissance, fiches territoriales et parcours de lecture.", en: "Knowledge schema, territory briefs and reading journeys." },
    illustrative: true,
  },
  {
    slug: "diagnostic-connectivite",
    title: { fr: "Diagnostic de connectivité territoriale", en: "Territorial connectivity diagnostic" },
    label: { fr: "CAPACITÉ · DEMO", en: "CAPABILITY · DEMO" },
    country: "Sénégal",
    sector: { fr: "Multimodal", en: "Multimodal" },
    context: { fr: "Exemple de demande pouvant être qualifiée via AeroLab ACT. Aucun résultat ou client n’est revendiqué.", en: "Example request that could be qualified through AeroLab ACT. No client or result is claimed." },
    intervention: { fr: "Relier signaux, indicateurs et infrastructures afin de produire une lecture actionnable.", en: "Connect signals, indicators and infrastructure to produce an actionable reading." },
    illustrative: true,
  },
];

export function label(locale: Locale, value: Localized) {
  return value[locale];
}

export function searchContent(query: string, locale: Locale) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const entries = [
    ...articles.map((item) => ({ type: "Mobility Actu", slug: item.slug, title: label(locale, item.title), excerpt: label(locale, item.excerpt) })),
    ...countries.map((item) => ({ type: "Mobility Hub", slug: item.slug, title: label(locale, item.name), excerpt: label(locale, item.description) })),
    ...markets.map((item) => ({ type: "Market", slug: item.slug, title: label(locale, item.name), excerpt: `${item.country} · ${label(locale, item.sector)}` })),
    ...infrastructures.map((item) => ({ type: "Infrastructure", slug: item.slug, title: label(locale, item.name), excerpt: `${item.city} · ${label(locale, item.type)}` })),
    ...indicators.map((item) => ({ type: "Data", slug: item.slug, title: label(locale, item.name), excerpt: `${item.value} ${label(locale, item.unit)} · ${item.territory}` })),
    ...analyses.map((item) => ({ type: "AeroLab Intelligence", slug: item.slug, title: label(locale, item.title), excerpt: label(locale, item.summary) })),
    ...projects.map((item) => ({ type: "Projects", slug: item.slug, title: label(locale, item.title), excerpt: label(locale, item.label) })),
  ];
  return entries.filter((item) => `${item.title} ${item.excerpt} ${item.type}`.toLowerCase().includes(normalized));
}
