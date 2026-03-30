import { ThumbsUp, ThumbsDown, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LabelPopupProps {
  label: {
    id: string;
    text: string;
    safety: number;
    vibe: string[] | null;
    cost: string;
    upvotes: number;
    downvotes: number;
  };
  onVote: (labelId: string, voteType: "upvote" | "downvote") => void;
}

export function LabelPopup({ label, onVote }: LabelPopupProps) {
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

      <div className="flex items-center gap-2 pt-1 border-t">
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
      </div>
    </div>
  );
}
