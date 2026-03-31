import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MapPin, TagsIcon, EyeOff, LocateFixed, Search, Loader2, Globe } from "lucide-react";

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

export const CITIES = [
  { name: "New York", lat: 40.755, lng: -73.984, flag: "🇺🇸" },
  { name: "London", lat: 51.5137, lng: -0.1337, flag: "🇬🇧" },
  { name: "Paris", lat: 48.8566, lng: 2.3431, flag: "🇫🇷" },
  { name: "Tokyo", lat: 35.6938, lng: 139.7005, flag: "🇯🇵" },
  { name: "Dubai", lat: 25.1972, lng: 55.2744, flag: "🇦🇪" },
  { name: "Singapore", lat: 1.3050, lng: 103.8320, flag: "🇸🇬" },
  { name: "Sydney", lat: -33.8908, lng: 151.2097, flag: "🇦🇺" },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, flag: "🇩🇪" },
  { name: "Barcelona", lat: 41.3922, lng: 2.1577, flag: "🇪🇸" },
  { name: "Bangkok", lat: 13.7308, lng: 100.5238, flag: "🇹🇭" },
  { name: "Seoul", lat: 37.5326, lng: 127.0246, flag: "🇰🇷" },
  { name: "Mumbai", lat: 19.0596, lng: 72.8295, flag: "🇮🇳" },
  { name: "Delhi", lat: 28.6315, lng: 77.2167, flag: "🇮🇳" },
  { name: "Cairo", lat: 30.0561, lng: 31.2394, flag: "🇪🇬" },
  { name: "Hong Kong", lat: 22.2796, lng: 114.1745, flag: "🇭🇰" },
  { name: "Bali", lat: -8.4095, lng: 115.1889, flag: "🇮🇩" },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241, flag: "🇿🇦" },
  { name: "Rome", lat: 41.9028, lng: 12.4964, flag: "🇮🇹" },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, flag: "🇰🇪" },
  { name: "Lisbon", lat: 38.7223, lng: -9.1393, flag: "🇵🇹" },
  { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, flag: "🇲🇾" },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, flag: "🇮🇩" },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, flag: "🇺🇸" },
  { name: "Miami", lat: 25.7617, lng: -80.1918, flag: "🇺🇸" },
  { name: "Vienna", lat: 48.2082, lng: 16.3738, flag: "🇦🇹" },
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
  const [citiesOpen, setCitiesOpen] = useState(false);

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

        <Popover open={citiesOpen} onOpenChange={setCitiesOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
              <Globe className="h-3.5 w-3.5" />
              Cities
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">Jump to city</p>
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {CITIES.map((city) => (
                <button
                  key={city.name}
                  className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                  onClick={() => {
                    onSearchLocation({ lat: city.lat, lng: city.lng });
                    setCitiesOpen(false);
                  }}
                >
                  <span className="text-base leading-none">{city.flag}</span>
                  <span>{city.name}</span>
                </button>
              ))}
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
