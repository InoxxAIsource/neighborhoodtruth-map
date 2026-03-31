import { useState, useEffect } from "react";
import { Shield, DollarSign } from "lucide-react";
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
  onVote: (labelId: string, voteType: "upvote" | "downvote" | "accurate") => void;
  apiBase: string;
  voterId: string;
  alreadyVoted?: boolean;
}

interface TagCount {
  tagKey: string;
  count: number;
}

export function LabelPopup({ label, onVote, apiBase, voterId, alreadyVoted = false }: LabelPopupProps) {
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagMsg, setTagMsg] = useState<string | null>(null);
  const [voted, setVoted] = useState(alreadyVoted);

  useEffect(() => {
    fetch(`${apiBase}/labels/${label.id}/tags`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: TagCount[]) => setTagCounts(data))
      .catch(() => {});
  }, [apiBase, label.id]);

  const topTagKeys = [...tagCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => t.tagKey);

  const handleTag = async (key: string) => {
    if (selectedTags.has(key)) return;
    if (selectedTags.size >= 4) {
      setTagMsg("Max 4 tags per label.");
      return;
    }
    setTagMsg(null);
    const next = new Set(selectedTags);
    next.add(key);
    setSelectedTags(next);

    try {
      const res = await fetch(`${apiBase}/labels/${label.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagKey: key, voterId }),
      });
      if (res.ok) {
        setTagCounts((prev) => {
          const existing = prev.find((t) => t.tagKey === key);
          if (existing) {
            return prev.map((t) => t.tagKey === key ? { ...t, count: t.count + 1 } : t);
          }
          return [...prev, { tagKey: key, count: 1 }];
        });
      }
    } catch {
    }
  };

  const handleVote = (voteType: "upvote" | "downvote" | "accurate") => {
    if (voted) return;
    setVoted(true);
    onVote(label.id, voteType);
  };

  const countFor = (key: string) => tagCounts.find((t) => t.tagKey === key)?.count ?? 0;

  return (
    <div className="min-w-[220px] max-w-[300px] p-1 font-sans">
      <p className="font-bold text-sm mb-2 leading-snug">{label.text}</p>

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

      {topTagKeys.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topTagKeys.map((key) => {
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

      <div className="flex items-center gap-1.5 pt-2 border-t flex-wrap mb-3">
        <Button
          size="sm"
          variant={voted ? "secondary" : "outline"}
          className="h-7 px-2 text-xs gap-1"
          disabled={voted}
          onClick={() => handleVote("upvote")}
        >
          👍 {label.upvotes}
        </Button>
        <Button
          size="sm"
          variant={voted ? "secondary" : "outline"}
          className="h-7 px-2 text-xs gap-1"
          disabled={voted}
          onClick={() => handleVote("downvote")}
        >
          👎 {label.downvotes}
        </Button>
        <Button
          size="sm"
          variant={voted ? "secondary" : "outline"}
          className="h-7 px-2 text-xs gap-1 text-sky-700"
          disabled={voted}
          onClick={() => handleVote("accurate")}
          title="This label is still accurate"
        >
          🔁 Accurate
        </Button>
      </div>

      <div className="border-t pt-2">
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          Tag this area <span className="font-normal text-gray-400">(up to 4)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_TAGS.map((tag) => {
            const count = countFor(tag.key);
            const chosen = selectedTags.has(tag.key);
            const disabled = !chosen && selectedTags.size >= 4;
            return (
              <button
                key={tag.key}
                type="button"
                disabled={disabled}
                onClick={() => handleTag(tag.key)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  chosen
                    ? "bg-teal-50 border-teal-500 text-teal-700"
                    : disabled
                      ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                      : "bg-white border-gray-200 text-gray-600 hover:border-teal-300 cursor-pointer"
                }`}
              >
                {tag.emoji} {tag.label}
                {count > 0 && (
                  <span className={`rounded-full px-1 text-[10px] ${chosen ? "bg-teal-100" : "bg-gray-100"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {tagMsg && <p className="text-[11px] text-red-500 mt-1">{tagMsg}</p>}
      </div>
    </div>
  );
}
