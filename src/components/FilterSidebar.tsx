import { useState } from "react";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  DollarSign,
  Sparkles,
  TrendingUp,
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
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <div
      className={`absolute top-0 left-0 h-full z-[1000] transition-all duration-300 ${
        collapsed ? "w-11" : "w-72"
      }`}
    >
      <div className="h-full bg-card/95 backdrop-blur-sm border-r shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-2.5 flex items-center justify-between border-b shrink-0">
          {!collapsed && (
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Heatmap toggle */}
            <div>
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                className="w-full gap-2"
                onClick={onToggleHeatmap}
              >
                <Sparkles className="h-4 w-4" />
                {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </Button>
            </div>

            <Separator />

            {/* Safety range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Safety ({filters.safetyMin}–{filters.safetyMax})
              </Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[filters.safetyMin, filters.safetyMax]}
                onValueChange={([min, max]) => {
                  onFiltersChange({ ...filters, safetyMin: min, safetyMax: max });
                }}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Sketchy</span>
                <span>Very Safe</span>
              </div>
            </div>

            <Separator />

            {/* Cost */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Cost Level
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {COST_OPTIONS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={filters.costs.includes(c) ? "default" : "outline"}
                    className="h-7 px-3 text-xs"
                    onClick={() => toggleCost(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Vibe */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vibe
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {VIBE_OPTIONS.map((v) => (
                  <Badge
                    key={v}
                    variant={filters.vibes.includes(v) ? "default" : "outline"}
                    className="cursor-pointer select-none text-xs"
                    onClick={() => toggleVibe(v)}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Min score */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Min Score ({filters.minScore === -99 ? "Any" : filters.minScore})
              </Label>
              <Slider
                min={-20}
                max={20}
                step={1}
                value={[filters.minScore === -99 ? -20 : filters.minScore]}
                onValueChange={([v]) => updateFilter("minScore", v === -20 ? -99 : v)}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>All</span>
                <span>+20</span>
              </div>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filters
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
