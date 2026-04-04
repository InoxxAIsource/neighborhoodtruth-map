import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapView } from "@/components/MapView";
import type { AreaSummary, LabelData } from "@/components/MapView";
import { FilterSidebar, DEFAULT_FILTERS } from "@/components/FilterSidebar";
import { TopToolbar } from "@/components/TopToolbar";
import { HeroOverlay, MicroHints, useOnboarding } from "@/components/Onboarding";
import { ZoneLegend } from "@/components/ZoneLegend";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Sparkles, X } from "lucide-react";
import { useVoterId } from "@/hooks/useVoterId";
import { toast } from "sonner";
import type { Filters } from "@/components/MapView";
import { useLanguage } from "@/contexts/LanguageContext";
import { MigrationModal } from "@/components/MigrationModal";
import { ShareSheet } from "@/components/ShareSheet";
import { LayerControlPanel } from "@/components/LayerControlPanel";
import { FestivalBanner } from "@/components/FestivalBanner";
import { useLayerState } from "@/hooks/useLayerState";

const HERE_API_KEY = (import.meta.env.VITE_HERE_API_KEY as string | undefined) ?? "";

const AddLabelDialog = lazy(() => import("@/components/AddLabelDialog").then(m => ({ default: m.AddLabelDialog })));
const NeighborhoodChatModal = lazy(() => import("@/components/NeighborhoodChatModal").then(m => ({ default: m.NeighborhoodChatModal })));

