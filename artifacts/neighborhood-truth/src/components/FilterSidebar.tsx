import { useState } from "react";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  DollarSign,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Filters } from "@/components/MapView";

const VIBE_OPTIONS = ["Chill", "Loud", "Bougie", "Artsy", "Family", "Nightlife"];
const COST_OPTIONS = ["$", "$$", "$$$", "$$$$"];

export const DEFAULT_FILTERS: Filters = {
  safetyMin: 1,
  safetyMax: 5,
  costs: [],
  vibes: [],
  minScore: -99,
};

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

export function FilterSidebar({ filters, onFiltersChange, showHeatmap, onToggleHeatmap }: FilterSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCost = (c: string) => {
    const next = filters.costs.includes(c)
      ? filters.costs.filter((x) => x !== c)
      : [...filters.costs, c];
    updateFilter("costs", next);
  };

  const toggleVibe = (v: string) => {
    const next = filters.vibes.includes(v)
      ? filters.vibes.filter((x) => x !== v)
      : [...filters.vibes, v];
    updateFilter("vibes", next);
  };

  const hasActiveFilters =
    filters.safetyMin > 1 ||
    filters.safetyMax < 5 ||
    filters.costs.length > 0 ||
    filters.vibes.length > 0 ||
    filters.minScore > -99;

  if (collapsed) {
    return (
      <div className="absolute left-4 top-20 sm:top-1/2 sm:-translate-y-1/2 z-[1000]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="bg-card/95 backdrop-blur-sm shadow-lg h-10 w-10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-20 sm:top-1/2 sm:-translate-y-1/2 z-[1000] w-64">
      <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border p-4 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                title="Reset filters"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Safety: {filters.safetyMin}–{filters.safetyMax}
          </Label>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[filters.safetyMin, filters.safetyMax]}
            onValueChange={([min, max]) => {
              updateFilter("safetyMin", min);
              updateFilter("safetyMax", max);
            }}
            className="mt-1"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            Cost
          </Label>
          <div className="flex gap-1.5 flex-wrap">
            {COST_OPTIONS.map((c) => (
              <Badge
                key={c}
                variant={filters.costs.includes(c) ? "default" : "outline"}
                className="cursor-pointer text-xs select-none"
                onClick={() => toggleCost(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Vibes
          </Label>
          <div className="flex gap-1.5 flex-wrap">
            {VIBE_OPTIONS.map((v) => (
              <Badge
                key={v}
                variant={filters.vibes.includes(v) ? "default" : "outline"}
                className="cursor-pointer text-xs select-none"
                onClick={() => toggleVibe(v)}
              >
                {v}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <Button
          variant={showHeatmap ? "default" : "outline"}
          size="sm"
          className="w-full text-xs"
          onClick={onToggleHeatmap}
        >
          {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
        </Button>
      </div>
    </div>
  );
}
