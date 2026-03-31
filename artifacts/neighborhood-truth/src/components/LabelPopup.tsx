import { ThumbsUp, ThumbsDown, RotateCcw, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PREDEFINED_TAGS = [
  { key: "safe-at-night", label: "Safe at night", emoji: "🌙" },
  { key: "noisy-on-weekends", label: "Noisy weekends", emoji: "🔊" },
  { key: "family-friendly", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { key: "expensive", label: "Expensive", emoji: "💎" },
  { key: "good-nightlife", label: "Good nightlife", emoji: "🎉" },
  { key: "quiet", label: "Quiet", emoji: "🌿" },
  { key: "good-for-students", label: "Good for students", emoji: "🎓" },
  { key: "well-connected", label: "Well connected", emoji: "🚇" },
];

interface LabelPopupProps {
  label: {
    id: string;
    text: string;
    safety: number;
    vibe: string[] | null;
    cost: string;
    upvotes: number;
    downvotes: number;
    topTags?: string[];
  };
  onVote: (labelId: string, voteType: "upvote" | "downvote") => void;
}

export function LabelPopup({ label, onVote }: LabelPopupProps) {
  const topTags = (label.topTags ?? []).slice(0, 3);

  return (
    <div className="min-w-[200px] max-w-[280px] p-1">
      <p className="font-medium text-sm mb-2">{label.text}</p>

      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {label.safety}/5
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {label.cost}
        </span>
      </div>

      {label.vibe && label.vibe.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {label.vibe.map((v) => (
            <Badge key={v} variant="secondary" className="text-[10px] px-1.5 py-0">
              {v}
            </Badge>
          ))}
        </div>
      )}

      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topTags.map((key) => {
            const tag = PREDEFINED_TAGS.find((t) => t.key === key);
            if (!tag) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-medium"
              >
                {tag.emoji} {tag.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onVote(label.id, "upvote")}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          {label.upvotes}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onVote(label.id, "downvote")}
        >
          <ThumbsDown className="h-3 w-3 mr-1" />
          {label.downvotes}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-sky-600"
          title="Still accurate"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Accurate
        </Button>
      </div>
    </div>
  );
}
