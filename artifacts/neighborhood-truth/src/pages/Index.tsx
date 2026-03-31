import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapView } from "@/components/MapView";
import type { AreaSummary, LabelData } from "@/components/MapView";
import { AddLabelDialog } from "@/components/AddLabelDialog";
import { FilterSidebar, DEFAULT_FILTERS } from "@/components/FilterSidebar";
import { TopToolbar } from "@/components/TopToolbar";
import { HeroOverlay, MicroHints, useOnboarding } from "@/components/Onboarding";
import { ZoneLegend } from "@/components/ZoneLegend";
import { NeighborhoodChatModal } from "@/components/NeighborhoodChatModal";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { useVoterId } from "@/hooks/useVoterId";
import { toast } from "sonner";
import type { Filters } from "@/components/MapView";

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
    mutationFn: async (label: {
      lat: number; lng: number; text: string; safety: number; vibe: string[]; cost: string; color: string; category: string | null;
    }) => {
      return apiFetch<LabelDTO>("/labels", {
        method: "POST",
        body: JSON.stringify(label),
      });
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
    mutationFn: async ({ labelId, voteType }: { labelId: string; voteType: "upvote" | "downvote" }) => {
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
    },
    onError: (e: Error) => {
      toast.error(e.message === "Already voted" ? "You already voted on this!" : "Vote failed");
    },
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
    setDialogOpen(true);
  }, []);

  const handleVote = useCallback((labelId: string, voteType: "upvote" | "downvote") => {
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

      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border">
          <h1 className="text-lg font-bold text-foreground">PlaceLabels</h1>
          <p className="text-[10px] text-muted-foreground">{labels.length} insights worldwide</p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000]">
        {isPlacingPin ? (
          <div className="flex flex-col items-end gap-2">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border animate-pulse">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 animate-bounce" />
                Tap the map to drop your label
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPlacingPin(false)}>Cancel</Button>
          </div>
        ) : (
          <Button size="lg" className="shadow-lg gap-2" onClick={() => setIsPlacingPin(true)}>
            <Plus className="h-5 w-5" />
            Drop Label
          </Button>
        )}
      </div>

      <AddLabelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        position={clickedPosition}
        onSubmit={(data) => addLabel.mutate(data)}
        isSubmitting={addLabel.isPending}
      />

      <ZoneLegend />

      <NeighborhoodChatModal
        label={selectedLabel}
        allLabels={labels}
        onClose={() => setSelectedLabel(null)}
        apiBase={API}
        onVote={handleVote}
        myVotes={userVotes}
      />
    </div>
  );
}
