import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch, useLocation } from "wouter";
import Index from "@/pages/Index";
import LandingPage from "@/pages/LandingPage";
import CityPage from "@/pages/seo/CityPage";
import AreaPage from "@/pages/seo/AreaPage";
import IntentPage from "@/pages/seo/IntentPage";
import ComparePage from "@/pages/seo/ComparePage";
import CheapAreasPage from "@/pages/seo/CheapAreasPage";
import VibeFilterPage from "@/pages/seo/VibeFilterPage";
import CityComparePage, { ALL_CITY_SLUGS } from "@/pages/seo/CityComparePage";
import AboutPage from "@/pages/seo/AboutPage";
import HowItWorksPage from "@/pages/seo/HowItWorksPage";
import { LanguageProvider } from "@/contexts/LanguageContext";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function ApiPassthrough() {
  useEffect(() => {
    window.location.replace(window.location.pathname + window.location.search);
  }, []);
  return null;
}

function CompareRouter({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const parts = slug.split("-vs-");
  const slugA = parts[0] ?? "";
  const slugB = parts.slice(1).join("-vs-") ?? "";
  const bothCities = ALL_CITY_SLUGS.has(slugA) && ALL_CITY_SLUGS.has(slugB);
  if (bothCities) return <CityComparePage />;
  return <ComparePage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router base={BASE}>
            <ScrollToTop />
            <Switch>
              {/* Utility pages */}
              <Route path="/about" component={AboutPage} />
              <Route path="/how-it-works" component={HowItWorksPage} />

              {/* City vs city → CityComparePage (dynamic), neighborhood vs neighborhood → ComparePage */}
              <Route path="/compare/:slug" component={CompareRouter} />

              {/* Cheap areas guides */}
              <Route path="/:city/cheap-areas-to-live" component={CheapAreasPage} />

              {/* Vibe filter pages — specific sub-pages */}
              <Route path="/bangalore/it-hub-areas" component={VibeFilterPage} />
              <Route path="/pune/student-friendly-areas" component={VibeFilterPage} />
              <Route path="/delhi/family-friendly-areas" component={VibeFilterPage} />
              <Route path="/mumbai/safe-areas-for-women" component={VibeFilterPage} />

              {/* Intent pages (existing) */}
              <Route path="/:city/safe-neighborhoods" component={IntentPage} />
              <Route path="/:city/affordable-areas" component={IntentPage} />
              <Route path="/:city/nightlife-areas" component={IntentPage} />
              <Route path="/:city/family-friendly" component={IntentPage} />
              <Route path="/:city/best-areas-for-students" component={IntentPage} />
              <Route path="/:city/best-areas-for-young-professionals" component={IntentPage} />
              <Route path="/:city/quiet-neighborhoods" component={IntentPage} />
              <Route path="/:city/expensive-neighborhoods" component={IntentPage} />

              {/* Full-screen map */}
              <Route path="/labels" component={Index} />
              <Route path="/map" component={Index} />

              {/* Guard: prevent /api/* from being caught by /:city/:area */}
              <Route path="/api/:rest*" component={ApiPassthrough} />

              {/* Area and city pages */}
              <Route path="/:city/:area" component={AreaPage} />
              <Route path="/:city" component={CityPage} />

              {/* Landing page — must be last */}
              <Route path="/" component={LandingPage} />
            </Switch>
          </Router>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
