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
import { Slider } from "@/components/ui/slider";
import { MapPin } from "lucide-react";

const VIBE_OPTIONS = ["Chill", "Lively", "Artsy", "Family", "Sketchy", "Trendy", "Quiet", "Loud"];
const COST_OPTIONS = ["$", "$$", "$$$", "$$$$"];

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
  const [safety, setSafety] = useState([3]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [cost, setCost] = useState("$$");

  const toggleVibe = (v: string) => {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleSubmit = () => {
    if (!position || !text.trim()) return;
    onSubmit({
      lat: position.lat,
      lng: position.lng,
      text: text.trim(),
      safety: safety[0],
      vibe: vibes,
      cost,
    });
    setText("");
    setSafety([3]);
    setVibes([]);
    setCost("$$");
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
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">{text.length}/80</p>
          </div>

          <div className="space-y-2">
            <Label>Safety ({safety[0]}/5)</Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={safety}
              onValueChange={setSafety}
              className="w-full"
            />
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
                  className="cursor-pointer select-none"
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
            {isSubmitting ? "Adding..." : "Add Label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
