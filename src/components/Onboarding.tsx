import { useState, useEffect } from "react";
import { MapPin, Compass, ArrowRight, ThumbsUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nt-onboarded";

export function HeroOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-card rounded-2xl shadow-2xl border px-8 py-10 max-w-md mx-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Discover real neighborhood vibes
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            See what locals actually think about each area. Drop labels, vote on insights, and find your perfect neighborhood.
          </p>
        </div>
        <Button size="lg" className="gap-2 w-full" onClick={onDismiss}>
          Explore Map
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MicroHints({ hasInteracted }: { hasInteracted: boolean }) {
  const [showVoteHint, setShowVoteHint] = useState(true);
  const [showFilterHint, setShowFilterHint] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setShowVoteHint(false), 8000);
    const t2 = setTimeout(() => setShowFilterHint(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (hasInteracted) return null;

  return (
    <>
      {/* Vote hint — bottom center */}
      {showVoteHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Click any label to vote & improve accuracy
            </p>
          </div>
        </div>
      )}

      {/* Filter hint — near sidebar */}
      {showFilterHint && (
        <div className="absolute top-16 left-14 z-[1001] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-500 delay-1000">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Find best areas instantly →
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function useOnboarding() {
  const [showHero, setShowHero] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShowHero(true);
    } else {
      setHasInteracted(true);
    }
  }, []);

  const dismissHero = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShowHero(false);
  };

  const markInteracted = () => setHasInteracted(true);

  return { showHero, hasInteracted, dismissHero, markInteracted };
}
