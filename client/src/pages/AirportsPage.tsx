import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, MapPin, Plane, Search, ShieldCheck } from "lucide-react";
import { AeroShell } from "@/components/AeroShell";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 20;

function formatNumber(value: number, locale: "fr" | "en") {
  return value.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");
}

function formatCoord(value: string | null | undefined) {
  if (!value) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(3) : "—";
}

export function AirportsPage() {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [offset, setOffset] = useState(0);

  // Only forward a country code the API will accept (exactly 2 letters, ISO alpha-2).
  const countryCode = country.trim().length === 2 ? country.trim().toUpperCase() : undefined;
  const searchTerm = search.trim() || undefined;

  const airportsQuery = trpc.dataEngine.airports.useQuery(
    { limit: PAGE_SIZE, offset, search: searchTerm, countryCode },
    { retry: false, placeholderData: (previous) => previous },
  );
  const statsQuery = trpc.dataEngine.airportsStats.useQuery(undefined, { retry: false });

  const rows = airportsQuery.data?.rows ?? [];
  const total = airportsQuery.data?.total ?? 0;
  const stats = statsQuery.data;

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0";
    const from = offset + 1;
    const to = offset + rows.length;
    return `${formatNumber(from, locale)}–${formatNumber(to, locale)} / ${formatNumber(total, locale)}`;
  }, [offset, rows.length, total, locale]);

  const resetOffset = () => setOffset(0);
  const onSearch = (value: string) => { setSearch(value); resetOffset(); };
  const onCountry = (value: string) => { setCountry(value); resetOffset(); };

  const isFiltering = Boolean(searchTerm || countryCode);
  const noDatabase = !statsQuery.isLoading && stats?.total === 0 && !isFiltering && total === 0;

  const T = {
    eyebrow: "DATA · AÉROPORTS",
    title: locale === "fr" ? "Les aéroports, en base réelle." : "Airports, from the real database.",
    intro: locale === "fr"
      ? "Chaque enregistrement provient de la base AeroLab, alimentée par une source vérifiée — pas d’une donnée de démonstration."
      : "Every record comes from the AeroLab database, fed by a verified source — not demo data.",
    back: locale === "fr" ? "Retour à Data" : "Back to Data",
    provenance: locale === "fr" ? "PROVENANCE" : "PROVENANCE",
    sourceLine: locale === "fr"
      ? "Source : OurAirports · Domaine public · Ingestion validée (fetch → validation → normalisation → base)"
      : "Source: OurAirports · Public domain · Validated ingestion (fetch → validation → normalization → database)",
    statTotal: locale === "fr" ? "Aéroports en base" : "Airports in database",
    statCountries: locale === "fr" ? "Pays couverts" : "Countries covered",
    statIata: locale === "fr" ? "Avec code IATA" : "With IATA code",
    statIcao: locale === "fr" ? "Avec code ICAO" : "With ICAO code",
    searchPlaceholder: locale === "fr" ? "Nom, code IATA ou ICAO…" : "Name, IATA or ICAO code…",
    countryPlaceholder: locale === "fr" ? "Pays (code ISO, ex. SN)" : "Country (ISO code, e.g. SN)",
    topCountries: locale === "fr" ? "PAYS LES PLUS COUVERTS" : "MOST COVERED COUNTRIES",
    colName: locale === "fr" ? "Nom" : "Name",
    colCountry: locale === "fr" ? "Pays" : "Country",
    colCoords: locale === "fr" ? "Coordonnées" : "Coordinates",
    empty: locale === "fr" ? "Aucun aéroport ne correspond à ces filtres." : "No airport matches these filters.",
    pending: locale === "fr"
      ? "Aucune donnée en base pour l’instant. Lancez l’ingestion OurAirports, puis rechargez cette page."
      : "No data in the database yet. Run the OurAirports ingestion, then reload this page.",
    loading: locale === "fr" ? "Chargement…" : "Loading…",
    prev: locale === "fr" ? "Précédent" : "Previous",
    next: locale === "fr" ? "Suivant" : "Next",
    iataShare: locale === "fr" ? "part IATA" : "IATA share",
  };

  const iataShare = stats && stats.total > 0 ? Math.round((stats.withIata / stats.total) * 100) : null;

  return (
    <AeroShell>
      <div className="container listing-page airports-page">
        <div className="page-intro">
          <Link className="back-link" href="/data"><ArrowLeft size={14} /> {T.back}</Link>
          <span className="eyebrow">{T.eyebrow}</span>
          <h1>{T.title}</h1>
          <p>{T.intro}</p>
        </div>

        <div className="source-banner">
          <ShieldCheck size={18} />
          <div>
            <span className="eyebrow">{T.provenance}</span>
            <p>{T.sourceLine}</p>
          </div>
        </div>

        <div className="airport-stats">
          <div className="stat-tile stat-tile-primary">
            <span className="stat-value">{formatNumber(stats?.total ?? 0, locale)}</span>
            <span className="stat-label">{T.statTotal}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{formatNumber(stats?.countriesCovered ?? 0, locale)}</span>
            <span className="stat-label">{T.statCountries}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{formatNumber(stats?.withIata ?? 0, locale)}</span>
            <span className="stat-label">{T.statIata}{iataShare !== null && <em> · {iataShare}% {T.iataShare}</em>}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{formatNumber(stats?.withIcao ?? 0, locale)}</span>
            <span className="stat-label">{T.statIcao}</span>
          </div>
        </div>

        {stats && stats.topCountries.length > 0 && (
          <div className="top-countries">
            <span className="eyebrow">{T.topCountries}</span>
            <div className="top-countries-row">
              {stats.topCountries.map((item) => (
                <button
                  key={item.countryCode}
                  className={countryCode === item.countryCode ? "country-chip active" : "country-chip"}
                  onClick={() => onCountry(countryCode === item.countryCode ? "" : item.countryCode)}
                >
                  {item.countryCode} <span>{formatNumber(item.total, locale)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="airports-toolbar">
          <div className="inline-search">
            <Search size={16} />
            <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={T.searchPlaceholder} />
          </div>
          <div className="inline-search country-search">
            <MapPin size={16} />
            <input value={country} onChange={(event) => onCountry(event.target.value)} maxLength={2} placeholder={T.countryPlaceholder} />
          </div>
          <span className="range-label">{rangeLabel}</span>
        </div>

        {noDatabase ? (
          <div className="empty-state airports-empty"><Plane size={18} /> {T.pending}</div>
        ) : airportsQuery.isLoading ? (
          <div className="empty-state airports-empty">{T.loading}</div>
        ) : rows.length === 0 ? (
          <div className="empty-state airports-empty">{T.empty}</div>
        ) : (
          <div className="airports-table" role="table">
            <div className="airports-table-head" role="row">
              <span role="columnheader">{T.colName}</span>
              <span role="columnheader">IATA</span>
              <span role="columnheader">ICAO</span>
              <span role="columnheader">{T.colCountry}</span>
              <span role="columnheader">{T.colCoords}</span>
            </div>
            {rows.map((airport) => (
              <div className="airport-row" role="row" key={airport.id}>
                <span className="airport-name" role="cell">{airport.name}</span>
                <span className="airport-code" role="cell">{airport.iata || "—"}</span>
                <span className="airport-code" role="cell">{airport.icao || "—"}</span>
                <span className="airport-country" role="cell">{airport.countryCode || "—"}</span>
                <span className="airport-coords" role="cell">{formatCoord(airport.latitude)}, {formatCoord(airport.longitude)}</span>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="pagination-bar">
            <button disabled={offset === 0} onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}>
              <ArrowLeft size={15} /> {T.prev}
            </button>
            <span>{rangeLabel}</span>
            <button disabled={offset + rows.length >= total} onClick={() => setOffset((current) => current + PAGE_SIZE)}>
              {T.next} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </AeroShell>
  );
}
