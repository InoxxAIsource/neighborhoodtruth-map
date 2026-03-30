import { useState } from "react";
import {
  Dialog,
  DialogContent,
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

const VIBE_OPTIONS = ["Chill", "Loud", "Bougie", "Artsy", "Family", "Nightlife"];
const COST_OPTIONS = ["$", "$$", "$$$", "$$$$"];
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
  }) => void;
  isSubmitting: boolean;
}

export function AddLabelDialog({
  open,
  onOpenChange,
  position,
  onSubmit,
  isSubmitting,
}: AddLabelDialogProps) {
  const [text, setText] = useState("");
  const [safety, setSafety] = useState(3);
  const [vibes, setVibes] = useState<string[]>([]);
  const [cost, setCost] = useState("$$");
  const [error, setError] = useState<string | null>(null);

  const toggleVibe = (v: string) => {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleSubmit = () => {
    if (!position) return;
    const validation = validateLabelText(text);
    if (!validation.valid) {
      setError(validation.reason ?? "Invalid text");
      return;
    }
    setError(null);
    onSubmit({
      lat: position.lat,
      lng: position.lng,
      text: text.trim(),
      safety,
      vibe: vibes,
      cost,
    });
    setText("");
    setSafety(3);
    setVibes([]);
    setCost("$$");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Add a Label
          </DialogTitle>
        </DialogHeader>

        {position && (
          <p className="text-xs text-muted-foreground">
            📍 {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label-text">What's this spot like?</Label>
            <Input
              id="label-text"
              placeholder="e.g. Great coffee shops, sketchy at night..."
              maxLength={80}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className="flex justify-between">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">{text.length}/80</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Safety ({safety}/5)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSafety(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= safety
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sketchy</span>
              <span>Very Safe</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vibe</Label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => (
                <Badge
                  key={v}
                  variant={vibes.includes(v) ? "default" : "outline"}
                  className="cursor-pointer select-none transition-all"
                  onClick={() => toggleVibe(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cost Level</Label>
            <div className="flex gap-2">
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || !position || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Drop Label 📌"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
