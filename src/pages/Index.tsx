import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapView } from "@/components/MapView";
import type { AreaSummary, LabelData } from "@/components/MapView";
import { AddLabelDialog } from "@/components/AddLabelDialog";
import { FilterSidebar, DEFAULT_FILTERS } from "@/components/FilterSidebar";
import { TopToolbar } from "@/components/TopToolbar";
import { HeroOverlay, MicroHints, useOnboarding } from "@/components/Onboarding";
import { NeighborhoodChatDrawer } from "@/components/NeighborhoodChatDrawer";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { useVoterId } from "@/hooks/useVoterId";
import { toast } from "sonner";
import type { Filters } from "@/components/MapView";

export default function Index() {
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locateUser, setLocateUser] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const voterId = useVoterId();
  const queryClient = useQueryClient();
  const { showHero, hasInteracted, dismissHero, markInteracted } = useOnboarding();

  const { data: labels = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userVotes = [] } = useQuery({
    queryKey: ["votes", voterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("label_id, vote_type")
        .eq("voter_id", voterId);
      if (error) throw error;
      return data;
    },
  });

  const addLabel = useMutation({
    mutationFn: async (label: {
      lat: number; lng: number; text: string; safety: number; vibe: string[]; cost: string; color: string; category: string | null;
    }) => {
      const { error } = await supabase.from("labels").insert(label);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      setDialogOpen(false);
      setIsPlacingPin(false);
      markInteracted();
      toast.success("Label dropped! 📌");
    },
    onError: () => toast.error("Failed to add label"),
  });

  const vote = useMutation({
    mutationFn: async ({ labelId, voteType }: { labelId: string; voteType: "upvote" | "downvote" }) => {
      const alreadyVoted = userVotes.some((v) => v.label_id === labelId);
      if (alreadyVoted) throw new Error("Already voted");

      const { error: voteError } = await supabase
        .from("votes")
        .insert({ label_id: labelId, voter_id: voterId, vote_type: voteType });
      if (voteError) {
        if (voteError.code === "23505") throw new Error("Already voted");
        throw voteError;
      }

      const field = voteType === "upvote" ? "upvotes" : "downvotes";
      const label = labels.find((l) => l.id === labelId);
      if (label) {
        await supabase.from("labels").update({ [field]: label[field] + 1 }).eq("id", labelId);
      }
    },
    onMutate: async ({ labelId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ["labels"] });
      const previous = queryClient.getQueryData(["labels"]);
      const field = voteType === "upvote" ? "upvotes" : "downvotes";
      queryClient.setQueryData(["labels"], (old: typeof labels) =>
        old?.map((l) => l.id === labelId ? { ...l, [field]: l[field] + 1 } : l)
      );
      markInteracted();
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["labels"], context.previous);
      toast.error(e.message === "Already voted" ? "You already voted on this!" : "Vote failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["votes", voterId] });
    },
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
    setDialogOpen(true);
  }, []);

  const handleVote = useCallback((labelId: string, voteType: "upvote" | "downvote") => {
    vote.mutate({ labelId, voteType });
  }, [vote]);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <MapView
        labels={labels}
        isPlacingPin={isPlacingPin}
        onMapClick={handleMapClick}
        onVote={handleVote}
        showHeatmap={showHeatmap}
        filters={filters}
        showLabels={showLabels}
        selectedCategories={selectedCategories}
        locateUser={locateUser}
        onLocated={() => setLocateUser(false)}
        flyToLocation={flyToLocation}
        onFlownTo={() => setFlyToLocation(null)}
        onAreaClick={(area) => {
          toast.info(`Exploring ${area.name} — ${area.labelCount} labels nearby`);
        }}
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

      {/* Onboarding */}
      {showHero && <HeroOverlay onDismiss={dismissHero} />}
      {!showHero && <MicroHints hasInteracted={hasInteracted} />}

      {/* App title */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border">
          <h1 className="text-lg font-bold text-foreground">NeighborhoodTruth</h1>
        </div>
      </div>

      {/* Add Label button */}
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

      {/* Empty state */}
      {!showHero && labels.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-8 py-6 shadow-lg border text-center">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No labels yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click anywhere on the map to add your insight</p>
          </div>
        </div>
      )}

      <AddLabelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        position={clickedPosition}
        onSubmit={(data) => addLabel.mutate(data)}
        isSubmitting={addLabel.isPending}
      />
    </div>
  );
}
