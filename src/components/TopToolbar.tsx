import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, TagsIcon, EyeOff, LocateFixed } from "lucide-react";

export const PLACE_CATEGORIES = {
  good: [
    { label: "Cafes to work", emoji: "☕" },
    { label: "Coworking", emoji: "💻" },
    { label: "Yoga studios", emoji: "🧘" },
    { label: "Parks", emoji: "🌳" },
    { label: "Playgrounds", emoji: "🛝" },
    { label: "Gyms", emoji: "🏋️" },
    { label: "Restaurants", emoji: "🍽️" },
    { label: "Bars", emoji: "🍺" },
    { label: "Art galleries", emoji: "🎨" },
    { label: "Bookstores", emoji: "📚" },
  ],
  bad: [
    { label: "Hotels", emoji: "🏨" },
    { label: "Fast food", emoji: "🍔" },
    { label: "Gambling", emoji: "🎰" },
    { label: "Pawn shops", emoji: "💰" },
    { label: "Laundromats", emoji: "🧺" },
    { label: "Phone repair", emoji: "📱" },
    { label: "Money transfer", emoji: "💸" },
    { label: "Tourist traps", emoji: "📸" },
  ],
};

export const ALL_PLACE_LABELS = [
  ...PLACE_CATEGORIES.good.map((c) => c.label),
  ...PLACE_CATEGORIES.bad.map((c) => c.label),
];

interface TopToolbarProps {
  showLabels: boolean;
  onToggleLabels: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

export function TopToolbar({
  showLabels,
  onToggleLabels,
  selectedCategories,
  onCategoriesChange,
  showHeatmap,
  onToggleHeatmap,
}: TopToolbarProps) {
  const [placesOpen, setPlacesOpen] = useState(false);

  const toggleCategory = (label: string) => {
    onCategoriesChange(
      selectedCategories.includes(label)
        ? selectedCategories.filter((c) => c !== label)
        : [...selectedCategories, label]
    );
  };

  const clearAll = () => onCategoriesChange([]);
  const selectAll = () => onCategoriesChange(ALL_PLACE_LABELS);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
      {/* District mode toggle */}
      <Button
        size="sm"
        variant={showHeatmap ? "default" : "outline"}
        className="gap-1.5 rounded-full shadow-md bg-card/95 backdrop-blur-sm border"
        onClick={onToggleHeatmap}
      >
        <MapPin className="h-3.5 w-3.5" />
        Districts
      </Button>

      {/* Places dropdown */}
      <Popover open={placesOpen} onOpenChange={setPlacesOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={selectedCategories.length > 0 ? "default" : "outline"}
            className="gap-1.5 rounded-full shadow-md bg-card/95 backdrop-blur-sm border"
          >
            <TagsIcon className="h-3.5 w-3.5" />
            Places
            {selectedCategories.length > 0 && (
              <span className="ml-1 bg-primary-foreground/20 rounded-full px-1.5 text-[10px] font-bold">
                {selectedCategories.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 max-h-[400px] overflow-y-auto p-3" align="center">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-foreground">Filter by Place</h4>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[10px] text-primary hover:underline font-medium">All</button>
              <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:underline font-medium">Clear</button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-1.5">👍 Good</p>
            <div className="space-y-1">
              {PLACE_CATEGORIES.good.map((cat) => (
                <label
                  key={cat.label}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.label)}
                    onCheckedChange={() => toggleCategory(cat.label)}
                  />
                  <span>{cat.emoji}</span>
                  <span className="text-foreground">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-red-500 font-bold mb-1.5">👎 Bad</p>
            <div className="space-y-1">
              {PLACE_CATEGORIES.bad.map((cat) => (
                <label
                  key={cat.label}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.label)}
                    onCheckedChange={() => toggleCategory(cat.label)}
                  />
                  <span>{cat.emoji}</span>
                  <span className="text-foreground">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* No tags toggle */}
      <Button
        size="sm"
        variant={!showLabels ? "default" : "outline"}
        className="gap-1.5 rounded-full shadow-md bg-card/95 backdrop-blur-sm border"
        onClick={onToggleLabels}
      >
        <EyeOff className="h-3.5 w-3.5" />
        No tags
      </Button>
    </div>
  );
}
