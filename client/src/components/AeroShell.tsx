import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Globe2, Menu, Search, X } from "lucide-react";
import { analyses, articles, countries, indicators, infrastructures, markets, projects, searchContent, sectors } from "@shared/content";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/copy";
import { trpc } from "@/lib/trpc";

const primaryLinks = [
  { href: "/", label: copy.home },
  { href: "/mobility-actu", label: copy.actu },
  { href: "/mobility-hub", label: copy.hub },
];

function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="AeroLab home">
      <span className="wordmark-mark">A</span>
      <span>AEROLAB</span>
    </Link>
  );
}

function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language-toggle" aria-label="Language selector">
      <Globe2 size={14} strokeWidth={1.7} />
      <button className={locale === "fr" ? "active" : ""} onClick={() => setLocale("fr")} aria-pressed={locale === "fr"}>FR</button>
      <span>/</span>
      <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const serverSearch = trpc.content.search.useQuery({ q: query, locale }, { enabled: query.trim().length > 0 });
  const fallbackResults = useMemo(() => searchContent(query, locale), [query, locale]);
  const results = serverSearch.data ?? fallbackResults;
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label={t(copy.search)}>
      <div className="search-panel-inner">
        <div className="search-panel-top">
          <span className="eyebrow">{t(copy.search)}</span>
          <button className="icon-button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
        </div>
        <div className="search-input-wrap">
          <Search size={20} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "fr" ? "Pays, article, indicateur, projet…" : "Country, article, indicator, project…"} />
          <span className="search-shortcut">⌘ K</span>
        </div>
        {query && (
          <div className="search-results">
            {results.length ? results.map((result) => (
              <Link key={`${result.type}-${result.slug}`} href={result.type === "Mobility Actu" ? `/mobility-actu/${result.slug}` : result.type === "Mobility Hub" ? `/mobility-hub/${result.slug}` : result.type === "Data" ? `/data/${result.slug}` : result.type === "AeroLab Intelligence" ? `/intelligence/${result.slug}` : `/projects/${result.slug}`} onClick={onClose} className="search-result">
                <span className="result-type">{result.type}</span>
                <strong>{result.title}</strong>
                <small>{result.excerpt}</small>
              </Link>
            )) : <div className="empty-state">{t(copy.noResults)}</div>}
          </div>
        )}
        {!query && <div className="search-hint">{locale === "fr" ? "Recherchez dans les signaux, territoires, données et analyses AeroLab." : "Search across AeroLab signals, territories, data and analysis."}</div>}
      </div>
    </div>
  );
}

function pageMeta(path: string, locale: "fr" | "en") {
  const parts = path.split("/").filter(Boolean);
  const section = parts[0];
  const slug = parts[1];
  const titles: Record<string, string> = {
    "mobility-actu": locale === "fr" ? "Mobility Actu" : "Mobility Actu",
    "mobility-hub": locale === "fr" ? "Mobility Hub" : "Mobility Hub",
    data: "Data",
    map: "Map",
    intelligence: "AeroLab Intelligence",
    projects: "Projects",
    act: "AeroLab ACT",
  };
  let title = titles[section] ?? "AeroLab";
  if (section === "mobility-actu" && slug) title = articles.find((item) => item.slug === slug)?.title[locale] ?? title;
  if (section === "mobility-hub" && slug) title = countries.find((item) => item.slug === slug)?.name[locale] ?? markets.find((item) => item.slug === slug)?.name[locale] ?? infrastructures.find((item) => item.slug === slug)?.name[locale] ?? sectors.find((item) => item.slug === slug)?.label[locale] ?? title;
  if (section === "data" && slug) title = indicators.find((item) => item.slug === slug)?.name[locale] ?? title;
  if (section === "intelligence" && slug) title = analyses.find((item) => item.slug === slug)?.title[locale] ?? title;
  if (section === "projects" && slug) title = projects.find((item) => item.slug === slug)?.title[locale] ?? title;
  return { title: `${title} | AeroLab`, description: locale === "fr" ? "AeroLab — The Mobility Intelligence Company. Signaux, territoires, données, analyses et action." : "AeroLab — The Mobility Intelligence Company. Signals, territories, data, analysis and action." };
}

export function AeroShell({ children }: { children: React.ReactNode }) {
  const { locale, t } = useLocale();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const meta = pageMeta(location, locale);
    document.title = meta.title;
    document.documentElement.lang = locale;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", meta.description);
  }, [location, locale]);
  const [searchOpen, setSearchOpen] = useState(false);
  const moduleLinks = [
    { href: "/data", label: copy.data, note: locale === "fr" ? "Indicateurs sourcés" : "Sourced indicators" },
    { href: "/airports", label: copy.airports, note: locale === "fr" ? "Base aéroports réelle" : "Real airports database" },
    { href: "/map", label: copy.map, note: locale === "fr" ? "Territoires & infrastructures" : "Territories & infrastructure" },
    { href: "/intelligence", label: copy.intelligence, note: locale === "fr" ? "Lectures stratégiques" : "Strategic readings" },
    { href: "/projects", label: copy.projects, note: locale === "fr" ? "Problématiques & capacités" : "Questions & capabilities" },
    { href: "/act", label: copy.act, note: locale === "fr" ? "Passer à l’action" : "Move to action" },
  ];
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Wordmark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {primaryLinks.map((link) => <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : ""}>{t(link.label)}</Link>)}
            <button className="nav-plus" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen}><span>+</span> {t(copy.more)}</button>
          </nav>
          <div className="header-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label={t(copy.search)}><Search size={17} /><span>{t(copy.search)}</span></button>
            <LanguageToggle />
            <button className="icon-button mobile-menu-trigger" onClick={() => setMenuOpen((current) => !current)} aria-label={t(copy.more)} aria-expanded={menuOpen}><Menu size={20} /></button>
          </div>
        </div>
        {menuOpen && <div className="mega-menu">
          <div className="mega-menu-inner">
            <div className="mega-intro"><span className="eyebrow">{locale === "fr" ? "ÉCOSYSTÈME AEROLAB" : "AEROLAB ECOSYSTEM"}</span><h2>{locale === "fr" ? "De l’information à l’action." : "From information to action."}</h2><p>{locale === "fr" ? "Explorez la chaîne de connaissance qui relie signaux, territoires, données et décisions." : "Explore the knowledge chain connecting signals, territories, data and decisions."}</p></div>
            <div className="mega-links">{moduleLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="mega-link"><span><strong>{t(link.label)}</strong><small>{link.note}</small></span><ArrowUpRight size={17} /></Link>)}</div>
          </div>
        </div>}
      </header>
      <main className="page-content">{children}</main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/" className={isActive("/") ? "active" : ""}><span className="nav-glyph">⌂</span><small>{t(copy.home)}</small></Link>
        <Link href="/mobility-actu" className={isActive("/mobility-actu") ? "active" : ""}><span className="nav-glyph">↗</span><small>{t(copy.actu)}</small></Link>
        <button className="mobile-plus" onClick={() => setMenuOpen((current) => !current)} aria-label={t(copy.more)}>+</button>
        <Link href="/mobility-hub" className={isActive("/mobility-hub") ? "active" : ""}><span className="nav-glyph">⌘</span><small>{t(copy.hub)}</small></Link>
        <button className={menuOpen ? "active" : ""} onClick={() => setMenuOpen((current) => !current)}><span className="nav-glyph">⋯</span><small>{t(copy.more)}</small></button>
      </nav>
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

export function DemoBadge() {
  const { t } = useLocale();
  return <span className="demo-badge">{t(copy.demo)}</span>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}
