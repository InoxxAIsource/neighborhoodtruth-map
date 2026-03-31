import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MapPin, TagsIcon, EyeOff, LocateFixed, Search, Loader2 } from "lucide-react";

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
  isLocating: boolean;
  onLocate: () => void;
  onSearchLocation: (coords: { lat: number; lng: number }) => void;
}

export function TopToolbar({
  showLabels,
  onToggleLabels,
  selectedCategories,
  onCategoriesChange,
  showHeatmap,
  onToggleHeatmap,
  isLocating,
  onLocate,
  onSearchLocation,
}: TopToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleCategory = (label: string) => {
    const next = selectedCategories.includes(label)
      ? selectedCategories.filter((c) => c !== label)
      : [...selectedCategories, label];
    onCategoriesChange(next);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data.length > 0) {
        onSearchLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setSearchOpen(false);
        setSearchQuery("");
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border flex items-center gap-1 px-2 py-1.5">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="center">
            <div className="flex gap-2">
              <Input
                placeholder="Search city or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleSearch} disabled={isSearching} className="h-8 px-3">
                {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={onToggleLabels}
        >
          {showLabels ? <TagsIcon className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showLabels ? "Labels On" : "Labels Off"}
        </Button>

        <div className="w-px h-5 bg-border" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
              <MapPin className="h-3.5 w-3.5" />
              Categories
              {selectedCategories.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-bold">
                  {selectedCategories.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="center">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">GOOD FOR</p>
                <div className="grid grid-cols-2 gap-1">
                  {PLACE_CATEGORIES.good.map((c) => (
                    <label key={c.label} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                      <Checkbox
                        checked={selectedCategories.includes(c.label)}
                        onCheckedChange={() => toggleCategory(c.label)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{c.emoji} {c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">WATCH OUT FOR</p>
                <div className="grid grid-cols-2 gap-1">
                  {PLACE_CATEGORIES.bad.map((c) => (
                    <label key={c.label} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                      <Checkbox
                        checked={selectedCategories.includes(c.label)}
                        onCheckedChange={() => toggleCategory(c.label)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{c.emoji} {c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => onCategoriesChange([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={onLocate}
          disabled={isLocating}
        >
          {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Locate
        </Button>
      </div>
    </div>
  );
}