const CITIES_MAP: { slug: string; name: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
  { slug: "new-york", name: "New York", latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
  { slug: "san-francisco", name: "San Francisco", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
  { slug: "los-angeles", name: "Los Angeles", latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0 },
  { slug: "toronto", name: "Toronto", latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1 },
  { slug: "mexico-city", name: "Mexico City", latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9 },
  { slug: "buenos-aires", name: "Buenos Aires", latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2 },
  { slug: "london", name: "London", latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1 },
  { slug: "amsterdam", name: "Amsterdam", latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1 },
  { slug: "rome", name: "Rome", latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7 },
  { slug: "istanbul", name: "Istanbul", latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5 },
  { slug: "tel-aviv", name: "Tel Aviv", latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05 },
  { slug: "jerusalem", name: "Jerusalem", latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4 },
  { slug: "tehran", name: "Tehran", latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7 },
  { slug: "cairo", name: "Cairo", latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5 },
  { slug: "cape-town", name: "Cape Town", latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7 },
  { slug: "tokyo", name: "Tokyo", latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9 },
  { slug: "seoul", name: "Seoul", latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3 },
  { slug: "hong-kong", name: "Hong Kong", latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5 },
  { slug: "bali", name: "Bali", latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5 },
  { slug: "karachi", name: "Karachi", latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4 },
  { slug: "lahore", name: "Lahore", latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5 },
  { slug: "mumbai", name: "Mumbai", latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3 },
  { slug: "delhi", name: "Delhi", latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5 },
  { slug: "bangalore", name: "Bangalore", latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0 },
  { slug: "hyderabad", name: "Hyderabad", latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9 },
  { slug: "pune", name: "Pune", latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3 },
  { slug: "chennai", name: "Chennai", latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8 },
  { slug: "kolkata", name: "Kolkata", latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8 },
  { slug: "ahmedabad", name: "Ahmedabad", latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2 },
  { slug: "jaipur", name: "Jaipur", latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2 },
  { slug: "lucknow", name: "Lucknow", latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3 },
  { slug: "chandigarh", name: "Chandigarh", latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2 },
  { slug: "goa", name: "Goa", latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3 },
  { slug: "indore", name: "Indore", latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2 },
  { slug: "coimbatore", name: "Coimbatore", latMin: 10.8, latMax: 11.2, lngMin: 76.8, lngMax: 77.2 },
];

function detectCity(lat: number, lng: number, zoom: number) {
  if (zoom < 10) return null;
  return CITIES_MAP.find(
    (c) => lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax
  ) ?? null;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

interface LabelDTO {
  id: string;
  lat: number;
  lng: number;
  text: string;
  safety: number;
  vibe: string[] | null;
  cost: string;
  upvotes: number;
  downvotes: number;
  color: string | null;
  category: string | null;
  createdAt: string;
  topTags?: string[];
}

interface VoteDTO {
  labelId: string;
  voteType: string;
}

export default function Index() {
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locateUser, setLocateUser] = useState(true);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedLabel, setSelectedLabel] = useState<LabelData | null>(null);
  const voterId = useVoterId();
  const queryClient = useQueryClient();
  const { showHero, hasInteracted, dismissHero, markInteracted } = useOnboarding();
  const { t } = useLanguage();

  // Layer state and map zoom
  const { layers, toggleLayer, togglePoi } = useLayerState();
  const [mapZoom, setMapZoom] = useState(2);

  // Share sheet state
  const [shareLabel, setShareLabel] = useState<LabelData | null>(null);

  // Migration Mode state
  const [detectedCity, setDetectedCity] = useState<{ slug: string; name: string } | null>(null);
  const [migrationBannerDismissed, setMigrationBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("pl_migration_banner_dismissed") === "1"; } catch { return false; }
  });
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);

  const handleMapViewChange = useCallback((lat: number, lng: number, zoom: number) => {
    const city = detectCity(lat, lng, zoom);
    if (city) {
      setDetectedCity({ slug: city.slug, name: city.name });
    } else {
      setDetectedCity(null);
    }
  }, []);

  const showMigrationBanner = detectedCity !== null && !migrationBannerDismissed && !migrationModalOpen;

  const { data: labels = [] } = useQuery<LabelDTO[]>({
    queryKey: ["labels"],
    queryFn: () => apiFetch<LabelDTO[]>("/labels"),
    refetchInterval: 30000,
  });

  const { data: userVotes = [] } = useQuery<VoteDTO[]>({
    queryKey: ["votes", voterId],
    queryFn: () => apiFetch<VoteDTO[]>(`/labels/my-votes?voterId=${encodeURIComponent(voterId)}`),
  });

  const addLabel = useMutation({
    mutationFn: async (payload: {
      lat: number; lng: number; text: string; safety: number; vibe: string[]; cost: string; color: string; category: string | null; tags: string[];
    }) => {
      const { tags, ...labelData } = payload;
      const label = await apiFetch<LabelDTO>("/labels", {
        method: "POST",
        body: JSON.stringify(labelData),
      });

      if (tags.length > 0) {
        await Promise.allSettled(
          tags.map((tagKey) =>
            fetch(`${API}/labels/${label.id}/tags`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tagKey, voterId }),
            })
          )
        );
      }

      return label;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      setDialogOpen(false);
      setIsPlacingPin(false);
      markInteracted();
      toast.success("Label dropped!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add label"),
  });

  const vote = useMutation({
    mutationFn: async ({ labelId, voteType }: { labelId: string; voteType: "upvote" | "downvote" | "accurate" }) => {
      const alreadyVoted = userVotes.some((v) => v.labelId === labelId);
      if (alreadyVoted) throw new Error("Already voted");

      return apiFetch<LabelDTO>(`/labels/${labelId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voterId, voteType }),
      });
    },
    onSuccess: () => {
      markInteracted();
      queryClient.invalidateQueries({ queryKey: ["votes", voterId] });
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
    onError: (e: Error) => {
      toast.error(e.message === "Already voted" ? "You already voted on this!" : "Vote failed");
    },
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
    setDialogOpen(true);
  }, []);

  const handleVote = useCallback((labelId: string, voteType: "upvote" | "downvote" | "accurate") => {
    vote.mutate({ labelId, voteType });
  }, [vote]);

  const handleLabelClick = useCallback((label: LabelData) => {
    setSelectedLabel(label);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const label = (e as CustomEvent<LabelData>).detail;
      if (label) setSelectedLabel(label);
    };
    window.addEventListener("hoodmap:askai", handler);
    return () => window.removeEventListener("hoodmap:askai", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const label = (e as CustomEvent<LabelData>).detail;
      if (label) setShareLabel(label);
    };
    window.addEventListener("hoodmap:share", handler);
    return () => window.removeEventListener("hoodmap:share", handler);
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <MapView
        labels={labels}
        isPlacingPin={isPlacingPin}
        onMapClick={handleMapClick}
        onVote={handleVote}
        onLabelClick={handleLabelClick}
        showHeatmap={showHeatmap}
        filters={filters}
        showLabels={showLabels}
        selectedCategories={selectedCategories}
        locateUser={locateUser}
        onLocated={() => setLocateUser(false)}
        flyToLocation={flyToLocation}
        onFlownTo={() => setFlyToLocation(null)}
        onAreaClick={(area: AreaSummary) => {
          toast.info(`Exploring ${area.name} — ${area.labelCount} labels nearby`);
        }}
        apiBase={API}
        voterId={voterId}
        myVotes={userVotes}
        onMapViewChange={handleMapViewChange}
        layers={layers}
        hereApiKey={HERE_API_KEY || undefined}
        onZoomChange={setMapZoom}
      />

      <TopToolbar
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((p) => !p)}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((p) => !p)}
        isLocating={locateUser}
        onLocate={() => setLocateUser(true)}
        onSearchLocation={(coords) => setFlyToLocation(coords)}
      />

      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((p) => !p)}
      />

      {showHero && <HeroOverlay onDismiss={dismissHero} />}
      {!showHero && <MicroHints hasInteracted={hasInteracted} />}

      {/* Always-present H1 for SEO crawlers; visually shown only on sm+ */}
      <h1 className="sr-only">NeighborhoodTruth — Honest Neighborhood Reviews &amp; Local Insights</h1>
      <div className="absolute top-4 right-4 z-[1000] hidden sm:block">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border">
          <span className="text-lg font-bold text-foreground">PlaceLabels</span>
          <p className="text-[10px] text-muted-foreground">{labels.length} insights worldwide</p>
        </div>
      </div>

      <div className="fixed right-4 sm:right-6 z-[1000]" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        {isPlacingPin ? (
          <div className="flex flex-col items-end gap-2">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border animate-pulse">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 animate-bounce" />
                {t.dropping}
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPlacingPin(false)}>{t.cancel}</Button>
          </div>
        ) : (
          <Button size="lg" className="shadow-lg gap-2 h-12 px-5 text-base" onClick={() => setIsPlacingPin(true)}>
            <Plus className="h-5 w-5" />
            {t.dropLabel}
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        <AddLabelDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          position={clickedPosition}
          onSubmit={(data) => addLabel.mutate(data)}
          isSubmitting={addLabel.isPending}
        />
      </Suspense>

      <ZoneLegend />

      {/* Festival banner — rendered inside the relative map wrapper */}
      <FestivalBanner apiBase={API} enabled={layers.festivals} />

      {/* Layer control panel — floating above zoom controls */}
      <div className="absolute inset-0 pointer-events-none z-[1100]">
        <div className="pointer-events-auto">
          <LayerControlPanel
            layers={layers}
            mapZoom={mapZoom}
            hasTrafficKey={!!HERE_API_KEY}
            onToggleLayer={toggleLayer}
            onTogglePoi={togglePoi}
          />
        </div>
      </div>

      {/* Migration Mode banner */}
      {showMigrationBanner && detectedCity && (
        <div
          className="fixed bottom-20 left-1/2 z-[1500] flex items-center gap-2 rounded-2xl shadow-xl border border-teal-200 px-4 py-3"
          style={{
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <Sparkles className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <p className="text-sm font-medium text-teal-900 whitespace-nowrap">
            New to {detectedCity.name}? Find your neighbourhood →
          </p>
          <button
            onClick={() => setMigrationModalOpen(true)}
            className="ml-1 text-xs font-bold bg-teal-600 text-white rounded-full px-3 py-1 hover:bg-teal-700 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Start quiz
          </button>
          <button
            onClick={() => {
              setMigrationBannerDismissed(true);
              try { sessionStorage.setItem("pl_migration_banner_dismissed", "1"); } catch {}
            }}
            className="text-teal-400 hover:text-teal-700 transition-colors flex-shrink-0 ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Suspense fallback={null}>
        <NeighborhoodChatModal
          label={selectedLabel}
          allLabels={labels}
          onClose={() => setSelectedLabel(null)}
          apiBase={API}
          onVote={handleVote}
          myVotes={userVotes}
        />
      </Suspense>

      {migrationModalOpen && detectedCity && (
        <MigrationModal
          citySlug={detectedCity.slug}
          cityName={detectedCity.name}
          cityLabels={labels.filter((l) => {
            const city = CITIES_MAP.find((c) => c.slug === detectedCity.slug);
            if (!city) return false;
            return l.lat >= city.latMin && l.lat <= city.latMax && l.lng >= city.lngMin && l.lng <= city.lngMax;
          }).map((l) => ({ text: l.text, lat: l.lat, lng: l.lng }))}
          apiBase={API}
          onClose={() => setMigrationModalOpen(false)}
          onFlyTo={(lat, lng) => {
            setFlyToLocation({ lat, lng, zoom: 14 });
            setMigrationModalOpen(false);
          }}
        />
      )}

      {shareLabel && (() => {
        const cityEntry = CITIES_MAP.find((c) =>
          shareLabel.lat >= c.latMin && shareLabel.lat <= c.latMax &&
          shareLabel.lng >= c.lngMin && shareLabel.lng <= c.lngMax
        );
        const citySlug = cityEntry?.slug ?? "map";
        const cityName = cityEntry?.name;
        const areaSlug = shareLabel.text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const shareUrl = `https://placelabels.com/${citySlug}/${areaSlug}`;
        const whatsappText = `Check out ${shareLabel.text}${cityName ? ` in ${cityName}` : ""} on PlaceLabels!\nSafety: ${"⭐".repeat(shareLabel.safety)} | Cost: ${shareLabel.cost}\n${shareUrl}`;
        return (
          <ShareSheet
            cardData={{
              areaName: shareLabel.text,
              cityName,
              vibes: shareLabel.vibe ?? [],
              safety: shareLabel.safety,
              cost: shareLabel.cost,
              quote: shareLabel.text,
            }}
            shareUrl={shareUrl}
            whatsappText={whatsappText}
            onClose={() => setShareLabel(null)}
          />
        );
      })()}
    </div>
  );
}
