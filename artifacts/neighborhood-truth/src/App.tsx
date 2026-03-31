import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import Index from "@/pages/Index";
import CityPage from "@/pages/seo/CityPage";
import AreaPage from "@/pages/seo/AreaPage";
import IntentPage from "@/pages/seo/IntentPage";
import ComparePage from "@/pages/seo/ComparePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base={BASE}>
          <Switch>
            <Route path="/compare/:slug" component={ComparePage} />
            <Route path="/:city/safe-neighborhoods" component={IntentPage} />
            <Route path="/:city/affordable-areas" component={IntentPage} />
            <Route path="/:city/nightlife-areas" component={IntentPage} />
            <Route path="/:city/family-friendly" component={IntentPage} />
            <Route path="/:city/:area" component={AreaPage} />
            <Route path="/:city" component={CityPage} />
            <Route path="/" component={Index} />
          </Switch>
        </Router>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
