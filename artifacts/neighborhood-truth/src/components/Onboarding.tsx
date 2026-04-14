import { useState, useEffect } from "react";
import { MapPin, Compass, ArrowRight, ThumbsUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nt-onboarded-v2";

export function HeroOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ contentVisibility: 'auto' }}>
      <div className="bg-card rounded-2xl shadow-2xl border px-8 py-10 max-w-md mx-4 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Discover real neighborhood vibes
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            See what locals actually think about each area across the world. Drop labels, vote on insights, and find your perfect neighborhood.
          </p>
          <p className="text-xs text-muted-foreground/70 italic pt-1">
            Tired of Google Maps guesses? Get real local vibes + AI answers from people who actually live here.
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
      {showVoteHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border flex items-center gap-2 text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4 text-primary" />
            <span>Click any label to vote on it</span>
          </div>
        </div>
      )}
      {showFilterHint && (
        <div className="absolute left-4 bottom-20 z-[1001] pointer-events-none animate-in fade-in slide-in-from-left-4 duration-500 delay-1000">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Filter labels by safety, cost & vibe</span>
          </div>
        </div>
      )}
    </>
  );
}

export function useOnboarding() {
  const [showHero, setShowHero] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [hasInteracted, setHasInteracted] = useState(false);

  const dismissHero = () => {
    setShowHero(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const markInteracted = () => setHasInteracted(true);

  return { showHero, hasInteracted, dismissHero, markInteracted };
}
