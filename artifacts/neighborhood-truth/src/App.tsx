import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import Index from "@/pages/Index";
import CityPage from "@/pages/seo/CityPage";
import AreaPage from "@/pages/seo/AreaPage";
import IntentPage from "@/pages/seo/IntentPage";
import ComparePage from "@/pages/seo/ComparePage";
import CheapAreasPage from "@/pages/seo/CheapAreasPage";
import VibeFilterPage from "@/pages/seo/VibeFilterPage";
import CityComparePage from "@/pages/seo/CityComparePage";
import AboutPage from "@/pages/seo/AboutPage";
import HowItWorksPage from "@/pages/seo/HowItWorksPage";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
            <Switch>
              {/* Utility pages */}
              <Route path="/about" component={AboutPage} />
              <Route path="/how-it-works" component={HowItWorksPage} />

              {/* City comparison pages — static city-vs-city (must come before generic compare) */}
              <Route path="/compare/delhi-vs-gurgaon" component={CityComparePage} />
              <Route path="/compare/mumbai-vs-pune" component={CityComparePage} />
              <Route path="/compare/bangalore-vs-hyderabad" component={CityComparePage} />
              <Route path="/compare/delhi-vs-noida" component={CityComparePage} />
              <Route path="/compare/gurgaon-vs-noida" component={CityComparePage} />

              {/* Generic area comparison page */}
              <Route path="/compare/:slug" component={ComparePage} />

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

              {/* Area and city pages */}
              <Route path="/:city/:area" component={AreaPage} />
              <Route path="/:city" component={CityPage} />
              <Route path="/" component={Index} />
            </Switch>
          </Router>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
