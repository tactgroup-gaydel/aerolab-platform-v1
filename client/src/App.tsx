import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import NotFound from "./pages/NotFound";
import { ActPage, ActuPage, AnalysisPage, ArticlePage, CountryPage, DataPage, Home, HubPage, InfrastructurePage, IntelligencePage, IndicatorPage, MapPage, MarketPage, ProjectPage, ProjectsPage, SectorPage } from "./pages/AeroPages";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/mobility-actu" component={ActuPage} />
    <Route path="/mobility-actu/:slug" component={ArticlePage} />
    <Route path="/mobility-hub" component={HubPage} />
    <Route path="/mobility-hub/sector/:slug" component={SectorPage} />
    <Route path="/mobility-hub/market/:slug" component={MarketPage} />
    <Route path="/mobility-hub/infrastructure/:slug" component={InfrastructurePage} />
    <Route path="/mobility-hub/:slug" component={CountryPage} />
    <Route path="/data" component={DataPage} />
    <Route path="/data/:slug" component={IndicatorPage} />
    <Route path="/map" component={MapPage} />
    <Route path="/intelligence" component={IntelligencePage} />
    <Route path="/intelligence/:slug" component={AnalysisPage} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/projects/:slug" component={ProjectPage} />
    <Route path="/act" component={ActPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><LocaleProvider><TooltipProvider><Toaster /><Router /></TooltipProvider></LocaleProvider></ThemeProvider></ErrorBoundary>;
}
