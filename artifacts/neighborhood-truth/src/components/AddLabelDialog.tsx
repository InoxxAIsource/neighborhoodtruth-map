import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { validateLabelText } from "@/lib/profanityFilter";
import { useLanguage } from "@/contexts/LanguageContext";

export const VIBE_OPTIONS = [
  "Chill", "Loud", "Bougie", "Artsy", "Family", "Nightlife",
  "IT Hub", "Old City Charm", "Student Zone", "Women Safe", "Metro Access King", "Upcoming Area",
];

const COST_OPTIONS = ["$", "$$", "$$$", "$$$$"];
const CATEGORY_OPTIONS = [
  "Cafes to work", "Coworking", "Yoga studios", "Parks", "Playgrounds", "Gyms",
  "Restaurants", "Bars", "Art galleries", "Bookstores",
  "Hotels", "Fast food", "Gambling", "Pawn shops", "Tourist traps",
];
const COLOR_OPTIONS = [
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Yellow", value: "#ca8a04" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Pink", value: "#db2777" },
  { label: "Gray", value: "#6b7280" },
  { label: "Black", value: "#111827" },
];

const TAG_OPTIONS = [
  { key: "safe-at-night", label: "Safe at night", emoji: "🌙" },
  { key: "noisy-on-weekends", label: "Noisy on weekends", emoji: "🔊" },
  { key: "family-friendly", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { key: "expensive", label: "Expensive", emoji: "💎" },
  { key: "good-nightlife", label: "Good nightlife", emoji: "🎉" },
  { key: "quiet", label: "Quiet", emoji: "🌿" },
  { key: "good-for-students", label: "Good for students", emoji: "🎓" },
  { key: "well-connected", label: "Well connected", emoji: "🚇" },
];

interface AddLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { lat: number; lng: number } | null;
  onSubmit: (data: {
    lat: number;
    lng: number;
    text: string;
    safety: number;
    vibe: string[];
    cost: string;
    color: string;
    category: string | null;
    tags: string[];
  }) => void;
  isSubmitting: boolean;
}

export function AddLabelDialog({ open, onOpenChange, position, onSubmit, isSubmitting }: AddLabelDialogProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [safety, setSafety] = useState(3);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [cost, setCost] = useState("$$");
  const [color, setColor] = useState("#0d9488");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleVibe = (v: string) => {
    setSelectedVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const toggleTag = (key: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 4) return prev;
      return [...prev, key];
    });
  };

  const handleSubmit = () => {
    const validation = validateLabelText(text);
    if (!validation.valid) {
      setError(validation.reason || "Invalid label");
      return;
    }
    if (!position) return;

    setError(null);
    onSubmit({
      lat: position.lat,
      lng: position.lng,
      text: text.trim(),
      safety,
      vibe: selectedVibes,
      cost,
      color,
      category,
      tags: selectedTags,
    });
    setText("");
    setSafety(3);
    setSelectedVibes([]);
    setCost("$$");
    setColor("#0d9488");
    setCategory(null);
    setSelectedTags([]);
  };

  const genericVibes = VIBE_OPTIONS.slice(0, 6);
  const indiaVibes = VIBE_OPTIONS.slice(6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t.dropLabel}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a label to describe what this neighborhood is like
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="label-text">{t.whatLike}</Label>
            <Input
              id="label-text"
              placeholder="e.g. Great coffee shops, Too loud at night..."
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); }}
              maxLength={80}
              className="mt-1"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            <p className="text-xs text-muted-foreground mt-1">{text.length}/80</p>
          </div>

          <div>
            <Label>{t.safetyRating}</Label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSafety(s)}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${s <= safety ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">{safety}/5</span>
            </div>
          </div>

          <div>
            <Label>{t.vibes}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {genericVibes.map((v) => (
                <Badge
                  key={v}
                  variant={selectedVibes.includes(v) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleVibe(v)}
                >
                  {t.vibeOptions[v] ?? v}
                </Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 mb-1 font-medium uppercase tracking-wide">🇮🇳 India-specific</p>
            <div className="flex flex-wrap gap-2">
              {indiaVibes.map((v) => (
                <Badge
                  key={v}
                  variant={selectedVibes.includes(v) ? "default" : "outline"}
                  className="cursor-pointer select-none border-orange-200 data-[selected=true]:bg-orange-600"
                  data-selected={selectedVibes.includes(v)}
                  onClick={() => toggleVibe(v)}
                >
                  {t.vibeOptions[v] ?? v}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>{t.costLevel}</Label>
            <div className="flex gap-2 mt-1">
              {COST_OPTIONS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={cost === c ? "default" : "outline"}
                  onClick={() => setCost(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t.category} <span className="text-muted-foreground font-normal">({t.optional})</span></Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORY_OPTIONS.map((c) => (
                <Badge
                  key={c}
                  variant={category === c ? "default" : "outline"}
                  className="cursor-pointer text-xs select-none"
                  onClick={() => setCategory(category === c ? null : c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>
              {t.tags}{" "}
              <span className="text-muted-foreground font-normal">({t.optional}, {t.upTo4})</span>
            </Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TAG_OPTIONS.map((tag) => {
                const selected = selectedTags.includes(tag.key);
                const disabled = !selected && selectedTags.length >= 4;
                return (
                  <button
                    key={tag.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleTag(tag.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none ${
                      selected
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : disabled
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-600 hover:border-teal-300 cursor-pointer"
                    }`}
                  >
                    <span>{tag.emoji}</span>
                    {tag.label}
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{selectedTags.length}/4 selected</p>
            )}
          </div>

          <div>
            <Label>{t.labelColor}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? t.dropping : t.dropLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
